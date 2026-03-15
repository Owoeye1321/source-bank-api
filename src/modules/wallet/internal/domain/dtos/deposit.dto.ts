import { IsNumber, Max, Min } from 'class-validator';

export class DepositDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10_000_000) // reasonable upper limit
  amount: number;
}
