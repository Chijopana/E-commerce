import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('Auth', () => {
  let fixture: ComponentFixture<Auth>;
  let component: Auth;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
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
