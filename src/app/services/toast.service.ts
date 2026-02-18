import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private readonly DEFAULT_DURATION = 5000; // 5 secondes

  constructor() {}

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addToast(toast: Toast): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-remove après la durée spécifiée
    if (toast.duration !== 0) { // 0 = toast persistant
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration || this.DEFAULT_DURATION);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration: duration !== undefined ? duration : this.DEFAULT_DURATION
    };
    this.addToast(toast);
  }

  error(title: string, message?: string, duration?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration: duration !== undefined ? duration : 8000 // Erreurs plus longues par défaut
    };
    this.addToast(toast);
  }

  warning(title: string, message?: string, duration?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration: duration !== undefined ? duration : this.DEFAULT_DURATION
    };
    this.addToast(toast);
  }

  info(title: string, message?: string, duration?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration: duration !== undefined ? duration : this.DEFAULT_DURATION
    };
    this.addToast(toast);
  }

  showError(message: string, duration?: number): void {
  }
  showSuccess(message: string, duration?: number): void {
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }

  // Méthodes spécialisées pour des cas d'usage courants

  productAddedToCart(productName: string): void {
    this.success('Produit ajouté', `${productName} a été ajouté au panier`);
  }

  productRemovedFromCart(productName: string): void {
    this.info('Produit retiré', `${productName} a été retiré du panier`);
  }

  orderCreated(orderNumber: string): void {
    this.success('Commande créée', `Votre commande ${orderNumber} a été enregistrée avec succès`);
  }

  paymentSuccess(): void {
    this.success('Paiement confirmé', 'Votre paiement a été traité avec succès');
  }

  paymentError(): void {
    this.error('Erreur de paiement', 'Une erreur s\'est produite lors du traitement de votre paiement');
  }

  loginSuccess(userName: string): void {
    this.success('Connexion réussie', `Bienvenue ${userName}`);
  }

  loginError(): void {
    this.error('Erreur de connexion', 'Email ou mot de passe incorrect');
  }

  registrationSuccess(): void {
    this.success('Compte créé', 'Votre compte a été créé avec succès');
  }

  profileUpdated(): void {
    this.success('Profil mis à jour', 'Vos informations ont été sauvegardées');
  }

  passwordUpdated(): void {
    this.success('Mot de passe modifié', 'Votre mot de passe a été mis à jour');
  }

  addressAdded(): void {
    this.success('Adresse ajoutée', 'Votre nouvelle adresse a été enregistrée');
  }

  addressUpdated(): void {
    this.success('Adresse mise à jour', 'Votre adresse a été modifiée');
  }

  addressDeleted(): void {
    this.info('Adresse supprimée', 'L\'adresse a été retirée de votre compte');
  }

  wishlistAdded(productName: string): void {
    this.success('Ajouté aux favoris', `${productName} a été ajouté à votre liste de souhaits`);
  }

  wishlistRemoved(productName: string): void {
    this.info('Retiré des favoris', `${productName} a été retiré de votre liste de souhaits`);
  }

  networkError(): void {
    this.error('Erreur de connexion', 'Vérifiez votre connexion internet et réessayez');
  }

  serverError(): void {
    this.error('Erreur serveur', 'Une erreur s\'est produite. Veuillez réessayer plus tard');
  }

  validationError(errors: string[]): void {
    const message = errors.length > 1
      ? errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : '')
      : errors[0];

    this.error('Erreur de validation', message);
  }

  sessionExpired(): void {
    this.warning('Session expirée', 'Veuillez vous reconnecter pour continuer');
  }

  maintenanceMode(): void {
    this.warning('Maintenance', 'Le site est en cours de maintenance. Certaines fonctionnalités peuvent être indisponibles');
  }

  // Méthode pour afficher des toasts persistants (qui ne disparaissent pas automatiquement)
  persistent(type: Toast['type'], title: string, message?: string): string {
    const toast: Toast = {
      id: this.generateId(),
      type,
      title,
      message,
      duration: 0 // 0 = persistant
    };
    this.addToast(toast);
    return toast.id; // Retourner l'ID pour pouvoir le supprimer manuellement
  }

  // Méthode pour mettre à jour un toast existant
  updateToast(id: string, updates: Partial<Omit<Toast, 'id'>>): void {
    const currentToasts = this.toastsSubject.value;
    const toastIndex = currentToasts.findIndex(toast => toast.id === id);

    if (toastIndex >= 0) {
      const updatedToasts = [...currentToasts];
      updatedToasts[toastIndex] = { ...updatedToasts[toastIndex], ...updates };
      this.toastsSubject.next(updatedToasts);
    }
  }

  getToasts(): Toast[] {
    return this.toastsSubject.value;
  }

  hasToasts(): boolean {
    return this.toastsSubject.value.length > 0;
  }

  getToastCount(): number {
    return this.toastsSubject.value.length;
  }
}
