// src/app/components/admin/produits/admin-produits.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { Produit, PagedResponse, Categorie, Marque } from '../../../models/interfaces';
import { environment } from "../../../../environments/environment";

@Component({
  selector: 'app-admin-produits',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p class="text-gray-600">Gérez votre catalogue de produits</p>
        </div>
        <button
          (click)="nouveauProduit()"
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          <lucide-icon name="plus" class="inline mr-2 h-4 w-4"></lucide-icon>
          Nouveau produit
        </button>
      </div>

      <!-- Filtres -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              [(ngModel)]="selectedCategorie"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes les catégories</option>
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
              <option value="">Toutes les marques</option>
              <option *ngFor="let marque of marques" [value]="marque.idMarque">
                {{ marque.nomMarque }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <select
              [(ngModel)]="stockFilter"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tous</option>
              <option value="disponible">En stock</option>
              <option value="rupture">Rupture de stock</option>
              <option value="faible">Stock faible</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <!-- Table des produits -->
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
              Prix
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
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
          <tr *ngFor="let produit of produits" class="hover:bg-gray-50">
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ produit.prix | currency:'XOF':'symbol':'1.0-0' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-900">{{ produit.stockDisponible }}</span>
                <button
                  (click)="editStock(produit)"
                  class="text-primary-600 hover:text-primary-800">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': produit.disponibilite && produit.stockDisponible > 5,
                        'bg-yellow-100 text-yellow-800': produit.disponibilite && produit.stockDisponible <= 5 && produit.stockDisponible > 0,
                        'bg-red-100 text-red-800': !produit.disponibilite || produit.stockDisponible === 0
                      }">
                  {{ getStockStatus(produit) }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button
                  (click)="voirDetails(produit)"
                  class="text-blue-600 hover:text-blue-800"
                  title="Voir détails">
                  <lucide-icon name="eye" class="h-4 w-4"></lucide-icon>
                </button>
                <button
                  (click)="editProduit(produit)"
                  class="text-primary-600 hover:text-primary-800"
                  title="Modifier">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button
                  (click)="deleteProduit(produit)"
                  class="text-red-600 hover:text-red-800"
                  title="Supprimer">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

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

      <!-- Message si aucun produit -->
      <div *ngIf="!loading && produits.length === 0" class="text-center py-12">
        <lucide-icon name="package" class="h-12 w-12 text-gray-400 mx-auto mb-4"></lucide-icon>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
        <p class="text-gray-500 mb-4">Commencez par ajouter votre premier produit.</p>
        <button
          (click)="nouveauProduit()"
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Nouveau produit
        </button>
      </div>

      <!-- Modal d'édition du stock -->
      <app-modal
        [isOpen]="showStockModal"
        [title]="'Modifier le stock'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="true"
        [closeOnEscape]="true"
        (closed)="closeStockModal()"
        size="md">

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Produit: {{ selectedProduit?.nomProduit }}
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nouvelle quantité
            </label>
            <input
              type="number"
              [(ngModel)]="newStock"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>

          <!-- Actions dans le contenu du modal -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              (click)="closeStockModal()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="button"
              (click)="saveStock()"
              [disabled]="newStock < 0"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </div>
      </app-modal>

      <!-- Modal de détails du produit -->
      <app-modal
        [isOpen]="showDetailsModal"
        [title]="'Détails du produit'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="true"
        [closeOnEscape]="true"
        (closed)="closeDetailsModal()"
        size="lg">

        <div *ngIf="selectedProduit" class="space-y-6">
          <!-- Images du produit -->
          <div *ngIf="selectedProduit.listeImages && selectedProduit.listeImages.length > 0">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Images</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <img
                *ngFor="let image of selectedProduit.listeImages"
                [src]="getImageUrl(image)"
                [alt]="selectedProduit.nomProduit"
                class="w-full h-32 object-cover rounded-lg border">
            </div>
          </div>

          <!-- Informations générales -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-3">Informations générales</h4>
              <dl class="space-y-2">
                <div>
                  <dt class="text-xs font-medium text-gray-500">Nom</dt>
                  <dd class="text-sm text-gray-900">{{ selectedProduit.nomProduit }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-500">Référence</dt>
                  <dd class="text-sm text-gray-900">{{ selectedProduit.refProduit || 'Non définie' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-500">Prix</dt>
                  <dd class="text-sm text-gray-900">{{ selectedProduit.prix | currency:'XOF':'symbol':'1.0-0' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-500">Stock</dt>
                  <dd class="text-sm text-gray-900">{{ selectedProduit.stockDisponible }} unités</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-500">Statut</dt>
                  <dd class="text-sm">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    [ngClass]="{
                      'bg-green-100 text-green-800': selectedProduit.disponibilite && selectedProduit.stockDisponible > 5,
                      'bg-yellow-100 text-yellow-800': selectedProduit.disponibilite && selectedProduit.stockDisponible <= 5 && selectedProduit.stockDisponible > 0,
                      'bg-red-100 text-red-800': !selectedProduit.disponibilite || selectedProduit.stockDisponible === 0
                    }">
                {{ getStockStatus(selectedProduit) }}
              </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-3">Catégories</h4>
              <dl class="space-y-2">
                <div>
                  <dt class="text-xs font-medium text-gray-500">Catégorie</dt>
                  <dd class="text-sm text-gray-900">{{ selectedProduit.categorie?.nomCategorie || 'Non définie' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-500">Marque</dt>
                  <dd class="text-sm text-gray-900">{{ selectedProduit.marque?.nomMarque || 'Non définie' }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Description -->
          <div *ngIf="selectedProduit.descriptionProduit">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Description</h4>
            <p class="text-sm text-gray-700">{{ selectedProduit.descriptionProduit }}</p>
          </div>

          <!-- Caractéristiques techniques -->
          <div *ngIf="selectedProduit.puissanceBTU || selectedProduit.consommationWatt || selectedProduit.labelEnergie || selectedProduit.dimensions || selectedProduit.poids || selectedProduit.garantie">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Caractéristiques techniques</h4>
            <dl class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngIf="selectedProduit.puissanceBTU">
                <dt class="text-xs font-medium text-gray-500">Puissance</dt>
                <dd class="text-sm text-gray-900">{{ selectedProduit.puissanceBTU }} BTU</dd>
              </div>
              <div *ngIf="selectedProduit.consommationWatt">
                <dt class="text-xs font-medium text-gray-500">Consommation</dt>
                <dd class="text-sm text-gray-900">{{ selectedProduit.consommationWatt }} W</dd>
              </div>
              <div *ngIf="selectedProduit.labelEnergie">
                <dt class="text-xs font-medium text-gray-500">Label énergétique</dt>
              </div>
              <div *ngIf="selectedProduit.dimensions">
                <dt class="text-xs font-medium text-gray-500">Dimensions</dt>
                <dd class="text-sm text-gray-900">{{ selectedProduit.dimensions }}</dd>
              </div>
              <div *ngIf="selectedProduit.poids">
                <dt class="text-xs font-medium text-gray-500">Poids</dt>
                <dd class="text-sm text-gray-900">{{ selectedProduit.poids }} kg</dd>
              </div>
              <div *ngIf="selectedProduit.garantie">
                <dt class="text-xs font-medium text-gray-500">Garantie</dt>
                <dd class="text-sm text-gray-900">{{ selectedProduit.garantie }}</dd>
              </div>
            </dl>
          </div>

          <!-- Actions dans le modal -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              (click)="closeDetailsModal()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Fermer
            </button>
            <button
              type="button"
              (click)="editProduit(selectedProduit!)"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              <lucide-icon name="edit" class="inline mr-2 h-4 w-4"></lucide-icon>
              Modifier
            </button>
          </div>
        </div>
      </app-modal>

    </div>
  `
})
export class AdminProduitsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  produits: Produit[] = [];
  categories: Categorie[] = [];
  marques: Marque[] = [];

  loading = false;
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  searchTerm = '';
  selectedCategorie = '';
  selectedMarque = '';
  stockFilter = '';

  showStockModal = false;
  showDetailsModal = false;
  selectedProduit: Produit | null = null;
  newStock = 0;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private adminService: AdminService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('AdminProduitsComponent initialisé');
    this.loadCategories();
    this.loadMarques();
    this.loadProduits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          console.log('Catégories chargées:', categories);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des catégories:', error);
        }
      });
  }

  private loadMarques(): void {
    this.apiService.getMarques()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (marques) => {
          this.marques = marques;
          console.log('Marques chargées:', marques);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des marques:', error);
        }
      });
  }

  private loadProduits(): void {
    this.loading = true;
    console.log('Chargement des produits...');

    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.selectedCategorie) filters.categorieId = parseInt(this.selectedCategorie);
    if (this.selectedMarque) filters.marqueId = parseInt(this.selectedMarque);
    if (this.stockFilter) filters.stockFilter = this.stockFilter;

    this.adminService.getAllProduitsAdmin(this.currentPage, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PagedResponse<Produit>) => {
          this.produits = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.loading = false;
          console.log('Produits chargés:', response);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.toastService.error('Erreur', 'Impossible de charger les produits');
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadProduits();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadProduits();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProduits();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProduits();
    }
  }

  nouveauProduit(): void {
    console.log('Navigation vers nouveau produit');
    this.router.navigate(['/admin/produits/nouveau']);
  }

  voirDetails(produit: Produit): void {
    console.log('Voir détails du produit:', produit);
    this.selectedProduit = produit;
    this.showDetailsModal = true;
  }

  editProduit(produit: Produit): void {
    console.log('Édition du produit:', produit);
    this.router.navigate(['/admin/produits', produit.idProduit, 'edit']);
  }

  editStock(produit: Produit): void {
    console.log('Édition du stock du produit:', produit);
    this.selectedProduit = produit;
    this.newStock = produit.stockDisponible;
    this.showStockModal = true;
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.selectedProduit = null;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedProduit = null;
  }

  saveStock(): void {
    if (this.selectedProduit && this.newStock >= 0) {
      console.log('Mise à jour du stock:', this.selectedProduit.idProduit, this.newStock);

      this.adminService.updateStock(this.selectedProduit.idProduit, this.newStock)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Stock mis à jour avec succès');
            this.toastService.success('Succès', 'Stock mis à jour');
            this.closeStockModal();
            this.loadProduits();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour du stock:', error);
            this.toastService.error('Erreur', 'Impossible de mettre à jour le stock');
          }
        });
    }
  }

  deleteProduit(produit: Produit): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${produit.nomProduit}" ?`)) {
      console.log('Suppression du produit:', produit);

      this.adminService.deleteProduit(produit.idProduit)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Produit supprimé avec succès');
            this.toastService.success('Succès', 'Produit supprimé');
            this.loadProduits();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.toastService.error('Erreur', 'Impossible de supprimer le produit');
          }
        });
    }
  }

  getProduitImage(produit: Produit): string {
    if (produit.listeImages && produit.listeImages.length > 0) {
      const imagePath = produit.listeImages[0];
      console.log('🖼️  Chemin image DB:', imagePath);

      if (imagePath.startsWith('http')) {
        return imagePath;
      }

      // CORRECTION: Utiliser l'URL correcte sans /api
      const imageUrl = `http://localhost:8080/uploads/${imagePath}`;
      console.log('🔗 URL construite:', imageUrl);
      return imageUrl;
    }
    return '/assets/images/placeholder-product.jpg';
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '/assets/images/placeholder.jpg';

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // CORRECTION: URL directe vers le serveur Spring Boot
    return `http://localhost:8080/uploads/${imagePath}`;
  }

  getStockStatus(produit: Produit): string {
    if (!produit.disponibilite || produit.stockDisponible === 0) {
      return 'Rupture';
    } else if (produit.stockDisponible <= 5) {
      return 'Stock faible';
    } else {
      return 'En stock';
    }
  }
}
