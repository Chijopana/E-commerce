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
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  /** ISO 8601 tal y como llega de la API. */
  date: string;
}

/**
 * Las categorias las sirve la API (`GET /products/categories`), no una lista
 * fija en el cliente: si mañana entra una categoria nueva en el catalogo, el
 * filtro la recoge sin tocar el frontend.
 *
 * `ALL` no es una categoria real, solo el valor del filtro "todas".
 */
export const ALL_CATEGORIES = '__ALL__';

export type ProductSort = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'name';

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  minRating?: number;
  sortBy?: ProductSort;
  page?: number;
  limit?: number;
}

/** Respuesta paginada del catalogo. */
export interface PagedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
