import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { Product } from '../models/product.model';
import { ProductCardComponent } from '../components/product-card.component';
import { apiErrorMessage } from '../core/api-error';
import { TranslatePipe } from '../i18n/translate.pipe';
import { categoryKey } from '../i18n/catalog-labels';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    ProductCardComponent,
    TranslatePipe,
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  readonly product = signal<Product | null>(null);
  readonly relatedProducts = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly isAuthenticated = signal(false);
  readonly wishlistIds = signal<number[]>([]);

  /** Unidades a añadir; el catálogo no permitía elegir cantidad desde la ficha. */
  readonly quantity = signal(1);

  readonly stars = [1, 2, 3, 4, 5];
  readonly ratingOptions = [5, 4, 3, 2, 1];

  readonly inWishlist = computed(() => {
    const current = this.product();
    return current ? this.wishlistIds().includes(current.id) : false;
  });

  readonly categoryLabel = computed(() => {
    const current = this.product();
    return current ? categoryKey(current.category) : '';
  });

  readonly reviewForm: FormGroup = this.fb.group({
    rating: [5, [Validators.required]],
    comment: ['', [Validators.required, Validators.minLength(5)]],
  });

  get locale(): string {
    return this.translation.currentLang();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));

      if (!Number.isFinite(id) || id <= 0) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.loadProduct(id);
    });

    this.authService.authState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.isAuthenticated.set(state.isAuthenticated));

    this.wishlistService.wishlist$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ids => this.wishlistIds.set(ids));
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.quantity.set(1);

    this.productsService
      .getProductById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: product => {
          this.loading.set(false);
          this.product.set(product);
          this.loadRelated(product);
        },
        // La API responde 404 si el producto no existe. Cualquier otro fallo
        // (red, servidor caido) tambien acaba aqui: se ensena la misma pagina
        // de "no encontrado", que al menos ofrece una salida al catalogo.
        error: () => {
          this.loading.set(false);
          this.product.set(null);
          this.notFound.set(true);
        },
      });
  }

  private loadRelated(current: Product): void {
    // Se piden solo los de la misma categoria al servidor, en vez de traer el
    // catalogo entero y filtrar en el cliente.
    this.productsService
      .getProductList({ category: current.category, limit: 5 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products =>
          this.relatedProducts.set(products.filter(p => p.id !== current.id).slice(0, 4)),
        error: () => this.relatedProducts.set([]),
      });
  }

  starIcon(position: number, rating: number): string {
    if (rating >= position) return 'star';
    return rating >= position - 0.5 ? 'star_half' : 'star_outline';
  }

  // --------------------------------------------------------------- cantidad

  increaseQuantity(): void {
    const stock = this.product()?.stock ?? 0;
    this.quantity.update(q => Math.min(q + 1, stock));
  }

  decreaseQuantity(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  // ---------------------------------------------------------------- carrito

  addToCart(): void {
    const product = this.product();
    if (!product) return;

    const result = this.cartService.addToCart(product, this.quantity());

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

  addRelatedToCart(product: Product): void {
    const result = this.cartService.addToCart(product);
    if (result.ok) {
      this.notifications.success(
        this.translation.translate('toast.addedToCart', { name: product.name }),
      );
    } else {
      this.notifications.error(this.translation.translate('toast.outOfStock'));
    }
  }

  // --------------------------------------------------------------- favoritos

  toggleWishlist(): void {
    const product = this.product();
    if (!product) return;

    if (!this.isAuthenticated()) {
      this.notifications.info(this.translation.translate('toast.loginRequiredWishlist'));
      return;
    }

    this.wishlistService
      .toggle(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: added =>
          this.notifications.success(
            this.translation.translate(added ? 'toast.wishlistAdded' : 'toast.wishlistRemoved'),
          ),
        error: () => this.notifications.error(this.translation.translate('errors.network')),
      });
  }

  // ----------------------------------------------------------------- reseñas

  submitReview(): void {
    const product = this.product();
    if (!product) return;

    if (!this.isAuthenticated()) {
      this.notifications.info(this.translation.translate('toast.loginRequiredReview'));
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    // El autor lo deduce el servidor del token: no se manda el id de usuario,
    // que seria confiar en el cliente para decir quien firma la resena.
    this.productsService
      .addReview(product.id, {
        rating: this.reviewForm.value.rating,
        comment: this.reviewForm.value.comment.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          // La API devuelve el producto ya con la resena y la nota
          // recalculada, asi que no hace falta volver a pedirlo.
          this.product.set(updated);
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.notifications.success(this.translation.translate('toast.reviewThanks'));
        },
        error: error =>
          this.notifications.error(
            this.translation.translate(apiErrorMessage(error, 'errors.network')),
          ),
      });
  }

  goBack(): void {
    void this.router.navigate(['/products']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackApplied']) return;
    img.dataset['fallbackApplied'] = 'true';
    img.src =
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
          '<rect width="600" height="600" fill="#e5e5ea"/></svg>',
      );
  }
}
