import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay } from 'rxjs';
import {
  ALL_CATEGORIES,
  PagedProducts,
  Product,
  ProductFilter,
  Review,
} from '../models/product.model';
import { environment } from '../../environments/environment';

/**
 * Catálogo servido por la API.
 *
 * Ya no hay copia local del catálogo ni deltas en localStorage: el stock, las
 * reseñas y la nota media viven en la base de datos, que es la única fuente de
 * verdad. Eso elimina de raíz toda una clase de fallos de la versión anterior
 * (el array mutable compartido entre páginas, el stock que nunca bajaba).
 */
@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Las categorías cambian poco, así que se piden una vez y se comparte la
   * respuesta entre todos los suscriptores en lugar de repetir la llamada cada
   * vez que alguien abre el desplegable de filtros.
   */
  private categories$?: Observable<string[]>;

  getProducts(filter: ProductFilter = {}): Observable<PagedProducts> {
    this.loadingSubject.next(true);

    return this.http
      .get<PagedProducts>(this.baseUrl, { params: this.toParams(filter) })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /** Atajo para quien solo quiere la lista y no le importa la paginación. */
  getProductList(filter: ProductFilter = {}): Observable<Product[]> {
    return this.getProducts(filter).pipe(map(page => page.items));
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  /**
   * Destacados: se piden los mejor valorados en vez de barajar en el cliente.
   * Con paginación en el servidor, barajar aquí solo mezclaría la página que
   * haya tocado, que no es lo mismo que "los mejores de la tienda".
   */
  getFeatured(limit = 6): Observable<Product[]> {
    return this.getProductList({ sortBy: 'rating', limit });
  }

  getCategories(): Observable<string[]> {
    this.categories$ ??= this.http.get<string[]>(`${this.baseUrl}/categories`).pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.categories$;
  }

  searchSuggestions(term: string, limit = 6): Observable<Product[]> {
    const q = term.trim();
    if (!q) return of([]);

    return this.getProductList({ searchTerm: q, limit }).pipe(
      // Un fallo de red en el buscador no debe romper la barra de navegación:
      // se enseña "sin resultados" y ya.
      catchError(() => of([])),
    );
  }

  addReview(productId: number, review: Pick<Review, 'rating' | 'comment'>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/${productId}/reviews`, review);
  }

  private toParams(filter: ProductFilter): HttpParams {
    let params = new HttpParams();

    if (filter.category && filter.category !== ALL_CATEGORIES) {
      params = params.set('category', filter.category);
    }
    if (filter.searchTerm) {
      params = params.set('q', filter.searchTerm);
    }
    // Se compara con `null` además de `undefined`: un input numérico vacío
    // ligado con ngModel emite `null`, y mandar `?minPrice=` haría fallar la
    // validación del servidor.
    if (filter.minPrice != null) {
      params = params.set('minPrice', filter.minPrice);
    }
    if (filter.maxPrice != null) {
      params = params.set('maxPrice', filter.maxPrice);
    }
    if (filter.minRating != null && filter.minRating > 0) {
      params = params.set('minRating', filter.minRating);
    }
    if (filter.sortBy && filter.sortBy !== 'relevance') {
      params = params.set('sort', filter.sortBy);
    }
    if (filter.page) {
      params = params.set('page', filter.page);
    }
    if (filter.limit) {
      params = params.set('limit', filter.limit);
    }

    return params;
  }
}
