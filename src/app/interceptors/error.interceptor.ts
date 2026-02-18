import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // FIX: Gestion spéciale pour les erreurs de parsing JSON avec status 200
        if (error.status === 200 && error.statusText === 'OK' && !error.ok) {
          console.warn('Erreur de parsing JSON pour une réponse 200 - probablement du texte reçu au lieu de JSON');
          console.log('URL concernée:', error.url);
          console.log('Réponse reçue:', error.error);

          // Si c'est une URL qui devrait retourner du texte, ne pas afficher d'erreur
          const textResponseUrls = [
            '/clients/wishlist/',
            '/clients/password',
            '/auth/logout'
          ];

          const isTextResponseExpected = textResponseUrls.some(url => error.url?.includes(url));

          if (isTextResponseExpected) {
            console.log('Erreur de parsing ignorée pour endpoint texte:', error.url);
            // Retourner l'erreur sans afficher de toast
            return throwError(() => error);
          }
        }

        // Gestion spécifique selon le code d'erreur
        switch (error.status) {
          case 401:
            return this.handle401Error(request, next, error);
          case 403:
            this.handle403Error(error);
            break;
          case 404:
            this.handle404Error(error);
            break;
          case 422:
            this.handle422Error(error);
            break;
          case 500:
            this.handle500Error(error);
            break;
          case 0:
            this.handleNetworkError(error);
            break;
          default:
            this.handleGenericError(error);
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler, error: HttpErrorResponse): Observable<HttpEvent<unknown>> {
    // Erreur 401 - Non autorisé

    // Si c'est une tentative de login qui échoue, ne pas essayer de refresh
    if (request.url.includes('/auth/login')) {
      this.toastService.loginError();
      return throwError(() => error);
    }

    // Si c'est une requête de refresh token qui échoue, déconnecter
    if (request.url.includes('/auth/refresh')) {
      this.authService.logout();
      return throwError(() => error);
    }

    // Essayer de rafraîchir le token
    if (this.authService.getRefreshToken()) {
      return this.authService.refreshToken().pipe(
        switchMap(() => {
          // Retry la requête avec le nouveau token
          const authRequest = request.clone({
            headers: request.headers.set('Authorization', `Bearer ${this.authService.getToken()}`)
          });
          return next.handle(authRequest);
        }),
        catchError((refreshError) => {
          // Si le refresh échoue aussi, déconnecter
          this.authService.logout();
          this.toastService.sessionExpired();
          return throwError(() => refreshError);
        })
      );
    } else {
      // Pas de refresh token, déconnecter
      this.authService.logout();
      this.toastService.sessionExpired();
      return throwError(() => error);
    }
  }

  private handle403Error(error: HttpErrorResponse): void {
    // Erreur 403 - Accès interdit
    this.toastService.error('Accès interdit', 'Vous n\'avez pas l\'autorisation d\'effectuer cette action');
  }

  private handle404Error(error: HttpErrorResponse): void {
    // Erreur 404 - Non trouvé
    if (!error.url?.includes('/api/')) {
      return; // Ne pas afficher d'erreur pour les ressources statiques
    }

    this.toastService.error('Ressource non trouvée', 'L\'élément demandé est introuvable');
  }

  private handle422Error(error: HttpErrorResponse): void {
    // Erreur 422 - Erreur de validation
    if (error.error && error.error.errors) {
      // Erreurs de validation du backend
      const validationErrors = this.extractValidationErrors(error.error.errors);
      this.toastService.validationError(validationErrors);
    } else {
      this.toastService.error('Erreur de validation', error.error?.message || 'Données invalides');
    }
  }

  private handle500Error(error: HttpErrorResponse): void {
    // Erreur 500 - Erreur serveur
    this.toastService.serverError();
    console.error('Erreur serveur:', error);
  }

  private handleNetworkError(error: HttpErrorResponse): void {
    // Erreur réseau (pas de connexion)
    this.toastService.networkError();
  }

  private handleGenericError(error: HttpErrorResponse): void {
    // FIX: Ne pas afficher d'erreur générique pour les cas de parsing JSON
    if (error.status === 200 && error.statusText === 'OK' && !error.ok) {
      console.log('Erreur de parsing JSON ignorée dans handleGenericError');
      return;
    }

    // Autres erreurs
    const errorMessage = error.error?.message || error.message || 'Une erreur s\'est produite';
    this.toastService.error('Erreur', errorMessage);
    console.error('Erreur HTTP:', error);
  }

  private extractValidationErrors(errors: any): string[] {
    const errorMessages: string[] = [];

    if (typeof errors === 'object') {
      Object.keys(errors).forEach(field => {
        if (Array.isArray(errors[field])) {
          errorMessages.push(...errors[field]);
        } else if (typeof errors[field] === 'string') {
          errorMessages.push(errors[field]);
        }
      });
    } else if (Array.isArray(errors)) {
      errorMessages.push(...errors);
    } else if (typeof errors === 'string') {
      errorMessages.push(errors);
    }

    return errorMessages;
  }
}
