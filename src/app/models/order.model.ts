import { CartItem } from './cart.model';

export interface Order {
  id: string;
  userId: number;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  estimatedDelivery: Date;
}

export enum OrderStatus {
  PENDING = 'Pendiente',
  PROCESSING = 'En proceso',
  SHIPPED = 'Enviado',
  DELIVERED = 'Entregado',
  CANCELLED = 'Cancelado'
}

export interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'Tarjeta de Crédito',
  DEBIT_CARD = 'Tarjeta de Débito',
  PAYPAL = 'PayPal',
  CASH = 'Efectivo'
}
