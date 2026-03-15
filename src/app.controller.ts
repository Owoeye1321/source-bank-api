import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Header('Content-Type', 'text/html')
  getLandingPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Source Bank API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 3rem 1.5rem;
    }
    .container { max-width: 720px; width: 100%; }
    .header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .header h1 {
      font-size: 2.25rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }
    .header p {
      font-size: 1.1rem;
      color: #94a3b8;
    }
    .badge {
      display: inline-block;
      background: #166534;
      color: #4ade80;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
    .section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .section h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 1rem;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #334155;
    }
    td {
      padding: 0.6rem 0.75rem;
      font-size: 0.9rem;
      border-bottom: 1px solid #1e293b;
    }
    tr:last-child td { border-bottom: none; }
    .method {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      font-family: monospace;
    }
    .get { background: #164e63; color: #22d3ee; }
    .post { background: #3b2f1a; color: #fbbf24; }
    .endpoint {
      font-family: monospace;
      color: #e2e8f0;
      font-size: 0.85rem;
    }
    .auth-badge {
      font-size: 0.7rem;
      color: #f87171;
      font-weight: 600;
    }
    .steps {
      list-style: none;
      counter-reset: steps;
    }
    .steps li {
      counter-increment: steps;
      padding: 0.6rem 0;
      padding-left: 2rem;
      position: relative;
      font-size: 0.9rem;
      color: #cbd5e1;
      border-bottom: 1px solid #334155;
    }
    .steps li:last-child { border-bottom: none; }
    .steps li::before {
      content: counter(steps);
      position: absolute;
      left: 0;
      width: 1.5rem;
      height: 1.5rem;
      background: #1e3a5f;
      color: #60a5fa;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
    code {
      background: #334155;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.8rem;
      color: #e2e8f0;
    }
    .footer {
      text-align: center;
      color: #475569;
      font-size: 0.8rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">LIVE</div>
      <h1>Source Bank API</h1>
      <p>A wallet system REST API for user registration, deposits, transfers, and transaction history.</p>
    </div>

    <div class="section">
      <h2>API Endpoints</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">/auth/register</td>
            <td>Register a new user</td>
            <td></td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">/auth/login</td>
            <td>Login &amp; get token</td>
            <td></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/wallet</td>
            <td>Get wallet balance</td>
            <td><span class="auth-badge">AUTH</span></td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">/wallet/deposit</td>
            <td>Deposit funds</td>
            <td><span class="auth-badge">AUTH</span></td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">/wallet/transfer</td>
            <td>Transfer to another user</td>
            <td><span class="auth-badge">AUTH</span></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/transactions</td>
            <td>List transactions</td>
            <td><span class="auth-badge">AUTH</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Getting Started</h2>
      <ol class="steps">
        <li>Register an account via <code>POST /auth/register</code> with your email and password.</li>
        <li>Login via <code>POST /auth/login</code> to receive a JWT access token.</li>
        <li>Include the token as <code>Authorization: Bearer &lt;token&gt;</code> in subsequent requests.</li>
        <li>Deposit funds, transfer to other users, and view your transaction history.</li>
      </ol>
    </div>

    <div class="footer">
      Source Bank API &mdash; Built with NestJS, TypeORM &amp; MySQL
    </div>
  </div>
</body>
</html>`;
  }
}
