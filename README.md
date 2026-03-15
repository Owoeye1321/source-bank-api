# Source Bank API

A wallet system REST API built with NestJS, TypeORM, and MySQL. Supports user registration and authentication, wallet deposits, peer-to-peer transfers (by email or account number), and transaction history with pagination.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Database Schema Design](#database-schema-design)
- [Concurrency and Race Condition Handling](#concurrency-and-race-condition-handling)
- [Trade-offs](#trade-offs)
- [Running Tests](#running-tests)

## Tech Stack

- **Runtime**: Node.js 22
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: MySQL 8 with TypeORM
- **Authentication**: JWT (Passport)
- **Containerization**: Docker & Docker Compose

## Project Structure

The codebase follows **Clean Architecture** with modular boundaries:

```
src/
  common/                        # Shared utilities (guards, filters, decorators)
  modules/
    auth/
      internal/
        application/             # Services, port interfaces
        domain/                  # Entities, DTOs, enums, types
        infrastructure/          # Repositories, controllers, strategies
      auth.module.ts
    wallet/
      internal/
        application/
        domain/
        infrastructure/
      wallet.module.ts
    transaction/
      internal/
        application/
        domain/
        infrastructure/
      transaction.module.ts
test/
  modules/
    auth/
    wallet/
    transaction/
```

Dependencies point inward: **Infrastructure -> Application -> Domain**. The domain layer has zero external dependencies.

## Getting Started

### Prerequisites

- Node.js >= 22
- MySQL 8 (or Docker)

### Option 1: Docker Compose (Recommended)

1. Clone the repository and create a `.env` file in the project root:

```env
PORT=3000
DB_HOST=source-bank-database
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_db_password
DB_DATABASE=source_bank
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION_SECONDS=86400
```

2. Start the database and API:

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`.

### Option 2: Local Setup

1. Ensure MySQL is running and create a database:

```sql
CREATE DATABASE source_bank;
```

2. Create a `.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_db_password
DB_DATABASE=source_bank
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION_SECONDS=86400
```

3. Install dependencies and start:

```bash
npm install
npm run start:dev
```

The schema is auto-synchronized in non-production environments. For production, use migrations:

```bash
npm run migration:generate --name=InitialMigration
npm run migration:run
```

## API Endpoints

All wallet and transaction endpoints require a Bearer token in the `Authorization` header.

### Auth

| Method | Endpoint         | Description       | Auth |
|--------|------------------|-------------------|------|
| POST   | `/auth/register` | Register new user | No   |
| POST   | `/auth/login`    | Login             | No   |

### Wallet

| Method | Endpoint           | Description               | Auth |
|--------|--------------------|---------------------------|------|
| GET    | `/wallet`          | Get wallet balance        | Yes  |
| POST   | `/wallet/deposit`  | Deposit funds             | Yes  |
| POST   | `/wallet/transfer` | Transfer to another user  | Yes  |

### Transactions

| Method | Endpoint         | Description                          | Auth |
|--------|------------------|--------------------------------------|------|
| GET    | `/transactions`  | List transactions (paginated, filterable) | Yes  |

**Query parameters for transactions**: `page`, `limit`, `transactionType` (CREDIT or DEBIT).

## Database Schema Design

### Entity Relationship Diagram

```
┌──────────────┐       1:1       ┌──────────────┐
│    users     │────────────────>│   wallets    │
├──────────────┤                 ├──────────────┤
│ id (PK)      │                 │ id (PK)      │
│ email (UQ)   │                 │ accountBalance│
│ password     │                 │ userId (FK,UQ)│
│ accountNumber│                 │ createdAt    │
│   (UQ)       │                 │ updatedAt    │
│ createdAt    │                 └──────────────┘
│ updatedAt    │
└──────┬───────┘
       │
       │ 1:N
       v
┌──────────────────┐
│  transactions    │
├──────────────────┤
│ id (PK)          │
│ reference (UQ)   │
│ transactionType  │
│ amount           │
│ previousBalance  │
│ currentBalance   │
│ description      │
│ senderDebitTransRef   │
│ receiverCreditTransRef│
│ userId (FK)      │
│ createdAt        │
└──────────────────┘
```

### Design Decisions

- **One wallet per user** enforced by a unique constraint on `userId`. Wallets are created atomically with user registration in a single database transaction.
- **`decimal(15, 2)`** used for all monetary fields (`accountBalance`, `amount`, `previousBalance`, `currentBalance`) to avoid floating-point precision errors inherent to IEEE 754.
- **`previousBalance` and `currentBalance` on every transaction** provide a full audit trail. Each transaction records the wallet state before and after, enabling balance reconstruction and dispute resolution without re-querying the wallet.
- **Linked transfer references**: peer-to-peer transfers create two transaction records (DEBIT for sender, CREDIT for recipient) linked by `senderDebitTransRef` and `receiverCreditTransRef`. This allows tracing both sides of any transfer from either record.
- **10-digit account numbers** randomly generated at registration, stored as strings to preserve leading zeros.

## Concurrency and Race Condition Handling

Financial operations require strict isolation to prevent double-spending and balance inconsistencies. The API uses **pessimistic locking** within database transactions.

### Deposits

```
Lock wallet (SELECT ... FOR UPDATE) -> Read balance -> Update balance -> Record transaction -> Commit
```

A pessimistic write lock is acquired on the wallet row before reading the balance. Any concurrent deposit on the same wallet will block until the first transaction commits, ensuring serialized access.

### Transfers

Transfers involve two wallets and therefore two locks, which introduces deadlock risk.

**The problem**: If User A transfers to User B while User B transfers to User A simultaneously:
- Transaction 1 locks Wallet A, then waits for Wallet B
- Transaction 2 locks Wallet B, then waits for Wallet A
- Neither can proceed: **deadlock**

**The solution**: Always acquire locks in consistent order (lower `userId` first):

```
Sort wallets by userId -> Lock both (SELECT ... FOR UPDATE) -> Validate sender balance -> Update both ballets -> Record debit + credit transactions -> Commit
```

Since both concurrent transfers will try to lock the lower-ID wallet first, one will proceed and the other will wait. No circular dependency can form.

### User Registration

User and wallet creation happen in a single atomic transaction. No explicit locking is needed because the records don't exist yet and can't be accessed concurrently.

## Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| **Pessimistic locking over optimistic** | Guarantees correctness under high contention; no retry logic needed | Locks block concurrent access, reducing throughput. Acceptable for a wallet system where correctness outweighs speed. |
| **Two transaction records per transfer** | Full audit trail from both sender and recipient perspectives; each user sees their own transaction history | Doubles storage for transfers compared to a single record with a direction flag. Justified because each side needs independent `previousBalance`/`currentBalance` snapshots. |
| **`decimal(15, 2)` over integers (cents)** | Readable values at the database level; no conversion logic in application code | Slightly more complex handling in TypeORM (MySQL returns decimals as strings). Integer cents would avoid this but reduce database-level readability. |
| **Synchronize in development** | No migration overhead during development; schema stays in sync automatically | Cannot be used in production as it may cause data loss. Production requires explicit migrations. |
| **Stateless JWT (no token revocation)** | Simple, scalable authentication with no session store | Tokens remain valid until expiry. Immediate revocation would require a token blacklist (Redis), adding infrastructure complexity. |
| **Clean Architecture** | Clear separation of concerns; domain logic is framework-agnostic and independently testable | More files and indirection compared to a flat structure. Worthwhile for maintainability as the codebase grows. |
| **`manager.update()` for balance writes** | Bypasses TypeORM change detection issues with decimal columns; issues direct UPDATE queries | Slightly less idiomatic than `manager.save()`, but more reliable for financial precision fields. |

## Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Test coverage
npm run test:cov
```
