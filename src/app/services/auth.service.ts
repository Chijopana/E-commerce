import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, AuthState, LoginCredentials, RegisterData } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'ecommerce_auth';
  private readonly USERS_KEY = 'ecommerce_users';
  
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  public authState$ = this.authState.asObservable();

  constructor() {
    this.loadAuthState();
    this.initializeDemoUsers();
  }

  private initializeDemoUsers(): void {
    const existingUsers = localStorage.getItem(this.USERS_KEY);
    if (!existingUsers) {
      const demoUsers = [
        {
          id: 1,
          email: 'demo@ecommerce.com',
          password: 'demo123',
          name: 'Usuario Demo',
          avatar: 'https://i.pravatar.cc/150?img=1',
          wishlist: [],
        },
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(demoUsers));
    }
  }

  private loadAuthState(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.authState.next(state);
      } catch (error) {
        console.error('Error loading auth state:', error);
      }
    }
  }

  private saveAuthState(state: AuthState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    this.authState.next(state);
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    return new Observable(observer => {
      const users = this.getUsers();
      const user = users.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (user) {
        const { password, ...userWithoutPassword } = user;
        this.saveAuthState({
          isAuthenticated: true,
          user: userWithoutPassword,
        });
        observer.next(true);
        observer.complete();
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }

  register(data: RegisterData): Observable<boolean> {
    return new Observable(observer => {
      const users = this.getUsers();
      
      if (users.find(u => u.email === data.email)) {
        observer.next(false);
        observer.complete();
        return;
      }

      const newUser = {
        id: users.length + 1,
        email: data.email,
        password: data.password,
        name: data.name,
        avatar: `https://i.pravatar.cc/150?img=${users.length + 1}`,
        wishlist: [],
      };

      users.push(newUser);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      const { password, ...userWithoutPassword } = newUser;
      this.saveAuthState({
        isAuthenticated: true,
        user: userWithoutPassword,
      });

      observer.next(true);
      observer.complete();
    });
  }

  logout(): void {
    this.saveAuthState({
      isAuthenticated: false,
      user: null,
    });
  }

  getUser(): User | null {
    return this.authState.value.user;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  private getUsers(): any[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  updateUserWishlist(wishlist: number[]): void {
    const currentUser = this.getUser();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, wishlist };
    this.saveAuthState({
      isAuthenticated: true,
      user: updatedUser,
    });

    // Update in storage
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].wishlist = wishlist;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }
  }
}
