import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
  showCancel?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  @Input() isVisible = false;
  @Input() data: ConfirmDialogData = {
    title: 'Confirmation',
    message: 'Êtes-vous sûr de vouloir continuer ?',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'info',
    showCancel: true
  };
  @Input() isLoading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  constructor() {}

  onConfirm(): void {
    if (!this.isLoading) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.isLoading) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isLoading) {
      this.onCancel();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.isLoading) {
      this.onCancel();
    } else if (event.key === 'Enter' && !this.isLoading) {
      this.onConfirm();
    }
  }

  getIconName(): string {
    if (this.data.icon) {
      return this.data.icon;
    }

    switch (this.data.type) {
      case 'danger':
        return 'alert-triangle';
      case 'warning':
        return 'alert-circle';
      case 'success':
        return 'check-circle';
      case 'info':
      default:
        return 'help-circle';
    }
  }

  getIconClass(): string {
    return `dialog-icon ${this.data.type || 'info'}`;
  }

  getConfirmButtonClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-warning';
      case 'success':
        return 'btn btn-success';
      case 'info':
      default:
        return 'btn btn-primary';
    }
  }
}

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogSubject = new Subject<ConfirmDialogData>();
  private resultSubject = new Subject<boolean>();

  constructor() {}

  // Observable pour les composants qui affichent le dialogue
  getDialogData(): Observable<ConfirmDialogData> {
    return this.dialogSubject.asObservable();
  }

  // Observable pour obtenir le résultat
  getResult(): Observable<boolean> {
    return this.resultSubject.asObservable();
  }

  // Méthode pour ouvrir un dialogue de confirmation
  confirm(data: Partial<ConfirmDialogData>): Observable<boolean> {
    const dialogData: ConfirmDialogData = {
      title: data.title || 'Confirmation',
      message: data.message || 'Êtes-vous sûr de vouloir continuer ?',
      confirmText: data.confirmText || 'Confirmer',
      cancelText: data.cancelText || 'Annuler',
      type: data.type || 'info',
      icon: data.icon,
      showCancel: data.showCancel !== false
    };

    this.dialogSubject.next(dialogData);
    return this.resultSubject.asObservable();
  }

  // Méthodes de confirmation spécifiques
  confirmDelete(itemName?: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmer la suppression',
      message: itemName
        ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ?<br><strong>Cette action est irréversible.</strong>`
        : 'Êtes-vous sûr de vouloir supprimer cet élément ?<br><strong>Cette action est irréversible.</strong>',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      icon: 'trash-2'
    });
  }

  confirmLogout(): Observable<boolean> {
    return this.confirm({
      title: 'Confirmation de déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Se déconnecter',
      cancelText: 'Rester connecté',
      type: 'warning',
      icon: 'log-out'
    });
  }

  confirmClearCart(): Observable<boolean> {
    return this.confirm({
      title: 'Vider le panier',
      message: 'Êtes-vous sûr de vouloir vider votre panier ?<br>Tous les articles seront supprimés.',
      confirmText: 'Vider le panier',
      cancelText: 'Annuler',
      type: 'warning',
      icon: 'shopping-cart'
    });
  }

  confirmOrderCancellation(): Observable<boolean> {
    return this.confirm({
      title: 'Annuler la commande',
      message: 'Êtes-vous sûr de vouloir annuler cette commande ?<br>Cette action ne peut pas être annulée.',
      confirmText: 'Annuler la commande',
      cancelText: 'Garder la commande',
      type: 'danger',
      icon: 'x-circle'
    });
  }

  // Envoyer le résultat
  sendResult(result: boolean): void {
    this.resultSubject.next(result);
  }
}
