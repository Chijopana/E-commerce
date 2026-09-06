import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const PAYMENT_METHODS = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'CASH'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Una línea del pedido tal y como la manda el cliente.
 *
 * Fíjate en lo que NO viaja: ni precio, ni nombre, ni total. El cliente dice
 * qué quiere y cuánto; el importe lo calcula el servidor leyendo la base de
 * datos. Aceptar el precio del cliente es lo que permite comprar por 0.
 */
export class OrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Math.min(Number(value), 99)) // tope defensivo por línea
  quantity!: number;
}

export class ShippingInfoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsEmail({}, { message: 'El email de envío no es válido' })
  email!: string;

  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  phone!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @Matches(/^\d{5}$/, { message: 'El código postal debe tener 5 dígitos' })
  postalCode!: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido no puede estar vacío' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo!: ShippingInfoDto;

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : undefined,
  )
  couponCode?: string;
}
