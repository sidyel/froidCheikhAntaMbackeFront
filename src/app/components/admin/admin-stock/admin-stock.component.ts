// src/app/components/admin/stock/admin-stock.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Produit, Categorie, Marque } from '../../../models/interfaces';
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-admin-stock',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion du Stock</h1>
          <p class="text-gray-600">Surveillez et gérez les niveaux de stock</p>
        </div>
        <div class="flex space-x-3">
          <button
            (click)="exporterStock()"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            <lucide-icon name="download" class="inline mr-2 h-4 w-4"></lucide-icon>
            Exporter
          </button>
          <button
            (click)="envoyerAlertes()"
            class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            <lucide-icon name="bell" class="inline mr-2 h-4 w-4"></lucide-icon>
            Alertes
          </button>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <lucide-icon name="check-circle" class="h-5 w-5 text-green-600"></lucide-icon>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">En stock</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stockStats.enStock }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <lucide-icon name="alert-triangle" class="h-5 w-5 text-yellow-600"></lucide-icon>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Stock faible</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stockStats.stockFaible }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <lucide-icon name="x-circle" class="h-5 w-5 text-red-600"></lucide-icon>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Rupture</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stockStats.rupture }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <lucide-icon name="package" class="h-5 w-5 text-blue-600"></lucide-icon>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total produits</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stockStats.total }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              placeholder="Nom du produit..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Niveau de stock</label>
            <select
              [(ngModel)]="stockFilter"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tous</option>
              <option value="rupture">Rupture (0)</option>
              <option value="faible">Stock faible (≤ 5)</option>
              <option value="moyen">Stock moyen (6-20)</option>
              <option value="bon">Stock suffisant (> 20)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              [(ngModel)]="selectedCategorie"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes</option>
              <option *ngFor="let cat of categories" [value]="cat.idCategorie">
                {{ cat.nomCategorie }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Marque</label>
            <select
              [(ngModel)]="selectedMarque"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes</option>
              <option *ngFor="let marque of marques" [value]="marque.idMarque">
                {{ marque.nomMarque }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
            <input
              type="number"
              [(ngModel)]="seuilAlerte"
              (change)="onFilterChange()"
              min="0"
              max="50"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <!-- Table des stocks -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock actuel
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valeur stock
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let produit of filteredProduits" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <img
                      [src]="getProduitImage(produit)"
                      [alt]="produit.nomProduit"
                      class="h-10 w-10 rounded-lg object-cover">
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ produit.nomProduit }}
                    </div>
                    <div class="text-sm text-gray-500">
                      Réf: {{ produit.refProduit }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ produit.categorie?.nomCategorie || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-3">
                  <span class="text-sm font-medium text-gray-900">{{ produit.stockDisponible }}</span>
                  <button
                    (click)="ajusterStock(produit)"
                    class="text-primary-600 hover:text-primary-800"
                    title="Ajuster le stock">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      [ngClass]="{
                        'bg-red-100 text-red-800': produit.stockDisponible === 0,
                        'bg-yellow-100 text-yellow-800': produit.stockDisponible > 0 && produit.stockDisponible <= seuilAlerte,
                        'bg-orange-100 text-orange-800': produit.stockDisponible > seuilAlerte && produit.stockDisponible <= 20,
                        'bg-green-100 text-green-800': produit.stockDisponible > 20
                      }">
                  {{ getStockStatus(produit) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ (produit.stockDisponible * produit.prix) | currency:'XOF':'symbol':'1.0-0' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    (click)="ajusterStock(produit)"
                    class="text-primary-600 hover:text-primary-800"
                    title="Ajuster stock">
                    <lucide-icon name="package" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button
                    (click)="voirHistorique(produit)"
                    class="text-gray-600 hover:text-gray-800"
                    title="Historique">
                    <lucide-icon name="clock" class="h-4 w-4"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Message si aucun produit -->
        <div *ngIf="filteredProduits.length === 0" class="text-center py-12">
          <lucide-icon name="package" class="h-12 w-12 text-gray-400 mx-auto mb-4"></lucide-icon>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
          <p class="text-gray-500">Aucun produit ne correspond à vos critères de recherche.</p>
        </div>
      </div>

      <!-- Modal ajustement stock -->
      <app-modal
        *ngIf="showStockModal && selectedProduit"
        title="Ajuster le stock"
        (closed)="closeStockModal()"
        (confirmed)="saveStockAdjustment()">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Produit: {{ selectedProduit.nomProduit }}
            </label>
            <p class="text-sm text-gray-500">Stock actuel: {{ selectedProduit.stockDisponible }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Type d'ajustement
            </label>
            <select
              [(ngModel)]="adjustmentType"
              (change)="onAdjustmentTypeChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="set">Définir une quantité exacte</option>
              <option value="add">Ajouter au stock existant</option>
              <option value="remove">Retirer du stock existant</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ getQuantityLabel() }}
            </label>
            <input
              type="number"
              [(ngModel)]="adjustmentQuantity"
              [min]="getMinQuantity()"
              (input)="calculateNewStock()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>

          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-700">
              <span class="font-medium">Nouveau stock:</span> {{ newStockQuantity }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Motif (optionnel)
            </label>
            <textarea
              [(ngModel)]="adjustmentReason"
              rows="2"
              placeholder="Raison de l'ajustement..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
        </div>
      </app-modal>

      <!-- Modal historique (placeholder) -->
      <app-modal
        *ngIf="showHistoriqueModal"
        title="Historique du stock"
        (close)="closeHistoriqueModal()"
        size="lg">
        <div class="text-center py-8">
          <lucide-icon name="clock" class="h-12 w-12 text-gray-400 mx-auto mb-4"></lucide-icon>
          <p class="text-gray-500">Fonctionnalité d'historique à implémenter</p>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminStockComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  categories: Categorie[] = [];
  marques: Marque[] = [];

  loading = false;
  searchTerm = '';
  stockFilter = '';
  selectedCategorie = '';
  selectedMarque = '';
  seuilAlerte = 5;

  stockStats = {
    total: 0,
    enStock: 0,
    stockFaible: 0,
    rupture: 0
  };

  // Modal ajustement stock
  showStockModal = false;
  selectedProduit: Produit | null = null;
  adjustmentType = 'set';
  adjustmentQuantity = 0;
  adjustmentReason = '';
  newStockQuantity = 0;

  // Modal historique
  showHistoriqueModal = false;

  constructor(
    private apiService: ApiService,
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;

    // Charger toutes les données nécessaires
    Promise.all([
      this.apiService.getProduits({ size: 1000 }).toPromise(),
      this.apiService.getCategories().toPromise(),
      this.apiService.getMarques().toPromise()
    ]).then(([produitsResponse, categories, marques]) => {
      this.produits = produitsResponse?.content || [];
      this.categories = categories || [];
      this.marques = marques || [];

      this.calculateStats();
      this.filterProduits();
      this.loading = false;
    }).catch(error => {
      console.error('Erreur lors du chargement des données:', error);
      this.toastService.error('Erreur', 'Impossible de charger les données');
      this.loading = false;
    });
  }

  private calculateStats(): void {
    this.stockStats.total = this.produits.length;
    this.stockStats.enStock = this.produits.filter(p => p.stockDisponible > this.seuilAlerte).length;
    this.stockStats.stockFaible = this.produits.filter(p => p.stockDisponible > 0 && p.stockDisponible <= this.seuilAlerte).length;
    this.stockStats.rupture = this.produits.filter(p => p.stockDisponible === 0).length;
  }

  onSearch(): void {
    this.filterProduits();
  }

  onFilterChange(): void {
    this.calculateStats();
    this.filterProduits();
  }

  private filterProduits(): void {
    let filtered = [...this.produits];

    // Filtrer par recherche
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(produit =>
        produit.nomProduit.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (produit.refProduit && produit.refProduit.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filtrer par niveau de stock
    if (this.stockFilter) {
      switch (this.stockFilter) {
        case 'rupture':
          filtered = filtered.filter(p => p.stockDisponible === 0);
          break;
        case 'faible':
          filtered = filtered.filter(p => p.stockDisponible > 0 && p.stockDisponible <= this.seuilAlerte);
          break;
        case 'moyen':
          filtered = filtered.filter(p => p.stockDisponible > this.seuilAlerte && p.stockDisponible <= 20);
          break;
        case 'bon':
          filtered = filtered.filter(p => p.stockDisponible > 20);
          break;
      }
    }

    // Filtrer par catégorie
    if (this.selectedCategorie) {
      filtered = filtered.filter(p => p.categorie?.idCategorie === parseInt(this.selectedCategorie));
    }

    // Filtrer par marque
    if (this.selectedMarque) {
      filtered = filtered.filter(p => p.marque?.idMarque === parseInt(this.selectedMarque));
    }

    this.filteredProduits = filtered;
  }

  ajusterStock(produit: Produit): void {
    this.selectedProduit = produit;
    this.adjustmentType = 'set';
    this.adjustmentQuantity = produit.stockDisponible;
    this.adjustmentReason = '';
    this.newStockQuantity = produit.stockDisponible;
    this.showStockModal = true;
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.selectedProduit = null;
  }

  onAdjustmentTypeChange(): void {
    if (this.selectedProduit) {
      switch (this.adjustmentType) {
        case 'set':
          this.adjustmentQuantity = this.selectedProduit.stockDisponible;
          break;
        case 'add':
        case 'remove':
          this.adjustmentQuantity = 0;
          break;
      }
      this.calculateNewStock();
    }
  }

  calculateNewStock(): void {
    if (!this.selectedProduit) return;

    switch (this.adjustmentType) {
      case 'set':
        this.newStockQuantity = this.adjustmentQuantity;
        break;
      case 'add':
        this.newStockQuantity = this.selectedProduit.stockDisponible + this.adjustmentQuantity;
        break;
      case 'remove':
        this.newStockQuantity = Math.max(0, this.selectedProduit.stockDisponible - this.adjustmentQuantity);
        break;
    }
  }

  getQuantityLabel(): string {
    switch (this.adjustmentType) {
      case 'set': return 'Nouvelle quantité';
      case 'add': return 'Quantité à ajouter';
      case 'remove': return 'Quantité à retirer';
      default: return 'Quantité';
    }
  }

  getMinQuantity(): number {
    return this.adjustmentType === 'remove' ? 0 : 0;
  }

  saveStockAdjustment(): void {
    if (this.selectedProduit && this.newStockQuantity >= 0) {
      this.adminService.updateStock(this.selectedProduit.idProduit, this.newStockQuantity)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Succès', 'Stock mis à jour');
            this.closeStockModal();
            this.loadData();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour du stock:', error);
            this.toastService.error('Erreur', 'Impossible de mettre à jour le stock');
          }
        });
    }
  }

  voirHistorique(produit: Produit): void {
    this.selectedProduit = produit;
    this.showHistoriqueModal = true;
  }

  closeHistoriqueModal(): void {
    this.showHistoriqueModal = false;
    this.selectedProduit = null;
  }

  exporterStock(): void {
    // Implémentation de l'export (CSV, Excel, etc.)
    this.toastService.info('Export', 'Fonctionnalité d\'export en développement');
  }

  envoyerAlertes(): void {
    this.adminService.getProduitsStockFaible(this.seuilAlerte)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits) => {
          if (produits.length > 0) {
            this.toastService.warning('Alertes stock', `${produits.length} produit(s) en stock faible`);
          } else {
            this.toastService.success('Stock', 'Tous les stocks sont suffisants');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la vérification des stocks:', error);
          this.toastService.error('Erreur', 'Impossible de vérifier les stocks');
        }
      });
  }

  getProduitImage(produit: Produit): string {
    return produit.listeImages && produit.listeImages.length > 0
      ? `${environment.apiUrl}/uploads/${produit.listeImages[0]}`
      : 'assets/images/placeholder-product.jpg';
  }

  getStockStatus(produit: Produit): string {
    if (produit.stockDisponible === 0) {
      return 'Rupture';
    } else if (produit.stockDisponible <= this.seuilAlerte) {
      return 'Stock faible';
    } else if (produit.stockDisponible <= 20) {
      return 'Stock moyen';
    } else {
      return 'Stock suffisant';
    }
  }
}
