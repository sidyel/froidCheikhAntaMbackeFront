import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ContenuService } from '../../../services/contenu.service';

export interface ContentColumn {
  key: string;
  label: string;
  type?: 'text' | 'image' | 'badge' | 'list';
}

export interface ContentFormField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'url' | 'list';
  required?: boolean;
}

export interface ContentManagerConfig {
  entityType: string;
  title: string;
  imageField?: string;
  columns: ContentColumn[];
  formFields: ContentFormField[];
}

@Component({
  selector: 'app-content-manager',
  template: `
    <div class="content-manager p-4">
      <div class="cm-header flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">{{ config.title }}</h2>
        <button class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                (click)="openCreateModal()">
          <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
          Ajouter
        </button>
      </div>

      <p class="text-gray-500 text-sm mb-4">
        Glissez-déposez pour réordonner. Sur mobile, utilisez ↑ ↓.
      </p>

      <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="flex flex-col gap-2">
        <div *ngFor="let item of items; let i = index"
             cdkDrag
             class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">

          <div cdkDragHandle class="cursor-grab text-gray-400 hidden sm:block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>

          <div *ngIf="config.imageField" class="w-16 h-16 flex-shrink-0">
            <img [src]="item[config.imageField!] || 'assets/images/logo.png'"
                 [alt]="item['nom'] || item['titre'] || ''"
                 class="w-full h-full object-cover rounded"
                 (error)="onImgError($event)">
          </div>

          <div class="flex-1 min-w-0">
            <ng-container *ngFor="let col of config.columns">
              <div *ngIf="col.type !== 'image'" class="text-sm text-gray-700 truncate">
                <strong>{{ col.label }}:</strong> {{ item[col.key] }}
              </div>
            </ng-container>
          </div>

          <div class="flex items-center gap-1 flex-shrink-0">
            <button (click)="moveUp(i)" [disabled]="i === 0"
                    class="p-1 border border-gray-200 rounded text-xs hover:bg-gray-50 disabled:opacity-30"
                    title="Monter">↑</button>
            <button (click)="moveDown(i)" [disabled]="i === items.length - 1"
                    class="p-1 border border-gray-200 rounded text-xs hover:bg-gray-50 disabled:opacity-30"
                    title="Descendre">↓</button>

            <button class="p-1 border rounded"
                    [class.border-green-500]="item['actif']"
                    [class.text-green-600]="item['actif']"
                    [class.border-gray-300]="!item['actif']"
                    [class.text-gray-400]="!item['actif']"
                    (click)="toggleActif(item)"
                    [title]="item['actif'] ? 'Désactiver' : 'Activer'">
              <lucide-icon [name]="item['actif'] ? 'eye' : 'eye-off'" class="w-4 h-4"></lucide-icon>
            </button>

            <button *ngIf="config.imageField"
                    class="p-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                    (click)="triggerUpload(item)" title="Changer l'image">
              <lucide-icon name="upload" class="w-4 h-4"></lucide-icon>
            </button>

            <button class="p-1 border border-blue-300 rounded text-blue-600 hover:bg-blue-50"
                    (click)="openEditModal(item)">
              <lucide-icon name="edit" class="w-4 h-4"></lucide-icon>
            </button>

            <button class="p-1 border border-red-300 rounded text-red-600 hover:bg-red-50"
                    (click)="confirmDelete(item)">
              <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal ajout/édition -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
           (click)="closeModal()">
        <div class="bg-white p-6 rounded-xl w-full max-w-lg max-h-screen overflow-y-auto mx-4"
             (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold mb-4">{{ editingItem ? 'Modifier' : 'Ajouter' }}</h3>
          <form (ngSubmit)="saveItem()">
            <ng-container *ngFor="let field of config.formFields">
              <div class="mb-4">
                <label class="block text-sm font-semibold mb-1">
                  {{ field.label }}<span *ngIf="field.required" class="text-red-500">*</span>
                </label>
                <textarea *ngIf="field.type === 'textarea'"
                          [(ngModel)]="formData[field.key]"
                          [name]="field.key" rows="3"
                          class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                <input *ngIf="field.type !== 'textarea' && field.type !== 'list'"
                       [type]="field.type === 'url' ? 'url' : 'text'"
                       [(ngModel)]="formData[field.key]"
                       [name]="field.key"
                       class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </ng-container>
            <div class="flex justify-end gap-2 mt-4">
              <button type="button" (click)="closeModal()"
                      class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)">
    </div>
  `,
  styles: [`
    .hidden { display: none; }
  `]
})
export class ContentManagerComponent implements OnInit {
  @Input() config!: ContentManagerConfig;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  items: any[] = [];
  showModal = false;
  editingItem: any = null;
  formData: any = {};
  private uploadTarget: any = null;

  constructor(private contenuService: ContenuService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.contenuService.getAdminItems(this.config.entityType).subscribe({
      next: (data) => this.items = data,
      error: (e) => console.error('Erreur chargement contenu:', e)
    });
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.saveOrdre();
  }

  moveUp(i: number): void {
    if (i > 0) { moveItemInArray(this.items, i, i - 1); this.saveOrdre(); }
  }

  moveDown(i: number): void {
    if (i < this.items.length - 1) { moveItemInArray(this.items, i, i + 1); this.saveOrdre(); }
  }

  private saveOrdre(): void {
    const items = this.items.map((item, i) => ({ id: item.id, ordre: i }));
    this.contenuService.updateOrdre(this.config.entityType, items).subscribe();
  }

  toggleActif(item: any): void {
    this.contenuService.updateItem(this.config.entityType, item.id, { ...item, actif: !item.actif }).subscribe({
      next: () => item.actif = !item.actif
    });
  }

  openCreateModal(): void {
    this.editingItem = null;
    this.formData = {};
    this.showModal = true;
  }

  openEditModal(item: any): void {
    this.editingItem = item;
    this.formData = { ...item };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.formData = {};
  }

  saveItem(): void {
    if (this.editingItem) {
      this.contenuService.updateItem(this.config.entityType, this.editingItem.id, this.formData).subscribe({
        next: () => { this.loadItems(); this.closeModal(); }
      });
    } else {
      this.contenuService.createItem(this.config.entityType, this.formData).subscribe({
        next: () => { this.loadItems(); this.closeModal(); }
      });
    }
  }

  confirmDelete(item: any): void {
    if (confirm(`Supprimer "${item.nom || item.titre || item.altText}" ?`)) {
      this.contenuService.deleteItem(this.config.entityType, item.id).subscribe({
        next: () => this.loadItems()
      });
    }
  }

  triggerUpload(item: any): void {
    this.uploadTarget = item;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.uploadTarget) return;
    this.contenuService.uploadImage(this.config.entityType, this.uploadTarget.id, file).subscribe({
      next: () => { this.loadItems(); this.uploadTarget = null; }
    });
  }

  onImgError(event: any): void {
    event.target.src = 'assets/images/logo.png';
  }
}
