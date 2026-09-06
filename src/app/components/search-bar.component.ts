import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ProductsService } from '../services/products.service';
import { TranslationService } from '../services/translation.service';
import { Product } from '../models/product.model';
import { TranslatePipe } from '../i18n/translate.pipe';

/**
 * Búsqueda con sugerencias.
 *
 * Sobre la versión anterior: se cierra al hacer clic fuera o con Escape, se
 * recorre con las flechas y Enter, y ofrece "ver todos los resultados" para
 * llegar al catálogo filtrado — antes solo se podía saltar a un producto
 * concreto y el desplegable se quedaba abierto encima de la página.
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, MatIconModule, TranslatePipe],
  template: `
    <div class="search-wrap" role="combobox" [attr.aria-expanded]="isOpen()" aria-haspopup="listbox">
      <mat-icon aria-hidden="true">search</mat-icon>

      <input
        #input
        type="search"
        [ngModel]="term()"
        (ngModelChange)="onInput($event)"
        (focus)="onFocus()"
        (keydown)="onKeydown($event)"
        [placeholder]="'search.placeholder' | t"
        [attr.aria-label]="'search.label' | t"
        aria-autocomplete="list"
        autocomplete="off" />

      @if (term()) {
        <button
          type="button"
          class="clear-btn"
          (click)="clear()"
          [attr.aria-label]="'search.clear' | t">
          <mat-icon>close</mat-icon>
        </button>
      }

      @if (isOpen()) {
        <div class="search-results" role="listbox">
          @for (product of results(); track product.id; let i = $index) {
            <button
              type="button"
              class="result-item"
              role="option"
              [attr.aria-selected]="highlighted() === i"
              [class.highlighted]="highlighted() === i"
              (click)="select(product)">
              <img [src]="product.image" [alt]="" loading="lazy" />
              <span class="result-text">
                <strong>{{ product.name }}</strong>
                <span class="result-price">{{ '$' + product.price.toFixed(2) }}</span>
              </span>
            </button>
          } @empty {
            <p class="no-results">
              <strong>{{ 'search.noResults' | t }}</strong>
              <span>{{ 'search.noResultsHint' | t }}</span>
            </p>
          }

          @if (results().length > 0) {
            <button
              type="button"
              class="see-all"
              role="option"
              [attr.aria-selected]="highlighted() === results().length"
              [class.highlighted]="highlighted() === results().length"
              (click)="seeAllResults()">
              <mat-icon>arrow_forward</mat-icon>
              {{ 'search.seeAll' | t: { term: term() } }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 7px 14px;
        width: 100%;
        transition: border-color 0.2s ease, background 0.2s ease;
      }

      @media (min-width: 900px) {
        .search-wrap {
          width: 280px;
        }
      }

      .search-wrap:focus-within {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-surface);
      }

      .search-wrap > mat-icon {
        color: var(--mat-sys-on-surface-variant);
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      input {
        border: none;
        background: none;
        outline: none;
        color: var(--mat-sys-on-surface);
        width: 100%;
        font-size: 14px;
        font-family: inherit;
      }

      /* La X nativa de type="search" en WebKit duplica el botón de limpiar. */
      input::-webkit-search-cancel-button {
        display: none;
      }

      .clear-btn {
        display: flex;
        background: none;
        border: none;
        padding: 0;
        color: var(--mat-sys-on-surface-variant);
      }

      .clear-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .search-results {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        width: min(360px, 92vw);
        background: var(--mat-sys-surface-container-high);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        overflow: hidden auto;
        z-index: 50;
        max-height: 380px;
        padding: 6px;
      }

      .result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 10px;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        border-radius: var(--radius-sm);
        color: inherit;
        font-family: inherit;
      }

      .result-item:hover,
      .result-item.highlighted,
      .see-all:hover,
      .see-all.highlighted {
        background: var(--mat-sys-surface-container-highest);
      }

      .result-item img {
        width: 44px;
        height: 44px;
        object-fit: cover;
        border-radius: var(--radius-sm);
        flex-shrink: 0;
        background: var(--mat-sys-surface-container);
      }

      .result-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .result-text strong {
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .result-price {
        font-size: 13px;
        color: var(--mat-sys-primary);
        font-weight: 600;
      }

      .see-all {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px;
        margin-top: 4px;
        border: none;
        border-top: 1px solid var(--mat-sys-outline-variant);
        background: none;
        color: var(--mat-sys-primary);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        border-radius: var(--radius-sm);
      }

      .see-all mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .no-results {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 20px;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
        font-size: 13px;
      }
    `,
  ],
})
export class SearchBarComponent {
  /** Avisa al contenedor de que se ha navegado (el móvil cierra su buscador). */
  readonly navigated = output<void>();

  private productsService = inject(ProductsService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);
  protected translation = inject(TranslationService);

  private inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  readonly term = signal('');
  readonly results = signal<Product[]>([]);
  readonly isOpen = signal(false);
  /** Índice resaltado; `results().length` es la fila "ver todos". */
  readonly highlighted = signal(-1);

  private input$ = new Subject<string>();

  constructor() {
    this.input$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        // `switchMap` descarta la respuesta anterior: al teclear rápido, una
        // consulta lenta ya no puede pisar el resultado de la más reciente.
        switchMap(term => this.productsService.searchSuggestions(term)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(results => {
        this.results.set(results);
        this.highlighted.set(-1);
      });
  }

  /** Cierra el desplegable al hacer clic fuera del componente. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  onInput(value: string): void {
    this.term.set(value);
    this.isOpen.set(value.trim().length > 0);
    this.input$.next(value);
  }

  onFocus(): void {
    if (this.term().trim().length > 0) this.isOpen.set(true);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);
      return;
    }

    if (!this.isOpen()) return;

    // El último índice navegable es la fila "ver todos los resultados".
    const lastIndex = this.results().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlighted.update(i => (i >= lastIndex ? 0 : i + 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlighted.update(i => (i <= 0 ? lastIndex : i - 1));
        break;

      case 'Enter': {
        event.preventDefault();
        const index = this.highlighted();
        const product = this.results()[index];

        if (product) this.select(product);
        else this.seeAllResults();
        break;
      }
    }
  }

  select(product: Product): void {
    this.close();
    void this.router.navigate(['/products', product.id]);
    this.navigated.emit();
  }

  seeAllResults(): void {
    const term = this.term().trim();
    if (!term) return;

    this.close();
    void this.router.navigate(['/products'], { queryParams: { q: term } });
    this.navigated.emit();
  }

  clear(): void {
    this.term.set('');
    this.results.set([]);
    this.isOpen.set(false);
    this.inputRef()?.nativeElement.focus();
  }

  private close(): void {
    this.isOpen.set(false);
    this.term.set('');
    this.results.set([]);
    this.highlighted.set(-1);
  }
}
