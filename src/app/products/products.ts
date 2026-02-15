import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';

import { CartService } from '../services/cart.service';
import { ProductsService } from '../services/products.service';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../services/auth.service';
import { Product, ProductCategory, ProductFilter } from '../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class Products implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories = Object.values(ProductCategory);
  wishlistIds: number[] = [];
  isAuthenticated = false;
  loading = true;

  // Filters
  searchTerm = '';
  selectedCategory: string = ProductCategory.ALL;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minRating = 0;

  constructor(
    private cartService: CartService,
    private productsService: ProductsService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read query params for initial category filter
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      this.loadProducts();
    });
    
    // Subscribe to auth state
    this.authService.authState$.subscribe(state => {
      this.isAuthenticated = state.isAuthenticated;
    });

    // Subscribe to wishlist
    this.wishlistService.wishlist$.subscribe(wishlist => {
      this.wishlistIds = wishlist;
    });
  }

  private loadProducts(): void {
    this.loading = true;
    this.productsService.getProducts().subscribe(products => {
      this.products = products;
      this.applyFilters();
      this.loading = false;
    });
  }

  applyFilters(): void {
    const filter: ProductFilter = {
      category: this.selectedCategory !== ProductCategory.ALL ? this.selectedCategory : undefined,
      searchTerm: this.searchTerm || undefined,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      minRating: this.minRating || undefined,
    };

    this.productsService.filterProducts(filter).subscribe(filtered => {
      this.filteredProducts = filtered.map(p => ({
        ...p,
        inWishlist: this.wishlistIds.includes(p.id)
      }));
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = ProductCategory.ALL;
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.minRating = 0;
    this.applyFilters();
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) {
      Swal.fire('Oops...', 'Producto agotado', 'error');
      return;
    }
    
    this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    });
    
    Swal.fire({
      icon: 'success',
      title: 'Añadido al carrito',
      text: `${product.name}`,
      timer: 1500,
      showConfirmButton: false,
    });
  }

  toggleWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    
    if (!this.isAuthenticated) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para usar la lista de deseos',
      });
      return;
    }

    this.wishlistService.toggleWishlist(product.id);
    product.inWishlist = !product.inWishlist;

    const message = product.inWishlist 
      ? 'Añadido a favoritos' 
      : 'Eliminado de favoritos';
    
    Swal.fire({
      icon: 'success',
      title: message,
      timer: 1000,
      showConfirmButton: false,
    });
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistIds.includes(productId);
  }
}
