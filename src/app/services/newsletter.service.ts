import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import {environment} from "../../environments/environment";

export interface NewsletterSubscription {
  email: string;
  subscribedAt?: Date;
  status?: 'active' | 'pending' | 'unsubscribed';
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
  data?: NewsletterSubscription;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly apiUrl = `${environment.apiUrl}/newsletter`;

  constructor(private http: HttpClient) {}

  /**
   * Abonne un utilisateur à la newsletter
   * @param email L'adresse email de l'utilisateur
   * @returns Observable de la réponse
   */
  subscribe(email: string): Observable<NewsletterResponse> {
    const payload: NewsletterSubscription = {
      email: email.trim().toLowerCase()
    };

    return this.http.post<NewsletterResponse>(`${this.apiUrl}/subscribe`, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Désabonne un utilisateur de la newsletter
   * @param email L'adresse email de l'utilisateur
   * @returns Observable de la réponse
   */
  unsubscribe(email: string): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(`${this.apiUrl}/unsubscribe`, { email })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Vérifie si un email est déjà abonné
   * @param email L'adresse email à vérifier
   * @returns Observable du statut d'abonnement
   */
  checkSubscription(email: string): Observable<boolean> {
    return this.http.get<{ subscribed: boolean }>(`${this.apiUrl}/check/${email}`)
      .pipe(
        map(response => response.subscribed),
        catchError(() => of(false))
      );
  }

  /**
   * Gère les erreurs HTTP
   * @param error L'erreur HTTP
   * @returns Observable d'erreur
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de l\'inscription.';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Cette adresse email est invalide.';
      } else if (error.status === 409) {
        errorMessage = 'Cette adresse email est déjà inscrite à notre newsletter.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else {
        errorMessage = error.error?.message || errorMessage;
      }
    }

    console.error('Newsletter error:', error);

    return throwError(() => ({
      error: {
        message: errorMessage,
        status: error.status
      }
    }));
  }

  /**
   * Version mock pour le développement sans backend
   * À utiliser temporairement si le backend n'est pas prêt
   */
  subscribeMock(email: string): Observable<NewsletterResponse> {
    console.log('Mock newsletter subscription for:', email);

    // Simule une requête réseau
    // @ts-ignore
    return of({
      success: true,
      message: 'Merci pour votre inscription ! Vous recevrez bientôt nos offres.',
      data: {
        email,
        subscribedAt: new Date(),
        status: 'active'
      }
    }).pipe(
      delay(1500) // Simule un délai réseau
    );
  }
}
