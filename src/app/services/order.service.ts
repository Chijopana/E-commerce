import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, OrderStatus, ShippingInfo, PaymentMethod } from '../models/order.model';
import { CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly STORAGE_KEY = 'ecommerce_orders';
  
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor() {
    this.loadOrders();
  }

  private loadOrders(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const orders = JSON.parse(saved);
        // Convert date strings back to Date objects
        orders.forEach((order: Order) => {
          order.createdAt = new Date(order.createdAt);
          order.estimatedDelivery = new Date(order.estimatedDelivery);
        });
        this.ordersSubject.next(orders);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    }
  }

  private saveOrders(orders: Order[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    this.ordersSubject.next(orders);
  }

  createOrder(
    userId: number,
    items: CartItem[],
    shippingInfo: ShippingInfo,
    paymentMethod: PaymentMethod
  ): Observable<Order> {
    return new Observable(observer => {
      const orders = this.ordersSubject.value;
      
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // 7 days from now

      const newOrder: Order = {
        id: this.generateOrderId(),
        userId,
        items: [...items],
        total,
        status: OrderStatus.PENDING,
        shippingInfo,
        paymentMethod,
        createdAt: new Date(),
        estimatedDelivery,
      };

      orders.unshift(newOrder); // Add to beginning
      this.saveOrders(orders);

      observer.next(newOrder);
      observer.complete();
    });
  }

  getOrdersByUserId(userId: number): Observable<Order[]> {
    return new Observable(observer => {
      const userOrders = this.ordersSubject.value.filter(o => o.userId === userId);
      observer.next(userOrders);
      observer.complete();
    });
  }

  getOrderById(orderId: string): Observable<Order | undefined> {
    return new Observable(observer => {
      const order = this.ordersSubject.value.find(o => o.id === orderId);
      observer.next(order);
      observer.complete();
    });
  }

  updateOrderStatus(orderId: string, status: OrderStatus): void {
    const orders = this.ordersSubject.value;
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      this.saveOrders([...orders]);
    }
  }

  cancelOrder(orderId: string): Observable<boolean> {
    return new Observable(observer => {
      const orders = this.ordersSubject.value;
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        orders[orderIndex].status = OrderStatus.CANCELLED;
        this.saveOrders([...orders]);
        observer.next(true);
      } else {
        observer.next(false);
      }
      
      observer.complete();
    });
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }
}
