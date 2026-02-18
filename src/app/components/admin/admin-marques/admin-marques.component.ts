// src/app/components/admin/marques/admin-marques.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Marque } from '../../../models/interfaces';
import { environment } from '../../../../environments/environment';
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-admin-marques',
  template: `
    <div class="space-y-6">
      <!-- Header avec bouton d'ajout -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Marques</h1>
          <p class="text-gray-600 mt-1">Gérez les marques de votre catalogue produits</p>
        </div>
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <button
            (click)="toggleView()"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <lucide-icon [name]="viewMode === 'grid' ? 'list' : 'grid'" class="mr-2 h-4 w-4"></lucide-icon>
            {{ viewMode === 'grid' ? 'Vue liste' : 'Vue grille' }}
          </button>
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <lucide-icon name="plus" class="mr-2 h-4 w-4"></lucide-icon>
            Nouvelle marque
          </button>
        </div>
      </div>

      <!-- Debug info (à supprimer en production) -->


      <!-- Barre de recherche et filtres -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange()"
                placeholder="Rechercher une marque..."
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <lucide-icon name="search" class="absolute left-3 top-3 h-4 w-4 text-gray-400"></lucide-icon>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filtrer par</label>
            <select
              [(ngModel)]="filterBy"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">Toutes les marques</option>
              <option value="with-products">Avec produits</option>
              <option value="without-products">Sans produits</option>
              <option value="with-logo">Avec logo</option>
              <option value="without-logo">Sans logo</option>
            </select>
          </div>
        </div>

        <!-- Statistiques rapides -->
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">{{ marques.length }}</div>
            <div class="text-sm text-gray-500">Total marques</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ getMarquesWithProducts() }}</div>
            <div class="text-sm text-gray-500">Avec produits</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ getMarquesWithLogo() }}</div>
            <div class="text-sm text-gray-500">Avec logo</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-600">{{ getTotalProducts() }}</div>
            <div class="text-sm text-gray-500">Total produits</div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span class="ml-2">Chargement des marques...</span>
      </div>

      <!-- Vue grille -->
      <div *ngIf="!loading && viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let marque of filteredMarques; trackBy: trackByMarqueId"
             class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div class="p-6">
            <!-- Logo -->
            <div class="flex justify-center mb-4">
              <div class="h-16 w-16 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-gray-200">
                <img
                  *ngIf="marque.logo"
                  [src]="getImageUrl(marque.logo)"
                  [alt]="marque.nomMarque"
                  class="h-14 w-14 object-contain rounded-md"
                  (error)="onImageError($event)">
                <lucide-icon
                  *ngIf="!marque.logo"
                  name="tag"
                  class="h-8 w-8 text-gray-400"></lucide-icon>
              </div>
            </div>

            <!-- Informations -->
            <div class="text-center">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ marque.nomMarque }}</h3>
              <p class="text-sm text-gray-600 mb-3 min-h-[40px]" *ngIf="marque.description">
                {{ marque.description.length > 80 ? (marque.description.substring(0, 80) + '...') : marque.description }}
              </p>
              <p class="text-sm text-gray-400 mb-3" *ngIf="!marque.description">
                Aucune description
              </p>

              <!-- Badge produits -->
              <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4"
                   [ngClass]="{
                     'bg-green-100 text-green-800': marque.nombreProduits && marque.nombreProduits > 0,
                     'bg-gray-100 text-gray-600': !marque.nombreProduits || marque.nombreProduits === 0
                   }">
                <lucide-icon name="package" class="mr-1 h-3 w-3"></lucide-icon>
                {{ marque.nombreProduits || 0 }} produit{{ (marque.nombreProduits || 0) !== 1 ? 's' : '' }}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-center space-x-2 pt-4 border-t border-gray-100">
              <button
                (click)="viewMarque(marque)"
                class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="Voir détails">
                <lucide-icon name="eye" class="h-4 w-4"></lucide-icon>
              </button>
              <button
                (click)="openEditModal(marque)"
                class="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                title="Modifier">
                <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
              </button>
              <button
                (click)="deleteMarque(marque)"
                class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
                [disabled]="marque.nombreProduits && marque.nombreProduits > 0">
                <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Card pour ajouter une nouvelle marque -->
        <div class="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-primary-300 transition-colors">
          <button
            (click)="openCreateModal()"
            class="w-full h-full p-6 flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 transition-colors min-h-[280px]">
            <lucide-icon name="plus" class="h-12 w-12 mb-2"></lucide-icon>
            <span class="text-sm font-medium">Ajouter une marque</span>
          </button>
        </div>
      </div>

      <!-- Vue tableau -->
      <div *ngIf="!loading && viewMode === 'table'" class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Marque
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Produits
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr *ngFor="let marque of filteredMarques; trackBy: trackByMarqueId" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="h-10 w-10 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center mr-4">
                  <img
                    *ngIf="marque.logo"
                    [src]="getImageUrl(marque.logo)"
                    [alt]="marque.nomMarque"
                    class="h-8 w-8 object-contain rounded-md"
                    (error)="onImageError($event)">
                  <lucide-icon
                    *ngIf="!marque.logo"
                    name="tag"
                    class="h-5 w-5 text-gray-400"></lucide-icon>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ marque.nomMarque }}</div>
                  <div class="text-sm text-gray-500">ID: {{ marque.idMarque }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 max-w-xs truncate">
                {{ marque.description || 'Aucune description' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-green-100 text-green-800': marque.nombreProduits && marque.nombreProduits > 0,
                        'bg-gray-100 text-gray-600': !marque.nombreProduits || marque.nombreProduits === 0
                      }">
                  {{ marque.nombreProduits || 0 }} produit{{ (marque.nombreProduits || 0) !== 1 ? 's' : '' }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button
                  (click)="viewMarque(marque)"
                  class="text-blue-600 hover:text-blue-800"
                  title="Voir détails">
                  <lucide-icon name="eye" class="h-4 w-4"></lucide-icon>
                </button>
                <button
                  (click)="openEditModal(marque)"
                  class="text-primary-600 hover:text-primary-800"
                  title="Modifier">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button
                  (click)="deleteMarque(marque)"
                  class="text-red-600 hover:text-red-800"
                  title="Supprimer"
                  [disabled]="marque.nombreProduits && marque.nombreProduits > 0">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Message si aucune marque -->
      <div *ngIf="!loading && filteredMarques.length === 0"
           class="text-center py-12 bg-white rounded-lg shadow">
        <lucide-icon name="tag" class="mx-auto h-12 w-12 text-gray-400"></lucide-icon>
        <h3 class="mt-4 text-lg font-medium text-gray-900">
          {{ searchTerm || filterBy !== 'all' ? 'Aucune marque trouvée' : 'Aucune marque' }}
        </h3>
        <p class="mt-2 text-gray-500">
          {{ searchTerm || filterBy !== 'all' ? 'Aucune marque ne correspond à votre recherche.' : 'Commencez par ajouter votre première marque.' }}
        </p>
        <button
          *ngIf="!searchTerm && filterBy === 'all'"
          (click)="openCreateModal()"
          class="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700">
          <lucide-icon name="plus" class="mr-2 h-4 w-4"></lucide-icon>
          Ajouter une marque
        </button>
      </div>

      <!-- Modal création/modification -->
      <app-modal
        [isOpen]="showFormModal"
        [title]="isEditMode ? 'Modifier la marque' : 'Nouvelle marque'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="true"
        [closeOnEscape]="true"
        (closed)="closeFormModal()"
        size="lg">

        <form [formGroup]="marqueForm" (ngSubmit)="onSubmit()" *ngIf="marqueForm">
          <div class="space-y-6">
            <!-- Nom de la marque -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom de la marque <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="nomMarque"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                [class.border-red-300]="marqueForm.get('nomMarque')?.invalid && marqueForm.get('nomMarque')?.touched"
                placeholder="Ex: Samsung, LG, Daikin...">
              <div *ngIf="marqueForm.get('nomMarque')?.invalid && marqueForm.get('nomMarque')?.touched"
                   class="mt-1 text-sm text-red-600">
                <div *ngIf="marqueForm.get('nomMarque')?.errors?.['required']">
                  Le nom de la marque est obligatoire
                </div>
                <div *ngIf="marqueForm.get('nomMarque')?.errors?.['minlength']">
                  Le nom doit contenir au moins 2 caractères
                </div>
                <div *ngIf="marqueForm.get('nomMarque')?.errors?.['maxlength']">
                  Le nom ne peut pas dépasser 100 caractères
                </div>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                formControlName="description"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Description de la marque, son histoire, ses spécialités..."></textarea>
              <div class="mt-1 text-sm text-gray-500">
                {{ marqueForm.get('description')?.value?.length || 0 }}/500 caractères
              </div>
            </div>

            <!-- Upload logo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Logo de la marque</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div class="space-y-1 text-center">
                  <!-- Prévisualisation du logo -->
                  <div *ngIf="logoPreview" class="mb-4">
                    <img [src]="logoPreview" alt="Aperçu logo" class="mx-auto h-32 w-32 object-contain">
                  </div>

                  <!-- Zone de drop -->
                  <div *ngIf="!logoPreview">
                    <lucide-icon name="upload" class="mx-auto h-12 w-12 text-gray-400"></lucide-icon>
                  </div>

                  <div class="flex text-sm text-gray-600">
                    <label for="logo-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>{{ logoPreview ? 'Changer le logo' : 'Télécharger un logo' }}</span>
                      <input
                        id="logo-upload"
                        name="logo-upload"
                        type="file"
                        class="sr-only"
                        accept="image/*"
                        (change)="onLogoSelected($event)">
                    </label>
                    <p class="pl-1">ou glisser-déposer</p>
                  </div>
                  <p class="text-xs text-gray-500">
                    PNG, JPG, SVG jusqu'à 5MB
                  </p>

                  <!-- Bouton de suppression -->
                  <button
                    *ngIf="logoPreview"
                    type="button"
                    (click)="removeLogo()"
                    class="mt-2 text-sm text-red-600 hover:text-red-800">
                    <lucide-icon name="trash-2" class="inline h-4 w-4 mr-1"></lucide-icon>
                    Supprimer le logo
                  </button>
                </div>
              </div>
            </div>

            <!-- Informations supplémentaires -->
            <div *ngIf="isEditMode && selectedMarque" class="bg-gray-50 p-4 rounded-md">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Informations</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">ID:</span>
                  <span class="ml-2 font-medium">{{ selectedMarque.idMarque }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Produits:</span>
                  <span class="ml-2 font-medium">{{ selectedMarque.nombreProduits || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CORRECTION: Boutons à l'intérieur du formulaire -->
          <div class="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              (click)="closeFormModal()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="marqueForm.invalid || submitting"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
        <span *ngIf="submitting" class="inline-flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {{ isEditMode ? 'Modification...' : 'Création...' }}
        </span>
              <span *ngIf="!submitting">
          {{ isEditMode ? 'Modifier' : 'Créer' }}
        </span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- AUTRE CORRECTION: Le modal de détails avec un commentaire corrigé -->
      <app-modal
        [isOpen]="showDetailsModal"
        [title]="'Détails de la marque'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="true"
        [closeOnEscape]="true"
        (closed)="closeDetailsModal()"
        size="lg">

        <div class="space-y-6" *ngIf="selectedMarque">
          <!-- Header avec logo et nom -->
          <div class="flex items-center space-x-4">
            <div class="h-16 w-16 bg-gray-50 rounded-lg flex items-center justify-center">
              <img
                *ngIf="selectedMarque.logo"
                [src]="getImageUrl(selectedMarque.logo)"
                [alt]="selectedMarque.nomMarque"
                class="h-14 w-14 object-contain rounded-md">
              <lucide-icon
                *ngIf="!selectedMarque.logo"
                name="tag"
                class="h-8 w-8 text-gray-400"></lucide-icon>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">{{ selectedMarque.nomMarque }}</h3>
              <p class="text-sm text-gray-500">ID: {{ selectedMarque.idMarque }}</p>
            </div>
          </div>

          <!-- Description -->
          <div *ngIf="selectedMarque.description">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Description</h4>
            <p class="text-gray-700">{{ selectedMarque.description }}</p>
          </div>

          <!-- Statistiques -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">Statistiques</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-600">{{ selectedMarque.nombreProduits || 0 }}</div>
                <div class="text-sm text-blue-700">Produits</div>
              </div>
            </div>
          </div>

          <!-- Actions directement dans le contenu -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              (click)="openEditModal(selectedMarque!)"
              class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700">
              <lucide-icon name="edit" class="mr-2 h-4 w-4"></lucide-icon>
              Modifier
            </button>
          </div>
        </div>
      </app-modal>
    </div>

    <!-- Toast Container -->
  `
})
export class AdminMarquesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Debug mode (à supprimer en production)
  debugMode = !environment.production;

  // Données
  marques: Marque[] = [];
  filteredMarques: Marque[] = [];
  loading = false;
  submitting = false;

  // Filtres et recherche
  searchTerm = '';
  filterBy = 'all';
  viewMode: 'grid' | 'table' = 'grid';

  // Modals
  showFormModal = false;
  showDetailsModal = false;
  isEditMode = false;
  selectedMarque: Marque | null = null;

  // Formulaire
  marqueForm!: FormGroup;
  logoPreview: string | null = null;
  selectedLogo: File | null = null;

  constructor(
    private apiService: ApiService,
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    console.log('AdminMarquesComponent: ngOnInit');
    this.initForm();
    this.setupSearch();
    this.loadMarques();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCreateModal(): void {
    console.log('AdminMarquesComponent: openCreateModal');
    this.isEditMode = false;
    this.selectedMarque = null;
    this.resetForm();
    this.showFormModal = true;
    console.log('showFormModal set to:', this.showFormModal);
  }

  private initForm(): void {
    console.log('AdminMarquesComponent: initForm');
    this.marqueForm = this.fb.group({
      nomMarque: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      description: ['', [Validators.maxLength(500)]]
    });

    console.log('Form initialized:', this.marqueForm);
  }

  private setupSearch(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  private loadMarques(): void {
    console.log('AdminMarquesComponent: loadMarques');
    this.loading = true;

    // Utiliser ApiService au lieu de AdminService pour commencer
    this.apiService.getMarques()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (marques) => {
          console.log('Marques loaded:', marques);
          this.marques = marques;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des marques:', error);
          this.toastService.error('Erreur', 'Impossible de charger les marques');
          this.loading = false;
        }
      });
  }

  onSearchChange(): void {
    this.searchSubject$.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.marques];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(marque =>
        marque.nomMarque.toLowerCase().includes(term) ||
        (marque.description && marque.description.toLowerCase().includes(term))
      );
    }

    // Filtre par catégorie
    switch (this.filterBy) {
      case 'with-products':
        filtered = filtered.filter(marque => marque.nombreProduits && marque.nombreProduits > 0);
        break;
      case 'without-products':
        filtered = filtered.filter(marque => !marque.nombreProduits || marque.nombreProduits === 0);
        break;
      case 'with-logo':
        filtered = filtered.filter(marque => marque.logo);
        break;
      case 'without-logo':
        filtered = filtered.filter(marque => !marque.logo);
        break;
    }

    this.filteredMarques = filtered;
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  trackByMarqueId(index: number, marque: Marque): number {
    return marque.idMarque;
  }

  // Statistiques
  getMarquesWithProducts(): number {
    return this.marques.filter(m => m.nombreProduits && m.nombreProduits > 0).length;
  }

  getMarquesWithLogo(): number {
    return this.marques.filter(m => m.logo).length;
  }

  getTotalProducts(): number {
    return this.marques.reduce((total, marque) => total + (marque.nombreProduits || 0), 0);
  }

  // Modals


  openEditModal(marque: Marque): void {
    console.log('AdminMarquesComponent: openEditModal', marque);
    this.isEditMode = true;
    this.selectedMarque = marque;

    if (this.marqueForm) {
      this.marqueForm.patchValue({
        nomMarque: marque.nomMarque,
        description: marque.description || ''
      });

      if (marque.logo) {
        this.logoPreview = this.getImageUrl(marque.logo);
      }
    }

    this.showFormModal = true;
    this.showDetailsModal = false;
    console.log('showFormModal set to:', this.showFormModal, 'isEditMode:', this.isEditMode);
  }

  closeFormModal(): void {
    console.log('AdminMarquesComponent: closeFormModal');
    this.showFormModal = false;
    this.resetForm();
  }

  viewMarque(marque: Marque): void {
    console.log('AdminMarquesComponent: viewMarque', marque);
    this.selectedMarque = marque;
    this.showDetailsModal = true;
    console.log('showDetailsModal set to:', this.showDetailsModal);
  }

  closeDetailsModal(): void {
    console.log('AdminMarquesComponent: closeDetailsModal');
    this.showDetailsModal = false;
    this.selectedMarque = null;
  }

  private resetForm(): void {
    if (this.marqueForm) {
      this.marqueForm.reset();
    }
    this.logoPreview = null;
    this.selectedLogo = null;
  }

  // Gestion du logo
  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Erreur', 'Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.toastService.error('Erreur', 'Le fichier ne doit pas dépasser 5MB');
      return;
    }

    this.selectedLogo = file;

    // Générer la prévisualisation
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview = null;
    this.selectedLogo = null;
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // CRUD Operations
  onSubmit(): void {
    console.log('AdminMarquesComponent: onSubmit', {
      formValid: this.marqueForm?.valid,
      formValue: this.marqueForm?.value,
      formErrors: this.marqueForm?.errors
    });

    if (!this.marqueForm || !this.marqueForm.valid) {
      console.log('Form is invalid:', this.marqueForm?.errors);
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.marqueForm?.controls || {}).forEach(key => {
        this.marqueForm.get(key)?.markAsTouched();
      });
      this.toastService.error('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.submitting = true;
    const formData = this.marqueForm.value;

    const marqueData: Partial<Marque> = {
      nomMarque: formData.nomMarque.trim(),
      description: formData.description ? formData.description.trim() : ''
    };

    console.log('Submitting marque data:', marqueData);

    const operation$ = this.isEditMode && this.selectedMarque ?
      this.apiService.updateMarque(this.selectedMarque.idMarque, marqueData) :
      this.apiService.createMarque(marqueData);

    operation$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (marque) => {
          console.log('Marque saved successfully:', marque);
          // Upload du logo si sélectionné
          if (this.selectedLogo) {
            this.uploadLogo(marque.idMarque);
          } else {
            this.completeOperation();
          }
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          const action = this.isEditMode ? 'modification' : 'création';
          this.toastService.error('Erreur', `Erreur lors de la ${action} de la marque`);
          this.submitting = false;
        }
      });
  }


  private uploadLogo(marqueId: number): void {
    if (!this.selectedLogo) {
      this.completeOperation();
      return;
    }

    // Utiliser ApiService au lieu d'AdminService
    this.apiService.uploadMarqueLogo(marqueId, this.selectedLogo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Logo uploadé avec succès:', response);
          this.completeOperation();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de l\'upload du logo:', error);

          // Gérer le cas où le serveur retourne du texte au lieu de JSON
          if (error.status === 200 && error.error?.text) {
            console.log('Upload réussi malgré l\'erreur de parsing:', error.error.text);
            // Le fichier a été uploadé avec succès
            this.completeOperation();
          } else {
            this.toastService.warning('Attention', 'Marque sauvegardée mais erreur lors de l\'upload du logo');
            this.completeOperation();
          }
        }
      });
  }

  private completeOperation(): void {
    const action = this.isEditMode ? 'modifiée' : 'créée';
    this.toastService.success('Succès', `Marque ${action} avec succès`);
    this.closeFormModal();
    this.loadMarques();
    this.submitting = false;
  }

  deleteMarque(marque: Marque): void {
    console.log('AdminMarquesComponent: deleteMarque', marque);

    // Vérifier s'il y a des produits associés
    if (marque.nombreProduits && marque.nombreProduits > 0) {
      this.toastService.warning(
        'Suppression impossible',
        `Cette marque est associée à ${marque.nombreProduits} produit(s). Supprimez d'abord les produits.`
      );
      return;
    }

    const message = `Êtes-vous sûr de vouloir supprimer définitivement la marque "${marque.nomMarque}" ?\n\nCette action est irréversible.`;

    if (confirm(message)) {
      this.apiService.deleteMarque(marque.idMarque)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Succès', 'Marque supprimée avec succès');
            this.loadMarques();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.toastService.error('Erreur', 'Impossible de supprimer la marque');
          }
        });
    }
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';

    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Construire l'URL complète
    return `${environment.uploadUrl}/${imagePath}`;
  }
}
