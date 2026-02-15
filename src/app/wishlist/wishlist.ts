import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WishlistService } from '../services/wishlist.service';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css'],
})
export class Wishlist implements OnInit {
  wishlistProducts: Product[] = [];
  loading = true;

  constructor(
    private wishlistService: WishlistService,
    private productsService: ProductsService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWishlistProducts();
  }

  private loadWishlistProducts(): void {
    this.wishlistService.wishlist$.subscribe(wishlistIds => {
      this.productsService.getProducts().subscribe(products => {
        this.wishlistProducts = products.filter(p => wishlistIds.includes(p.id));
        this.loading = false;
      });
    });
  }

  removeFromWishlist(productId: number): void {
    Swal.fire({
      title: '¿Eliminar de favoritos?',
      text: 'Se eliminará este producto de tu lista de favoritos',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.wishlistService.removeFromWishlist(productId);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Producto eliminado de favoritos',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
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
      text: `${product.name} ha sido añadido al carrito`,
      timer: 1500,
      showConfirmButton: false,
    });
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }
}
