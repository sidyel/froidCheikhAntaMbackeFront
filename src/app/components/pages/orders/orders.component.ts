import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Commande, PagedResponse, StatutCommande, Breadcrumb } from '../../../models/interfaces';

@Component({
  selector: 'app-orders',
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <div class="container mx-auto px-4 py-8">

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Mes Commandes
          </h1>
          <p class="text-gray-600">
            Suivez l'état de vos commandes et consultez votre historique d'achats
          </p>
        </div>

        <!-- Filters -->
        <div class="mb-6 bg-white rounded-xl shadow-lg p-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">

            <!-- Status Filter -->
            <div class="flex items-center space-x-4">
              <label class="text-sm font-medium text-gray-700">Filtrer par statut:</label>
              <select
                [(ngModel)]="selectedStatus"
                (ngModelChange)="onStatusFilterChange()"
                class="form-input text-sm">
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRMEE">Confirmée</option>
                <option value="PAYEE">Payée</option>
                <option value="EN_PREPARATION">En préparation</option>
                <option value="EXPEDIE">Expédiée</option>
                <option value="LIVREE">Livrée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>

            <!-- Search -->
            <div class="flex items-center space-x-2">
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchChange()"
                  placeholder="Rechercher une commande..."
                  class="form-input text-sm pl-10 w-64">
                <lucide-icon name="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders List -->
        <div class="space-y-6" *ngIf="!isLoading && orders.length > 0">
          <div
            *ngFor="let order of orders; trackBy: trackByOrder"
            class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">

            <!-- Order Header -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">

                <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div>
                    <span class="text-sm text-gray-600">Commande</span>
                    <p class="font-semibold text-gray-900">{{ order.numeroCommande }}</p>
                  </div>
                  <div>
                    <span class="text-sm text-gray-600">Date</span>
                    <p class="font-medium text-gray-900">{{ order.dateCommande | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <div>
                    <span class="text-sm text-gray-600">Total</span>
                    <p class="font-semibold text-primary-600">{{ order.montantTotal | currency:'XOF':'symbol':'1.0-0' }}</p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <span [class]="getStatusBadgeClasses(order.statutCommande)" class="badge">
                    {{ getStatusLabel(order.statutCommande) }}
                  </span>
                  <button
                    (click)="viewOrderDetail(order.idCommande)"
                    class="btn-outline text-sm py-2 px-4">
                    <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
                    <span>Voir détails</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Order Content -->
            <div class="p-6">

              <!-- Order Items Preview -->
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Articles commandés</h4>
                <div class="space-y-3">
                  <div
                    *ngFor="let ligne of order.lignesCommande.slice(0, 3)"
                    class="flex items-center space-x-4">

                    <!-- Product Image -->
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <lucide-icon name="package" class="w-6 h-6 text-gray-400"></lucide-icon>
                      </div>
                    </div>

                    <!-- Product Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ ligne.nomProduitCommande }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ ligne.refProduitCommande }} • Qté: {{ ligne.quantite }}
                      </p>
                    </div>

                    <!-- Price -->
                    <div class="text-sm font-medium text-gray-900">
                      {{ ligne.sousTotal | currency:'XOF':'symbol':'1.0-0' }}
                    </div>
                  </div>

                  <!-- More items indicator -->
                  <div *ngIf="order.lignesCommande.length > 3" class="text-center">
                    <span class="text-sm text-gray-500">
                      et {{ order.lignesCommande.length - 3 }} article{{ order.lignesCommande.length - 3 > 1 ? 's' : '' }} de plus
                    </span>
                  </div>
                </div>
              </div>

              <!-- Order Progress -->
              <div class="mb-4" *ngIf="shouldShowProgress(order.statutCommande)">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Progression de la commande</span>
                  <span>{{ getProgressPercentage(order.statutCommande) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    [style.width.%]="getProgressPercentage(order.statutCommande)">
                  </div>
                </div>
              </div>

              <!-- Delivery Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div *ngIf="order.modeLivraison">
                  <span class="text-gray-600">Mode de livraison:</span>
                  <p class="font-medium text-gray-900">{{ getDeliveryModeLabel(order.modeLivraison) }}</p>
                </div>

                <div *ngIf="order.numeroSuivi">
                  <span class="text-gray-600">Numéro de suivi:</span>
                  <p class="font-medium text-gray-900">{{ order.numeroSuivi }}</p>
                </div>

                <div *ngIf="order.paiement">
                  <span class="text-gray-600">Paiement:</span>
                  <p class="font-medium text-gray-900">{{ getPaymentMethodLabel(order.paiement.methodePaiement) }}</p>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  (click)="viewOrderDetail(order.idCommande)"
                  class="btn-primary text-sm py-2 px-4">
                  <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
                  <span>Voir détails</span>
                </button>

                <button
                  *ngIf="canReorder(order)"
                  (click)="reorder(order)"
                  class="btn-outline text-sm py-2 px-4">
                  <lucide-icon name="repeat" class="w-4 h-4"></lucide-icon>
                  <span>Recommander</span>
                </button>

                <button
                  *ngIf="canDownloadInvoice(order)"
                  (click)="downloadInvoice(order)"
                  class="btn-outline text-sm py-2 px-4">
                  <lucide-icon name="download" class="w-4 h-4"></lucide-icon>
                  <span>Facture</span>
                </button>

                <button
                  *ngIf="canTrackOrder(order)"
                  (click)="trackOrder(order)"
                  class="btn-outline text-sm py-2 px-4">
                  <lucide-icon name="truck" class="w-4 h-4"></lucide-icon>
                  <span>Suivre</span>
                </button>

                <button
                  *ngIf="canCancelOrder(order)"
                  (click)="cancelOrder(order)"
                  class="btn-danger text-sm py-2 px-4">
                  <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="space-y-6">
          <div *ngFor="let i of [1,2,3,4,5]" class="bg-white rounded-xl shadow-lg animate-pulse">
            <div class="bg-gray-200 h-20 rounded-t-xl"></div>
            <div class="p-6 space-y-3">
              <div class="bg-gray-200 h-4 rounded w-3/4"></div>
              <div class="bg-gray-200 h-4 rounded w-1/2"></div>
              <div class="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && orders.length === 0" class="text-center py-16">
          <div class="max-w-md mx-auto">
            <lucide-icon name="package" class="w-24 h-24 text-gray-300 mx-auto mb-6"></lucide-icon>
            <h3 class="text-xl font-semibold text-gray-900 mb-4">
              {{ selectedStatus || searchQuery ? 'Aucune commande trouvée' : 'Aucune commande pour le moment' }}
            </h3>
            <p class="text-gray-600 mb-8">
              {{ selectedStatus || searchQuery
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez vos achats dès maintenant et découvrez notre large gamme de produits.' }}
            </p>
            <button
              *ngIf="!selectedStatus && !searchQuery"
              (click)="goToProducts()"
              class="btn-primary text-lg px-8 py-3">
              <lucide-icon name="shopping-cart" class="w-5 h-5"></lucide-icon>
              <span>Commencer mes achats</span>
            </button>
            <button
              *ngIf="selectedStatus || searchQuery"
              (click)="clearFilters()"
              class="btn-outline text-lg px-8 py-3">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
              <span>Effacer les filtres</span>
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <app-pagination
          *ngIf="ordersResponse && ordersResponse.totalElements > 0"
          [currentPage]="currentPage"
          [totalPages]="ordersResponse.totalPages"
          [totalElements]="ordersResponse.totalElements"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  orders: Commande[] = [];
  ordersResponse: PagedResponse<Commande> | null = null;

  // Filters
  selectedStatus = '';
  searchQuery = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // UI State
  isLoading = true;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Accueil', route: '/' },
    { label: 'Mon Profil', route: '/profil' },
    { label: 'Mes Commandes', route: undefined }
  ];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrders(): void {
    this.isLoading = true;

    const params = {
      page: this.currentPage,
      size: this.pageSize
    };

    this.apiService.getMesCommandes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ordersResponse = response;
          this.orders = response.content;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des commandes:', error);
          this.isLoading = false;
          this.toastService.error('Erreur', 'Impossible de charger vos commandes');
        }
      });
  }

  // Event handlers
  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    // Implémenter la recherche si nécessaire
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrders();
    this.scrollToTop();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadOrders();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadOrders();
  }

  // Navigation
  viewOrderDetail(orderId: number): void {
    this.router.navigate(['/commande', orderId]);
  }

  goToProducts(): void {
    this.router.navigate(['/produits']);
  }

  // Order actions
  reorder(order: Commande): void {
    // Implémenter la re-commande
    this.toastService.info('Fonctionnalité bientôt disponible', 'La recommande sera bientôt disponible');
  }

  downloadInvoice(order: Commande): void {
    // Implémenter le téléchargement de facture
    this.toastService.info('Fonctionnalité bientôt disponible', 'Le téléchargement de facture sera bientôt disponible');
  }

  trackOrder(order: Commande): void {
    if (order.numeroSuivi) {
      // Rediriger vers une page de suivi ou ouvrir un modal
      this.toastService.info('Suivi de commande', `Numéro de suivi: ${order.numeroSuivi}`);
    }
  }

  cancelOrder(order: Commande): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;

    // Implémenter l'annulation de commande
    this.toastService.info('Fonctionnalité bientôt disponible', 'L\'annulation de commande sera bientôt disponible');
  }

  // Helper methods
  getStatusLabel(status: StatutCommande): string {
    const statusLabels = {
      [StatutCommande.EN_ATTENTE]: 'En attente',
      [StatutCommande.CONFIRMEE]: 'Confirmée',
      [StatutCommande.PAYEE]: 'Payée',
      [StatutCommande.EN_PREPARATION]: 'En préparation',
      [StatutCommande.EXPEDIE]: 'Expédiée',
      [StatutCommande.LIVREE]: 'Livrée',
      [StatutCommande.ANNULEE]: 'Annulée',
      [StatutCommande.REMBOURSEE]: 'Remboursée'
    };
    return statusLabels[status] || status;
  }

  getStatusBadgeClasses(status: StatutCommande): string {
    const baseClasses = 'badge';

    switch (status) {
      case StatutCommande.EN_ATTENTE:
      case StatutCommande.CONFIRMEE:
        return `${baseClasses} badge-warning`;
      case StatutCommande.PAYEE:
      case StatutCommande.EN_PREPARATION:
      case StatutCommande.EXPEDIE:
        return `${baseClasses} badge-info`;
      case StatutCommande.LIVREE:
        return `${baseClasses} badge-success`;
      case StatutCommande.ANNULEE:
      case StatutCommande.REMBOURSEE:
        return `${baseClasses} badge-danger`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getDeliveryModeLabel(mode: any): string {
    const modeLabels = {
      'LIVRAISON_DOMICILE': 'Livraison à domicile',
      'LIVRAISON_EXPRESS': 'Livraison express',
      'RETRAIT_MAGASIN': 'Retrait en magasin'
    };
    return modeLabels[mode as keyof typeof modeLabels] || mode;
  }

  getPaymentMethodLabel(method: any): string {
    const methodLabels = {
      'WAVE': 'Wave',
      'ORANGE_MONEY': 'Orange Money',
      'VIREMENT_BANCAIRE': 'Virement bancaire',
      'ESPECES': 'Espèces',
      'CARTE_BANCAIRE': 'Carte bancaire'
    };
    return methodLabels[method as keyof typeof methodLabels] || method;
  }

  shouldShowProgress(status: StatutCommande): boolean {
    return ![StatutCommande.ANNULEE, StatutCommande.REMBOURSEE].includes(status);
  }

  getProgressPercentage(status: StatutCommande): number {
    const progressMap = {
      [StatutCommande.EN_ATTENTE]: 10,
      [StatutCommande.CONFIRMEE]: 25,
      [StatutCommande.PAYEE]: 40,
      [StatutCommande.EN_PREPARATION]: 60,
      [StatutCommande.EXPEDIE]: 80,
      [StatutCommande.LIVREE]: 100,
      [StatutCommande.ANNULEE]: 0,
      [StatutCommande.REMBOURSEE]: 0
    };
    return progressMap[status] || 0;
  }

  // Order action permissions
  canReorder(order: Commande): boolean {
    return [StatutCommande.LIVREE, StatutCommande.ANNULEE].includes(order.statutCommande);
  }

  canDownloadInvoice(order: Commande): boolean {
    return [StatutCommande.PAYEE, StatutCommande.EN_PREPARATION, StatutCommande.EXPEDIE, StatutCommande.LIVREE].includes(order.statutCommande);
  }

  canTrackOrder(order: Commande): boolean {
    return !!(order.numeroSuivi && [StatutCommande.EXPEDIE].includes(order.statutCommande));
  }

  canCancelOrder(order: Commande): boolean {
    return [StatutCommande.EN_ATTENTE, StatutCommande.CONFIRMEE].includes(order.statutCommande);
  }

  trackByOrder(index: number, order: Commande): number {
    return order.idCommande;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
