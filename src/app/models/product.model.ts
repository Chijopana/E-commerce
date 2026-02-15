export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  category: string;
  rating: number;
  reviews: Review[];
  inWishlist?: boolean;
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

export enum ProductCategory {
  ELECTRONICS = 'Electrónica',
  ACCESSORIES = 'Accesorios',
  CLOTHING = 'Ropa',
  SPORTS = 'Deportes',
  HOME = 'Hogar',
  ALL = 'Todos'
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  minRating?: number;
}
