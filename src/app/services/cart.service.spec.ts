import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { STANDARD_SHIPPING_COST } from '../models/pricing';

describe('CartService', () => {
  let service: CartService;

  const headphones = {
    id: 1,
    name: 'Auriculares',
    price: 89.99,
    image: 'auriculares.jpg',
    stock: 12,
  };

  const scarce = {
    id: 99,
    name: 'Última unidad',
    price: 10,
    image: 'x.jpg',
    stock: 1,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  describe('addToCart', () => {
    it('añade un producto nuevo', () => {
      const result = service.addToCart(headphones);

      expect(result.ok).toBeTrue();
      expect(service.getItemCount()).toBe(1);
    });

    it('acumula unidades del mismo producto', () => {
      service.addToCart(headphones);
      service.addToCart(headphones);

      expect(service.getCartItems().length).toBe(1);
      expect(service.getItemCount()).toBe(2);
    });

    it('avisa al llegar al tope de stock en vez de fallar en silencio', () => {
      service.addToCart(scarce);
      const result = service.addToCart(scarce);

      expect(result.ok).toBeFalse();
      if (!result.ok) {
        expect(result.reason).toBe('stock-limit');
        expect(result.available).toBe(1);
      }
      expect(service.getItemCount()).toBe(1);
    });

    it('rechaza un producto agotado', () => {
      const result = service.addToCart({ ...scarce, stock: 0 });

      expect(result.ok).toBeFalse();
      if (!result.ok) expect(result.reason).toBe('out-of-stock');
    });

    it('recorta la cantidad pedida al stock disponible', () => {
      const result = service.addToCart({ ...scarce, stock: 3 }, 10);

      expect(result.ok).toBeTrue();
      expect(service.getItemCount()).toBe(3);
    });
  });

  describe('updateQuantity', () => {
    it('nunca supera el stock', () => {
      service.addToCart(headphones);
      service.updateQuantity(headphones.id, 999);

      expect(service.getItemCount()).toBe(headphones.stock);
    });

    it('elimina la línea al bajar de uno', () => {
      service.addToCart(headphones);
      service.updateQuantity(headphones.id, 0);

      expect(service.isEmpty()).toBeTrue();
    });
  });

  describe('totales', () => {
    it('cobra envío por debajo del umbral', () => {
      service.addToCart({ ...headphones, price: 20 });

      expect(service.getState().shippingCost).toBe(STANDARD_SHIPPING_COST);
      expect(service.getTotal()).toBe(29.99);
    });

    it('regala el envío por encima del umbral', () => {
      service.addToCart({ ...headphones, price: 120 });

      expect(service.getState().shippingCost).toBe(0);
      expect(service.getTotal()).toBe(120);
    });

    it('calcula cuánto falta para el envío gratis', () => {
      service.addToCart({ ...headphones, price: 75 });

      expect(service.getState().amountToFreeShipping).toBe(25);
    });
  });

  describe('persistencia', () => {
    it('descarta un carrito guardado ilegible sin romper la aplicación', () => {
      localStorage.setItem('ecommerce_cart', '{no es json válido');

      // `CartService` inyecta `ProductsService`, así que necesita contexto de
      // inyección; `new CartService()` a secas lanzaría.
      const revived = TestBed.runInInjectionContext(() => new CartService());

      expect(revived.isEmpty()).toBeTrue();
    });
  });
});
