// src/app/components/admin/produits/produit-form/produit-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { environment } from "../../../../../environments/environment";
import { Categorie, Marque, Produit, ImageProduit, AttributProduit, ModeleAttribut, VideoProduit } from "../../../../models/interfaces";
import { ApiService } from "../../../../services/api.service";
import { AdminService } from "../../../../services/admin.service";
import { ToastService } from "../../../../services/toast.service";

interface EditableAttribut {
  idAttribut?: number;
  nomAttribut: string;
  valeurAttribut: string;
  modeleAttributId?: number;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  valeursAutorisees: string[];
  unite?: string;
  obligatoire: boolean;
  isNew: boolean;
}

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
        <button (click)="goBack()" class="text-gray-600 hover:text-gray-800 flex items-center">
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

          <!-- Informations générales -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                <input type="text" formControlName="nomProduit"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Climatiseur Samsung 12000 BTU">
                <div *ngIf="hasError('nomProduit', 'required')" class="text-red-500 text-sm mt-1">Le nom est obligatoire</div>
                <div *ngIf="hasError('nomProduit', 'minlength')" class="text-red-500 text-sm mt-1">Au moins 2 caractères</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prix *</label>
                <div class="relative">
                  <input type="number" formControlName="prix" min="0" step="100"
                    class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0">
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span class="text-gray-500 text-sm">FCFA</span>
                  </div>
                </div>
                <div *ngIf="hasError('prix', 'required')" class="text-red-500 text-sm mt-1">Le prix est obligatoire</div>
                <div *ngIf="hasError('prix', 'min')" class="text-red-500 text-sm mt-1">Le prix doit être positif</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select formControlName="categorieId" (change)="onCategorieChange($event)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner une catégorie</option>
                  <option *ngFor="let cat of categories" [value]="cat.idCategorie">{{ cat.nomCategorie }}</option>
                </select>
                <div *ngIf="hasError('categorieId', 'required')" class="text-red-500 text-sm mt-1">La catégorie est obligatoire</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
                <select formControlName="marqueId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner une marque</option>
                  <option *ngFor="let marque of marques" [value]="marque.idMarque">{{ marque.nomMarque }}</option>
                </select>
                <div *ngIf="hasError('marqueId', 'required')" class="text-red-500 text-sm mt-1">La marque est obligatoire</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stock disponible</label>
                <input type="number" formControlName="stockDisponible" min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Référence produit</label>
                <input type="text" formControlName="refProduit"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Généré automatiquement si vide">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Modèle fabricant</label>
                <input type="text" formControlName="modeleFabricant"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: AR12TXHQBWKN">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">EAN / GTIN</label>
                <input type="text" formControlName="ean" maxlength="14"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="8, 12, 13 ou 14 chiffres">
                <div *ngIf="hasError('ean', 'pattern')" class="text-red-500 text-sm mt-1">EAN invalide (8, 12, 13 ou 14 chiffres)</div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <textarea formControlName="descriptionProduit" rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Description détaillée du produit... (150 caractères minimum recommandé)"></textarea>
            <div class="text-xs text-gray-400 text-right mt-1">
              {{ (produitForm.get('descriptionProduit')?.value || '').length }} car.
              <span *ngIf="(produitForm.get('descriptionProduit')?.value || '').length > 0 && (produitForm.get('descriptionProduit')?.value || '').length < 150"
                class="text-orange-500"> — &lt; 150 (impacte le score de complétude)</span>
            </div>
          </div>

          <!-- Images du produit -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Images du produit</h3>

            <!-- Images existantes (après migration) -->
            <div *ngIf="existingImages.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Images actuelles
                <span class="ml-2 text-xs text-gray-400">(glisser ↑↓ pour réordonner)</span>
              </h4>
              <div class="space-y-2">
                <div *ngFor="let img of existingImages; index as i"
                  class="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
                  <img [src]="img.url" [alt]="img.texteAlternatif || 'Image ' + (i+1)"
                    class="w-16 h-16 object-cover rounded border flex-shrink-0">
                  <div class="flex-1 min-w-0">
                    <span class="text-xs text-gray-500">Ordre {{ img.ordre + 1 }}</span>
                    <span *ngIf="img.principale"
                      class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      ★ Principale
                    </span>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <!-- Définir comme principale -->
                    <button type="button" *ngIf="!img.principale" title="Définir comme principale"
                      (click)="setAsPrincipale(img)"
                      class="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
                      <lucide-icon name="star" class="w-4 h-4"></lucide-icon>
                    </button>
                    <!-- Monter -->
                    <button type="button" [disabled]="i === 0" title="Monter"
                      (click)="moveImageUp(i)"
                      class="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                      <lucide-icon name="arrow-up" class="w-4 h-4"></lucide-icon>
                    </button>
                    <!-- Descendre -->
                    <button type="button" [disabled]="i === existingImages.length - 1" title="Descendre"
                      (click)="moveImageDown(i)"
                      class="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                      <lucide-icon name="arrow-down" class="w-4 h-4"></lucide-icon>
                    </button>
                    <!-- Supprimer -->
                    <button type="button" title="Supprimer"
                      (click)="confirmDeleteImage(img)"
                      class="p-1 text-red-400 hover:text-red-600 transition-colors">
                      <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Bouton réordonner -->
              <button type="button" *ngIf="reorderDirty" (click)="saveReorder()"
                [disabled]="isSavingReorder"
                class="mt-2 text-sm px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                {{ isSavingReorder ? 'Enregistrement...' : 'Enregistrer l\'ordre' }}
              </button>
            </div>

            <!-- Fallback : images de l'ancienne table (avant migration) -->
            <div *ngIf="existingImages.length === 0 && legacyImages.length > 0" class="mb-4">
              <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2 text-sm text-yellow-800">
                <lucide-icon name="alert-triangle" class="w-4 h-4 inline mr-1"></lucide-icon>
                Images issues de l'ancienne table (avant migration). La gestion avancée sera disponible après migration.
              </div>
              <div class="grid grid-cols-4 gap-2">
                <img *ngFor="let url of legacyImages" [src]="url" alt="Image produit"
                  class="w-full h-20 object-cover rounded border">
              </div>
            </div>

            <!-- Zone d'upload -->
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors">
              <input type="file" (change)="onImagesSelected($event)" multiple accept="image/*" #fileInput class="hidden">
              <div class="space-y-3">
                <lucide-icon name="upload-cloud" class="w-12 h-12 text-gray-400 mx-auto"></lucide-icon>
                <p class="text-sm text-gray-500">JPG, PNG, WebP • Max 5 MB chacune</p>
                <button type="button" (click)="fileInput.click()" class="btn-outline text-sm">
                  <lucide-icon name="upload" class="w-4 h-4 mr-2"></lucide-icon>
                  Sélectionner des images
                </button>
              </div>
            </div>

            <!-- Fichiers sélectionnés non encore uploadés -->
            <div *ngIf="pendingFiles.length > 0" class="mt-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">À uploader ({{ pendingFiles.length }})</h4>
              <div class="grid grid-cols-4 gap-3">
                <div *ngFor="let pf of pendingFiles; index as i" class="relative group">
                  <img [src]="pf.preview" alt="Aperçu" class="w-full h-20 object-cover rounded border">
                  <button type="button" (click)="removePendingFile(i)"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <lucide-icon name="x" class="w-3 h-3"></lucide-icon>
                  </button>
                </div>
              </div>
              <button type="button" *ngIf="isEditing && produitId" (click)="uploadPendingImages()"
                [disabled]="isUploadingImages"
                class="mt-2 btn-secondary text-sm">
                <lucide-icon name="upload" class="w-4 h-4 mr-2" *ngIf="!isUploadingImages"></lucide-icon>
                <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" *ngIf="isUploadingImages"></div>
                {{ isUploadingImages ? 'Upload...' : 'Uploader maintenant' }}
              </button>
            </div>

            <!-- Confirmation de suppression -->
            <div *ngIf="imageToDelete" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span class="text-sm text-red-700">Supprimer cette image ?</span>
              <div class="flex gap-2">
                <button type="button" (click)="executeDeleteImage()" class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Confirmer</button>
                <button type="button" (click)="imageToDelete = null" class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">Annuler</button>
              </div>
            </div>
          </div>

          <!-- Vidéos de présentation -->
          <div class="border-b border-gray-200 pb-6" *ngIf="isEditing && produitId">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Vidéos de présentation</h3>
                <p class="text-xs text-gray-500 mt-1">{{ produitVideos.length }}/3 vidéos • YouTube, Facebook ou fichier MP4/MOV/WebM</p>
              </div>
            </div>

            <!-- Liste des vidéos -->
            <div *ngIf="produitVideos.length > 0" class="space-y-3 mb-4">
              <div *ngFor="let video of produitVideos; index as i"
                   class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <!-- Miniature -->
                <div class="flex-shrink-0 w-16 h-10 bg-gray-200 rounded overflow-hidden relative">
                  <img *ngIf="video.urlApercu" [src]="video.urlApercu" [alt]="video.titre || 'Vidéo'"
                       class="w-full h-full object-cover" onerror="this.style.display='none'">
                  <div *ngIf="!video.urlApercu"
                       class="w-full h-full flex items-center justify-center bg-gray-700">
                    <lucide-icon name="video" class="w-5 h-5 text-gray-300"></lucide-icon>
                  </div>
                  <!-- Badge type -->
                  <span class="absolute bottom-0 right-0 text-white text-xs px-1 rounded-tl"
                        [ngClass]="{'bg-red-600': video.type === 'YOUTUBE', 'bg-blue-600': video.type === 'FACEBOOK', 'bg-purple-600': video.type === 'CLOUDINARY'}">
                    {{ video.type === 'YOUTUBE' ? 'YT' : video.type === 'FACEBOOK' ? 'FB' : 'CL' }}
                  </span>
                </div>
                <!-- Titre -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ video.titre || video.url }}</p>
                  <p class="text-xs text-gray-500">{{ video.type }}</p>
                </div>
                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <button type="button" (click)="toggleVideoActif(video)"
                          [title]="video.active ? 'Désactiver' : 'Activer'"
                          class="p-1 rounded hover:bg-gray-200">
                    <lucide-icon [name]="video.active ? 'eye' : 'eye-off'" class="w-4 h-4 text-gray-600"></lucide-icon>
                  </button>
                  <button type="button" (click)="monterVideo(i)" [disabled]="i === 0"
                          class="p-1 rounded hover:bg-gray-200 disabled:opacity-30" title="Monter">
                    <lucide-icon name="chevron-up" class="w-4 h-4 text-gray-600"></lucide-icon>
                  </button>
                  <button type="button" (click)="descendreVideo(i)" [disabled]="i === produitVideos.length - 1"
                          class="p-1 rounded hover:bg-gray-200 disabled:opacity-30" title="Descendre">
                    <lucide-icon name="chevron-down" class="w-4 h-4 text-gray-600"></lucide-icon>
                  </button>
                  <button type="button" (click)="demanderSuppressionVideo(video)"
                          class="p-1 rounded hover:bg-red-100" title="Supprimer">
                    <lucide-icon name="trash-2" class="w-4 h-4 text-red-500"></lucide-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Confirmation suppression vidéo -->
            <div *ngIf="videoToDelete" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span class="text-sm text-red-700">Supprimer « {{ videoToDelete.titre || videoToDelete.url.slice(0,40) }} » ?</span>
              <div class="flex gap-2">
                <button type="button" (click)="executerSuppressionVideo()" class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Confirmer</button>
                <button type="button" (click)="videoToDelete = null" class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">Annuler</button>
              </div>
            </div>

            <!-- Ajout vidéo (masqué si limite atteinte) -->
            <div *ngIf="produitVideos.length < 3" class="space-y-3">
              <!-- Ajout par lien -->
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="videoLienUrl" [ngModelOptions]="{standalone: true}"
                       placeholder="Coller un lien YouTube ou Facebook…"
                       (input)="onVideoLienChange()"
                       class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <button type="button" (click)="ajouterVideoLien()"
                        [disabled]="!videoLienUrl || isAddingVideo"
                        class="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50">
                  <lucide-icon name="plus" class="w-4 h-4" *ngIf="!isAddingVideo"></lucide-icon>
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" *ngIf="isAddingVideo"></div>
                </button>
              </div>
              <!-- Aperçu lien en attente -->
              <div *ngIf="videoLienApercu" class="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                <img [src]="videoLienApercu" alt="Aperçu" class="w-20 h-12 object-cover rounded">
                <span class="text-xs text-gray-600">Aperçu YouTube — cliquez + pour ajouter</span>
              </div>

              <!-- Upload fichier -->
              <div class="flex items-center gap-3">
                <input type="file" #videoFileInput accept="video/mp4,video/quicktime,video/webm"
                       (change)="onVideoFileSelected($event)" class="hidden">
                <button type="button" (click)="videoFileInput.click()"
                        [disabled]="isUploadingVideo"
                        class="btn-outline text-sm">
                  <lucide-icon name="upload" class="w-4 h-4 mr-2" *ngIf="!isUploadingVideo"></lucide-icon>
                  <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" *ngIf="isUploadingVideo"></div>
                  {{ isUploadingVideo ? 'Envoi en cours…' : 'Envoyer un fichier vidéo' }}
                </button>
                <span class="text-xs text-gray-500">MP4, MOV, WebM • max 50 Mo</span>
              </div>

              <!-- Barre de progression upload -->
              <div *ngIf="videoUploadProgress > 0 && videoUploadProgress < 100" class="mt-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                       [style.width.%]="videoUploadProgress"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1 text-right">{{ videoUploadProgress }}%</p>
              </div>
            </div>
            <p *ngIf="produitVideos.length >= 3" class="text-sm text-orange-600 mt-2">
              <lucide-icon name="alert-circle" class="w-4 h-4 inline mr-1"></lucide-icon>
              Limite de 3 vidéos atteinte.
            </p>
          </div>

          <!-- Fiche technique PDF -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Fiche technique (optionnel)</h3>
            <div class="space-y-4">
              <div *ngIf="currentFicheTechnique" class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <lucide-icon name="file-text" class="w-5 h-5 text-blue-600"></lucide-icon>
                  <span class="text-sm font-medium text-blue-900">Fiche technique actuelle</span>
                </div>
                <div class="flex space-x-3">
                  <a [href]="getFicheTechniqueUrl()" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">Voir</a>
                  <button type="button" (click)="removeFicheTechnique()" class="text-red-600 hover:text-red-800 text-sm">Supprimer</button>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <input type="file" accept=".pdf" (change)="onFicheTechniqueSelected($event)" #ficheInput class="hidden">
                <button type="button" (click)="ficheInput.click()" class="btn-outline text-sm">
                  <lucide-icon name="upload" class="w-4 h-4 mr-2"></lucide-icon>
                  {{ currentFicheTechnique ? 'Remplacer' : 'Ajouter une fiche technique' }}
                </button>
                <span *ngIf="selectedFicheTechnique" class="text-sm text-gray-600">
                  {{ selectedFicheTechnique.name }} ({{ formatFileSize(selectedFicheTechnique.size) }})
                </span>
              </div>
              <p class="text-xs text-gray-500">Format PDF uniquement • Taille maximale : 10 MB</p>
            </div>
          </div>

          <!-- Caractéristiques techniques fixes -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Caractéristiques techniques</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Puissance (BTU)</label>
                <input type="number" formControlName="puissanceBTU" min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 12000">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Consommation (Watts)</label>
                <input type="number" formControlName="consommationWatt" min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 1200">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Label énergétique</label>
                <select formControlName="labelEnergie"
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                <input type="text" formControlName="dimensions"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 80 x 60 x 30 cm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
                <input type="number" formControlName="poids" min="0" step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 25.5">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Garantie</label>
                <input type="text" formControlName="garantie"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 2 ans">
              </div>
            </div>
          </div>

          <!-- Attributs dynamiques -->
          <div class="border-b border-gray-200 pb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">Attributs dynamiques</h3>
              <span *ngIf="modelesAttributs.length > 0" class="text-xs text-gray-400">{{ modelesAttributs.length }} modèle(s) pour cette catégorie</span>
            </div>

            <!-- Modèles suggérés non encore ajoutés -->
            <div *ngIf="suggestedModeles.length > 0" class="mb-4">
              <p class="text-xs text-gray-500 mb-2">Attributs suggérés :</p>
              <div class="flex flex-wrap gap-2">
                <button type="button" *ngFor="let modele of suggestedModeles"
                  (click)="addAttributFromModele(modele)"
                  class="text-xs px-2 py-1 border border-primary-300 text-primary-700 rounded hover:bg-primary-50">
                  + {{ modele.nomAttribut }}
                  <span *ngIf="modele.obligatoire" class="text-red-500">*</span>
                </button>
              </div>
            </div>

            <!-- Liste des attributs en cours d'édition -->
            <div class="space-y-2">
              <div *ngFor="let attr of editableAttributs; index as i"
                class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <!-- Nom -->
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">
                      {{ attr.nomAttribut }}
                      <span *ngIf="attr.obligatoire" class="text-red-500">*</span>
                      <span *ngIf="attr.unite" class="text-gray-400"> ({{ attr.unite }})</span>
                    </label>
                    <!-- BOOLEAN -->
                    <select *ngIf="attr.type === 'BOOLEAN'" [(ngModel)]="attr.valeurAttribut" [ngModelOptions]="{standalone: true}"
                      class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500">
                      <option value="">—</option>
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </select>
                    <!-- SELECT -->
                    <select *ngIf="attr.type === 'SELECT'" [(ngModel)]="attr.valeurAttribut" [ngModelOptions]="{standalone: true}"
                      class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500">
                      <option value="">Choisir...</option>
                      <option *ngFor="let v of attr.valeursAutorisees" [value]="v">{{ v }}</option>
                    </select>
                    <!-- NUMBER -->
                    <input *ngIf="attr.type === 'NUMBER'" type="number" [(ngModel)]="attr.valeurAttribut" [ngModelOptions]="{standalone: true}"
                      class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500">
                    <!-- TEXT -->
                    <input *ngIf="attr.type === 'TEXT'" type="text" [(ngModel)]="attr.valeurAttribut" [ngModelOptions]="{standalone: true}"
                      class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500">
                  </div>
                </div>
                <button type="button" (click)="removeAttribut(i)"
                  class="flex-shrink-0 p-1 text-red-400 hover:text-red-600">
                  <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>

            <!-- Ajout d'un attribut libre -->
            <div class="mt-3 flex items-end gap-2">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Nom de l'attribut</label>
                <input type="text" [(ngModel)]="newAttributNom" [ngModelOptions]="{standalone: true}"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                  placeholder="Ex: Fluide frigorigène">
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Valeur</label>
                <input type="text" [(ngModel)]="newAttributValeur" [ngModelOptions]="{standalone: true}"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                  placeholder="Ex: R32">
              </div>
              <button type="button" (click)="addAttributLibre()"
                [disabled]="!newAttributNom.trim()"
                class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 disabled:opacity-40">
                + Ajouter
              </button>
            </div>
          </div>

          <!-- Disponibilité -->
          <div class="border-b border-gray-200 pb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Disponibilité</h3>
            <div class="flex items-center">
              <input type="checkbox" formControlName="disponibilite" id="disponibilite"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
              <label for="disponibilite" class="ml-2 block text-sm text-gray-900">
                Produit disponible à la vente
              </label>
            </div>
            <div class="flex items-center mt-3">
              <input type="checkbox" formControlName="excluCatalogue" id="excluCatalogue"
                class="h-4 w-4 text-orange-500 focus:ring-orange-400 border-gray-300 rounded">
              <label for="excluCatalogue" class="ml-2 block text-sm text-gray-900">
                Exclure du catalogue publicitaire (Meta, Google)
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-6">
            <button type="button" (click)="goBack()"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" [disabled]="produitForm.invalid || saving"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="saving" class="flex items-center">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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

  // Images persistées (après migration)
  existingImages: ImageProduit[] = [];
  // Fallback : URLs depuis l'ancienne table (avant migration, pas d'id)
  legacyImages: string[] = [];
  // Fichiers sélectionnés localement, pas encore uploadés
  pendingFiles: {file: File; preview: string}[] = [];
  isUploadingImages = false;
  imageToDelete: ImageProduit | null = null;
  reorderDirty = false;
  isSavingReorder = false;

  // Vidéos de présentation
  produitVideos: VideoProduit[] = [];
  videoLienUrl = '';
  videoLienApercu: string | null = null;
  isAddingVideo = false;
  isUploadingVideo = false;
  videoUploadProgress = 0;
  videoToDelete: VideoProduit | null = null;

  // Fiche technique
  selectedFicheTechnique: File | null = null;
  currentFicheTechnique: string | null = null;

  // Attributs dynamiques
  editableAttributs: EditableAttribut[] = [];
  modelesAttributs: ModeleAttribut[] = [];
  newAttributNom = '';
  newAttributValeur = '';

  get suggestedModeles(): ModeleAttribut[] {
    const usedNames = new Set(this.editableAttributs.map(a => a.nomAttribut));
    return this.modelesAttributs.filter(m => !usedNames.has(m.nomAttribut));
  }

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
      modeleFabricant: [''],
      ean: ['', [Validators.pattern('^(\\d{8}|\\d{12}|\\d{13}|\\d{14})$')]],
      disponibilite: [true],
      excluCatalogue: [false]
    });
  }

  private checkEditMode(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nouveau') {
        this.isEditing = true;
        this.produitId = parseInt(id);
        this.loadProduit();
      }
    });
  }

  private loadInitialData(): void {
    this.loading = true;
    Promise.all([
      this.apiService.getCategories().toPromise(),
      this.apiService.getMarques().toPromise()
    ]).then(([categories, marques]) => {
      this.categories = categories || [];
      this.marques = marques || [];
      this.loading = false;
    }).catch(() => {
      this.toastService.error('Erreur', 'Impossible de charger les données');
      this.loading = false;
    });
  }

  private loadProduit(): void {
    if (!this.produitId) return;
    this.apiService.getProduitById(this.produitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produit) => this.populateForm(produit),
        error: () => {
          this.toastService.error('Erreur', 'Impossible de charger le produit');
          this.goBack();
        }
      });
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
      modeleFabricant: produit.modeleFabricant || '',
      ean: produit.ean || '',
      disponibilite: produit.disponibilite,
      excluCatalogue: produit.excluCatalogue ?? false
    });

    // Images : d'abord images[] (après migration), sinon listeImages (avant migration)
    if (produit.images && produit.images.length > 0) {
      this.existingImages = [...produit.images].sort((a, b) => a.ordre - b.ordre);
    } else if (produit.listeImages && produit.listeImages.length > 0) {
      this.legacyImages = [...produit.listeImages];
    }

    // Vidéos
    if (produit.videos && produit.videos.length > 0) {
      this.produitVideos = [...produit.videos].sort((a, b) => a.ordre - b.ordre);
    }

    if (produit.ficheTechniquePDF) {
      this.currentFicheTechnique = produit.ficheTechniquePDF;
    }

    // Attributs
    if (produit.attributs && produit.attributs.length > 0) {
      this.editableAttributs = produit.attributs.map(a => ({
        idAttribut: a.idAttribut,
        nomAttribut: a.nomAttribut,
        valeurAttribut: a.valeurAttribut,
        modeleAttributId: a.modeleAttributId,
        type: 'TEXT' as const,
        valeursAutorisees: [],
        obligatoire: false,
        isNew: false
      }));
    }

    // Charger les modèles de la catégorie
    if (produit.categorie?.idCategorie) {
      this.loadModelesForCategorie(produit.categorie.idCategorie);
    }
  }

  // === CATÉGORIE → charger les modèles d'attributs ===

  onCategorieChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const catId = parseInt(select.value);
    if (catId) {
      this.loadModelesForCategorie(catId);
    } else {
      this.modelesAttributs = [];
    }
  }

  private loadModelesForCategorie(catId: number): void {
    this.apiService.getModelesByCategorie(catId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modeles) => {
          this.modelesAttributs = modeles;
          // Enrichir les attributs existants avec le type du modèle
          this.editableAttributs = this.editableAttributs.map(attr => {
            const modele = modeles.find(m => m.idModele === attr.modeleAttributId || m.nomAttribut === attr.nomAttribut);
            if (modele) {
              return {
                ...attr,
                type: modele.typeValeur,
                valeursAutorisees: this.parseValeursAutorisees(modele.valeursAutorisees),
                unite: modele.unite,
                obligatoire: modele.obligatoire
              };
            }
            return attr;
          });
        },
        error: () => { /* pas bloquant */ }
      });
  }

  private parseValeursAutorisees(json?: string): string[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  // === ATTRIBUTS DYNAMIQUES ===

  addAttributFromModele(modele: ModeleAttribut): void {
    this.editableAttributs.push({
      nomAttribut: modele.nomAttribut,
      valeurAttribut: '',
      modeleAttributId: modele.idModele,
      type: modele.typeValeur,
      valeursAutorisees: this.parseValeursAutorisees(modele.valeursAutorisees),
      unite: modele.unite,
      obligatoire: modele.obligatoire,
      isNew: true
    });
  }

  addAttributLibre(): void {
    const nom = this.newAttributNom.trim();
    if (!nom) return;
    this.editableAttributs.push({
      nomAttribut: nom,
      valeurAttribut: this.newAttributValeur.trim(),
      type: 'TEXT',
      valeursAutorisees: [],
      obligatoire: false,
      isNew: true
    });
    this.newAttributNom = '';
    this.newAttributValeur = '';
  }

  removeAttribut(index: number): void {
    this.editableAttributs.splice(index, 1);
  }

  // === GESTION DES IMAGES ===

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Erreur', `${file.name} dépasse 5 MB`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Erreur', `${file.name} n'est pas une image`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.pendingFiles.push({file, preview: e.target?.result as string});
      };
      reader.readAsDataURL(file);
    }
  }

  removePendingFile(index: number): void {
    this.pendingFiles.splice(index, 1);
  }

  async uploadPendingImages(): Promise<void> {
    if (!this.produitId || this.pendingFiles.length === 0) return;
    this.isUploadingImages = true;
    try {
      const files = this.pendingFiles.map(pf => pf.file);
      const uploaded = await this.apiService.uploadImages(this.produitId, files).toPromise();
      if (uploaded) {
        this.existingImages.push(...uploaded);
        this.legacyImages = []; // les nouvelles images remplacent le fallback
        this.pendingFiles = [];
        this.toastService.success('Succès', `${uploaded.length} image(s) uploadée(s)`);
      }
    } catch {
      this.toastService.error('Erreur', 'Impossible d\'uploader les images');
    } finally {
      this.isUploadingImages = false;
    }
  }

  confirmDeleteImage(img: ImageProduit): void {
    this.imageToDelete = img;
  }

  async executeDeleteImage(): Promise<void> {
    if (!this.imageToDelete || !this.produitId) return;
    const img = this.imageToDelete;
    this.imageToDelete = null;
    try {
      await this.apiService.deleteProductImage(this.produitId, img.idImage).toPromise();
      this.existingImages = this.existingImages.filter(i => i.idImage !== img.idImage);
      this.toastService.success('Succès', 'Image supprimée');
    } catch {
      this.toastService.error('Erreur', 'Impossible de supprimer l\'image');
    }
  }

  async setAsPrincipale(img: ImageProduit): Promise<void> {
    if (!this.produitId) return;
    try {
      await this.apiService.setImagePrincipale(this.produitId, img.idImage).toPromise();
      this.existingImages.forEach(i => i.principale = i.idImage === img.idImage);
      this.toastService.success('Succès', 'Image principale définie');
    } catch {
      this.toastService.error('Erreur', 'Impossible de définir l\'image principale');
    }
  }

  moveImageUp(index: number): void {
    if (index === 0) return;
    [this.existingImages[index - 1], this.existingImages[index]] = [this.existingImages[index], this.existingImages[index - 1]];
    this.reorderDirty = true;
  }

  moveImageDown(index: number): void {
    if (index === this.existingImages.length - 1) return;
    [this.existingImages[index], this.existingImages[index + 1]] = [this.existingImages[index + 1], this.existingImages[index]];
    this.reorderDirty = true;
  }

  async saveReorder(): Promise<void> {
    if (!this.produitId) return;
    this.isSavingReorder = true;
    try {
      const orderedIds = this.existingImages.map(i => i.idImage);
      const result = await this.apiService.reorderImages(this.produitId, orderedIds).toPromise();
      if (result) {
        this.existingImages = result;
        this.reorderDirty = false;
        this.toastService.success('Succès', 'Ordre des images enregistré');
      }
    } catch {
      this.toastService.error('Erreur', 'Impossible de réordonner les images');
    } finally {
      this.isSavingReorder = false;
    }
  }

  // === VIDÉOS DE PRÉSENTATION ===

  ajouterVideoLien(): void {
    if (!this.videoLienUrl.trim() || !this.produitId) return;
    this.isAddingVideo = true;
    this.apiService.ajouterVideoLien(this.produitId, this.videoLienUrl.trim())
      .subscribe({
        next: (video) => {
          this.produitVideos = [...this.produitVideos, video].sort((a, b) => a.ordre - b.ordre);
          this.videoLienUrl = '';
          this.videoLienApercu = null;
          this.isAddingVideo = false;
          this.toastService.success('Succès', 'Vidéo ajoutée');
        },
        error: (err) => {
          this.isAddingVideo = false;
          const msg = err?.error?.message || 'URL non reconnue ou limite atteinte';
          this.toastService.error('Erreur', msg);
        }
      });
  }

  /** Aperçu en temps réel pour YouTube */
  onVideoLienChange(): void {
    const yt = this.videoLienUrl.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    this.videoLienApercu = yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
  }

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.produitId) return;

    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowed.includes(file.type)) {
      this.toastService.error('Erreur', 'Format non autorisé. Utilisez MP4, MOV ou WebM.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.toastService.error('Erreur', 'Le fichier dépasse 50 Mo.');
      return;
    }

    this.isUploadingVideo = true;
    this.videoUploadProgress = 0;

    this.apiService.getVideoSignature(this.produitId).subscribe({
      next: (sig) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sig.apiKey);
        formData.append('timestamp', sig.timestamp.toString());
        formData.append('signature', sig.signature);
        formData.append('folder', sig.folder);
        formData.append('allowed_formats', sig.allowedFormats);

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            this.videoUploadProgress = Math.round((e.loaded / e.total) * 100);
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            this.apiService.confirmerUploadVideo(this.produitId!, {
              publicId: result.public_id,
              secureUrl: result.secure_url,
              originalFilename: file.name,
              bytes: result.bytes,
              format: result.format,
              titre: file.name.replace(/\.[^.]+$/, '')
            }).subscribe({
              next: (video) => {
                this.produitVideos = [...this.produitVideos, video].sort((a, b) => a.ordre - b.ordre);
                this.isUploadingVideo = false;
                this.videoUploadProgress = 0;
                this.toastService.success('Succès', 'Vidéo uploadée');
              },
              error: () => {
                this.isUploadingVideo = false;
                this.toastService.error('Erreur', 'Erreur lors de la confirmation');
              }
            });
          } else {
            this.isUploadingVideo = false;
            this.toastService.error('Erreur', 'Échec de l\'upload Cloudinary');
          }
        });
        xhr.addEventListener('error', () => {
          this.isUploadingVideo = false;
          this.toastService.error('Erreur', 'Erreur réseau pendant l\'upload');
        });
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);
        xhr.send(formData);
      },
      error: () => {
        this.isUploadingVideo = false;
        this.toastService.error('Erreur', 'Impossible d\'obtenir la signature d\'upload');
      }
    });
  }

  toggleVideoActif(video: VideoProduit): void {
    if (!this.produitId || !video.id) return;
    this.apiService.toggleVideoActif(this.produitId, video.id).subscribe({
      next: (updated) => {
        const idx = this.produitVideos.findIndex(v => v.id === video.id);
        if (idx >= 0) this.produitVideos[idx] = updated;
      },
      error: () => this.toastService.error('Erreur', 'Impossible de modifier la vidéo')
    });
  }

  monterVideo(index: number): void {
    if (index === 0 || !this.produitId) return;
    const video = this.produitVideos[index];
    if (!video.id) return;
    this.apiService.modifierOrdreVideo(this.produitId, video.id, index - 1).subscribe({
      next: () => {
        [this.produitVideos[index - 1], this.produitVideos[index]] =
          [this.produitVideos[index], this.produitVideos[index - 1]];
      }
    });
  }

  descendreVideo(index: number): void {
    if (index >= this.produitVideos.length - 1 || !this.produitId) return;
    const video = this.produitVideos[index];
    if (!video.id) return;
    this.apiService.modifierOrdreVideo(this.produitId, video.id, index + 1).subscribe({
      next: () => {
        [this.produitVideos[index], this.produitVideos[index + 1]] =
          [this.produitVideos[index + 1], this.produitVideos[index]];
      }
    });
  }

  demanderSuppressionVideo(video: VideoProduit): void {
    this.videoToDelete = video;
  }

  executerSuppressionVideo(): void {
    if (!this.videoToDelete || !this.produitId || !this.videoToDelete.id) return;
    const id = this.videoToDelete.id;
    this.apiService.supprimerVideo(this.produitId, id).subscribe({
      next: () => {
        this.produitVideos = this.produitVideos.filter(v => v.id !== id);
        this.videoToDelete = null;
        this.toastService.success('Succès', 'Vidéo supprimée');
      },
      error: () => this.toastService.error('Erreur', 'Impossible de supprimer la vidéo')
    });
  }

  // === FICHE TECHNIQUE ===

  onFicheTechniqueSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.toastService.error('Erreur', 'Seuls les fichiers PDF sont autorisés');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('Erreur', 'Le fichier ne doit pas dépasser 10 MB');
      return;
    }
    this.selectedFicheTechnique = file;
  }

  removeFicheTechnique(): void {
    this.currentFicheTechnique = null;
    this.selectedFicheTechnique = null;
  }

  getFicheTechniqueUrl(): string {
    if (!this.currentFicheTechnique) return '';
    if (this.currentFicheTechnique.startsWith('http')) return this.currentFicheTechnique;
    return `${environment.apiUrl.replace('/api', '')}/uploads/${this.currentFicheTechnique}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // === SOUMISSION ===

  async onSubmit(): Promise<void> {
    if (!this.produitForm.valid) {
      this.markFormGroupTouched();
      this.toastService.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.saving = true;
    try {
      const produitData = this.prepareProduitData();
      let produit: Produit | undefined;

      if (this.isEditing && this.produitId) {
        produit = await this.adminService.updateProduit(this.produitId, produitData).toPromise();
      } else {
        produit = await this.adminService.createProduit(produitData).toPromise();
      }

      if (!produit?.idProduit) throw new Error('Pas d\'ID produit retourné');

      // Upload des images en attente
      if (this.pendingFiles.length > 0) {
        try {
          const files = this.pendingFiles.map(pf => pf.file);
          const uploaded = await this.apiService.uploadImages(produit.idProduit, files).toPromise();
          if (uploaded) {
            this.existingImages.push(...uploaded);
            this.pendingFiles = [];
          }
        } catch {
          this.toastService.warning('Attention', 'Produit sauvegardé mais erreur lors de l\'upload des images');
        }
      }

      // Upload fiche technique
      if (this.selectedFicheTechnique) {
        try {
          await this.apiService.uploadFicheTechnique(produit.idProduit, this.selectedFicheTechnique).toPromise();
          this.selectedFicheTechnique = null;
        } catch {
          this.toastService.warning('Attention', 'Produit sauvegardé mais erreur lors de l\'upload de la fiche technique');
        }
      }

      // Sync attributs en mode création (en édition ils sont gérés live)
      if (!this.isEditing) {
        await this.syncAttributs(produit.idProduit);
      } else if (this.isEditing && this.produitId) {
        await this.syncAttributs(this.produitId);
      }

      this.toastService.success('Succès', this.isEditing ? 'Produit modifié avec succès' : 'Produit créé avec succès');
      this.goBack();
    } catch (error) {
      this.toastService.error('Erreur', 'Impossible de sauvegarder le produit');
    } finally {
      this.saving = false;
    }
  }

  private async syncAttributs(produitId: number): Promise<void> {
    const newAttributs = this.editableAttributs.filter(a => a.isNew);
    for (const attr of newAttributs) {
      try {
        await this.apiService.createAttribut(produitId, {
          nomAttribut: attr.nomAttribut,
          valeurAttribut: attr.valeurAttribut,
          modeleAttributId: attr.modeleAttributId
        }).toPromise();
      } catch { /* ignorer les erreurs individuelles */ }
    }
    // Mise à jour des attributs existants modifiés
    const existingAttributs = this.editableAttributs.filter(a => !a.isNew && a.idAttribut);
    for (const attr of existingAttributs) {
      try {
        await this.apiService.updateAttribut(produitId, attr.idAttribut!, {
          valeurAttribut: attr.valeurAttribut
        }).toPromise();
      } catch { /* ignorer */ }
    }
  }

  private prepareProduitData(): Partial<Produit> {
    const formValue = this.produitForm.value;
    return {
      nomProduit: formValue.nomProduit,
      descriptionProduit: formValue.descriptionProduit,
      prix: parseFloat(formValue.prix),
      stockDisponible: parseInt(formValue.stockDisponible) || 0,
      refProduit: formValue.refProduit || undefined,
      puissanceBTU: formValue.puissanceBTU ? parseInt(formValue.puissanceBTU) : undefined,
      consommationWatt: formValue.consommationWatt ? parseInt(formValue.consommationWatt) : undefined,
      labelEnergie: formValue.labelEnergie || undefined,
      dimensions: formValue.dimensions || undefined,
      poids: formValue.poids ? parseFloat(formValue.poids) : undefined,
      garantie: formValue.garantie || undefined,
      modeleFabricant: formValue.modeleFabricant || undefined,
      ean: formValue.ean || undefined,
      disponibilite: formValue.disponibilite,
      excluCatalogue: formValue.excluCatalogue,
      categorie: formValue.categorieId ? {idCategorie: parseInt(formValue.categorieId)} as Categorie : undefined,
      marque: formValue.marqueId ? {idMarque: parseInt(formValue.marqueId)} as Marque : undefined,
      ficheTechniquePDF: this.currentFicheTechnique || undefined
    };
  }

  // === UTILITAIRES ===

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.produitForm.get(fieldName);
    return !!(field?.errors?.[errorType] && field.touched);
  }

  private markFormGroupTouched(): void {
    Object.values(this.produitForm.controls).forEach(c => c.markAsTouched());
  }

  goBack(): void {
    this.router.navigate(['/admin/produits']);
  }
}
