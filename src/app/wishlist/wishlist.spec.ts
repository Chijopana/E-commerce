import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Wishlist } from './wishlist';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('Wishlist', () => {
  let fixture: ComponentFixture<Wishlist>;
  let component: Wishlist;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Wishlist],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Wishlist);
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
