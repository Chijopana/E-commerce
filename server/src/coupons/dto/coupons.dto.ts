import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  // Los cupones se guardan en mayusculas: normalizar aqui hace que
  // "descuento10" y " DESCUENTO10 " funcionen igual.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code!: string;
}
