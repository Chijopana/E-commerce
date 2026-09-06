import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { WishlistService } from '../services/wishlist.service';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { Product } from '../models/product.model';
import { ProductCardComponent } from '../components/product-card.component';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ProductCardComponent, TranslatePipe],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css'],
})
export class Wishlist implements OnInit {
  private wishlistService = inject(WishlistService);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3];

  ngOnInit(): void {
    // `combineLatest` mantiene la lista al dia: al quitar un favorito, la
    // wishlist emite de nuevo y la vista se recalcula sin recargar nada.
    combineLatest([
      this.wishlistService.wishlist$,
      this.productsService.getProductList({ limit: 60 }),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([ids, products]) => {
          this.products.set(products.filter(p => ids.includes(p.id)));
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
        },
      });
  }

  async remove(product: Product): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: this.translation.translate('wishlist.confirm.title'),
      text: this.translation.translate('wishlist.confirm.text'),
      confirmText: this.translation.translate('common.remove'),
      cancelText: this.translation.translate('common.cancel'),
      danger: true,
    });

    if (!confirmed) return;

    this.wishlistService
      .remove(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.notifications.success(this.translation.translate('toast.wishlistRemoved')),
        error: () => this.notifications.error(this.translation.translate('errors.network')),
      });
  }

  addToCart(product: Product): void {
    const result = this.cartService.addToCart(product);

    if (result.ok) {
      this.notifications.success(
        this.translation.translate('toast.addedToCart', { name: product.name }),
      );
    } else if (result.reason === 'out-of-stock') {
      this.notifications.error(this.translation.translate('toast.outOfStock'));
    } else {
      this.notifications.warning(
        this.translation.translate('toast.stockLimit', { count: result.available }),
      );
    }
  }

  goToProducts(): void {
    void this.router.navigate(['/products']);
  }
}
