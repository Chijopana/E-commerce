import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CartService } from '../services/cart.service';
import { ProductsService } from '../services/products.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { CartItem, CartState } from '../models/cart.model';
import { FREE_SHIPPING_THRESHOLD } from '../models/pricing';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class Cart {
  private cartService = inject(CartService);
  private productsService = inject(ProductsService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly state = signal<CartState>(this.cartService.getState());
  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  constructor() {
    this.cartService.cartState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.state.set(state));

    // Al abrir el carrito se refrescan precio y stock contra el catalogo: el
    // producto pudo subir de precio o agotarse desde que se anadio, y cobrar
    // el precio viejo seria mentir.
    this.productsService
      .getProductList({ limit: 60 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => this.cartService.syncWithCatalog(products),
        // Sin conexion se sigue con los datos guardados; el servidor
        // revalidara igualmente al confirmar el pedido.
        error: () => undefined,
      });
  }

  /** Porcentaje recorrido hacia el envío gratis, para la barra de progreso. */
  freeShippingProgress(): number {
    const subtotal = this.state().subtotal;
    return Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity >= item.stock) {
      this.notifications.warning(
        this.translation.translate('toast.stockLimit', { count: item.stock }),
      );
      return;
    }
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    } else {
      void this.removeItem(item);
    }
  }

  async removeItem(item: CartItem): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: this.translation.translate('cart.confirm.removeTitle'),
      text: this.translation.translate('cart.confirm.removeText', { name: item.name }),
      confirmText: this.translation.translate('common.remove'),
      cancelText: this.translation.translate('common.cancel'),
      danger: true,
    });

    if (!confirmed) return;

    this.cartService.removeFromCart(item.id);
    this.notifications.success(this.translation.translate('cart.toast.removed'));
  }

  async clearCart(): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: this.translation.translate('cart.confirm.clearTitle'),
      text: this.translation.translate('cart.confirm.clearText'),
      confirmText: this.translation.translate('cart.actions.clear'),
      cancelText: this.translation.translate('common.cancel'),
      danger: true,
    });

    if (!confirmed) return;

    this.cartService.clearCart();
    this.notifications.success(this.translation.translate('cart.toast.cleared'));
  }

  goToCheckout(): void {
    void this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    void this.router.navigate(['/products']);
  }

  goToProduct(item: CartItem): void {
    void this.router.navigate(['/products', item.id]);
  }
}
