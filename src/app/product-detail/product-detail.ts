import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import Swal from 'sweetalert2';

import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../services/auth.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetail implements OnInit {
  product?: Product;
  relatedProducts: Product[] = [];
  loading = true;
  notFound = false;
  isAuthenticated = false;
  wishlistIds: number[] = [];

  reviewForm: FormGroup;

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productsService: ProductsService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required]],
      comment: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('id'));
        if (!id) {
          this.notFound = true;
          this.loading = false;
          return;
        }
        this.loadProduct(id);
      });

    this.authService.authState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => { this.isAuthenticated = state.isAuthenticated; });

    this.wishlistService.wishlist$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(wishlist => { this.wishlistIds = wishlist; });
  }

  private loadProduct(id: number): void {
    this.loading = true;
    this.notFound = false;

    this.productsService.getProductById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(product => {
        if (!product) {
          this.notFound = true;
          this.loading = false;
          return;
        }
        this.product = product;
        this.loading = false;
        this.loadRelated(product);
      });
  }

  private loadRelated(current: Product): void {
    this.productsService.getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(products => {
        this.relatedProducts = products
          .filter(p => p.category === current.category && p.id !== current.id)
          .slice(0, 4);
      });
  }

  isInWishlist(id: number): boolean {
    return this.wishlistIds.includes(id);
  }

  toggleWishlist(): void {
    if (!this.product) return;

    if (!this.isAuthenticated) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para usar la lista de deseos',
      });
      return;
    }

    this.wishlistService.toggleWishlist(this.product.id);
  }

  addToCart(): void {
    if (!this.product) return;

    if (this.product.stock <= 0) {
      Swal.fire('Oops...', 'Producto agotado', 'error');
      return;
    }

    this.cartService.addToCart({
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      image: this.product.image,
      stock: this.product.stock,
    });

    Swal.fire({
      icon: 'success',
      title: 'Añadido al carrito',
      text: this.product.name,
      timer: 1500,
      showConfirmButton: false,
    });
  }

  submitReview(): void {
    if (!this.isAuthenticated) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para dejar una reseña',
      });
      return;
    }

    if (this.reviewForm.invalid || !this.product) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const user = this.authService.getUser();
    if (!user) return;

    this.productsService.addReview(this.product.id, {
      userId: user.id,
      userName: user.name,
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment,
      date: new Date(),
    });

    // refresca el producto local para reflejar la reseña y el rating recalculado
    this.loadProduct(this.product.id);
    this.reviewForm.reset({ rating: 5, comment: '' });

    Swal.fire({
      icon: 'success',
      title: '¡Gracias por tu reseña!',
      timer: 1500,
      showConfirmButton: false,
    });
  }

  goToProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}