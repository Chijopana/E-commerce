export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
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

/** Lo que devuelven /auth/login y /auth/register. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}
