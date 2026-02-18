import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { LoginRequest, RegisterRequest, AuthResponse, UserInfo } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'userInfo';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const userInfo = this.getUserInfo();

    if (token && userInfo) {
      this.currentUserSubject.next(userInfo);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        this.setAuthData(response);
      }),
      catchError(error => {
        console.error('Erreur de connexion:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.register(userData).pipe(
      tap(response => {
        this.setAuthData(response);
      }),
      catchError(error => {
        console.error('Erreur d\'inscription:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Appeler l'API pour informer le serveur (optionnel)
    this.apiService.logout().subscribe();

    // Nettoyer les données locales
    this.clearAuthData();

    // Rediriger vers la page d'accueil
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    return this.apiService.refreshToken(refreshToken).pipe(
      tap(response => {
        this.setAuthData(response);
      }),
      catchError(error => {
        console.error('Erreur de rafraîchissement du token:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.userInfo));

    this.currentUserSubject.next(authResponse.userInfo);
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserInfo(): UserInfo | null {
    const userInfo = localStorage.getItem(this.USER_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  isClient(): boolean {
    return this.hasRole('CLIENT');
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? ['ADMIN', 'SUPER_ADMIN', 'GESTIONNAIRE'].includes(user.role) : false;
  }

  // Méthodes utiles pour les guards
  canActivate(): boolean {
    if (this.isAuthenticated() && !this.isTokenExpired()) {
      return true;
    }

    // Essayer de rafraîchir le token si possible
    if (this.getRefreshToken()) {
      this.refreshToken().subscribe({
        next: () => {
          // Token rafraîchi avec succès
        },
        error: () => {
          this.logout();
        }
      });
    } else {
      this.logout();
    }

    return false;
  }

  redirectAfterLogin(returnUrl?: string): void {
    if (returnUrl && returnUrl !== '/connexion' && returnUrl !== '/inscription') {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/profil']);
    }
  }

  // Ajoutez cette méthode dans AuthService (Angular)
  resetPassword(email: string): Observable<any> {
    return this.apiService.resetPassword(email).pipe(
      catchError(error => {
        console.error('Erreur de réinitialisation:', error);
        return throwError(() => error);
      })
    );
  }
}
