import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ProductsService } from '../services/products.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="search-wrap">
      <mat-icon>search</mat-icon>
      <input
        type="text"
        [(ngModel)]="term"
        (ngModelChange)="onInput($event)"
        placeholder="Buscar productos..."
        (focus)="showResults = term.length > 0">
      <div class="search-results" *ngIf="showResults && results.length > 0">
        <div class="result-item" *ngFor="let p of results" (click)="select(p)">
          <img [src]="p.image" [alt]="p.name">
          <div>
            <strong>{{ p.name }}</strong>
            <span>{{ '$' + p.price.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <div class="search-results" *ngIf="showResults && term.length > 0 && results.length === 0">
        <div class="no-results">Sin resultados</div>
      </div>
    </div>
  `,
  styles: [`
    .search-wrap { position: relative; display: flex; align-items: center; gap: 8px;
      background: var(--mat-sys-surface-container); border-radius: 20px; padding: 6px 14px; width: 260px; }
    .search-wrap mat-icon { color: var(--mat-sys-on-surface-variant); font-size: 20px; width: 20px; height: 20px; }
    .search-wrap input { border: none; background: none; outline: none; color: var(--mat-sys-on-surface);
      width: 100%; font-size: 14px; }
    .search-results { position: absolute; top: calc(100% + 8px); left: 0; width: 320px;
      background: var(--mat-sys-surface-container-high); border-radius: 10px; box-shadow: 0 12px 30px rgba(0,0,0,0.2);
      overflow: hidden; z-index: 50; max-height: 360px; overflow-y: auto; }
    .result-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; }
    .result-item:hover { background: var(--mat-sys-surface-container-highest); }
    .result-item img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
    .result-item div { display: flex; flex-direction: column; }
    .result-item span { font-size: 12px; color: var(--mat-sys-primary); font-weight: 600; }
    .no-results { padding: 16px; text-align: center; color: var(--mat-sys-on-surface-variant); font-size: 13px; }
  `],
})
export class SearchBarComponent {
  term = '';
  results: Product[] = [];
  showResults = false;

  private input$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  constructor(private productsService: ProductsService, private router: Router) {
    this.input$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.productsService.searchSuggestions(term)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => { this.results = results; });
  }

  onInput(value: string): void {
    this.showResults = value.length > 0;
    this.input$.next(value);
  }

  select(product: Product): void {
    this.showResults = false;
    this.term = '';
    this.router.navigate(['/products', product.id]);
  }
}