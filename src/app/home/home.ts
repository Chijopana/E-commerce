import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Product } from '../models/product.model';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { ProductCardComponent } from '../components/product-card.component';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ProductCardComponent,
    TranslatePipe,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  readonly featuredProducts = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly wishlistIds = signal<number[]>([]);
  readonly isAuthenticated = signal(false);

  /** Marcadores de posición mientras cargan los destacados. */
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  newsletterEmail = '';
  readonly newsletterError = signal('');

  // Los valores coinciden con las categorias que sirve la API; el icono es
  // decoracion del frontend y por eso vive aqui.
  readonly categories = [
    { key: 'category.electronics', value: 'Electrónica', icon: 'devices' },
    { key: 'category.accessories', value: 'Accesorios', icon: 'backpack' },
    { key: 'category.sports', value: 'Deportes', icon: 'fitness_center' },
    { key: 'category.home', value: 'Hogar', icon: 'chair' },
  ];

  readonly features = [
    { icon: 'local_shipping', key: 'shipping' },
    { icon: 'verified_user', key: 'secure' },
    { icon: 'workspace_premium', key: 'quality' },
    { icon: 'payments', key: 'payments' },
  ];

  readonly stats = [
    { icon: 'inventory_2', value: '100+', key: 'home.stats.products' },
    { icon: 'groups', value: '1000+', key: 'home.stats.customers' },
    { icon: 'support_agent', value: '24/7', key: 'home.stats.support' },
    { icon: 'thumb_up', value: '98%', key: 'home.stats.satisfaction' },
  ];

  /** Los testimonios son datos de demostración, no traducibles por clave. */
  readonly testimonials = [
    { name: 'Juan García', comment: 'Excelente calidad y servicio rápido. Muy satisfecho con mi compra.' },
    { name: 'María López', comment: 'Productos originales y precios muy competitivos. Lo recomiendo.' },
    { name: 'Carlos Méndez', comment: 'El envío fue rápido y el producto llegó en perfectas condiciones.' },
    { name: 'Ana Rodríguez', comment: 'Atención al cliente impecable, resolvieron mis dudas al instante.' },
  ];

  ngOnInit(): void {
    // `getFeatured` baraja una copia. Antes la home ordenaba con `sort()` el
    // array que devolvía el servicio, que era el catálogo real: el orden de la
    // tienda entera cambiaba solo por haber pasado por la portada.
    this.productsService
      .getFeatured(6)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.featuredProducts.set(products);
          this.loading.set(false);
        },
        error: () => {
          // La portada tiene que salir del esqueleto aunque la API falle: el
          // resto de la pagina (categorias, ventajas) sigue siendo util.
          this.featuredProducts.set([]);
          this.loading.set(false);
        },
      });

    this.authService.authState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.isAuthenticated.set(state.isAuthenticated));

    this.wishlistService.wishlist$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ids => this.wishlistIds.set(ids));
  }

  goToProducts(category?: string): void {
    void this.router.navigate(['/products'], {
      queryParams: category ? { category } : {},
    });
  }

  scrollToCategories(): void {
    document.querySelector('.categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  toggleWishlist(product: Product): void {
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

  /**
   * El formulario del newsletter existía pero no estaba conectado a nada: se
   * podía escribir y pulsar "Suscribirse" sin que ocurriera absolutamente nada.
   * Sigue sin haber backend, pero al menos valida y confirma.
   */
  subscribeNewsletter(): void {
    const email = this.newsletterEmail.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    if (!valid) {
      this.newsletterError.set(this.translation.translate('home.newsletter.invalid'));
      return;
    }

    this.newsletterError.set('');
    this.newsletterEmail = '';
    this.notifications.success(this.translation.translate('home.newsletter.success'));
  }
}
