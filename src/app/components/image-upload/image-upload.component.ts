// image-upload.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ImageService } from "../../services/image.service";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: 'app-image-upload',
  template: `
    <div class="image-upload-container">

      <!-- Zone de drop -->
      <div
        class="upload-dropzone"
        [class.dragover]="isDragOver"
        [class.has-images]="previews.length > 0"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">

        <input
          #fileInput
          type="file"
          [multiple]="multiple"
          [accept]="acceptedTypes"
          (change)="onFilesSelected($event)"
          class="hidden">

        <div *ngIf="previews.length === 0" class="upload-placeholder">
          <lucide-icon name="upload-cloud" class="icon-large"></lucide-icon>
          <p class="placeholder-title">
            {{ placeholder || 'Cliquez ou glissez vos images ici' }}
          </p>
          <p class="placeholder-sub">
            {{ multiple ? 'Plusieurs images' : 'Une image' }} • Max {{ maxFileSize }}MB • {{ acceptedFormats }}
          </p>
        </div>

        <div *ngIf="previews.length > 0" class="upload-add-more">
          <lucide-icon name="plus" class="icon-small"></lucide-icon>
          <span class="add-more-text">Ajouter {{ multiple ? 'd\'autres images' : 'une nouvelle image' }}</span>
        </div>
      </div>

      <!-- Prévisualisations -->
      <div *ngIf="previews.length > 0" class="previews-grid">
        <div
          *ngFor="let preview of previews; index as i; trackBy: trackByIndex"
          class="preview-item">

          <div class="preview-image-container">
            <img
              [src]="preview"
              [alt]="'Aperçu ' + (i + 1)"
              class="preview-image">

            <!-- Indicateur de téléchargement -->
            <div *ngIf="uploadProgress[i] !== undefined" class="upload-overlay">
              <div class="upload-progress">
                <div class="progress-bar" [style.width.%]="uploadProgress[i]"></div>
              </div>
              <span class="upload-percentage">{{ uploadProgress[i] }}%</span>
            </div>

            <!-- Bouton de suppression -->
            <button
              *ngIf="!isUploading"
              type="button"
              (click)="removePreview(i)"
              class="remove-button"
              aria-label="Supprimer l'image">
              <lucide-icon name="x" class="icon-x"></lucide-icon>
            </button>

            <!-- Indicateur de succès -->
            <div *ngIf="uploadedImages[i]" class="success-indicator" title="Téléchargé">
              <lucide-icon name="check" class="icon-check"></lucide-icon>
            </div>
          </div>

          <!-- Informations du fichier -->
          <div class="file-info">
            <p class="file-name">{{ selectedFiles[i]?.name || 'Image ' + (i + 1) }}</p>
            <p class="file-size">{{ formatFileSize(selectedFiles[i]?.size || 0) }}</p>
          </div>
        </div>
      </div>

      <!-- Messages d'erreur -->
      <div *ngIf="errors.length > 0" class="error-messages">
        <div *ngFor="let error of errors" class="error-item">
          <lucide-icon name="alert-circle" class="icon-alert"></lucide-icon>
          <span class="error-text">{{ error }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div *ngIf="selectedFiles.length > 0 && !autoUpload" class="upload-actions">
        <button
          type="button"
          (click)="clearAll()"
          [disabled]="isUploading"
          class="btn-outline">
          <lucide-icon name="trash-2" class="icon-small"></lucide-icon>
          Tout effacer
        </button>

        <button
          type="button"
          (click)="startUpload()"
          [disabled]="isUploading || selectedFiles.length === 0"
          class="btn-primary">
          <lucide-icon name="upload" class="icon-small" *ngIf="!isUploading"></lucide-icon>
          <div class="spinner" *ngIf="isUploading" role="status" aria-hidden="true"></div>
          {{ isUploading ? 'Téléchargement...' : 'Télécharger' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Dropzone */
    .upload-dropzone {
      position: relative;
      border: 2px dashed #D1D5DB;
      border-radius: 0.5rem;
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all .15s ease;
      background: transparent;
    }
    .upload-dropzone:hover {
      border-color: #60A5FA;
      background: rgba(96,165,250,0.03);
    }
    .upload-dropzone.dragover {
      border-color: #1D4ED8;
      background: rgba(59,130,246,0.08);
    }
    .upload-dropzone.has-images {
      padding: 1rem;
      background: #F9FAFB;
    }

    .hidden { display: none; }

    /* Placeholder */
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 0;
    }
    .icon-large { width: 3rem; height: 3rem; color: #9CA3AF; margin-bottom: 0.75rem; }
    .placeholder-title { font-size: 1.125rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0; }
    .placeholder-sub { font-size: 0.875rem; color: #6B7280; margin: 0; }

    .upload-add-more {
      display:flex;
      align-items:center;
      justify-content:center;
      padding: 0.5rem 0;
    }
    .icon-small { width: 1.25rem; height: 1.25rem; color: #374151; }
    .add-more-text { margin-left: 0.5rem; color: #374151; font-size: 0.875rem; }

    /* Grid previews */
    .previews-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .previews-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1024px) {
      .previews-grid { grid-template-columns: repeat(4, 1fr); }
    }

    .preview-item {
      background: #FFFFFF;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      border: 1px solid #E5E7EB;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Square image container using CSS aspect-ratio */
    .preview-image-container {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1; /* carré */
      overflow: hidden;
      background: #F3F4F6;
    }

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Upload overlay & progress */
    .upload-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .upload-progress {
      width: 75%;
      background: #E5E7EB;
      border-radius: 9999px;
      height: 8px;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }
    .progress-bar {
      background: #2563EB;
      height: 8px;
      border-radius: 9999px;
      transition: width .3s ease;
      width: 0%;
    }
    .upload-percentage {
      color: #FFFFFF;
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* Buttons on image */
    .remove-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #EF4444;
      color: #FFFFFF;
      border-radius: 9999px;
      padding: 0.25rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background .15s ease;
    }
    .remove-button:hover { background: #DC2626; }
    .icon-x { width: 1rem; height: 1rem; }

    .success-indicator {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 9999px;
      padding: 0.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon-check { width: 1rem; height: 1rem; }

    /* File info */
    .file-info { padding: 0.5rem; }
    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: 0;
    }
    .file-size {
      font-size: 0.75rem;
      color: #6B7280;
      margin: 0;
    }

    /* Errors */
    .error-messages {
      display:flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #FFF1F2;
      border: 1px solid #FECACA;
      border-radius: 0.5rem;
    }
    .error-item { display:flex; align-items:center; gap: 0.5rem; }
    .icon-alert { width: 1rem; height: 1rem; color: #EF4444; }
    .error-text { color: #B91C1C; font-size: 0.875rem; }

    /* Actions */
    .upload-actions {
      display:flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #E5E7EB;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #E5E7EB;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .btn-primary {
      background: #2563EB;
      color: #FFFFFF;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #FFFFFF;
      border-top-color: transparent;
      border-radius: 9999px;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ImageUploadComponent implements OnInit {
  @Input() multiple: boolean = true;
  @Input() maxFiles: number = 8;
  @Input() maxFileSize: number = 5; // MB
  @Input() acceptedTypes: string = 'image/*';
  @Input() acceptedFormats: string = 'JPG, PNG, GIF, WebP';
  @Input() placeholder: string = '';
  @Input() autoUpload: boolean = false;
  @Input() existingImages: string[] = [];

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() uploadComplete = new EventEmitter<string[]>();
  @Output() uploadError = new EventEmitter<string[]>();
  @Output() imageRemoved = new EventEmitter<number>();


  selectedFiles: File[] = [];
  previews: string[] = [];
  errors: string[] = [];
  uploadProgress: { [index: number]: number } = {};
  uploadedImages: { [index: number]: boolean } = {};
  isDragOver: boolean = false;
  isUploading: boolean = false;


  constructor(
    private imageService: ImageService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.existingImages && this.existingImages.length > 0) {
      // Créer des prévisualisations à partir des URLs d'images existantes
      this.previews = this.existingImages.map(img => this.imageService.getImageUrl(img));
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processFiles(files);
  }

  onFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files);

    // Reset input
    event.target.value = '';
  }

  private async processFiles(files: File[]): Promise<void> {
    this.errors = [];

    // Validation
    const validation = this.imageService.validateImageFiles(files);
    if (!validation.valid) {
      this.errors = validation.errors;
      return;
    }

    // Vérifier le nombre maximum de fichiers
    if (!this.multiple) {
      this.selectedFiles = [files[0]];
    } else {
      const totalFiles = this.selectedFiles.length + files.length;
      if (totalFiles > this.maxFiles) {
        this.errors.push(`Maximum ${this.maxFiles} fichiers autorisés`);
        return;
      }
      this.selectedFiles.push(...files);
    }

    // Créer les prévisualisations SEULEMENT pour l'affichage local
    try {
      const newPreviews = await this.imageService.createImagePreviews(files);
      if (!this.multiple) {
        this.previews = [...this.existingImages.map(img => this.imageService.getImageUrl(img)), ...newPreviews];
      } else {
        this.previews.push(...newPreviews);
      }
    } catch (error) {
      console.error('Erreur lors de la création des prévisualisations:', error);
    }

    // Émettre SEULEMENT les fichiers sélectionnés, pas les prévisualisations base64
    this.filesSelected.emit(this.selectedFiles);
  }

  removePreview(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
    delete this.uploadProgress[index];
    delete this.uploadedImages[index];

    this.imageRemoved.emit(index);
    this.filesSelected.emit(this.selectedFiles);
  }

  clearAll(): void {
    this.selectedFiles = [];
    this.previews = this.existingImages.map(img => this.imageService.getImageUrl(img));
    this.uploadProgress = {};
    this.uploadedImages = {};
    this.errors = [];

    this.filesSelected.emit(this.selectedFiles);
  }

  async startUpload(): Promise<void> {
    if (this.selectedFiles.length === 0) return;

    this.isUploading = true;
    this.errors = [];

    try {
      // Simuler le progrès d'upload (adapte selon ton API)
      for (let i = 0; i < this.selectedFiles.length; i++) {
        this.uploadProgress[i] = 0;

        // Simulation du progrès
        const interval = setInterval(() => {
          this.uploadProgress[i] = Math.min((this.uploadProgress[i] || 0) + 10, 90);
        }, 100);

        // Ici tu ferais un appel réel : await this.imageService.uploadFile(this.selectedFiles[i], progressCallback)
        await new Promise(resolve => setTimeout(resolve, 1000)); // simulation

        clearInterval(interval);
        this.uploadProgress[i] = 100;
        this.uploadedImages[i] = true;
      }

      // Émettre la completion
      this.uploadComplete.emit(this.previews);
      this.toastService.success('Succès', 'Images téléchargées avec succès');

    } catch (error) {
      const errorMessage = 'Erreur lors du téléchargement des images';
      this.errors.push(errorMessage);
      this.uploadError.emit([errorMessage]);
      this.toastService.error('Erreur', errorMessage);
    } finally {
      this.isUploading = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k)) || 0;

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
