import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Coupon { code: string; discountPercent: number; }

@Injectable({ providedIn: 'root' })
export class CouponService {
  private coupons: Coupon[] = [
    { code: 'DESCUENTO10', discountPercent: 10 },
    { code: 'BIENVENIDO15', discountPercent: 15 },
    { code: 'VIP20', discountPercent: 20 },
  ];

  validate(code: string): Observable<Coupon | null> {
    const found = this.coupons.find(c => c.code === code.trim().toUpperCase());
    return of(found ?? null).pipe(delay(400));
  }
}