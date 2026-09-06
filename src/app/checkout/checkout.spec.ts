import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Checkout } from './checkout';
import { CartService } from '../services/cart.service';
import { testProviders, clearAppStorage } from '../testing/test-providers';
import { STANDARD_SHIPPING_COST } from '../models/pricing';

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let component: Checkout;
  let cart: CartService;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: testProviders(),
    }).compileComponents();

    cart = TestBed.inject(CartService);
    // El checkout se pinta sobre un carrito con contenido; la ruta real lo
    // garantiza con `cartNotEmptyGuard`.
    cart.addToCart({ id: 1, name: 'Auriculares', price: 40, image: 'a.jpg', stock: 10 });

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => clearAppStorage());

  it('se crea sin errores', () => {
    expect(component).toBeTruthy();
  });

  it('precarga el formulario y lo marca inválido hasta completarlo', () => {
    expect(component.shippingForm.valid).toBeFalse();
  });

  it('suma el envío cuando el subtotal no llega al umbral', () => {
    expect(component.totals().subtotal).toBe(40);
    expect(component.totals().shippingCost).toBe(STANDARD_SHIPPING_COST);
    expect(component.totals().total).toBe(49.99);
  });

  it('el descuento del cupón se refleja en el total', () => {
    component.appliedCoupon.set({ code: 'DESCUENTO10', discountPercent: 10 });

    expect(component.totals().discount).toBe(4);
    expect(component.totals().total).toBe(45.99);
  });

  it('el envío pasa a gratis al superar el umbral', () => {
    cart.updateQuantity(1, 3); // 120

    expect(component.totals().shippingCost).toBe(0);
    expect(component.totals().total).toBe(120);
  });
});
