import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  // Se normaliza aquí para que el índice único de la base de datos haga su
  // trabajo: sin esto, "Ana@x.com" y "ana@x.com" serían dos cuentas distintas.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72) // límite real de bcrypt: lo que pase de 72 bytes se ignora
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password!: string;
}
