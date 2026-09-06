import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { AuthResponse, AuthState, LoginCredentials, RegisterData, User } from '../models/user.model';
import { TokenStore } from '../core/token.store';
import { environment } from '../../environments/environment';

/**
 * Sesión contra la API.
 *
 * Ya no hay usuarios ni contraseñas en el navegador: el servidor guarda el hash
 * (bcrypt) y devuelve un JWT. Aquí solo se conserva el token y una copia del
 * usuario para pintar la interfaz.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokens = inject(TokenStore);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  public authState$ = this.authState.asObservable();

  /**
   * Rehidrata la sesión al arrancar preguntando al servidor quién es el dueño
   * del token. No basta con mirar si hay token guardado: puede estar caducado
   * o pertenecer a una cuenta ya borrada, y la interfaz se quedaría enseñando
   * una sesión que el backend no reconoce.
   */
  restoreSession(): Observable<User | null> {
    if (!this.tokens.get()) return of(null);

    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap(user => this.authState.next({ isAuthenticated: true, user })),
      catchError(() => {
        this.tokens.clear();
        this.authState.next({ isAuthenticated: false, user: null });
        return of(null);
      }),
    );
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(res => this.acceptSession(res)),
        map(res => res.user),
      );
  }

  register(data: RegisterData): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, data)
      .pipe(
        tap(res => this.acceptSession(res)),
        map(res => res.user),
      );
  }

  logout(): void {
    this.tokens.clear();
    this.authState.next({ isAuthenticated: false, user: null });
  }

  getUser(): User | null {
    return this.authState.value.user;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  private acceptSession(response: AuthResponse): void {
    this.tokens.set(response.accessToken);
    this.authState.next({ isAuthenticated: true, user: response.user });
  }
}
