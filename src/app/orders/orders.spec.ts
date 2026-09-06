import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Orders } from './orders';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('Orders', () => {
  let fixture: ComponentFixture<Orders>;
  let component: Orders;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Orders],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Orders);
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
