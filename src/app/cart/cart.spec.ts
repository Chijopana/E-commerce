import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cart } from './cart';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('Cart', () => {
  let fixture: ComponentFixture<Cart>;
  let component: Cart;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Cart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => clearAppStorage());

  it('se crea sin errores', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza su plantilla sin lanzar', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });
});
