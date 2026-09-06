import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductsService } from './products.service';
import { PagedProducts } from '../models/product.model';
import { environment } from '../../environments/environment';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  const emptyPage: PagedProducts = { items: [], total: 0, page: 1, limit: 24, totalPages: 1 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('parámetros de consulta', () => {
    it('no manda parámetros vacíos', () => {
      service.getProducts().subscribe();

      // Sin filtros la URL va limpia; mandar `?q=&minPrice=` haría fallar la
      // validación del servidor.
      const req = httpMock.expectOne(`${environment.apiUrl}/products`);
      expect(req.request.params.keys()).toEqual([]);
      req.flush(emptyPage);
    });

    it('traduce los filtros de categoría, precio, orden y página', () => {
      service
        .getProducts({
          category: 'Electrónica',
          minPrice: 10,
          maxPrice: 200,
          sortBy: 'price-asc',
          page: 2,
          limit: 12,
        })
        .subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/products`);
      expect(req.request.params.get('category')).toBe('Electrónica');
      expect(req.request.params.get('minPrice')).toBe('10');
      expect(req.request.params.get('maxPrice')).toBe('200');
      expect(req.request.params.get('sort')).toBe('price-asc');
      expect(req.request.params.get('page')).toBe('2');
      req.flush(emptyPage);
    });

    it('omite la categoría "todas" y el orden por relevancia', () => {
      service.getProducts({ category: '__ALL__', sortBy: 'relevance' }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/products`);
      expect(req.request.params.has('category')).toBeFalse();
      expect(req.request.params.has('sort')).toBeFalse();
      req.flush(emptyPage);
    });

    it('ignora un precio ausente, que es lo que deja un input numérico vacío', () => {
      service.getProducts({ minPrice: undefined, maxPrice: undefined }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/products`);
      expect(req.request.params.has('minPrice')).toBeFalse();
      req.flush(emptyPage);
    });
  });

  describe('loading$', () => {
    it('recorre false -> true -> false en una carga', done => {
      const seen: boolean[] = [];

      service.loading$.subscribe(value => {
        seen.push(value);
        if (seen.length === 3) {
          expect(seen).toEqual([false, true, false]);
          done();
        }
      });

      service.getProducts().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/products`).flush(emptyPage);
    });

    it('vuelve a false también cuando la petición falla', done => {
      const seen: boolean[] = [];

      service.loading$.subscribe(value => {
        seen.push(value);
        if (seen.length === 3) {
          expect(seen[2]).toBeFalse();
          done();
        }
      });

      service.getProducts().subscribe({ error: () => undefined });
      httpMock
        .expectOne(`${environment.apiUrl}/products`)
        .flush('boom', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('categorías', () => {
    it('se piden una sola vez y se comparten entre suscriptores', () => {
      service.getCategories().subscribe();
      service.getCategories().subscribe();

      httpMock.expectOne(`${environment.apiUrl}/products/categories`).flush(['Hogar']);
    });

    it('devuelve lista vacía si la API falla, sin romper el filtro', done => {
      service.getCategories().subscribe(categories => {
        expect(categories).toEqual([]);
        done();
      });

      httpMock
        .expectOne(`${environment.apiUrl}/products/categories`)
        .flush('boom', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('sugerencias del buscador', () => {
    it('no llama a la API con el término vacío', done => {
      service.searchSuggestions('   ').subscribe(results => {
        expect(results).toEqual([]);
        done();
      });

      httpMock.expectNone(() => true);
    });

    it('un fallo de red no rompe la barra de búsqueda', done => {
      service.searchSuggestions('auriculares').subscribe(results => {
        expect(results).toEqual([]);
        done();
      });

      httpMock
        .expectOne(r => r.url === `${environment.apiUrl}/products`)
        .flush('boom', { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('reseñas', () => {
    it('no manda el autor: lo deduce el servidor del token', () => {
      service.addReview(3, { rating: 5, comment: 'Muy bueno' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/products/3/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rating: 5, comment: 'Muy bueno' });
      req.flush({});
    });
  });
});
