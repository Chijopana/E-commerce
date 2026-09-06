import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CartService } from '../services/cart.service';
import { ProductsService } from '../services/products.service';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { ALL_CATEGORIES, Product, ProductFilter, ProductSort } from '../models/product.model';
import { ProductCardComponent } from '../components/product-card.component';
import { TranslatePipe } from '../i18n/translate.pipe';
import { categoryKey } from '../i18n/catalog-labels';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatPaginatorModule,
    ProductCardComponent,
    TranslatePipe,
  ],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class Products implements OnInit {
  private cartService = inject(CartService);
  private productsService = inject(ProductsService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly wishlistIds = signal<number[]>([]);
  readonly isAuthenticated = signal(false);
  readonly filtersOpen = signal(false);

  /** Las categorías las sirve la API, no una lista fija en el cliente. */
  readonly categories = signal<string[]>([]);
  readonly allCategories = ALL_CATEGORIES;

  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly pageSize = PAGE_SIZE;

  readonly sortOptions: { value: ProductSort; key: string }[] = [
    { value: 'relevance', key: 'products.sort.relevance' },
    { value: 'price-asc', key: 'products.sort.priceAsc' },
    { value: 'price-desc', key: 'products.sort.priceDesc' },
    { value: 'rating', key: 'products.sort.rating' },
    { value: 'name', key: 'products.sort.name' },
  ];

  // Estado de los filtros (ligado con ngModel desde la plantilla).
  searchTerm = '';
  selectedCategory: string = ALL_CATEGORIES;
  minPrice?: number;
  maxPrice?: number;
  minRating = 0;
  sortBy: ProductSort = 'relevance';
  pageIndex = 0;

  readonly activeFilterCount = signal(0);

  readonly resultCountKey = computed(() =>
    this.total() === 1 ? 'products.countOne' : 'products.count',
  );

  /**
   * Todas las peticiones de catálogo pasan por aquí.
   *
   * `debounceTime` evita lanzar una búsqueda por cada tecla, y `switchMap`
   * descarta las respuestas obsoletas: al teclear rápido, una consulta lenta ya
   * no puede pisar el resultado de la más reciente.
   */
  private filterRequests$ = new Subject<ProductFilter>();

  constructor() {
    this.filterRequests$
      .pipe(
        debounceTime(250),
        switchMap(filter => this.productsService.getProducts(filter)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: page => {
          this.products.set(page.items);
          this.total.set(page.total);
          this.loading.set(false);
          this.loadError.set(false);
        },
        error: () => {
          this.products.set([]);
          this.total.set(0);
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  ngOnInit(): void {
    this.productsService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => this.categories.set(categories));

    // La categoría y la búsqueda pueden venir por URL (desde la home o desde el
    // buscador de la barra superior), así la vista es enlazable y compartible.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.selectedCategory = params.get('category') ?? ALL_CATEGORIES;
        this.searchTerm = params.get('q') ?? '';
        this.pageIndex = 0;
        this.applyFilters();
      });

    this.authService.authState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.isAuthenticated.set(state.isAuthenticated));

    this.wishlistService.wishlist$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ids => this.wishlistIds.set(ids));
  }

  /** Cambiar un filtro vuelve a la primera página: si no, se ve un vacío raro. */
  onFilterChange(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.applyFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  applyFilters(): void {
    this.loading.set(true);
    this.activeFilterCount.set(this.countActiveFilters());

    this.filterRequests$.next({
      category: this.selectedCategory,
      searchTerm: this.searchTerm || undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      minRating: this.minRating || undefined,
      sortBy: this.sortBy,
      page: this.pageIndex + 1,
      limit: PAGE_SIZE,
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = ALL_CATEGORIES;
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.minRating = 0;
    this.sortBy = 'relevance';
    this.pageIndex = 0;

    // Limpia también la URL: si no, al recargar volverían los filtros de antes.
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onFilterChange();
  }

  toggleFilters(): void {
    this.filtersOpen.update(open => !open);
  }

  categoryLabel(value: string): string {
    return categoryKey(value);
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
      // Antes esto no decía nada: al llegar al tope de stock, el botón
      // simplemente dejaba de responder.
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

  private countActiveFilters(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.selectedCategory !== ALL_CATEGORIES) count++;
    if (this.minPrice != null) count++;
    if (this.maxPrice != null) count++;
    if (this.minRating) count++;
    return count;
  }
}
