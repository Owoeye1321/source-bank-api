import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { RecipientType } from '../enums/recipient-type.enum';

export class TransferDto {
  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @ValidateIf(
    (o: TransferDto) => o.recipientType === RecipientType.ACCOUNT_NUMBER,
  )
  @IsString()
  @Length(10, 10)
  recipientAccountNumber?: string;

  @ValidateIf((o: TransferDto) => o.recipientType === RecipientType.EMAIL)
  @IsEmail()
  recipientEmail?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(10_000_000)
  amount: number;
}
