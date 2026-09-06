import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { CouponService, Coupon } from '../services/coupon.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { CartState } from '../models/cart.model';
import { PAYMENT_METHODS, PaymentMethod } from '../models/order.model';
import { calculateTotals } from '../models/pricing';
import { apiErrorMessage } from '../core/api-error';
import { TranslatePipe } from '../i18n/translate.pipe';
import { paymentMethodKey, paymentMethodIcon } from '../i18n/catalog-labels';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatStepperModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private couponService = inject(CouponService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly cartState = signal<CartState>(this.cartService.getState());
  readonly paymentMethods = PAYMENT_METHODS;

  readonly appliedCoupon = signal<Coupon | null>(null);
  readonly couponError = signal('');
  readonly validatingCoupon = signal(false);
  readonly submitting = signal(false);

  couponCode = '';

  /**
   * Totales para PINTAR el resumen.
   *
   * El importe que se cobra lo recalcula el servidor desde la base de datos al
   * crear el pedido; esto solo sirve para que el usuario vea el desglose antes
   * de confirmar. Si los dos no coinciden, manda el servidor.
   */
  readonly totals = computed(() =>
    calculateTotals(this.cartState().subtotal, this.appliedCoupon()?.discountPercent ?? 0),
  );

  readonly shippingForm: FormGroup;
  readonly paymentForm: FormGroup;

  constructor() {
    // No hace falta vigilar el carrito para expulsar al usuario si se vacía:
    // de eso se encarga `cartNotEmptyGuard` al entrar en la ruta.
    this.cartService.cartState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.cartState.set(state));

    const user = this.authService.getUser();

    this.shippingForm = this.fb.group({
      name: [user?.name ?? '', [Validators.required, Validators.minLength(3)]],
      email: [user?.email ?? '', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['CREDIT_CARD' as PaymentMethod, [Validators.required]],
    });
  }

  paymentLabel(method: PaymentMethod): string {
    return paymentMethodKey(method);
  }

  paymentIcon(method: PaymentMethod): string {
    return paymentMethodIcon(method);
  }

  // ------------------------------------------------------------------ cupón

  applyCoupon(): void {
    const code = this.couponCode.trim();
    if (!code) return;

    this.couponError.set('');
    this.validatingCoupon.set(true);

    this.couponService
      .validate(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(coupon => {
        this.validatingCoupon.set(false);

        if (coupon) {
          this.appliedCoupon.set(coupon);
        } else {
          this.appliedCoupon.set(null);
          this.couponError.set(this.translation.translate('checkout.coupon.invalid'));
        }
      });
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponCode = '';
    this.couponError.set('');
  }

  // ----------------------------------------------------------------- pedido

  submitOrder(): void {
    if (this.shippingForm.invalid || this.paymentForm.invalid) {
      this.shippingForm.markAllAsTouched();
      this.paymentForm.markAllAsTouched();
      this.notifications.error(
        this.translation.translate('checkout.error.formTitle'),
        this.translation.translate('checkout.error.formText'),
      );
      return;
    }

    if (this.cartService.isEmpty()) {
      void this.router.navigate(['/cart']);
      return;
    }

    this.submitting.set(true);

    this.orderService
      .createOrder({
        // Solo qué y cuánto: los precios los pone el servidor.
        items: this.cartService.toOrderItems(),
        shippingInfo: this.shippingForm.value,
        paymentMethod: this.paymentForm.value.paymentMethod,
        couponCode: this.appliedCoupon()?.code,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async order => {
          this.submitting.set(false);
          this.cartService.clearCart();

          await this.notifications.dialogInfo({
            title: this.translation.translate('checkout.success.title'),
            html: `
              <p>${this.translation.translate('checkout.success.body', { id: order.id })}</p>
              <p class="dialog-note">${this.translation.translate('checkout.success.delivery', {
                date: new Date(order.estimatedDelivery).toLocaleDateString(
                  this.translation.currentLang(),
                ),
              })}</p>
            `,
            confirmText: this.translation.translate('checkout.success.action'),
          });

          void this.router.navigate(['/orders']);
        },
        error: error => {
          this.submitting.set(false);

          // El servidor puede rechazar el pedido porque el stock se agotó entre
          // medias o porque el cupón acaba de caducar. Ese mensaje concreto es
          // mucho más útil que un "algo ha fallado" genérico.
          this.notifications.error(
            this.translation.translate(apiErrorMessage(error, 'checkout.error.failed')),
          );
        },
      });
  }

  goBackToCart(): void {
    void this.router.navigate(['/cart']);
  }
}
