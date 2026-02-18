import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly PLACEHOLDER_IMAGE = 'assets/images/placeholder.jpg';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly API_URL = environment.apiUrl;
  private readonly BASE_URL = this.API_URL.replace('/api', ''); // Enlever /api pour les fichiers statiques


  constructor(private apiService: ApiService,private http: HttpClient) {}

  /**
   * Upload d'image de catégorie
   */
  uploadCategorieImage(categorieId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    console.log('📤 Upload image catégorie:', categorieId, file.name);
    return this.http.post(`${this.API_URL}/categories/${categorieId}/image`, formData, {
      responseType: 'text'
    });
  }

  /**
   * Supprimer image de catégorie
   */
  deleteCategorieImage(categorieId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/categories/${categorieId}/image`);
  }
  /**
   * Valide un fichier image
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Aucun fichier sélectionné' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'Le fichier ne doit pas dépasser 5MB' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP' };
    }

    return { valid: true };
  }

  /**
   * Valide plusieurs fichiers images
   */
  validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!files || files.length === 0) {
      errors.push('Aucun fichier sélectionné');
    }

    files.forEach((file, index) => {
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        errors.push(`Fichier ${index + 1}: ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Créer une prévisualisation d'image
   */
  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject('Fichier invalide');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = () => reject('Erreur lors de la lecture du fichier');
      reader.readAsDataURL(file);
    });
  }



  /**
   * Créer des prévisualisations pour plusieurs images
   */
  async createImagePreviews(files: File[]): Promise<string[]> {
    const previews: string[] = [];

    for (const file of files) {
      try {
        const preview = await this.createImagePreview(file);
        previews.push(preview);
      } catch (error) {
        console.warn('Erreur lors de la création de la prévisualisation:', error);
        previews.push(this.PLACEHOLDER_IMAGE);
      }
    }

    return previews;
  }

  /**
   * Obtenir l'URL d'affichage d'une image
   */
  getImageUrl(imagePath: string | null | undefined): string {
    return this.apiService.getImageUrl(imagePath);
  }

  /**
   * Redimensionner une image (optionnel - pour optimiser les uploads)
   */
  resizeImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Redimensionner
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en blob puis en fichier
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject('Erreur lors du redimensionnement');
          }
        }, file.type, quality);
      };

      img.onerror = () => reject('Erreur lors du chargement de l\'image');
      img.src = URL.createObjectURL(file);
    });
  }
}
