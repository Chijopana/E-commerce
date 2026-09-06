import { Component, computed, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../models/product.model';
import { TranslationService } from '../services/translation.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import { categoryKey } from '../i18n/catalog-labels';

/**
 * Tarjeta de producto compartida por el catálogo, la home y favoritos.
 *
 * Antes cada una de esas páginas repetía el mismo bloque de markup con su
 * propio CSS, y se habían desincronizado: la home ni siquiera pintaba la imagen
 * del producto (mostraba un icono gris de relleno) y solo el catálogo enseñaba
 * el aviso de stock bajo.
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  template: `
    <mat-card
      class="product-card"
      tabindex="0"
      role="link"
      [attr.aria-label]="'products.card.viewDetail' | t: { name: product().name }"
      (click)="openDetail()"
      (keydown.enter)="openDetail()"
      (keydown.space)="$event.preventDefault(); openDetail()">
      <div class="image-wrap">
        <img
          [src]="product().image"
          [alt]="product().name"
          loading="lazy"
          decoding="async"
          (error)="onImageError($event)" />

        <span class="stock-badge" [class.out]="isOutOfStock()">
          <mat-icon aria-hidden="true">{{ isOutOfStock() ? 'cancel' : 'check_circle' }}</mat-icon>
          {{ (isOutOfStock() ? 'products.card.soldOut' : 'products.card.available') | t }}
        </span>

        @if (showWishlist()) {
          <button
            mat-icon-button
            class="wishlist-btn"
            [class.active]="inWishlist()"
            [matTooltip]="wishlistLabel()"
            [attr.aria-label]="wishlistLabel()"
            [attr.aria-pressed]="inWishlist()"
            (click)="onWishlist($event)">
            <mat-icon>{{ inWishlist() ? 'favorite' : 'favorite_border' }}</mat-icon>
          </button>
        }

        @if (removable()) {
          <button
            mat-icon-button
            class="remove-btn"
            [matTooltip]="'wishlist.remove' | t"
            [attr.aria-label]="'wishlist.remove' | t"
            (click)="onRemove($event)">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <div class="card-body">
        <span class="category">{{ categoryLabel() | t }}</span>
        <h3 class="name">{{ product().name }}</h3>
        <p class="description">{{ product().description }}</p>

        <div class="rating" [attr.aria-label]="product().rating + ' / 5'">
          @for (star of stars; track star) {
            <mat-icon class="star" aria-hidden="true">{{ starIcon(star) }}</mat-icon>
          }
          <span class="rating-text">
            @if (product().reviews.length > 0) {
              {{ product().rating }} · {{ 'products.card.reviews' | t: { count: product().reviews.length } }}
            } @else {
              {{ 'products.card.noReviews' | t }}
            }
          </span>
        </div>

        @if (isLowStock()) {
          <p class="low-stock">
            <mat-icon aria-hidden="true">bolt</mat-icon>
            {{ 'products.card.lowStock' | t: { count: product().stock } }}
          </p>
        }

        <p class="price">\${{ product().price | number: '1.2-2' }}</p>
      </div>

      <div class="card-actions">
        <button
          mat-flat-button
          class="add-btn"
          [disabled]="isOutOfStock()"
          (click)="onAdd($event)">
          <mat-icon>shopping_cart</mat-icon>
          {{ (isOutOfStock() ? 'products.card.soldOut' : 'products.card.add') | t }}
        </button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .product-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        cursor: pointer;
        border: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface-container-low);
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }

      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg) !important;
        border-color: color-mix(in srgb, var(--mat-sys-primary) 40%, transparent);
      }

      .image-wrap {
        position: relative;
        aspect-ratio: 4 / 3;
        background: var(--mat-sys-surface-container);
        overflow: hidden;
      }

      .image-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }

      .product-card:hover .image-wrap img {
        transform: scale(1.05);
      }

      .stock-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px 4px 6px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        background: var(--state-success);
        box-shadow: var(--shadow-sm);
      }

      .stock-badge.out {
        background: var(--state-error);
      }

      .stock-badge mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .wishlist-btn,
      .remove-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        background: var(--mat-sys-surface);
        color: var(--mat-sys-on-surface-variant);
        box-shadow: var(--shadow-sm);
      }

      .wishlist-btn.active {
        color: var(--state-error);
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 14px 16px 8px;
        flex: 1;
      }

      .category {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mat-sys-primary);
      }

      .name {
        font-size: 15px;
        font-weight: 600;
        line-height: 1.35;
        /* Dos líneas fijas: sin esto, un nombre largo desalineaba el precio y
           el botón respecto a las tarjetas vecinas de la misma fila. */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 2.7em;
      }

      .description {
        font-size: 13px;
        line-height: 1.5;
        color: var(--mat-sys-on-surface-variant);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-wrap: wrap;
      }

      .star {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #f5a524;
      }

      .rating-text {
        margin-left: 6px;
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }

      .low-stock {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--state-warning);
      }

      .low-stock mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      .price {
        margin-top: auto;
        padding-top: 6px;
        font-size: 21px;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
      }

      .card-actions {
        padding: 0 16px 16px;
      }

      .add-btn {
        width: 100%;
        height: 42px;
        font-weight: 600;
      }
    `,
  ],
})
export class ProductCardComponent {
  private router = inject(Router);
  private translation = inject(TranslationService);

  readonly product = input.required<Product>();
  readonly inWishlist = input(false);
  /** Muestra el corazón de favoritos (solo tiene sentido con sesión iniciada). */
  readonly showWishlist = input(false);
  /** Muestra la X de quitar (se usa en la página de favoritos). */
  readonly removable = input(false);

  readonly add = output<Product>();
  readonly wishlistToggle = output<Product>();
  readonly remove = output<Product>();

  readonly stars = [1, 2, 3, 4, 5];

  readonly isOutOfStock = computed(() => this.product().stock <= 0);
  readonly isLowStock = computed(() => {
    const stock = this.product().stock;
    return stock > 0 && stock <= 5;
  });
  readonly categoryLabel = computed(() => categoryKey(this.product().category));

  wishlistLabel(): string {
    return this.translation.translate(
      this.inWishlist() ? 'products.card.removeWishlist' : 'products.card.addWishlist',
    );
  }

  starIcon(position: number): string {
    const rating = this.product().rating;
    if (rating >= position) return 'star';
    return rating >= position - 0.5 ? 'star_half' : 'star_outline';
  }

  openDetail(): void {
    void this.router.navigate(['/products', this.product().id]);
  }

  onAdd(event: Event): void {
    event.stopPropagation();
    this.add.emit(this.product());
  }

  onWishlist(event: Event): void {
    event.stopPropagation();
    this.wishlistToggle.emit(this.product());
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.product());
  }

  /** Imagen rota (por ejemplo, sin conexión al CDN de los placeholders). */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackApplied']) return;
    img.dataset['fallbackApplied'] = 'true';
    img.src = FALLBACK_IMAGE;
  }
}

/**
 * SVG en línea como imagen de reserva. Antes el fallback apuntaba a otra URL
 * remota (o, en el checkout, a `assets/images/placeholder.jpg`, que no existe),
 * así que si fallaba la red fallaba también el sustituto y quedaba el icono de
 * imagen rota del navegador.
 */
const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#e5e5ea"/>
      <g fill="#9a9aa2" transform="translate(170 118)">
        <path d="M4 0h52a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4zm0 4v34l14-14 10 10 14-16 14 18V4H4z"/>
        <circle cx="18" cy="14" r="5"/>
      </g>
    </svg>`,
  );
