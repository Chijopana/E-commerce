import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFound } from './not-found';
import { testProviders, clearAppStorage } from '../testing/test-providers';

describe('NotFound', () => {
  let fixture: ComponentFixture<NotFound>;
  let component: NotFound;

  beforeEach(async () => {
    clearAppStorage();

    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(NotFound);
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
