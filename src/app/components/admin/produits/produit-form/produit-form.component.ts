// src/app/components/admin/produits/produit-form/produit-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { environment } from "../../../../../environments/environment";
import { Categorie, Marque, Produit } from "../../../../models/interfaces";
import { ApiService } from "../../../../services/api.service";
import { AdminService } from "../../../../services/admin.service";
import { ToastService } from "../../../../services/toast.service";

@Component({
  selector: 'app-produit-form',
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEditing ? 'Modifier le produit' : 'Nouveau produit' }}
          </h1>
          <p class="text-gray-600">
            {{ isEditing ? 'Modifiez les informations du produit' : 'Ajoutez un nouveau produit à votre catalogue' }}
          </p>
        </div>
        <button
          (click)="goBack()"
          class="text-gray-600 hover:text-gray-800">
          <lucide-icon name="chevron-left" class="h-5 w-5"></lucide-icon>
          <span class="ml-1">Retour</span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div class="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Formulaire -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg">
        <form [formGroup]="produitForm" (ngSubmit)="onSubmit()" class="space-y-6 p-6">

          <!-- Informations de base -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  formControlName="nomProduit"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Climatiseur Samsung 12000 BTU">
                <div *ngIf="hasError('nomProduit', 'required')" class="text-red-500 text-sm mt-1">
                  Le nom est obligatoire
                </div>
                <div *ngIf="hasError('nomProduit', 'minlength')" class="text-red-500 text-sm mt-1">
                  Le nom doit contenir au moins 2 caractères
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Prix *
                </label>
                <div class="relative">
                  <input
                    type="number"
                    formControlName="prix"
                    min="0"
                    step="100"
                    class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0">
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span class="text-gray-500 text-sm">FCFA</span>
                  </div>
                </div>
                <div *ngIf="hasError('prix', 'required')" class="text-red-500 text-sm mt-1">
                  Le prix est obligatoire
                </div>
                <div *ngIf="hasError('prix', 'min')" class="text-red-500 text-sm mt-1">
                  Le prix doit être positif
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  formControlName="categorieId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner une catégorie</option>
                  <option *ngFor="let cat of categories" [value]="cat.idCategorie">
                    {{ cat.nomCategorie }}
                  </option>
                </select>
                <div *ngIf="hasError('categorieId', 'required')" class="text-red-500 text-sm mt-1">
                  La catégorie est obligatoire
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Marque *
                </label>
                <select
                  formControlName="marqueId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner une marque</option>
                  <option *ngFor="let marque of marques" [value]="marque.idMarque">
                    {{ marque.nomMarque }}
                  </option>
                </select>
                <div *ngIf="hasError('marqueId', 'required')" class="text-red-500 text-sm mt-1">
                  La marque est obligatoire
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Stock disponible
                </label>
                <input
                  type="number"
                  formControlName="stockDisponible"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0">
                <div *ngIf="hasError('stockDisponible', 'min')" class="text-red-500 text-sm mt-1">
                  Le stock doit être positif ou nul
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Référence produit
                </label>
                <input
                  type="text"
                  formControlName="refProduit"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Généré automatiquement si vide">
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <div>
              <textarea
                formControlName="descriptionProduit"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Description détaillée du produit..."></textarea>
            </div>
          </div>

          <!-- Images du produit -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Images du produit</h3>

            <!-- Zone d'upload -->
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors">
              <input
                type="file"
                (change)="onImagesSelected($event)"
                multiple
                accept="image/*"
                #fileInput
                class="hidden">

              <div class="space-y-4">
                <div>
                  <lucide-icon name="upload-cloud" class="w-12 h-12 text-gray-400 mx-auto mb-2"></lucide-icon>
                  <p class="text-lg font-medium text-gray-600 mb-1">
                    Cliquez pour ajouter des images
                  </p>
                  <p class="text-sm text-gray-500">
                    Plusieurs images • Max 5MB chacune • JPG, PNG, GIF, WebP
                  </p>
                </div>

                <button
                  type="button"
                  (click)="fileInput.click()"
                  class="btn-outline">
                  <lucide-icon name="upload" class="w-4 h-4 mr-2"></lucide-icon>
                  Sélectionner des images
                </button>
              </div>
            </div>

            <!-- Prévisualisations -->
            <div *ngIf="imagesPreviews.length > 0" class="mt-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Images sélectionnées</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div *ngFor="let preview of imagesPreviews; index as i" class="relative group">
                  <img
                    [src]="preview"
                    [alt]="'Aperçu ' + (i + 1)"
                    class="w-full h-24 object-cover rounded-lg border shadow-sm">

                  <button
                    type="button"
                    (click)="removeImagePreview(i)"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                    <lucide-icon name="x" class="w-3 h-3"></lucide-icon>
                  </button>

                  <!-- Indicateur si c'est une nouvelle image -->
                  <div *ngIf="i >= existingImagePaths.length"
                       class="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                    Nouveau
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload manuel si pas d'auto-upload -->
            <div *ngIf="selectedImages.length > 0 && isEditing" class="mt-4">
              <button
                type="button"
                (click)="uploadImages()"
                [disabled]="isUploadingImages"
                class="btn-secondary">
                <lucide-icon name="upload" class="w-4 h-4 mr-2" *ngIf="!isUploadingImages"></lucide-icon>
                <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" *ngIf="isUploadingImages"></div>
                {{ isUploadingImages ? 'Upload en cours...' : 'Uploader les nouvelles images' }}
              </button>
            </div>
          </div>

          <!-- Fiche technique PDF -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Fiche technique (optionnel)</h3>

            <div class="space-y-4">
              <!-- Fichier existant -->
              <div *ngIf="currentFicheTechnique" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <lucide-icon name="file-text" class="w-5 h-5 text-blue-600"></lucide-icon>
                    <span class="text-sm font-medium text-blue-900">Fiche technique actuelle</span>
                  </div>
                  <div class="flex space-x-2">
                    <a
                      [href]="getFicheTechniqueUrl()"
                      target="_blank"
                      class="text-blue-600 hover:text-blue-800 text-sm">
                      Voir
                    </a>
                    <button
                      type="button"
                      (click)="removeFicheTechnique()"
                      class="text-red-600 hover:text-red-800 text-sm">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload nouvelle fiche -->
              <div class="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".pdf"
                  (change)="onFicheTechniqueSelected($event)"
                  #ficheInput
                  class="hidden">

                <button
                  type="button"
                  (click)="ficheInput.click()"
                  class="btn-outline">
                  <lucide-icon name="upload" class="w-4 h-4 mr-2"></lucide-icon>
                  {{ currentFicheTechnique ? 'Remplacer la fiche technique' : 'Ajouter une fiche technique' }}
                </button>

                <span *ngIf="selectedFicheTechnique" class="text-sm text-gray-600">
                  {{ selectedFicheTechnique.name }} ({{ formatFileSize(selectedFicheTechnique.size) }})
                </span>
              </div>

              <p class="text-xs text-gray-500">
                Format PDF uniquement • Taille maximale: 10MB
              </p>
            </div>
          </div>

          <!-- Caractéristiques techniques -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Caractéristiques techniques</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Puissance (BTU)
                </label>
                <input
                  type="number"
                  formControlName="puissanceBTU"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 12000">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Consommation (Watts)
                </label>
                <input
                  type="number"
                  formControlName="consommationWatt"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 1200">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Label énergétique
                </label>
                <select
                  formControlName="labelEnergie"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner un label</option>
                  <option value="A_PLUS_PLUS_PLUS">A+++</option>
                  <option value="A_PLUS_PLUS">A++</option>
                  <option value="A_PLUS">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions
                </label>
                <input
                  type="text"
                  formControlName="dimensions"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 80 x 60 x 30 cm">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  formControlName="poids"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 25.5">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Garantie
                </label>
                <input
                  type="text"
                  formControlName="garantie"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 2 ans">
              </div>
            </div>
          </div>

          <!-- Disponibilité -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Disponibilité</h3>
            <div class="flex items-center">
              <input
                type="checkbox"
                formControlName="disponibilite"
                id="disponibilite"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
              <label for="disponibilite" class="ml-2 block text-sm text-gray-900">
                Produit disponible à la vente
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              (click)="goBack()"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="produitForm.invalid || saving"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="saving">
                <div class="inline w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Enregistrement...
              </span>
              <span *ngIf="!saving">{{ isEditing ? 'Mettre à jour' : 'Créer le produit' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProduitFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  produitForm!: FormGroup;
  categories: Categorie[] = [];
  marques: Marque[] = [];

  isEditing = false;
  produitId: number | null = null;
  loading = false;
  saving = false;

  // Gestion des images - VERSION CORRIGÉE
  selectedImages: File[] = [];
  existingImagePaths: string[] = []; // Chemins des images existantes
  imagesPreviews: string[] = []; // Prévisualisations locales
  imagesUploaded = false;
  isUploadingImages = false;

  // Gestion de la fiche technique
  selectedFicheTechnique: File | null = null;
  currentFicheTechnique: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private adminService: AdminService,
    private toastService: ToastService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    console.log('ProduitFormComponent initialisé');
    this.loadInitialData();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.produitForm = this.fb.group({
      nomProduit: ['', [Validators.required, Validators.minLength(2)]],
      descriptionProduit: [''],
      prix: [0, [Validators.required, Validators.min(0)]],
      stockDisponible: [0, [Validators.min(0)]],
      refProduit: [''],
      categorieId: ['', Validators.required],
      marqueId: ['', Validators.required],
      puissanceBTU: [null],
      consommationWatt: [null],
      labelEnergie: [''],
      dimensions: [''],
      poids: [null],
      garantie: [''],
      disponibilite: [true]
    });
  }

  private checkEditMode(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Paramètre ID de la route:', id);

      if (id && id !== 'nouveau') {
        this.isEditing = true;
        this.produitId = parseInt(id);
        console.log('Mode édition activé pour le produit ID:', this.produitId);
        this.loadProduit();
      } else {
        console.log('Mode création activé');
      }
    });
  }

  private loadInitialData(): void {
    this.loading = true;
    console.log('Chargement des données initiales...');

    Promise.all([
      this.apiService.getCategories().toPromise(),
      this.apiService.getMarques().toPromise()
    ]).then(([categories, marques]) => {
      this.categories = categories || [];
      this.marques = marques || [];
      this.loading = false;
      console.log('Données initiales chargées:', { categories, marques });
    }).catch(error => {
      console.error('Erreur lors du chargement des données:', error);
      this.toastService.error('Erreur', 'Impossible de charger les données');
      this.loading = false;
    });
  }

  private loadProduit(): void {
    if (this.produitId) {
      console.log('Chargement du produit ID:', this.produitId);

      this.apiService.getProduitById(this.produitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (produit) => {
            console.log('Produit chargé:', produit);
            this.populateForm(produit);
          },
          error: (error) => {
            console.error('Erreur lors du chargement du produit:', error);
            this.toastService.error('Erreur', 'Impossible de charger le produit');
            this.goBack();
          }
        });
    }
  }

  private populateForm(produit: Produit): void {
    this.produitForm.patchValue({
      nomProduit: produit.nomProduit,
      descriptionProduit: produit.descriptionProduit,
      prix: produit.prix,
      stockDisponible: produit.stockDisponible,
      refProduit: produit.refProduit,
      categorieId: produit.categorie?.idCategorie || '',
      marqueId: produit.marque?.idMarque || '',
      puissanceBTU: produit.puissanceBTU,
      consommationWatt: produit.consommationWatt,
      labelEnergie: produit.labelEnergie || '',
      dimensions: produit.dimensions,
      poids: produit.poids,
      garantie: produit.garantie,
      disponibilite: produit.disponibilite
    });

    // Charger les images existantes - VERSION CORRIGÉE
    if (produit.listeImages && produit.listeImages.length > 0) {
      this.existingImagePaths = [...produit.listeImages];
      // Créer les prévisualisations à partir des URLs complètes
      this.imagesPreviews = produit.listeImages.map(imagePath =>
        this.getImageUrl(imagePath)
      );
    }

    // Charger la fiche technique existante
    if (produit.ficheTechniquePDF) {
      this.currentFicheTechnique = produit.ficheTechniquePDF;
    }
  }

  // === GESTION DES IMAGES - VERSION CORRIGÉE ===

  onImagesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    console.log('Images sélectionnées:', files);

    if (this.imagesPreviews.length + files.length > 8) {
      this.toastService.error('Erreur', 'Maximum 8 images autorisées');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Erreur', `Le fichier ${file.name} ne doit pas dépasser 5MB`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        this.toastService.error('Erreur', `Le fichier ${file.name} n'est pas une image`);
        continue;
      }

      this.selectedImages.push(file);

      // Créer une prévisualisation locale
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagesPreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
    this.imagesUploaded = false;

    console.log('Images sélectionnées total:', this.selectedImages.length);
    console.log('Prévisualisations total:', this.imagesPreviews.length);
  }

  removeImagePreview(index: number): void {
    console.log('Suppression de l\'image à l\'index:', index);

    // Si c'est une image existante
    if (index < this.existingImagePaths.length) {
      this.existingImagePaths.splice(index, 1);
    } else {
      // Si c'est une nouvelle image sélectionnée
      const selectedIndex = index - this.existingImagePaths.length;
      if (selectedIndex >= 0 && selectedIndex < this.selectedImages.length) {
        this.selectedImages.splice(selectedIndex, 1);
      }
    }

    this.imagesPreviews.splice(index, 1);
  }

  async uploadImages(): Promise<void> {
    if (this.selectedImages.length === 0 || !this.produitId) return;

    this.isUploadingImages = true;

    try {
      console.log('Upload manuel de', this.selectedImages.length, 'images');
      const imageUrls = await this.apiService.uploadImages(this.produitId, this.selectedImages).toPromise();
      console.log('Images uploadées manuellement:', imageUrls);

      if (imageUrls) {
        // Ajouter les nouveaux chemins aux images existantes
        this.existingImagePaths.push(...imageUrls);
        this.selectedImages = [];
        this.imagesUploaded = true;

        // Recréer les prévisualisations à partir des chemins existants
        this.imagesPreviews = this.existingImagePaths.map(imagePath =>
          this.getImageUrl(imagePath)
        );

        this.toastService.success('Succès', 'Images uploadées avec succès');

        // Optionnel: Recharger le produit pour vérifier la sauvegarde
        if (this.produitId) {
          const produitMisAJour = await this.apiService.getProduitById(this.produitId).toPromise();
          console.log('Produit après upload:', produitMisAJour);
        }
      }
    } catch (error) {
      console.error('Erreur upload manuel:', error);
      this.toastService.error('Erreur', 'Impossible d\'uploader les images');
    } finally {
      this.isUploadingImages = false;
    }
  }

  // === GESTION DE LA FICHE TECHNIQUE ===

  onFicheTechniqueSelected(event: any): void {
    const file = event.target.files[0] as File;
    if (file) {
      // Validation
      if (file.type !== 'application/pdf') {
        this.toastService.error('Erreur', 'Seuls les fichiers PDF sont autorisés');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        this.toastService.error('Erreur', 'Le fichier ne doit pas dépasser 10MB');
        return;
      }

      this.selectedFicheTechnique = file;
      console.log('Fiche technique sélectionnée:', file.name);
    }

    // Reset input
    event.target.value = '';
  }

  removeFicheTechnique(): void {
    this.currentFicheTechnique = null;
    this.selectedFicheTechnique = null;
  }

  getFicheTechniqueUrl(): string {
    if (this.currentFicheTechnique) {
      return this.getImageUrl(this.currentFicheTechnique);
    }
    return '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // === SOUMISSION DU FORMULAIRE - VERSION CORRIGÉE ===

  async onSubmit(): Promise<void> {
    console.log('Soumission du formulaire');
    console.log('Validité du formulaire:', this.produitForm.valid);

    if (this.produitForm.valid) {
      this.saving = true;

      try {
        const produitData = this.prepareProduitData();
        console.log('Données du produit à sauvegarder:', produitData);

        // 1. Créer ou mettre à jour le produit
        let produit: Produit | undefined;
        if (this.isEditing && this.produitId) {
          produit = await this.adminService.updateProduit(this.produitId, produitData).toPromise();
        } else {
          produit = await this.adminService.createProduit(produitData).toPromise();
        }

        console.log('Produit sauvegardé:', produit);

        // 2. Upload des nouvelles images si nécessaire
        // @ts-ignore
        if (produit.idProduit && this.selectedImages.length > 0) {
          console.log('Upload de', this.selectedImages.length, 'nouvelles images');

          try {
            // @ts-ignore
            const imageUrls = await this.apiService.uploadImages(produit.idProduit, this.selectedImages).toPromise();
            console.log('Images uploadées avec succès:', imageUrls);

            // Les images sont automatiquement ajoutées au produit par le endpoint
            this.selectedImages = []; // Vider les images sélectionnées

          } catch (uploadError) {
            console.error('Erreur lors de l\'upload des images:', uploadError);
            this.toastService.warning('Attention', 'Produit créé mais erreur lors de l\'upload des images');
          }
        }

        // 3. Upload de la fiche technique si nécessaire
        // @ts-ignore
        if (produit.idProduit && this.selectedFicheTechnique) {
          console.log('Upload de la fiche technique');

          try {
            // @ts-ignore
            const ficheTechniqueUrl = await this.apiService.uploadFicheTechnique(produit.idProduit, this.selectedFicheTechnique).toPromise();
            console.log('Fiche technique uploadée:', ficheTechniqueUrl);
            this.selectedFicheTechnique = null;

          } catch (uploadError) {
            console.error('Erreur lors de l\'upload de la fiche technique:', uploadError);
            this.toastService.warning('Attention', 'Produit créé mais erreur lors de l\'upload de la fiche technique');
          }
        }

        this.toastService.success(
          'Succès',
          this.isEditing ? 'Produit modifié avec succès' : 'Produit créé avec succès'
        );

        this.saving = false;
        this.goBack();

      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.toastService.error('Erreur', 'Impossible de sauvegarder le produit');
        this.saving = false;
      }
    } else {
      console.log('Formulaire invalide');
      this.toastService.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      this.markFormGroupTouched();
    }
  }

  private prepareProduitData(): Partial<Produit> {
    const formValue = this.produitForm.value;
    const data: Partial<Produit> = {
      nomProduit: formValue.nomProduit,
      descriptionProduit: formValue.descriptionProduit,
      prix: parseFloat(formValue.prix),
      stockDisponible: parseInt(formValue.stockDisponible) || 0,
      refProduit: formValue.refProduit || null,
      puissanceBTU: formValue.puissanceBTU ? parseInt(formValue.puissanceBTU) : undefined,
      consommationWatt: formValue.consommationWatt ? parseInt(formValue.consommationWatt) : undefined,
      labelEnergie: formValue.labelEnergie || null,
      dimensions: formValue.dimensions || null,
      poids: formValue.poids ? parseFloat(formValue.poids) : undefined,
      garantie: formValue.garantie || null,
      disponibilite: formValue.disponibilite,
      categorie: formValue.categorieId ? { idCategorie: parseInt(formValue.categorieId) } as Categorie : undefined,
      marque: formValue.marqueId ? { idMarque: parseInt(formValue.marqueId) } as Marque : undefined
    };

    // IMPORTANT: Inclure SEULEMENT les chemins des images existantes pour la mise à jour
    if (this.isEditing && this.existingImagePaths.length > 0) {
      data.listeImages = [...this.existingImagePaths];
    }

    // Inclure la fiche technique existante
    if (this.currentFicheTechnique) {
      data.ficheTechniquePDF = this.currentFicheTechnique;
    }

    return data;
  }

  private async uploadFilesAfterSave(produitId: number): Promise<void> {
    try {
      // Upload images si nécessaire
      if (this.selectedImages.length > 0) {
        console.log('Upload de', this.selectedImages.length, 'nouvelles images');
        const imageUrls = await this.apiService.uploadImages(produitId, this.selectedImages).toPromise();
        if (imageUrls) {
          console.log('Images uploadées après sauvegarde:', imageUrls);
          this.existingImagePaths.push(...imageUrls);
          this.selectedImages = [];
        }
      }

      // Upload fiche technique si nécessaire
      if (this.selectedFicheTechnique) {
        console.log('Upload de la fiche technique');
        const ficheTechniqueUrl = await this.apiService.uploadFicheTechnique(produitId, this.selectedFicheTechnique).toPromise();
        if (ficheTechniqueUrl) {
          console.log('Fiche technique uploadée après sauvegarde');
          this.currentFicheTechnique = ficheTechniqueUrl;
          this.selectedFicheTechnique = null;
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      this.toastService.warning('Attention', 'Produit créé mais erreur lors de l\'upload des fichiers');
    }
  }

  // === MÉTHODES UTILITAIRES ===

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.produitForm.get(fieldName);
    return !!(field && field.errors && field.errors[errorType] && field.touched);
  }

  private getFormErrors(): any {
    let formErrors: any = {};
    Object.keys(this.produitForm.controls).forEach(key => {
      const controlErrors = this.produitForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.produitForm.controls).forEach(key => {
      const control = this.produitForm.get(key);
      control?.markAsTouched();
    });
  }

  private getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'assets/images/placeholder-product.jpg';
    }

    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Construire l'URL avec le serveur backend
    return `${environment.apiUrl.replace('/api', '')}/uploads/${imagePath}`;
  }

  goBack(): void {
    console.log('Retour vers la liste des produits');
    this.router.navigate(['/admin/produits']);
  }
}
