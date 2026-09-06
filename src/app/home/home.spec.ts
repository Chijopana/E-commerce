import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
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
