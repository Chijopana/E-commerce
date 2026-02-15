import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';

describe('Auth', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Auth);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
