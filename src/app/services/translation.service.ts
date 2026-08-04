import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type Lang = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translations = signal<Record<string, string>>({});
  currentLang = signal<Lang>(this.getInitialLang());

  constructor(private http: HttpClient) {
    this.load(this.currentLang());
  }

  async setLang(lang: Lang): Promise<void> {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
    await this.load(lang);
  }

  // uso: {{ t.get('nav.home') }} en las plantillas
  get(key: string): string {
    return this.translations()[key] ?? key;
  }

  private async load(lang: Lang): Promise<void> {
    const data = await firstValueFrom(this.http.get<Record<string, string>>(`/i18n/${lang}.json`));
    this.translations.set(data);
  }

  private getInitialLang(): Lang {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved) return saved;
    return navigator.language.startsWith('en') ? 'en' : 'es';
  }
}