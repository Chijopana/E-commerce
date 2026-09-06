import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Lang = 'es' | 'en';

export const SUPPORTED_LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const DEFAULT_LANG: Lang = 'es';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);

  private dictionary = signal<Record<string, string>>({});

  readonly currentLang = signal<Lang>(DEFAULT_LANG);
  readonly ready = signal(false);

  readonly langLabel = computed(
    () => SUPPORTED_LANGS.find(l => l.code === this.currentLang())?.label ?? '',
  );

  /**
   * Carga el idioma inicial antes de que arranque la aplicación
   * (ver `provideAppInitializer` en app.config.ts).
   *
   * Sin esto la primera pintada mostraba las claves crudas —"nav.home"— durante
   * unos milisegundos, hasta que llegaba el JSON.
   */
  async init(): Promise<void> {
    const lang = this.readStoredLang() ?? this.detectBrowserLang();
    await this.load(lang);
    this.currentLang.set(lang);
    this.ready.set(true);
  }

  async setLang(lang: Lang): Promise<void> {
    if (lang === this.currentLang() && this.ready()) return;

    const loaded = await this.load(lang);
    if (!loaded) return; // se conserva el idioma anterior

    this.currentLang.set(lang);

    try {
      localStorage.setItem('lang', lang);
    } catch {
      // El idioma no se recordará entre sesiones, pero la app funciona.
    }

    document.documentElement.lang = lang;
  }

  /**
   * Traduce una clave. Acepta parámetros con sintaxis `{nombre}`:
   * `t('cart.itemCount', { count: 3 })` → "Tienes 3 productos".
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const value = this.dictionary()[key];
    if (value === undefined) {
      // Devolver la clave deja el fallo visible en pantalla en vez de un hueco
      // en blanco, que es mucho más difícil de detectar.
      return key;
    }
    if (!params) return value;

    return value.replace(/\{(\w+)\}/g, (match, name: string) =>
      params[name] !== undefined ? String(params[name]) : match,
    );
  }

  private async load(lang: Lang): Promise<boolean> {
    try {
      // URL relativa a propósito: así respeta el <base href>, que en GitHub
      // Pages es "/E-commerce/". Con "/i18n/..." absoluto daba 404 al desplegar.
      const data = await firstValueFrom(
        this.http.get<Record<string, string>>(`i18n/${lang}.json`),
      );
      this.dictionary.set(data ?? {});
      return true;
    } catch (error) {
      console.error(`No se pudo cargar el idioma "${lang}":`, error);

      // Si falla el idioma inicial y no es el de por defecto, se reintenta con
      // el de por defecto antes de rendirse.
      if (lang !== DEFAULT_LANG && Object.keys(this.dictionary()).length === 0) {
        return this.load(DEFAULT_LANG);
      }
      return false;
    }
  }

  private readStoredLang(): Lang | null {
    try {
      const saved = localStorage.getItem('lang');
      return this.isSupported(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  private detectBrowserLang(): Lang {
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    return this.isSupported(nav) ? nav : DEFAULT_LANG;
  }

  private isSupported(value: string | null | undefined): value is Lang {
    return SUPPORTED_LANGS.some(l => l.code === value);
  }
}
