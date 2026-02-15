import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductCategory, Product } from '../models/product.model';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  featuredProducts: Product[] = [];
  testimonials = [
    {
      name: 'Juan García',
      comment: 'Excelente calidad y servicio rápido. Muy satisfecho con mi compra.',
      rating: 5,
      image: 'account_circle'
    },
    {
      name: 'María López',
      comment: 'Productos originales y precios muy competitivos. Lo recomiendo.',
      rating: 5,
      image: 'account_circle'
    },
    {
      name: 'Carlos Mendez',
      comment: 'El envío fue rápido y el producto llegó en perfectas condiciones.',
      rating: 5,
      image: 'account_circle'
    },
    {
      name: 'Ana Rodríguez',
      comment: 'Atención del cliente impecable, resolvieron mis dudas al instante.',
      rating: 5,
      image: 'account_circle'
    }
  ];

  features = [
    {
      icon: 'local_shipping',
      title: 'Envío Gratis',
      description: 'En compras mayores a $100'
    },
    {
      icon: 'verified_user',
      title: 'Compra Segura',
      description: 'Protección de datos garantizada'
    },
    {
      icon: 'support_agent',
      title: 'Soporte 24/7',
      description: 'Estamos para ayudarte'
    },
    {
      icon: 'payments',
      title: 'Múltiples Pagos',
      description: 'Aceptamos tarjetas y más'
    }
  ];

  categories = [
    { name: 'Electrónica', value: ProductCategory.ELECTRONICS, icon: 'devices', color: '#1976d2' },
    { name: 'Accesorios', value: ProductCategory.ACCESSORIES, icon: 'backpack', color: '#f57c00' },
    { name: 'Deportes', value: ProductCategory.SPORTS, icon: 'sports_soccer', color: '#4caf50' },
    { name: 'Hogar', value: ProductCategory.HOME, icon: 'home', color: '#9c27b0' }
  ];

  constructor(private router: Router, private productsService: ProductsService, private cartService: CartService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.productsService.getProducts().subscribe(products => {
      // Obtener 6 productos destacados aleatorios
      this.featuredProducts = products.sort(() => Math.random() - 0.5).slice(0, 6);
    });
  }

  navigateToProducts(category?: string): void {
    if (category) {
      this.router.navigate(['/products'], { queryParams: { category } });
    } else {
      this.router.navigate(['/products']);
    }
  }

  navigateToProduct(id: number): void {
    this.router.navigate(['/products', id.toString()]);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    });
  }

  scrollToFeatures(): void {
    const categoriesSection = document.querySelector('.categories-section');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
