import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product, ProductFilter, ProductCategory, Review } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private mockProducts: Product[] = [
    {
      id: 1,
      name: 'Auriculares Inalámbricos Premium',
      price: 89.99,
      image: 'https://placehold.co/400x300/667eea/fff?text=Auriculares',
      description: 'Auriculares con cancelación de ruido activa, batería de 30 horas y calidad de sonido Hi-Fi.',
      stock: 12,
      category: ProductCategory.ELECTRONICS,
      rating: 4.5,
      reviews: [
        { id: 1, userId: 1, userName: 'María G.', rating: 5, comment: 'Excelente calidad de sonido', date: new Date('2026-01-15') },
        { id: 2, userId: 2, userName: 'Carlos P.', rating: 4, comment: 'Muy buenos, la batería dura mucho', date: new Date('2026-01-20') }
      ]
    },
    {
      id: 2,
      name: 'Smartwatch Deportivo Pro',
      price: 199.99,
      image: 'https://placehold.co/400x300/764ba2/fff?text=Smartwatch',
      description: 'Monitoriza tu salud 24/7: frecuencia cardíaca, oxígeno en sangre, sueño y 100+ modos deportivos.',
      stock: 7,
      category: ProductCategory.ELECTRONICS,
      rating: 4.8,
      reviews: [
        { id: 3, userId: 3, userName: 'Ana M.', rating: 5, comment: 'Perfecto para hacer ejercicio', date: new Date('2026-02-01') }
      ]
    },
    {
      id: 3,
      name: 'Mochila Antirrobo Inteligente',
      price: 59.99,
      image: 'https://placehold.co/400x300/f57c00/fff?text=Mochila',
      description: 'Diseño ergonómico con puerto USB, compartimentos secretos y material impermeable.',
      stock: 15,
      category: ProductCategory.ACCESSORIES,
      rating: 4.3,
      reviews: []
    },
    {
      id: 4,
      name: 'Altavoz Bluetooth Resistente',
      price: 45.99,
      image: 'https://placehold.co/400x300/4caf50/fff?text=Altavoz',
      description: 'Sonido 360°, resistente al agua IP67, batería de 24 horas.',
      stock: 8,
      category: ProductCategory.ELECTRONICS,
      rating: 4.6,
      reviews: [
        { id: 4, userId: 4, userName: 'Pedro L.', rating: 5, comment: 'Increíble para la playa', date: new Date('2026-01-28') }
      ]
    },
    {
      id: 5,
      name: 'Cámara Web 4K Ultra HD',
      price: 129.99,
      image: 'https://placehold.co/400x300/1976d2/fff?text=Camara',
      description: 'Cámara profesional para streaming con micrófono incorporado y enfoque automático.',
      stock: 5,
      category: ProductCategory.ELECTRONICS,
      rating: 4.7,
      reviews: []
    },
    {
      id: 6,
      name: 'Teclado Mecánico RGB',
      price: 89.99,
      image: 'https://placehold.co/400x300/e91e63/fff?text=Teclado',
      description: 'Teclado gaming con switches mecánicos, iluminación RGB personalizable y reposamuñecas.',
      stock: 10,
      category: ProductCategory.ELECTRONICS,
      rating: 4.9,
      reviews: []
    },
    {
      id: 7,
      name: 'Botella Térmica Inteligente',
      price: 34.99,
      image: 'https://placehold.co/400x300/00bcd4/fff?text=Botella',
      description: 'Mantiene bebidas frías 24h o calientes 12h, con recordatorio de hidratación.',
      stock: 20,
      category: ProductCategory.SPORTS,
      rating: 4.4,
      reviews: []
    },
    {
      id: 8,
      name: 'Lámpara LED Escritorio',
      price: 39.99,
      image: 'https://placehold.co/400x300/ff9800/fff?text=Lampara',
      description: 'Lámpara con 3 modos de luz, puerto USB de carga y brazo flexible.',
      stock: 12,
      category: ProductCategory.HOME,
      rating: 4.2,
      reviews: []
    },
    {
      id: 9,
      name: 'Mouse Ergonómico Inalámbrico',
      price: 29.99,
      image: 'https://placehold.co/400x300/9c27b0/fff?text=Mouse',
      description: 'Diseño ergonómico vertical para reducir la fatiga, 6 botones programables.',
      stock: 18,
      category: ProductCategory.ELECTRONICS,
      rating: 4.5,
      reviews: []
    },
    {
      id: 10,
      name: 'Cargador Inalámbrico 3 en 1',
      price: 49.99,
      image: 'https://placehold.co/400x300/607d8b/fff?text=Cargador',
      description: 'Carga simultánea de teléfono, smartwatch y auriculares. Compatible con todos los dispositivos.',
      stock: 14,
      category: ProductCategory.ELECTRONICS,
      rating: 4.6,
      reviews: []
    },
    {
      id: 11,
      name: 'Funda Portátil Acolchada',
      price: 24.99,
      image: 'https://placehold.co/400x300/795548/fff?text=Funda',
      description: 'Protección premium para portátiles de 13-15 pulgadas con bolsillos adicionales.',
      stock: 25,
      category: ProductCategory.ACCESSORIES,
      rating: 4.3,
      reviews: []
    },
    {
      id: 12,
      name: 'Pulsera Fitness Tracker',
      price: 39.99,
      image: 'https://placehold.co/400x300/ff5722/fff?text=Pulsera',
      description: 'Monitoreo de actividad, sueño y notificaciones. Batería de 7 días.',
      stock: 16,
      category: ProductCategory.SPORTS,
      rating: 4.4,
      reviews: []
    }
  ];

  private productsSubject = new BehaviorSubject<Product[]>(this.mockProducts);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public products$ = this.productsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  getProducts(): Observable<Product[]> {
    this.loadingSubject.next(true);
    return of(this.mockProducts).pipe(
      delay(500),
      // Simulate API call
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    return of(this.mockProducts.find(p => p.id === id)).pipe(delay(300));
  }

  filterProducts(filter: ProductFilter): Observable<Product[]> {
    this.loadingSubject.next(true);
    
    let filtered = [...this.mockProducts];

    if (filter.category && filter.category !== ProductCategory.ALL) {
      filtered = filtered.filter(p => p.category === filter.category);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (filter.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filter.minPrice!);
    }

    if (filter.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filter.maxPrice!);
    }

    if (filter.minRating !== undefined) {
      filtered = filtered.filter(p => p.rating >= filter.minRating!);
    }

    return of(filtered).pipe(
      delay(300),
      // Simulate API call
    );
  }

  getCategories(): string[] {
    return Object.values(ProductCategory);
  }

  addReview(productId: number, review: Omit<Review, 'id'>): void {
    const product = this.mockProducts.find(p => p.id === productId);
    if (product) {
      const newReview: Review = {
        ...review,
        id: product.reviews.length + 1,
      };
      product.reviews.push(newReview);
      
      // Recalculate rating
      const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = totalRating / product.reviews.length;
      
      this.productsSubject.next([...this.mockProducts]);
    }
  }
}
