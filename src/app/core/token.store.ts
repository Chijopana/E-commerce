import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'ecommerce_token';

/**
 * Guarda el token JWT.
 *
 * Vive aparte de `AuthService` para romper un ciclo: el interceptor necesita el
 * token, y `AuthService` necesita el interceptor para sus propias llamadas.
 *
 * Nota sobre el almacenamiento: `localStorage` es accesible desde JavaScript,
 * asi que un XSS podria leer el token. Lo correcto en produccion es una cookie
 * `httpOnly` + `SameSite`, que el navegador manda sola y el script no ve. Se
 * queda asi porque el frontend es estatico (GitHub Pages) y el backend vive en
 * otro dominio, donde las cookies de terceros complican mas de lo que aportan
 * en un proyecto de demostracion.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  /** Señal para que la interfaz pueda reaccionar a que haya o no sesion. */
  readonly token = signal<string | null>(this.read());

  get(): string | null {
    return this.token();
  }

  set(token: string): void {
    this.token.set(token);
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // Sin persistencia la sesion dura lo que dure la pestana.
    }
  }

  clear(): void {
    this.token.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nada que hacer: el token ya esta fuera de memoria.
    }
  }

  private read(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
