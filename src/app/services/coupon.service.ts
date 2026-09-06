import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Coupon {
  code: string;
  discountPercent: number;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/coupons`;

  /**
   * Comprueba un cupon. Devuelve `null` si no vale, para que el checkout
   * distinga "codigo incorrecto" de un error de red sin leer codigos HTTP.
   *
   * Ojo: esto es solo para dar respuesta inmediata en la interfaz. El descuento
   * de verdad lo aplica el servidor al crear el pedido, y si el cupon caduca
   * entre medias el pedido se rechaza.
   */
  validate(code: string): Observable<Coupon | null> {
    return this.http
      .post<Coupon>(`${this.baseUrl}/validate`, { code })
      .pipe(catchError(() => of(null)));
  }
}
