// src/app/components/admin/categories/admin-categories.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { Categorie } from '../../../models/interfaces';
import { environment } from "../../../../environments/environment";
import {ImageService} from "../../../services/image.service";

@Component({
  selector: 'app-admin-categories',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Catégories</h1>
          <p class="text-gray-600">Organisez votre catalogue par catégories</p>
        </div>
        <button
          (click)="nouvelleCategorie()"
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <lucide-icon name="plus" class="mr-2 h-4 w-4"></lucide-icon>
          Nouvelle catégorie
        </button>
      </div>

      <!-- Filtres -->
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex-1 max-w-md">
            <label class="sr-only">Rechercher</label>
            <div class="relative">
              <lucide-icon name="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearch()"
                placeholder="Rechercher une catégorie..."
                class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <select
              [(ngModel)]="filterType"
              (change)="onFilterChange()"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tous les types</option>
              <option value="parent">Catégories principales</option>
              <option value="child">Sous-catégories</option>
            </select>
            <button
              (click)="resetFilters()"
              class="px-3 py-2 text-gray-600 hover:text-gray-800">
              <lucide-icon name="x" class="h-4 w-4"></lucide-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <!-- Liste des catégories -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sous-catégories
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
              <tr *ngFor="let categorie of filteredCategories; let i = index"
                  class="hover:bg-gray-50 transition-colors duration-150"
                  [class.bg-blue-50]="categorie.idCategorie === selectedCategorieId">

                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-12 w-12 flex-shrink-0">
                      <img
                        *ngIf="categorie.imageCategorie"
                        [src]="getImageUrl(categorie.imageCategorie)"
                        [alt]="categorie.nomCategorie"
                        class="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        (error)="onImageError($event)">
                      <div *ngIf="!categorie.imageCategorie"
                           class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <lucide-icon name="grid" class="h-6 w-6 text-gray-400"></lucide-icon>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ categorie.nomCategorie }}
                      </div>
                      <div class="text-sm text-gray-500" *ngIf="categorie.descriptionCategorie">
                        {{ getDescriptionPreview(categorie.descriptionCategorie) }}
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <span *ngIf="categorie.nomParent"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ categorie.nomParent }}
                  </span>
                  <span *ngIf="!categorie.nomParent" class="text-sm text-gray-400">
                    Catégorie principale
                  </span>
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ getSousCategories(categorie.idCategorie).length }}
                  </span>
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {{ categorie.nombreProduits || 0 }}
                  </span>
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end items-center space-x-2">
                    <button
                      (click)="viewCategorie(categorie)"
                      class="text-gray-600 hover:text-gray-800 p-1 rounded transition-colors"
                      title="Voir détails">
                      <lucide-icon name="eye" class="h-4 w-4"></lucide-icon>
                    </button>
                    <button
                      (click)="editCategorie(categorie)"
                      class="text-primary-600 hover:text-primary-800 p-1 rounded transition-colors"
                      title="Modifier">
                      <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                    </button>
                    <button
                      (click)="confirmDeleteCategorie(categorie)"
                      [disabled]="(categorie.nombreProduits && categorie.nombreProduits > 0) || getSousCategories(categorie.idCategorie).length > 0"
                      [class.opacity-50]="(categorie.nombreProduits && categorie.nombreProduits > 0) || getSousCategories(categorie.idCategorie).length > 0"
                      [class.cursor-not-allowed]="(categorie.nombreProduits && categorie.nombreProduits > 0) || getSousCategories(categorie.idCategorie).length > 0"
                      class="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                      title="Supprimer">
                      <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Message si aucune catégorie -->
        <div *ngIf="filteredCategories.length === 0" class="text-center py-12">
          <lucide-icon name="grid" class="h-12 w-12 text-gray-400 mx-auto mb-4"></lucide-icon>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ searchTerm ? 'Aucun résultat trouvé' : 'Aucune catégorie trouvée' }}
          </h3>
          <p class="text-gray-500 mb-4">
            {{ searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Commencez par ajouter votre première catégorie' }}
          </p>
          <button
            *ngIf="!searchTerm"
            (click)="nouvelleCategorie()"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Nouvelle catégorie
          </button>
        </div>
      </div>

      <!-- Modal création/édition -->
      <div *ngIf="showFormModal"
           class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              {{ isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
            </h3>
            <button
              (click)="closeFormModal()"
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
            </button>
          </div>

          <form [formGroup]="categorieForm" class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom de la catégorie *
              </label>
              <input
                type="text"
                formControlName="nomCategorie"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                [class.border-red-500]="categorieForm.get('nomCategorie')?.errors && categorieForm.get('nomCategorie')?.touched"
                placeholder="Ex: Climatiseurs">
              <div *ngIf="categorieForm.get('nomCategorie')?.errors?.['required'] && categorieForm.get('nomCategorie')?.touched"
                   class="text-red-500 text-sm mt-1">
                Le nom est obligatoire
              </div>
              <div *ngIf="categorieForm.get('nomCategorie')?.errors?.['minlength'] && categorieForm.get('nomCategorie')?.touched"
                   class="text-red-500 text-sm mt-1">
                Le nom doit contenir au moins 2 caractères
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                formControlName="descriptionCategorie"
                rows="3"
                maxlength="500"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Description de la catégorie..."></textarea>
              <p class="text-xs text-gray-500 mt-1">
                {{ categorieForm.get('descriptionCategorie')?.value?.length || 0 }}/500 caractères
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Catégorie parent
              </label>
              <select
                formControlName="parentId"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">Aucune (catégorie principale)</option>
                <option *ngFor="let cat of getAvailableParentCategories()" [value]="cat.idCategorie">
                  {{ cat.nomCategorie }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Image de la catégorie
              </label>
              <input
                type="file"
                (change)="onImageSelected($event)"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <p class="text-xs text-gray-500 mt-1">
                Formats acceptés: JPG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>

            <!-- Prévisualisation image -->
            <div *ngIf="imagePreview" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Aperçu</label>
              <div class="relative inline-block">
                <img [src]="imagePreview" alt="Aperçu" class="h-32 w-32 object-cover rounded-lg border border-gray-300">
                <button
                  type="button"
                  (click)="removeImage()"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <lucide-icon name="x" class="h-3 w-3"></lucide-icon>
                </button>
              </div>
            </div>
          </form>

          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              (click)="closeFormModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              Annuler
            </button>
            <button
              (click)="saveCategorie()"
              [disabled]="categorieForm.invalid || savingCategorie"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              <lucide-icon *ngIf="savingCategorie" name="loader-2" class="animate-spin h-4 w-4 mr-2"></lucide-icon>
              {{ isEditing ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de confirmation de suppression -->
      <div *ngIf="showDeleteModal"
           class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4">
            <div class="flex items-center mb-4">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <lucide-icon name="alert-triangle" class="h-6 w-6 text-red-600"></lucide-icon>
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Supprimer la catégorie</h3>
              <p class="text-sm text-gray-500 mb-4">
                Êtes-vous sûr de vouloir supprimer la catégorie
                <span class="font-medium text-gray-900">"{{ categorieToDelete?.nomCategorie }}"</span> ?
                Cette action est irréversible.
              </p>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              (click)="closeDeleteModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors">
              Annuler
            </button>
            <button
              (click)="deleteCategorie()"
              [disabled]="deletingCategorie"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              <lucide-icon *ngIf="deletingCategorie" name="loader-2" class="animate-spin h-4 w-4 mr-2"></lucide-icon>
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de détails -->
      <div *ngIf="showViewModal && selectedCategorie"
           class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Détails de la catégorie</h3>
            <button
              (click)="closeViewModal()"
              class="text-gray-400 hover:text-gray-600">
              <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
            </button>
          </div>

          <div class="px-6 py-4 space-y-4">
            <!-- Image -->
            <div *ngIf="selectedCategorie.imageCategorie" class="text-center">
              <img
                [src]="getImageUrl(selectedCategorie.imageCategorie)"
                [alt]="selectedCategorie.nomCategorie"
                class="h-32 w-32 object-cover rounded-lg mx-auto border border-gray-300">
            </div>

            <!-- Informations -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Nom</label>
                <p class="text-sm text-gray-900">{{ selectedCategorie.nomCategorie }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Parent</label>
                <p class="text-sm text-gray-900">{{ selectedCategorie.nomParent || 'Aucun' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Sous-catégories</label>
                <p class="text-sm text-gray-900">{{ getSousCategories(selectedCategorie.idCategorie).length }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Produits</label>
                <p class="text-sm text-gray-900">{{ selectedCategorie.nombreProduits || 0 }}</p>
              </div>
            </div>

            <!-- Description -->
            <div *ngIf="selectedCategorie.descriptionCategorie">
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <p class="text-sm text-gray-900">{{ selectedCategorie.descriptionCategorie }}</p>
            </div>

            <!-- Sous-catégories -->
            <div *ngIf="getSousCategories(selectedCategorie.idCategorie).length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Sous-catégories</label>
              <div class="space-y-2">
                <div *ngFor="let sousCategorie of getSousCategories(selectedCategorie.idCategorie)"
                     class="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span class="text-sm text-gray-900">{{ sousCategorie.nomCategorie }}</span>
                  <span class="text-xs text-gray-500">{{ sousCategorie.nombreProduits || 0 }} produits</span>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              (click)="editCategorie(selectedCategorie!)"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors">
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminCategoriesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();


  categories: Categorie[] = [];
  filteredCategories: Categorie[] = [];
  loading = false;

  // Filtres et recherche
  searchTerm = '';
  filterType = '';

  // Modals
  showFormModal = false;
  showDeleteModal = false;
  showViewModal = false;
  isEditing = false;

  // États de chargement
  savingCategorie = false;
  deletingCategorie = false;

  // Catégorie sélectionnée
  selectedCategorie: Categorie | null = null;
  selectedCategorieId: number | null = null;
  categorieToDelete: Categorie | null = null;

  // Formulaire
  categorieForm!: FormGroup;
  imagePreview: string | null = null;
  selectedImage: File | null = null;

  constructor(
    private imageService: ImageService, // Ajouter ImageService
    private apiService: ApiService,
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.categorieForm = this.fb.group({
      nomCategorie: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descriptionCategorie: ['', [Validators.maxLength(500)]],
      parentId: ['']
    });
  }

  private loadCategories(): void {
    this.loading = true;

    this.adminService.getAllCategoriesAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des catégories:', error);
          this.toastService.error('Erreur', 'Impossible de charger les catégories');
          this.loading = false;
        }
      });
  }

  // Filtres et recherche
  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.categories];

    // Recherche par nom
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(cat =>
        cat.nomCategorie.toLowerCase().includes(term) ||
        (cat.descriptionCategorie && cat.descriptionCategorie.toLowerCase().includes(term))
      );
    }

    // Filtre par type
    if (this.filterType === 'parent') {
      filtered = filtered.filter(cat => !cat.parentId);
    } else if (this.filterType === 'child') {
      filtered = filtered.filter(cat => cat.parentId);
    }

    this.filteredCategories = filtered;
  }

  // CRUD Operations
  nouvelleCategorie(): void {
    this.isEditing = false;
    this.selectedCategorie = null;
    this.resetForm();
    this.showFormModal = true;
  }

  editCategorie(categorie: Categorie): void {
    this.isEditing = true;
    this.selectedCategorie = categorie;
    this.selectedCategorieId = categorie.idCategorie;

    this.categorieForm.patchValue({
      nomCategorie: categorie.nomCategorie,
      descriptionCategorie: categorie.descriptionCategorie || '',
      parentId: categorie.parentId || ''
    });

    if (categorie.imageCategorie) {
      this.imagePreview = this.getImageUrl(categorie.imageCategorie);
    }

    this.showFormModal = true;
  }

  viewCategorie(categorie: Categorie): void {
    this.selectedCategorie = categorie;
    this.selectedCategorieId = categorie.idCategorie;
    this.showViewModal = true;
  }

  confirmDeleteCategorie(categorie: Categorie): void {
    // Vérifier si la catégorie peut être supprimée
    const sousCategories = this.getSousCategories(categorie.idCategorie);
    if (sousCategories.length > 0) {
      this.toastService.error('Erreur', 'Impossible de supprimer une catégorie qui contient des sous-catégories');
      return;
    }

    if (categorie.nombreProduits && categorie.nombreProduits > 0) {
      this.toastService.error('Erreur', 'Impossible de supprimer une catégorie qui contient des produits');
      return;
    }

    this.categorieToDelete = categorie;
    this.showDeleteModal = true;
  }

  saveCategorie(): void {
    if (this.categorieForm.valid && !this.savingCategorie) {
      this.savingCategorie = true;
      const formData = this.categorieForm.value;

      const categorieData: Partial<Categorie> = {
        nomCategorie: formData.nomCategorie.trim(),
        descriptionCategorie: formData.descriptionCategorie?.trim() || undefined,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined
      };

      const request = this.isEditing && this.selectedCategorie
        ? this.adminService.updateCategorie(this.selectedCategorie.idCategorie, categorieData)
        : this.adminService.createCategorie(categorieData);

      request.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (savedCategorie) => {
            const successMessage = this.isEditing ? 'Catégorie modifiée avec succès' : 'Catégorie créée avec succès';
            this.toastService.success('Succès', successMessage);

            // Upload de l'image si sélectionnée
            if (this.selectedImage && savedCategorie.idCategorie) {
              this.uploadImage(savedCategorie.idCategorie);
            } else {
              this.savingCategorie = false;
              this.closeFormModal();
              this.loadCategories();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la sauvegarde:', error);
            this.toastService.error('Erreur', 'Impossible de sauvegarder la catégorie');
            this.savingCategorie = false;
          }
        });
    } else {
      this.toastService.error('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      this.markFormGroupTouched();
    }
  }

  deleteCategorie(): void {
    if (this.categorieToDelete && !this.deletingCategorie) {
      this.deletingCategorie = true;

      this.adminService.deleteCategorie(this.categorieToDelete.idCategorie)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Succès', 'Catégorie supprimée avec succès');
            this.deletingCategorie = false;
            this.closeDeleteModal();
            this.loadCategories();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.toastService.error('Erreur', 'Impossible de supprimer la catégorie');
            this.deletingCategorie = false;
          }
        });
    }
  }

  // Gestion des images
  onImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const validation = this.imageService.validateImageFile(file);

      if (!validation.valid) {
        this.toastService.error('Erreur', validation.error || 'Fichier invalide');
        // Réinitialiser l'input
        event.target.value = '';
        return;
      }

      this.selectedImage = file;

      // Créer la prévisualisation
      this.imageService.createImagePreview(file)
        .then(preview => {
          this.imagePreview = preview;
        })
        .catch(error => {
          console.error('Erreur prévisualisation:', error);
          this.toastService.error('Erreur', 'Impossible de créer la prévisualisation');
        });
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.jpg'; // Image par défaut
  }

  private uploadImage(categorieId: number): void {
    if (this.selectedImage) {
      console.log('📤 Début upload image pour catégorie:', categorieId);

      this.imageService.uploadCategorieImage(categorieId, this.selectedImage)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (imagePath) => {
            console.log('✅ Image uploadée:', imagePath);
            this.toastService.success('Succès', 'Image uploadée avec succès');
            this.savingCategorie = false;
            this.closeFormModal();
            this.loadCategories();
          },
          error: (error) => {
            console.error('❌ Erreur upload image:', error);
            this.toastService.warning('Attention', 'Catégorie sauvegardée mais erreur lors de l\'upload de l\'image');
            this.savingCategorie = false;
            this.closeFormModal();
            this.loadCategories();
          }
        });
    }
  }

  // Utilitaires
  getSousCategories(parentId: number): Categorie[] {
    return this.categories.filter(cat => cat.parentId === parentId);
  }

  getAvailableParentCategories(): Categorie[] {
    // Exclure la catégorie en cours d'édition pour éviter les références circulaires
    return this.categories.filter(cat =>
      !cat.parentId &&
      (!this.selectedCategorie || cat.idCategorie !== this.selectedCategorie.idCategorie)
    );
  }

  getDescriptionPreview(description: string): string {
    return description.length > 50 ? description.substring(0, 50) + '...' : description;
  }

  getImageUrl(imagePath: string): string {
    return this.imageService.getImageUrl(imagePath);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categorieForm.controls).forEach(key => {
      const control = this.categorieForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.categorieForm.reset();
    this.imagePreview = null;
    this.selectedImage = null;
    this.selectedCategorieId = null;
  }

  // Gestion des modals
  closeFormModal(): void {
    this.showFormModal = false;
    this.resetForm();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.categorieToDelete = null;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCategorie = null;
    this.selectedCategorieId = null;
  }
}
