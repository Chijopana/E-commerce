export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  wishlist: number[]; // array of product IDs
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}
