import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order } from '../models/order.model';
import { environment } from '../../environments/environment';

/**
 * Pedidos contra la API.
 *
 * El servidor no acepta precios ni totales del cliente: solo `productId` y
 * `quantity`. Recalcula el importe desde la base de datos, comprueba el stock
 * y lo descuenta en una transaccion. Este servicio es un envoltorio fino a
 * proposito; toda la logica de negocio esta del lado del servidor, que es el
 * unico sitio donde no se puede manipular.
 */
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, request);
  }

  /** El servidor filtra por el usuario del token; no se le pasa ningun id. */
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  cancelOrder(id: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
