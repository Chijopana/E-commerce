import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Products } from './products';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('Products', () => {
  let fixture: ComponentFixture<Products>;
  let component: Products;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Products],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
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
