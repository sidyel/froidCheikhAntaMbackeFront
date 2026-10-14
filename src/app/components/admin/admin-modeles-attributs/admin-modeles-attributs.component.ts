// src/app/components/admin/admin-modeles-attributs/admin-modeles-attributs.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Categorie, ModeleAttribut } from '../../../models/interfaces';

const TYPE_LABELS: Record<string, string> = {
  TEXT: 'Texte',
  NUMBER: 'Nombre',
  BOOLEAN: 'Oui / Non',
  SELECT: 'Choix'
};

interface ModeleForm {
  nomAttribut: string;
  description: string;
  typeValeur: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  valeursAutorisees: string;  // JSON string
  unite: string;
  obligatoire: boolean;
  ordre: number;
  categorieIds: number[];
}

@Component({
  selector: 'app-admin-modeles-attributs',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Modèles d'attributs</h1>
          <p class="text-gray-600">Définissez les attributs proposés selon la catégorie produit</p>
        </div>
        <button (click)="openCreate()"
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <lucide-icon name="plus" class="inline mr-2 h-4 w-4"></lucide-icon>
          Nouveau modèle
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div class="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Filtre par catégorie -->
      <div *ngIf="!loading" class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700">Filtrer par catégorie :</label>
          <select [(ngModel)]="filtreCategorie" (change)="onFiltreChange()"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500">
            <option [ngValue]="null">Toutes les catégories</option>
            <option *ngFor="let cat of categories" [ngValue]="cat.idCategorie">{{ cat.nomCategorie }}</option>
          </select>
          <span class="text-sm text-gray-500">{{ filteredModeles.length }} modèle(s)</span>
        </div>
      </div>

      <!-- Liste des modèles -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg overflow-hidden">
        <table *ngIf="filteredModeles.length > 0" class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité / Valeurs</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégories</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let modele of filteredModeles" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ modele.nomAttribut }}</div>
                <div *ngIf="modele.description" class="text-xs text-gray-500">{{ modele.description }}</div>
                <span *ngIf="modele.obligatoire"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 mt-1">
                  Obligatoire
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="{
                    'bg-blue-100 text-blue-800': modele.typeValeur === 'TEXT',
                    'bg-purple-100 text-purple-800': modele.typeValeur === 'NUMBER',
                    'bg-green-100 text-green-800': modele.typeValeur === 'BOOLEAN',
                    'bg-orange-100 text-orange-800': modele.typeValeur === 'SELECT'
                  }">
                  {{ typeLabel(modele.typeValeur) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">
                <span *ngIf="modele.unite">{{ modele.unite }}</span>
                <span *ngIf="modele.typeValeur === 'SELECT' && modele.valeursAutorisees"
                  class="text-xs text-gray-500">{{ modele.valeursAutorisees }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span *ngIf="!modele.categorieIds?.length" class="text-xs text-gray-400">Toutes</span>
                  <span *ngFor="let catId of modele.categorieIds"
                    class="inline-flex px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                    {{ getCatNom(catId) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ modele.ordre }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button (click)="openEdit(modele)" class="text-primary-600 hover:text-primary-800 mr-3" title="Modifier">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button (click)="confirmDelete(modele)" class="text-red-600 hover:text-red-800" title="Supprimer">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="filteredModeles.length === 0" class="text-center py-12">
          <lucide-icon name="tag" class="h-12 w-12 text-gray-300 mx-auto mb-4"></lucide-icon>
          <p class="text-gray-500">Aucun modèle d'attribut trouvé.</p>
        </div>
      </div>

      <!-- Modal création / édition -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        (click)="closeModal()">
        <div class="bg-white rounded-xl w-full max-w-lg max-h-screen overflow-y-auto"
          (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">
              {{ editingModele ? 'Modifier le modèle' : 'Nouveau modèle d\'attribut' }}
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'attribut *</label>
                <input type="text" [(ngModel)]="form.nomAttribut"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Fluide frigorigène">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" [(ngModel)]="form.description"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Courte description optionnelle">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type de valeur *</label>
                <select [(ngModel)]="form.typeValeur"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500">
                  <option value="TEXT">Texte</option>
                  <option value="NUMBER">Nombre</option>
                  <option value="BOOLEAN">Oui / Non</option>
                  <option value="SELECT">Choix (liste)</option>
                </select>
              </div>

              <div *ngIf="form.typeValeur === 'NUMBER'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                <input type="text" [(ngModel)]="form.unite"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: BTU, W, kg...">
              </div>

              <div *ngIf="form.typeValeur === 'SELECT'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Valeurs autorisées</label>
                <textarea [(ngModel)]="form.valeursAutorisees" rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder='["R32","R410A","R134a"]'></textarea>
                <p class="text-xs text-gray-400 mt-1">Format JSON : ["valeur1","valeur2"]</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" id="obligatoire" [(ngModel)]="form.obligatoire"
                  class="h-4 w-4 text-primary-600 border-gray-300 rounded">
                <label for="obligatoire" class="text-sm text-gray-700">Attribut obligatoire</label>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                <input type="number" [(ngModel)]="form.ordre" min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Catégories associées</label>
                <div class="max-h-36 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  <label *ngFor="let cat of categories" class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      [checked]="form.categorieIds.includes(cat.idCategorie)"
                      (change)="toggleCategorie(cat.idCategorie)"
                      class="h-3 w-3 text-primary-600 border-gray-300 rounded">
                    <span class="text-sm text-gray-700">{{ cat.nomCategorie }}</span>
                  </label>
                </div>
                <p class="text-xs text-gray-400 mt-1">Laisser vide = s'applique à toutes les catégories</p>
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button type="button" (click)="closeModal()"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button type="button" (click)="saveModele()" [disabled]="saving || !form.nomAttribut.trim()"
                class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50">
                {{ saving ? 'Enregistrement...' : (editingModele ? 'Modifier' : 'Créer') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation suppression -->
      <div *ngIf="modeleToDelete" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full">
          <h3 class="text-lg font-bold text-gray-900 mb-2">Supprimer ce modèle ?</h3>
          <p class="text-sm text-gray-600 mb-4">
            Supprimer "{{ modeleToDelete.nomAttribut }}" ? Les attributs produits liés seront orphelins mais conservés.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="modeleToDelete = null" class="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Annuler</button>
            <button (click)="executeDelete()" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminModelesAttributsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  modeles: ModeleAttribut[] = [];
  categories: Categorie[] = [];
  loading = false;
  saving = false;

  filtreCategorie: number | null = null;

  showModal = false;
  editingModele: ModeleAttribut | null = null;
  modeleToDelete: ModeleAttribut | null = null;

  form: ModeleForm = this.emptyForm();

  get filteredModeles(): ModeleAttribut[] {
    if (!this.filtreCategorie) return this.modeles;
    return this.modeles.filter(m =>
      !m.categorieIds?.length || m.categorieIds.includes(this.filtreCategorie!)
    );
  }

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private load(): void {
    this.loading = true;
    Promise.all([
      this.apiService.getModeles().toPromise(),
      this.apiService.getCategories().toPromise()
    ]).then(([modeles, categories]) => {
      this.modeles = modeles || [];
      this.categories = categories || [];
      this.loading = false;
    }).catch(() => {
      this.toastService.error('Erreur', 'Impossible de charger les données');
      this.loading = false;
    });
  }

  private emptyForm(): ModeleForm {
    return {
      nomAttribut: '',
      description: '',
      typeValeur: 'TEXT',
      valeursAutorisees: '',
      unite: '',
      obligatoire: false,
      ordre: 0,
      categorieIds: []
    };
  }

  openCreate(): void {
    this.editingModele = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEdit(modele: ModeleAttribut): void {
    this.editingModele = modele;
    this.form = {
      nomAttribut: modele.nomAttribut,
      description: modele.description || '',
      typeValeur: modele.typeValeur,
      valeursAutorisees: modele.valeursAutorisees || '',
      unite: modele.unite || '',
      obligatoire: modele.obligatoire,
      ordre: modele.ordre,
      categorieIds: [...(modele.categorieIds || [])]
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingModele = null;
  }

  toggleCategorie(catId: number): void {
    const idx = this.form.categorieIds.indexOf(catId);
    if (idx >= 0) {
      this.form.categorieIds.splice(idx, 1);
    } else {
      this.form.categorieIds.push(catId);
    }
  }

  async saveModele(): Promise<void> {
    if (!this.form.nomAttribut.trim()) return;
    this.saving = true;
    const payload: Partial<ModeleAttribut> = {
      nomAttribut: this.form.nomAttribut.trim(),
      description: this.form.description || undefined,
      typeValeur: this.form.typeValeur,
      valeursAutorisees: this.form.typeValeur === 'SELECT' ? this.form.valeursAutorisees : undefined,
      unite: this.form.typeValeur === 'NUMBER' ? this.form.unite : undefined,
      obligatoire: this.form.obligatoire,
      ordre: this.form.ordre,
      categorieIds: this.form.categorieIds
    };
    try {
      if (this.editingModele) {
        const updated = await this.apiService.updateModele(this.editingModele.idModele, payload).toPromise();
        if (updated) {
          const idx = this.modeles.findIndex(m => m.idModele === this.editingModele!.idModele);
          if (idx >= 0) this.modeles[idx] = updated;
        }
        this.toastService.success('Succès', 'Modèle modifié');
      } else {
        const created = await this.apiService.createModele(payload).toPromise();
        if (created) this.modeles.push(created);
        this.toastService.success('Succès', 'Modèle créé');
      }
      this.closeModal();
    } catch {
      this.toastService.error('Erreur', 'Impossible de sauvegarder le modèle');
    } finally {
      this.saving = false;
    }
  }

  confirmDelete(modele: ModeleAttribut): void {
    this.modeleToDelete = modele;
  }

  async executeDelete(): Promise<void> {
    if (!this.modeleToDelete) return;
    const modele = this.modeleToDelete;
    this.modeleToDelete = null;
    try {
      await this.apiService.deleteModele(modele.idModele).toPromise();
      this.modeles = this.modeles.filter(m => m.idModele !== modele.idModele);
      this.toastService.success('Succès', 'Modèle supprimé');
    } catch {
      this.toastService.error('Erreur', 'Impossible de supprimer le modèle');
    }
  }

  onFiltreChange(): void { /* filtre local, pas d'appel API */ }

  typeLabel(type: string): string {
    return TYPE_LABELS[type] || type;
  }

  getCatNom(catId: number): string {
    return this.categories.find(c => c.idCategorie === catId)?.nomCategorie || String(catId);
  }
}
