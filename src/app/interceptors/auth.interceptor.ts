import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Récupérer le token d'authentification
    const token = this.authService.getToken();

    // Si un token existe et que la requête est vers notre API
    if (token && this.isApiRequest(request.url)) {
      // Cloner la requête et ajouter l'en-tête Authorization
      const authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });

      return next.handle(authRequest);
    }

    // Sinon, passer la requête sans modification
    return next.handle(request);
  }

  private isApiRequest(url: string): boolean {
    // Vérifier si l'URL correspond à notre API
    // Vous pouvez ajuster cette logique selon vos besoins
    return url.includes('/api/') || url.startsWith('http://localhost:8080/api/');
  }
}
