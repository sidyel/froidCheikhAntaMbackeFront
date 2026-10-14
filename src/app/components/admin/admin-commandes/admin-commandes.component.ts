import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { Commande, PagedResponse, StatutCommande } from '../../../models/interfaces';

@Component({
  selector: 'app-admin-commandes',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
        <p class="text-gray-600">Suivez et gérez toutes les commandes</p>
      </div>

      <!-- Filtres -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              placeholder="Numéro de commande..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              [(ngModel)]="selectedStatut"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Période</label>
            <select
              [(ngModel)]="selectedPeriode"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes les commandes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <!-- Table des commandes -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commande
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr *ngFor="let commande of commandes; trackBy: trackByCommandeId" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ commande.numeroCommande }}
              </div>
              <div class="text-sm text-gray-500" *ngIf="commande.numeroSuivi">
                Suivi: {{ commande.numeroSuivi }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900" *ngIf="commande.clientId; else inviteInfo">
                Client {{ commande.clientId }}
              </div>
              <ng-template #inviteInfo>
                <div class="text-sm text-gray-900">
                  {{ commande.nomInvite }} {{ commande.prenomInvite }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ commande.emailInvite }}
                </div>
              </ng-template>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ commande.dateCommande | date:'short' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ commande.montantTotal | currency:('' | devise):'symbol':'1.0-0' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <!-- VERSION CORRIGÉE DU SELECT -->
              <div class="relative">
                <select
                  [value]="commande.statutCommande"
                  (change)="updateStatut(commande, $event)"
                  [disabled]="updatingStatus[commande.idCommande]"
                  class="text-xs px-2 py-1 rounded-full border focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[120px]"
                  [ngClass]="{
                      'bg-yellow-100 text-yellow-800 border-yellow-300': commande.statutCommande === 'EN_ATTENTE',
                      'bg-blue-100 text-blue-800 border-blue-300': commande.statutCommande === 'CONFIRMEE',
                      'bg-green-100 text-green-800 border-green-300': commande.statutCommande === 'PAYEE',
                      'bg-purple-100 text-purple-800 border-purple-300': commande.statutCommande === 'EN_PREPARATION',
                      'bg-indigo-100 text-indigo-800 border-indigo-300': commande.statutCommande === 'EXPEDIE',
                      'bg-emerald-100 text-emerald-800 border-emerald-300': commande.statutCommande === 'LIVREE',
                      'bg-red-100 text-red-800 border-red-300': commande.statutCommande === 'ANNULEE',
                      'opacity-50 cursor-not-allowed': updatingStatus[commande.idCommande]
                    }">
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="CONFIRMEE">Confirmée</option>
                  <option value="PAYEE">Payée</option>
                  <option value="EN_PREPARATION">En préparation</option>
                  <option value="EXPEDIE">Expédiée</option>
                  <option value="LIVREE">Livrée</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
                <!-- Indicateur de chargement -->
                <div *ngIf="updatingStatus[commande.idCommande]"
                     class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                </div>
              </div>
              <!-- Message de statut -->
              <div *ngIf="updatingStatus[commande.idCommande]" class="text-xs text-gray-500 mt-1">
                Mise à jour...
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button
                  (click)="voirDetails(commande)"
                  [disabled]="loadingDetails"
                  class="text-primary-600 hover:text-primary-800 disabled:opacity-50"
                  title="Voir détails">
                  <lucide-icon name="eye" class="h-4 w-4"></lucide-icon>
                </button>
                <button
                  *ngIf="commande.statutCommande !== 'ANNULEE' && commande.statutCommande !== 'LIVREE'"
                  (click)="annulerCommande(commande)"
                  [disabled]="updatingStatus[commande.idCommande]"
                  class="text-red-600 hover:text-red-800 disabled:opacity-50"
                  title="Annuler">
                  <lucide-icon name="x-circle" class="h-4 w-4"></lucide-icon>
                </button>
                <button
                  *ngIf="commande.statutCommande === 'ANNULEE'"
                  (click)="supprimerCommande(commande)"
                  [disabled]="deletingCommande[commande.idCommande]"
                  class="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Supprimer définitivement">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <!-- Message si aucune commande -->
        <div *ngIf="commandes.length === 0" class="text-center py-8">
          <p class="text-gray-500">Aucune commande trouvée</p>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              [disabled]="currentPage === 0"
              (click)="previousPage()"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Précédent
            </button>
            <button
              [disabled]="currentPage >= totalPages - 1"
              (click)="nextPage()"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Suivant
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Affichage de
                <span class="font-medium">{{ currentPage * pageSize + 1 }}</span>
                à
                <span class="font-medium">{{ Math.min((currentPage + 1) * pageSize, totalElements) }}</span>
                sur
                <span class="font-medium">{{ totalElements }}</span>
                résultats
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  [disabled]="currentPage === 0"
                  (click)="previousPage()"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <lucide-icon name="chevron-left" class="h-5 w-5"></lucide-icon>
                </button>
                <button
                  [disabled]="currentPage >= totalPages - 1"
                  (click)="nextPage()"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <lucide-icon name="chevron-right" class="h-5 w-5"></lucide-icon>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal détails commande -->
      <app-modal
        *ngIf="showDetailsModal"
        [isOpen]="showDetailsModal"
        [config]="{
          title: 'Détails de la commande ' + (selectedCommande?.numeroCommande || ''),
          showCancel: false,
          cancelText: 'Fermer'
        }"
        (closed)="closeDetailsModal()"
        (cancelled)="closeDetailsModal()"
        size="lg">

        <div *ngIf="selectedCommande" class="space-y-6">
          <!-- Informations générales -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-3">Informations de la commande</h3>
              <dl class="space-y-2">
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Numéro:</dt>
                  <dd class="text-sm font-medium text-gray-900">{{ selectedCommande.numeroCommande }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Date:</dt>
                  <dd class="text-sm text-gray-900">{{ selectedCommande.dateCommande | date:'full' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Statut:</dt>
                  <dd class="text-sm text-gray-900">{{ getStatutLabel(selectedCommande.statutCommande) }}</dd>
                </div>
                <div class="flex justify-between" *ngIf="selectedCommande.numeroSuivi">
                  <dt class="text-sm text-gray-500">Suivi:</dt>
                  <dd class="text-sm text-gray-900">{{ selectedCommande.numeroSuivi }}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-3">Adresse de livraison</h3>
              <div class="text-sm text-gray-900" *ngIf="selectedCommande.adresseLivraison">
                <p class="font-medium">{{ selectedCommande.adresseLivraison.nom }} {{ selectedCommande.adresseLivraison.prenom }}</p>
                <p>{{ selectedCommande.adresseLivraison.ligne1 }}</p>
                <p *ngIf="selectedCommande.adresseLivraison.ligne2">{{ selectedCommande.adresseLivraison.ligne2 }}</p>
                <p>{{ selectedCommande.adresseLivraison.ville }} {{ selectedCommande.adresseLivraison.codePostal }}</p>
                <p class="mt-2">📞 {{ selectedCommande.adresseLivraison.telephone }}</p>
              </div>
            </div>
          </div>

          <!-- Produits commandés -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Produits commandés</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="space-y-3" *ngIf="selectedCommande.lignesCommande && selectedCommande.lignesCommande.length > 0; else noProducts">
                <div *ngFor="let ligne of selectedCommande.lignesCommande; trackBy: trackByLigneId"
                     class="flex justify-between items-center bg-white p-3 rounded">
                  <div>
                    <p class="font-medium text-gray-900">{{ ligne.nomProduitCommande }}</p>
                    <p class="text-sm text-gray-500">Réf: {{ ligne.refProduitCommande }}</p>
                    <p class="text-sm text-gray-500">Quantité: {{ ligne.quantite }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium text-gray-900">{{ ligne.prixUnitaire | currency:('' | devise):'symbol':'1.0-0' }}</p>
                    <p class="text-sm text-gray-500">Total: {{ ligne.sousTotal | currency:('' | devise):'symbol':'1.0-0' }}</p>
                  </div>
                </div>
              </div>

              <ng-template #noProducts>
                <div class="text-center py-4 text-gray-500">
                  Aucun produit trouvé pour cette commande
                </div>
              </ng-template>

              <!-- Récapitulatif financier -->
              <div class="border-t border-gray-200 pt-3 mt-3 space-y-1">
                <!-- Détail livraison — commandes récentes avec champs zone -->
                <ng-container *ngIf="selectedCommande.zoneNom; else livraisonSimple">
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>Zone ({{ selectedCommande.zoneNom }}) — {{ selectedCommande.zoneModeApplique }}:</span>
                    <span *ngIf="selectedCommande.livraisonGratuiteAppliquee; else prixZone" class="text-green-600 font-medium">Gratuit</span>
                    <ng-template #prixZone>
                      <span>{{ selectedCommande.zonePrixApplique | currency:('' | devise):'symbol':'1.0-0' }}</span>
                    </ng-template>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600"
                       *ngIf="selectedCommande.supplementExpressApplique && selectedCommande.supplementExpressApplique > 0">
                    <span>Supplément express:</span>
                    <span>{{ selectedCommande.supplementExpressApplique | currency:('' | devise):'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600"
                       *ngIf="selectedCommande.supplementGabaritApplique && selectedCommande.supplementGabaritApplique > 0">
                    <span>Supplément gabarit lourd:</span>
                    <span>{{ selectedCommande.supplementGabaritApplique | currency:('' | devise):'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600 font-medium">
                    <span>Total livraison:</span>
                    <span>{{ selectedCommande.fraisLivraison | currency:('' | devise):'symbol':'1.0-0' }}</span>
                  </div>
                </ng-container>
                <!-- Livraison simple — anciennes commandes sans champs zone -->
                <ng-template #livraisonSimple>
                  <div class="flex justify-between text-sm text-gray-600" *ngIf="selectedCommande.fraisLivraison > 0">
                    <span>Frais de livraison:</span>
                    <span>{{ selectedCommande.fraisLivraison | currency:('' | devise):'symbol':'1.0-0' }}</span>
                  </div>
                </ng-template>
                <div class="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span class="text-base font-medium text-gray-900">Total commande:</span>
                  <span class="text-base font-medium text-gray-900">{{ selectedCommande.montantTotal | currency:('' | devise):'symbol':'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="loadingDetails" class="flex justify-center py-8">
          <app-loading-spinner></app-loading-spinner>
        </div>
      </app-modal>

      <!-- Modal annulation -->
      <app-modal
        *ngIf="showAnnulationModal"
        [isOpen]="showAnnulationModal"
        [config]="{
          title: 'Annuler la commande',
          confirmText: 'Confirmer lannulation',
          cancelText: 'Annuler'
        }"
        [confirmDisabled]="!motifAnnulation.trim() || processingCancellation"
        [isProcessing]="processingCancellation"
        (closed)="closeAnnulationModal()"
        (confirmed)="confirmerAnnulation()"
        (cancelled)="closeAnnulationModal()">

        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Êtes-vous sûr de vouloir annuler cette commande ?
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Motif d'annulation <span class="text-red-500">*</span>
            </label>
            <textarea
              [(ngModel)]="motifAnnulation"
              rows="3"
              placeholder="Précisez le motif de l'annulation..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              [class.border-red-300]="motifAnnulation.trim() === '' && showValidationError"></textarea>
            <p *ngIf="motifAnnulation.trim() === '' && showValidationError" class="mt-1 text-xs text-red-600">
              Le motif d'annulation est obligatoire
            </p>
          </div>
        </div>
      </app-modal>

      <!-- Modal suppression -->
      <app-modal
        *ngIf="showSuppressionModal"
        [isOpen]="showSuppressionModal"
        [config]="{
          title: 'Supprimer la commande',
          confirmText: 'Confirmer la suppression',
          cancelText: 'Annuler'
        }"
        [confirmDisabled]="processingDeletion"
        [isProcessing]="processingDeletion"
        (closed)="closeSuppressionModal()"
        (confirmed)="confirmerSuppression()"
        (cancelled)="closeSuppressionModal()">

        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <lucide-icon name="alert-triangle" class="h-6 w-6 text-red-500"></lucide-icon>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900">Attention</h3>
              <p class="text-sm text-gray-600">
                Cette action est irréversible. La commande sera définitivement supprimée.
              </p>
            </div>
          </div>
          <p class="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer définitivement cette commande ?
          </p>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminCommandesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  commandes: Commande[] = [];
  loading = false;
  loadingDetails = false;
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  // État pour le suivi des mises à jour de statut
  updatingStatus: { [commandeId: number]: boolean } = {};
  deletingCommande: { [commandeId: number]: boolean } = {};

  searchTerm = '';
  selectedStatut = '';
  selectedPeriode = '';

  showDetailsModal = false;
  selectedCommande: Commande | null = null;

  showAnnulationModal = false;
  commandeToCancel: Commande | null = null;
  motifAnnulation = '';
  processingCancellation = false;
  showValidationError = false;

  showSuppressionModal = false;
  commandeToDelete: Commande | null = null;
  processingDeletion = false;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCommandes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCommandes(): void {
    this.loading = true;
    const statut = this.selectedStatut || undefined;

    console.log('🔄 Chargement des commandes avec statut:', statut);

    this.adminService.getAllCommandes(this.currentPage, this.pageSize, statut)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PagedResponse<Commande>) => {
          console.log('✅ Réponse reçue:', response);
          this.commandes = response.content || [];
          this.totalPages = response.totalPages || 0;
          this.totalElements = response.totalElements || 0;
          this.loading = false;
          console.log('📋 Commandes chargées:', this.commandes.length);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des commandes:', error);
          this.toastService.error('Erreur', 'Impossible de charger les commandes');
          this.commandes = [];
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadCommandes();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadCommandes();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadCommandes();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadCommandes();
    }
  }

  // VERSION CORRIGÉE DE updateStatut
  updateStatut(commande: Commande, event: any): void {
    const nouveauStatut = event.target.value as StatutCommande;
    const ancienStatut = commande.statutCommande;

    console.log('🔄 Tentative de mise à jour statut:', {
      commandeId: commande.idCommande,
      ancienStatut,
      nouveauStatut
    });

    // Ne rien faire si le statut n'a pas changé
    if (nouveauStatut === ancienStatut) {
      console.log('ℹ️ Statut inchangé, abandon de la mise à jour');
      return;
    }

    // Vérifier que l'ID de la commande existe
    if (!commande.idCommande) {
      console.error('❌ ID de commande manquant');
      this.toastService.error('Erreur', 'ID de commande manquant');
      event.target.value = ancienStatut; // Restaurer l'ancien statut
      return;
    }

    // Marquer comme en cours de mise à jour
    this.updatingStatus[commande.idCommande] = true;

    console.log('📤 Envoi de la requête de mise à jour...');

    this.adminService.updateStatutCommande(commande.idCommande, nouveauStatut)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commandeUpdated) => {
          console.log('✅ Statut mis à jour avec succès:', commandeUpdated);

          // Mettre à jour la commande dans la liste
          const index = this.commandes.findIndex(c => c.idCommande === commande.idCommande);
          if (index >= 0) {
            // Conserver l'objet existant mais mettre à jour les propriétés nécessaires
            this.commandes[index] = {
              ...this.commandes[index],
              ...commandeUpdated,
              statutCommande: commandeUpdated.statutCommande || nouveauStatut
            };
            console.log('🔄 Commande mise à jour dans la liste:', this.commandes[index]);
          }

          this.toastService.success('Succès', `Statut mis à jour vers "${this.getStatutLabel(nouveauStatut)}"`);
          this.updatingStatus[commande.idCommande] = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la mise à jour du statut:', error);

          let errorMessage = 'Impossible de mettre à jour le statut';
          if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.toastService.error('Erreur', errorMessage);

          // Restaurer l'ancien statut dans le select
          event.target.value = ancienStatut;

          // Restaurer l'ancien statut dans l'objet commande
          commande.statutCommande = ancienStatut;

          this.updatingStatus[commande.idCommande] = false;
        }
      });
  }

  voirDetails(commande: Commande): void {
    console.log('👁️ Affichage des détails de la commande:', commande.idCommande);
    this.loadingDetails = true;

    // Charger les détails complets de la commande
    this.adminService.getCommandeById(commande.idCommande)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commandeComplete) => {
          console.log('✅ Détails chargés:', commandeComplete);
          this.selectedCommande = commandeComplete;
          this.showDetailsModal = true;
          this.loadingDetails = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des détails:', error);
          this.toastService.error('Erreur', 'Impossible de charger les détails de la commande');
          this.loadingDetails = false;

          // Fallback: utiliser les données disponibles
          this.selectedCommande = commande;
          this.showDetailsModal = true;
        }
      });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCommande = null;
  }

  annulerCommande(commande: Commande): void {
    console.log('❌ Demande d\'annulation de la commande:', commande.idCommande);
    this.commandeToCancel = commande;
    this.motifAnnulation = '';
    this.showValidationError = false;
    this.showAnnulationModal = true;
  }

  closeAnnulationModal(): void {
    this.showAnnulationModal = false;
    this.commandeToCancel = null;
    this.motifAnnulation = '';
    this.showValidationError = false;
    this.processingCancellation = false;
  }

  confirmerAnnulation(): void {
    if (!this.motifAnnulation.trim()) {
      this.showValidationError = true;
      return;
    }

    if (this.commandeToCancel) {
      console.log('📤 Envoi de l\'annulation:', {
        id: this.commandeToCancel.idCommande,
        motif: this.motifAnnulation.trim()
      });

      this.processingCancellation = true;

      this.adminService.annulerCommande(this.commandeToCancel.idCommande, this.motifAnnulation.trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (commandeAnnulee) => {
            console.log('✅ Commande annulée:', commandeAnnulee);
            this.toastService.success('Succès', 'Commande annulée avec succès');
            this.closeAnnulationModal();
            this.loadCommandes(); // Recharger la liste
          },
          error: (error) => {
            console.error('❌ Erreur lors de l\'annulation:', error);

            let errorMessage = 'Impossible d\'annuler la commande';
            if (error?.error?.message) {
              errorMessage = error.error.message;
            }

            this.toastService.error('Erreur', errorMessage);
            this.processingCancellation = false;
          }
        });
    }
  }

  supprimerCommande(commande: Commande): void {
    console.log('🗑️ Demande de suppression de la commande:', commande.idCommande);
    this.commandeToDelete = commande;
    this.showSuppressionModal = true;
  }

  closeSuppressionModal(): void {
    this.showSuppressionModal = false;
    this.commandeToDelete = null;
    this.processingDeletion = false;
  }

  confirmerSuppression(): void {
    if (this.commandeToDelete) {
      console.log('📤 Envoi de la suppression:', this.commandeToDelete.idCommande);

      this.processingDeletion = true;
      this.deletingCommande[this.commandeToDelete.idCommande] = true;

      this.adminService.supprimerCommande(this.commandeToDelete.idCommande)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Commande supprimée');
            this.toastService.success('Succès', 'Commande supprimée avec succès');
            this.closeSuppressionModal();
            this.loadCommandes(); // Recharger la liste
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);

            let errorMessage = 'Impossible de supprimer la commande';
            if (error?.error?.message) {
              errorMessage = error.error.message;
            }

            this.toastService.error('Erreur', errorMessage);

            if (this.commandeToDelete) {
              this.deletingCommande[this.commandeToDelete.idCommande] = false;
            }
            this.processingDeletion = false;
          }
        });
    }
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'PAYEE': 'Payée',
      'EN_PREPARATION': 'En préparation',
      'EXPEDIE': 'Expédiée',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }

  // TrackBy functions pour améliorer les performances
  trackByCommandeId(index: number, commande: Commande): number {
    return commande.idCommande;
  }

  trackByLigneId(index: number, ligne: any): number {
    return ligne.id || index;
  }

  Math = Math;
}
