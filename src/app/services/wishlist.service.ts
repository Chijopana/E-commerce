import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Favoritos en el servidor.
 *
 * Se guarda un `BehaviorSubject` con los identificadores para que la interfaz
 * pinte los corazones al instante, pero la lista buena es la que devuelve la
 * API: cada operacion responde con el estado completo y con eso se refresca.
 * Asi la lista sigue al usuario entre navegadores, que era justo lo que no
 * hacia cuando vivia en localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/wishlist`;

  private idsSubject = new BehaviorSubject<number[]>([]);
  public wishlist$ = this.idsSubject.asObservable();

  constructor() {
    // Al entrar se carga y al salir se vacia. Sin esto, los favoritos de quien
    // cerro sesion se quedaban pintados para el siguiente.
    this.auth.authState$.subscribe(state => {
      if (state.isAuthenticated) {
        this.refresh();
      } else {
        this.idsSubject.next([]);
      }
    });
  }

  refresh(): void {
    this.http
      .get<number[]>(this.baseUrl)
      .pipe(catchError(() => of([])))
      .subscribe(ids => this.idsSubject.next(ids));
  }

  add(productId: number): Observable<number[]> {
    return this.http
      .post<number[]>(`${this.baseUrl}/${productId}`, {})
      .pipe(tap(ids => this.idsSubject.next(ids)));
  }

  remove(productId: number): Observable<number[]> {
    return this.http
      .delete<number[]>(`${this.baseUrl}/${productId}`)
      .pipe(tap(ids => this.idsSubject.next(ids)));
  }

  /** Alterna y devuelve si el producto ha quedado en favoritos. */
  toggle(productId: number): Observable<boolean> {
    const willAdd = !this.isInWishlist(productId);
    const request = willAdd ? this.add(productId) : this.remove(productId);

    return request.pipe(map(() => willAdd));
  }

  isInWishlist(productId: number): boolean {
    return this.idsSubject.value.includes(productId);
  }

  getIds(): number[] {
    return this.idsSubject.value;
  }
}
