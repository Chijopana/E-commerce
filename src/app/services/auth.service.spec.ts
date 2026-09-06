import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { TokenStore } from '../core/token.store';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let tokens: TokenStore;
  let httpMock: HttpTestingController;

  const session = {
    accessToken: 'token-de-prueba',
    user: { id: 1, email: 'demo@ecommerce.com', name: 'Usuario Demo', avatar: null },
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    tokens = TestBed.inject(TokenStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('guarda el token y publica la sesión', done => {
      service.login({ email: 'demo@ecommerce.com', password: 'demo123' }).subscribe(user => {
        expect(user.email).toBe('demo@ecommerce.com');
        expect(tokens.get()).toBe('token-de-prueba');
        expect(service.isAuthenticated()).toBeTrue();
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(session);
    });

    it('no deja sesión a medias si el servidor rechaza', done => {
      service.login({ email: 'demo@ecommerce.com', password: 'mala' }).subscribe({
        error: () => {
          expect(tokens.get()).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          done();
        },
      });

      httpMock
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush({ message: 'Email o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('nunca envía la contraseña por la URL', () => {
      service.login({ email: 'demo@ecommerce.com', password: 'demo123' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.urlWithParams).not.toContain('demo123');
      req.flush(session);
    });
  });

  describe('logout', () => {
    it('borra el token y vacía la sesión', done => {
      service.login({ email: 'demo@ecommerce.com', password: 'demo123' }).subscribe(() => {
        service.logout();

        expect(tokens.get()).toBeNull();
        expect(service.getUser()).toBeNull();
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(session);
    });
  });

  describe('restoreSession', () => {
    it('sin token guardado no llama a la API', done => {
      service.restoreSession().subscribe(user => {
        expect(user).toBeNull();
        done();
      });

      httpMock.expectNone(() => true);
    });

    it('con token válido recupera al usuario', done => {
      tokens.set('token-de-prueba');

      service.restoreSession().subscribe(user => {
        expect(user!.name).toBe('Usuario Demo');
        expect(service.isAuthenticated()).toBeTrue();
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(session.user);
    });

    it('con token caducado limpia la sesión en vez de dejarla a medias', done => {
      tokens.set('token-caducado');

      service.restoreSession().subscribe(user => {
        expect(user).toBeNull();
        expect(tokens.get()).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        done();
      });

      httpMock
        .expectOne(`${environment.apiUrl}/auth/me`)
        .flush({ message: 'no vale' }, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
