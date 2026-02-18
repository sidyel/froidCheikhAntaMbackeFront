import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    if (this.authService.isAuthenticated() && !this.authService.isTokenExpired()) {
      return true;
    }

    // Vérifier s'il y a un refresh token disponible
    if (this.authService.getRefreshToken()) {
      // Essayer de rafraîchir le token
      this.authService.refreshToken().subscribe({
        next: () => {
          // Token rafraîchi avec succès, permettre l'accès
          return true;
        },
        error: () => {
          // Échec du rafraîchissement, rediriger vers la connexion
          this.redirectToLogin(state.url);
          return false;
        }
      });

      // En attendant la réponse du refresh, bloquer temporairement
      return false;
    }

    // Pas de token valide, rediriger vers la connexion
    this.redirectToLogin(state.url);
    return false;
  }

  private redirectToLogin(returnUrl: string): void {
    this.toastService.warning('Connexion requise', 'Veuillez vous connecter pour accéder à cette page');
    this.router.navigate(['/connexion'], {
      queryParams: { returnUrl }
    });
  }
}
