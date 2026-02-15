import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private wishlistSubject = new BehaviorSubject<number[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadWishlist();
    
    // Subscribe to auth changes
    this.authService.authState$.subscribe(state => {
      if (state.user) {
        this.wishlistSubject.next(state.user.wishlist || []);
      } else {
        this.wishlistSubject.next([]);
      }
    });
  }

  private loadWishlist(): void {
    const user = this.authService.getUser();
    if (user) {
      this.wishlistSubject.next(user.wishlist || []);
    }
  }

  addToWishlist(productId: number): void {
    const currentWishlist = this.wishlistSubject.value;
    
    if (!currentWishlist.includes(productId)) {
      const newWishlist = [...currentWishlist, productId];
      this.wishlistSubject.next(newWishlist);
      this.authService.updateUserWishlist(newWishlist);
    }
  }

  removeFromWishlist(productId: number): void {
    const currentWishlist = this.wishlistSubject.value;
    const newWishlist = currentWishlist.filter(id => id !== productId);
    this.wishlistSubject.next(newWishlist);
    this.authService.updateUserWishlist(newWishlist);
  }

  toggleWishlist(productId: number): void {
    if (this.isInWishlist(productId)) {
      this.removeFromWishlist(productId);
    } else {
      this.addToWishlist(productId);
    }
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistSubject.value.includes(productId);
  }

  clearWishlist(): void {
    this.wishlistSubject.next([]);
    this.authService.updateUserWishlist([]);
  }

  getWishlistCount(): number {
    return this.wishlistSubject.value.length;
  }
}
