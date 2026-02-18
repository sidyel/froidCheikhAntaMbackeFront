import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Commande, StatutCommande, Breadcrumb } from '../../../models/interfaces';

@Component({
  selector: 'app-order-detail',
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <div class="container mx-auto px-4 py-8" *ngIf="!isLoading && commande">

        <!-- Order Header -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">

            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Commande {{ commande.numeroCommande }}
              </h1>
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>Passée le {{ commande.dateCommande | date:'dd MMMM yyyy à HH:mm':'fr' }}</span>
                <span class="hidden sm:inline">•</span>
                <span>{{ commande.lignesCommande.length }} article{{ commande.lignesCommande.length > 1 ? 's' : '' }}</span>
              </div>
            </div>

            <div class="flex items-center space-x-4">
              <span [class]="getStatusBadgeClasses(commande.statutCommande)" class="badge text-sm">
                {{ getStatusLabel(commande.statutCommande) }}
              </span>
              <div class="text-right">
                <div class="text-2xl font-bold text-primary-600">
                  {{ commande.montantTotal | currency:'XOF':'symbol':'1.0-0' }}
                </div>
                <div class="text-sm text-gray-500">TTC</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Progress -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8" *ngIf="shouldShowProgress()">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Suivi de votre commande</h2>

          <div class="relative">
            <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>

            <div class="space-y-6">
              <div *ngFor="let step of getOrderSteps()" class="relative flex items-center">
                <div [class]="step.completed ? 'bg-primary-600 text-white' : step.current ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' : 'bg-gray-100 text-gray-400'"
                     class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                  <lucide-icon *ngIf="step.completed" name="check" class="w-4 h-4"></lucide-icon>
                  <span *ngIf="!step.completed">{{ step.number }}</span>
                </div>
                <div class="ml-4">
                  <div [class]="step.completed || step.current ? 'text-gray-900 font-medium' : 'text-gray-500'"
                       class="text-sm">
                    {{ step.label }}
                  </div>
                  <div *ngIf="step.date" class="text-xs text-gray-500 mt-1">
                    {{ step.date | date:'dd/MM/yyyy à HH:mm' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Order Items -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Items List -->
            <div class="bg-white rounded-xl shadow-lg">
              <div class="p-6 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Articles commandés</h2>
              </div>

              <div class="divide-y divide-gray-200">
                <div *ngFor="let ligne of commande.lignesCommande" class="p-6">
                  <div class="flex items-center space-x-4">

                    <!-- Product Image Placeholder -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <lucide-icon name="package" class="w-8 h-8 text-gray-400"></lucide-icon>
                      </div>
                    </div>

                    <!-- Product Info -->
                    <div class="flex-1">
                      <h3 class="font-medium text-gray-900">{{ ligne.nomProduitCommande }}</h3>
                      <p class="text-sm text-gray-500" *ngIf="ligne.refProduitCommande">
                        Réf: {{ ligne.refProduitCommande }}
                      </p>
                      <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Quantité: {{ ligne.quantite }}</span>
                        <span>Prix unitaire: {{ ligne.prixUnitaire | currency:'XOF':'symbol':'1.0-0' }}</span>
                      </div>
                    </div>

                    <!-- Total -->
                    <div class="text-right">
                      <div class="font-medium text-gray-900">
                        {{ ligne.sousTotal | currency:'XOF':'symbol':'1.0-0' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Delivery Address -->
            <div class="bg-white rounded-xl shadow-lg p-6" *ngIf="commande.adresseLivraison">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Adresse de livraison</h2>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="font-medium text-gray-900">
                  {{ commande.adresseLivraison.prenom }} {{ commande.adresseLivraison.nom }}
                </div>
                <div class="text-gray-600 mt-1">
                  {{ commande.adresseLivraison.ligne1 }}
                  <div *ngIf="commande.adresseLivraison.ligne2">{{ commande.adresseLivraison.ligne2 }}</div>
                  {{ commande.adresseLivraison.ville }}
                  <span *ngIf="commande.adresseLivraison.codePostal">{{ commande.adresseLivraison.codePostal }}</span>
                </div>
                <div class="text-gray-600 mt-2" *ngIf="commande.adresseLivraison.telephone">
                  <lucide-icon name="phone" class="w-4 h-4 inline mr-1"></lucide-icon>
                  {{ commande.adresseLivraison.telephone }}
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="space-y-6">

            <!-- Payment & Delivery Info -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations</h2>

              <div class="space-y-4">
                <div *ngIf="commande.modeLivraison">
                  <div class="text-sm text-gray-600">Mode de livraison</div>
                  <div class="font-medium text-gray-900">{{ getDeliveryModeLabel(commande.modeLivraison) }}</div>
                </div>

                <div *ngIf="commande.paiement">
                  <div class="text-sm text-gray-600">Moyen de paiement</div>
                  <div class="font-medium text-gray-900">{{ getPaymentMethodLabel(commande.paiement.methodePaiement) }}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    Statut: {{ getPaymentStatusLabel(commande.paiement.statutPaiement) }}
                  </div>
                </div>

                <div *ngIf="commande.numeroSuivi">
                  <div class="text-sm text-gray-600">Numéro de suivi</div>
                  <div class="font-medium text-gray-900">{{ commande.numeroSuivi }}</div>
                </div>
              </div>
            </div>

            <!-- Price Summary -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>

              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Sous-total</span>
                  <span class="font-medium">{{ getSubtotal() | currency:'XOF':'symbol':'1.0-0' }}</span>
                </div>

                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Frais de livraison</span>
                  <span class="font-medium text-green-600">
                    {{ commande.fraisLivraison > 0 ? (commande.fraisLivraison | currency:'XOF':'symbol':'1.0-0') : 'Gratuit' }}
                  </span>
                </div>

                <div class="border-t border-gray-200 pt-3">
                  <div class="flex justify-between">
                    <span class="text-lg font-semibold text-gray-900">Total</span>
                    <span class="text-lg font-bold text-primary-600">{{ commande.montantTotal | currency:'XOF':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              <div class="space-y-3">
                <button
                  *ngIf="canDownloadInvoice()"
                  (click)="downloadInvoice()"
                  class="w-full btn-outline text-sm py-2">
                  <lucide-icon name="download" class="w-4 h-4"></lucide-icon>
                  <span>Télécharger la facture</span>
                </button>

                <button
                  *ngIf="canTrackOrder()"
                  (click)="trackOrder()"
                  class="w-full btn-outline text-sm py-2">
                  <lucide-icon name="truck" class="w-4 h-4"></lucide-icon>
                  <span>Suivre la livraison</span>
                </button>

                <button
                  *ngIf="canCancelOrder()"
                  (click)="cancelOrder()"
                  class="w-full btn-danger text-sm py-2">
                  <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                  <span>Annuler la commande</span>
                </button>

                <button
                  (click)="goBackToOrders()"
                  class="w-full btn-outline text-sm py-2">
                  <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
                  <span>Retour aux commandes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600">Chargement de la commande...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !commande && hasError" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <lucide-icon name="package" class="w-24 h-24 text-gray-300 mx-auto mb-4"></lucide-icon>
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">Commande non trouvée</h2>
          <p class="text-gray-600 mb-6">La commande que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
          <button (click)="goBackToOrders()" class="btn-primary">
            <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
            <span>Retour aux commandes</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  commande: Commande | null = null;
  breadcrumbs: Breadcrumb[] = [];

  isLoading = true;
  hasError = false;
  currentOrderId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const orderId = +params['id'];
        this.currentOrderId = orderId;

        if (orderId && !isNaN(orderId)) {
          this.loadOrder(orderId);
        } else {
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrder(orderId: number): void {
    this.isLoading = true;
    this.hasError = false;

    this.apiService.getCommande(orderId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Erreur lors du chargement de la commande:', error);
          this.hasError = true;
          this.isLoading = false;
          throw error;
        })
      )
      .subscribe({
        next: (commande) => {
          this.commande = commande;
          this.updateBreadcrumbs();
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = [
      { label: 'Accueil', route: '/' },
      { label: 'Mes Commandes', route: '/commandes' }
    ];

    if (this.commande) {
      this.breadcrumbs.push({
        label: `Commande ${this.commande.numeroCommande}`,
        route: undefined
      });
    }
  }

  // Status and labels
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

  getPaymentStatusLabel(status: any): string {
    const statusLabels = {
      'EN_ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'ECHOUE': 'Échec',
      'ANNULE': 'Annulé',
      'REMBOURSE': 'Remboursé'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  // Progress tracking
  shouldShowProgress(): boolean {
    return this.commande ? ![StatutCommande.ANNULEE, StatutCommande.REMBOURSEE].includes(this.commande.statutCommande) : false;
  }

  getOrderSteps(): any[] {
    if (!this.commande) return [];

    const steps = [
      { number: 1, label: 'Commande passée', status: StatutCommande.EN_ATTENTE },
      { number: 2, label: 'Commande confirmée', status: StatutCommande.CONFIRMEE },
      { number: 3, label: 'Paiement effectué', status: StatutCommande.PAYEE },
      { number: 4, label: 'En préparation', status: StatutCommande.EN_PREPARATION },
      { number: 5, label: 'Expédiée', status: StatutCommande.EXPEDIE },
      { number: 6, label: 'Livrée', status: StatutCommande.LIVREE }
    ];

    const currentStatusIndex = steps.findIndex(step => step.status === this.commande!.statutCommande);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStatusIndex,
      current: index === currentStatusIndex,
      date: index <= currentStatusIndex ? this.commande!.dateCommande : null
    }));
  }

  // Actions
  canDownloadInvoice(): boolean {
    return this.commande ? [StatutCommande.PAYEE, StatutCommande.EN_PREPARATION, StatutCommande.EXPEDIE, StatutCommande.LIVREE].includes(this.commande.statutCommande) : false;
  }

  canTrackOrder(): boolean {
    return this.commande ? !!(this.commande.numeroSuivi && [StatutCommande.EXPEDIE].includes(this.commande.statutCommande)) : false;
  }

  canCancelOrder(): boolean {
    return this.commande ? [StatutCommande.EN_ATTENTE, StatutCommande.CONFIRMEE].includes(this.commande.statutCommande) : false;
  }

  downloadInvoice(): void {
    this.toastService.info('Fonctionnalité bientôt disponible', 'Le téléchargement de facture sera bientôt disponible');
  }

  trackOrder(): void {
    if (this.commande?.numeroSuivi) {
      this.toastService.info('Suivi de commande', `Numéro de suivi: ${this.commande.numeroSuivi}`);
    }
  }

  cancelOrder(): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    this.toastService.info('Fonctionnalité bientôt disponible', 'L\'annulation de commande sera bientôt disponible');
  }

  goBackToOrders(): void {
    this.router.navigate(['/commandes']);
  }

  // Calculations
  getSubtotal(): number {
    return this.commande ? this.commande.lignesCommande.reduce((total, ligne) => total + ligne.sousTotal, 0) : 0;
  }
}
