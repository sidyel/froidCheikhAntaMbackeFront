import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LivraisonService } from '../../../services/livraison.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import {
  ZoneLivraisonAdmin,
  ZoneLivraisonCreate,
  CsvPreviewResponse
} from '../../../models/interfaces';

@Component({
  selector: 'app-admin-zones-livraison',
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Zones de livraison</h1>
          <p class="text-gray-600 mt-1">Gérez les zones et tarifs de livraison</p>
        </div>
        <div class="mt-4 sm:mt-0 flex space-x-3" *ngIf="canEdit">
          <button
            (click)="ouvrirImportCsv()"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <lucide-icon name="upload" class="mr-2 h-4 w-4"></lucide-icon>
            Importer CSV
          </button>
          <button
            (click)="ouvrirFormulaire()"
            class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700">
            <lucide-icon name="plus" class="mr-2 h-4 w-4"></lucide-icon>
            Nouvelle zone
          </button>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg p-4 shadow text-center">
          <div class="text-2xl font-bold text-primary-600">{{ zones.length }}</div>
          <div class="text-sm text-gray-500">Total zones</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow text-center">
          <div class="text-2xl font-bold text-green-600">{{ zonesActives }}</div>
          <div class="text-sm text-gray-500">Zones actives</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow text-center">
          <div class="text-2xl font-bold text-blue-600">{{ villes.length }}</div>
          <div class="text-sm text-gray-500">Villes</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow text-center">
          <div class="text-2xl font-bold text-purple-600">{{ zonesExpress }}</div>
          <div class="text-sm text-gray-500">Zones express</div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <select
              [(ngModel)]="filtreVille"
              (change)="appliquerFiltres()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes les villes</option>
              <option *ngFor="let ville of villes" [value]="ville">{{ ville }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              [(ngModel)]="filtreStatut"
              (change)="appliquerFiltres()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Toutes</option>
              <option value="actif">Actives</option>
              <option value="inactif">Inactives</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="filtreRecherche"
                (input)="appliquerFiltres()"
                placeholder="Rechercher un quartier..."
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <lucide-icon name="search" class="absolute left-3 top-3 h-4 w-4 text-gray-400"></lucide-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Liste des zones -->
      <div *ngIf="!loading" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quartier</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix standard</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix express</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Délai</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th *ngIf="canEdit" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let zone of zonesFiltrees" [class.opacity-50]="!zone.actif">
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="font-medium text-gray-900">{{ zone.villeLabel }}</span>
                  <span *ngIf="zone.eligibleLivraisonGratuite" class="ml-1 text-xs text-green-600 bg-green-50 px-1 rounded">gratuit éligible</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-gray-700">{{ zone.quartierLabel }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-gray-900">
                  <span *ngIf="zone.prixStandard === 0" class="text-green-600">Gratuit</span>
                  <span *ngIf="zone.prixStandard > 0">{{ zone.prixStandard | number:'1.0-0' }} FCFA</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-gray-700">
                  <span *ngIf="!zone.expressDisponible" class="text-gray-400 text-xs">N/A</span>
                  <span *ngIf="zone.expressDisponible && !zone.prixExpress" class="text-xs text-blue-600">+ supplément global</span>
                  <span *ngIf="zone.expressDisponible && zone.prixExpress">{{ zone.prixExpress | number:'1.0-0' }} FCFA</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">{{ zone.delaiEstime }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    [class.bg-green-100]="zone.actif"
                    [class.text-green-800]="zone.actif"
                    [class.bg-gray-100]="!zone.actif"
                    [class.text-gray-600]="!zone.actif">
                    {{ zone.actif ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td *ngIf="canEdit" class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    (click)="ouvrirFormulaire(zone)"
                    class="text-primary-600 hover:text-primary-900">
                    <lucide-icon name="edit" class="w-4 h-4 inline"></lucide-icon>
                  </button>
                  <button
                    (click)="toggleActif(zone)"
                    [title]="zone.actif ? 'Désactiver' : 'Activer'"
                    class="text-gray-500 hover:text-gray-800">
                    <lucide-icon [name]="zone.actif ? 'eye-off' : 'eye'" class="w-4 h-4 inline"></lucide-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="zonesFiltrees.length === 0">
                <td [attr.colspan]="canEdit ? 7 : 6" class="px-4 py-8 text-center text-gray-500">
                  Aucune zone trouvée
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ────────────────── MODAL FORMULAIRE ZONE ────────────────── -->
    <div *ngIf="showModal"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ editingZone ? 'Modifier la zone' : 'Nouvelle zone' }}
          </h2>
          <button (click)="fermerModal()" class="text-gray-400 hover:text-gray-600">
            <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
          </button>
        </div>

        <form [formGroup]="zoneForm" (ngSubmit)="sauvegarderZone()" class="p-6 space-y-4">

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ville (slug) *</label>
              <div *ngIf="!nouvelleVille">
                <select
                  formControlName="ville"
                  class="form-input"
                  (change)="onVilleFormChange()">
                  <option value="">Sélectionnez...</option>
                  <option *ngFor="let v of villes" [value]="slugify(v)">{{ v }}</option>
                  <option value="__nouvelle__">+ Nouvelle ville</option>
                </select>
              </div>
              <div *ngIf="nouvelleVille" class="flex space-x-2">
                <input type="text" formControlName="ville" placeholder="ex: saint-pierre" class="form-input flex-1">
                <button type="button" (click)="annulerNouvelleVille()" class="px-3 text-gray-500 hover:text-gray-700">
                  <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              <div *ngIf="zoneForm.get('ville')?.invalid && zoneForm.get('ville')?.touched" class="text-red-500 text-xs mt-1">Requis</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ville (label affiché) *</label>
              <input type="text" formControlName="villeLabel" placeholder="ex: Saint-Pierre" class="form-input">
              <div *ngIf="zoneForm.get('villeLabel')?.invalid && zoneForm.get('villeLabel')?.touched" class="text-red-500 text-xs mt-1">Requis</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quartier (slug) *</label>
              <input type="text" formControlName="quartier" placeholder="ex: centre-ville" class="form-input">
              <div *ngIf="zoneForm.get('quartier')?.invalid && zoneForm.get('quartier')?.touched" class="text-red-500 text-xs mt-1">Requis</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quartier (label affiché) *</label>
              <input type="text" formControlName="quartierLabel" placeholder="ex: Centre-ville" class="form-input">
              <div *ngIf="zoneForm.get('quartierLabel')?.invalid && zoneForm.get('quartierLabel')?.touched" class="text-red-500 text-xs mt-1">Requis</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prix standard (FCFA) *</label>
              <input type="number" formControlName="prixStandard" min="0" step="500" class="form-input">
              <div *ngIf="zoneForm.get('prixStandard')?.invalid && zoneForm.get('prixStandard')?.touched" class="text-red-500 text-xs mt-1">Requis (≥ 0)</div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prix express (FCFA) <span class="text-gray-400 text-xs">optionnel</span></label>
              <input type="number" formControlName="prixExpress" min="0" step="500" placeholder="Laissez vide = supplément global" class="form-input">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Délai estimé</label>
              <input type="text" formControlName="delaiEstime" placeholder="ex: 24h, 2-3 jours" class="form-input">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
              <input type="number" formControlName="ordre" min="0" class="form-input">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center space-x-2">
              <input type="checkbox" formControlName="expressDisponible" id="expressDisponible" class="rounded">
              <label for="expressDisponible" class="text-sm text-gray-700">Express disponible</label>
            </div>
            <div class="flex items-center space-x-2">
              <input type="checkbox" formControlName="eligibleLivraisonGratuite" id="eligibleGratuite" class="rounded">
              <label for="eligibleGratuite" class="text-sm text-gray-700">Éligible livraison gratuite</label>
            </div>
            <div class="flex items-center space-x-2">
              <input type="checkbox" formControlName="actif" id="actif" class="rounded">
              <label for="actif" class="text-sm text-gray-700">Zone active</label>
            </div>
          </div>

          <!-- Avertissement nouvelle ville -->
          <div *ngIf="nouvelleVille" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <lucide-icon name="info" class="w-4 h-4 inline mr-1"></lucide-icon>
            Une zone « Autres quartiers » sera automatiquement créée pour cette ville avec le même prix standard.
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" (click)="fermerModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="saving || zoneForm.invalid"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50">
              <span *ngIf="saving">Sauvegarde...</span>
              <span *ngIf="!saving">{{ editingZone ? 'Modifier' : 'Créer' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ────────────────── MODAL IMPORT CSV ────────────────── -->
    <div *ngIf="showImportModal"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-screen overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-xl font-semibold text-gray-900">Import CSV</h2>
          <button (click)="fermerImportModal()" class="text-gray-400 hover:text-gray-600">
            <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
          </button>
        </div>

        <div class="p-6 space-y-4">

          <!-- Étape 1: sélection fichier -->
          <div *ngIf="!csvPreview">
            <label class="block text-sm font-medium text-gray-700 mb-2">Fichier CSV</label>
            <p class="text-xs text-gray-500 mb-3">
              Colonnes attendues : <code>ville, ville_label, quartier, quartier_label, prix_standard, prix_express, delai_estime, express_disponible, eligible_livraison_gratuite</code>
            </p>
            <input
              #csvFileInput
              type="file"
              accept=".csv,text/csv"
              (change)="onCsvSelected($event)"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
            <div *ngIf="csvImportLoading" class="mt-3 flex items-center space-x-2 text-gray-500">
              <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm">Analyse en cours...</span>
            </div>
          </div>

          <!-- Étape 2: prévisualisation -->
          <div *ngIf="csvPreview">
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{{ csvPreview.lignesACreer.length }}</div>
                <div class="text-xs text-gray-500">Lignes à créer</div>
              </div>
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{{ csvPreview.lignesAModifier.length }}</div>
                <div class="text-xs text-gray-500">Lignes à modifier</div>
              </div>
              <div class="text-center p-3 bg-red-50 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{{ csvPreview.lignesEnErreur.length }}</div>
                <div class="text-xs text-gray-500">Erreurs</div>
              </div>
            </div>

            <!-- Erreurs -->
            <div *ngIf="csvPreview.lignesEnErreur.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-red-700 mb-2">Lignes en erreur</h4>
              <div class="bg-red-50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                <div *ngFor="let err of csvPreview.lignesEnErreur" class="text-xs text-red-700">
                  Ligne {{ err.numeroLigne }} : {{ err.motif }}
                </div>
              </div>
            </div>

            <!-- Aperçu créations -->
            <div *ngIf="csvPreview.lignesACreer.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-green-700 mb-2">Zones à créer ({{ csvPreview.lignesACreer.length }})</h4>
              <div class="bg-green-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div *ngFor="let l of csvPreview.lignesACreer" class="text-xs text-gray-700">
                  {{ l.villeLabel }} — {{ l.quartierLabel }} ({{ l.prixStandard | number:'1.0-0' }} FCFA)
                </div>
              </div>
            </div>

            <!-- Aperçu modifications -->
            <div *ngIf="csvPreview.lignesAModifier.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-blue-700 mb-2">Zones à modifier ({{ csvPreview.lignesAModifier.length }})</h4>
              <div class="bg-blue-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div *ngFor="let l of csvPreview.lignesAModifier" class="text-xs text-gray-700">
                  {{ l.villeLabel }} — {{ l.quartierLabel }} → {{ l.prixStandard | number:'1.0-0' }} FCFA
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" (click)="fermerImportModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button
              *ngIf="csvPreview"
              (click)="confirmerImport()"
              [disabled]="csvConfirmLoading || csvPreview.lignesACreer.length + csvPreview.lignesAModifier.length === 0"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50">
              <span *ngIf="csvConfirmLoading">Import en cours...</span>
              <span *ngIf="!csvConfirmLoading">Confirmer l'import ({{ csvPreview.lignesACreer.length + csvPreview.lignesAModifier.length }} zones)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminZonesLivraisonComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  zones: ZoneLivraisonAdmin[] = [];
  zonesFiltrees: ZoneLivraisonAdmin[] = [];
  villes: string[] = [];
  loading = false;
  saving = false;

  filtreVille = '';
  filtreStatut = '';
  filtreRecherche = '';

  // Formulaire zone
  showModal = false;
  editingZone: ZoneLivraisonAdmin | null = null;
  zoneForm!: FormGroup;
  nouvelleVille = false;

  // Import CSV
  showImportModal = false;
  csvPreview: CsvPreviewResponse | null = null;
  csvImportLoading = false;
  csvConfirmLoading = false;

  get canEdit(): boolean {
    return this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN');
  }

  get zonesActives(): number {
    return this.zones.filter(z => z.actif).length;
  }

  get zonesExpress(): number {
    return this.zones.filter(z => z.expressDisponible).length;
  }

  constructor(
    private fb: FormBuilder,
    private livraisonService: LivraisonService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargerZones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  chargerZones(): void {
    this.loading = true;
    this.livraisonService.getAllZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zones) => {
          this.zones = zones;
          this.extraireVilles(zones);
          this.appliquerFiltres();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.toastService.error('Erreur', 'Impossible de charger les zones');
        }
      });
  }

  private extraireVilles(zones: ZoneLivraisonAdmin[]): void {
    const set = new Set<string>();
    zones.forEach(z => set.add(z.villeLabel));
    this.villes = Array.from(set).sort();
  }

  appliquerFiltres(): void {
    let result = [...this.zones];

    if (this.filtreVille) {
      result = result.filter(z => z.villeLabel === this.filtreVille);
    }

    if (this.filtreStatut === 'actif') {
      result = result.filter(z => z.actif);
    } else if (this.filtreStatut === 'inactif') {
      result = result.filter(z => !z.actif);
    }

    if (this.filtreRecherche.trim()) {
      const term = this.filtreRecherche.toLowerCase();
      result = result.filter(z =>
        z.quartierLabel.toLowerCase().includes(term) ||
        z.villeLabel.toLowerCase().includes(term)
      );
    }

    this.zonesFiltrees = result;
  }

  ouvrirFormulaire(zone?: ZoneLivraisonAdmin): void {
    this.editingZone = zone ?? null;
    this.nouvelleVille = false;
    this.zoneForm = this.fb.group({
      ville: [zone?.ville ?? '', Validators.required],
      villeLabel: [zone?.villeLabel ?? '', Validators.required],
      quartier: [zone?.quartier ?? '', Validators.required],
      quartierLabel: [zone?.quartierLabel ?? '', Validators.required],
      prixStandard: [zone?.prixStandard ?? 0, [Validators.required, Validators.min(0)]],
      prixExpress: [zone?.prixExpress ?? null],
      expressDisponible: [zone?.expressDisponible ?? true],
      delaiEstime: [zone?.delaiEstime ?? ''],
      actif: [zone?.actif ?? true],
      eligibleLivraisonGratuite: [zone?.eligibleLivraisonGratuite ?? false],
      ordre: [zone?.ordre ?? 0]
    });
    this.showModal = true;
  }

  fermerModal(): void {
    this.showModal = false;
    this.editingZone = null;
  }

  onVilleFormChange(): void {
    const val = this.zoneForm.get('ville')?.value;
    if (val === '__nouvelle__') {
      this.nouvelleVille = true;
      this.zoneForm.patchValue({ ville: '' });
    } else if (val) {
      const zone = this.zones.find(z => z.ville === val);
      if (zone) {
        this.zoneForm.patchValue({ villeLabel: zone.villeLabel });
      }
    }
  }

  annulerNouvelleVille(): void {
    this.nouvelleVille = false;
    this.zoneForm.patchValue({ ville: '' });
  }

  sauvegarderZone(): void {
    if (this.zoneForm.invalid) return;
    this.saving = true;
    const dto: ZoneLivraisonCreate = { ...this.zoneForm.value };
    if (!dto.prixExpress) delete (dto as any).prixExpress;

    const obs$ = this.editingZone
      ? this.livraisonService.modifierZone(this.editingZone.id, dto)
      : this.livraisonService.creerZone(dto);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.fermerModal();
        this.toastService.success('Succès', this.editingZone ? 'Zone modifiée' : 'Zone créée');
        this.chargerZones();
        // Si nouvelle ville, créer automatiquement zone "Autres quartiers"
        if (!this.editingZone && this.nouvelleVille) {
          this.creerZoneAutresQuartiers(dto);
        }
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || 'Erreur lors de la sauvegarde';
        this.toastService.error('Erreur', msg);
      }
    });
  }

  private creerZoneAutresQuartiers(ville: ZoneLivraisonCreate): void {
    const autresDto: ZoneLivraisonCreate = {
      ville: ville.ville,
      villeLabel: ville.villeLabel,
      quartier: 'autres-quartiers',
      quartierLabel: 'Autres quartiers',
      prixStandard: ville.prixStandard,
      expressDisponible: ville.expressDisponible,
      delaiEstime: ville.delaiEstime,
      actif: true,
      eligibleLivraisonGratuite: ville.eligibleLivraisonGratuite,
      ordre: 99
    };
    this.livraisonService.creerZone(autresDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.chargerZones(),
        error: () => {} // non bloquant
      });
  }

  toggleActif(zone: ZoneLivraisonAdmin): void {
    this.livraisonService.toggleActif(zone.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const idx = this.zones.findIndex(z => z.id === zone.id);
          if (idx !== -1) this.zones[idx] = updated;
          this.appliquerFiltres();
          this.toastService.success('Succès', `Zone ${updated.actif ? 'activée' : 'désactivée'}`);
        },
        error: () => this.toastService.error('Erreur', 'Impossible de modifier le statut')
      });
  }

  slugify(label: string): string {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // ──── Import CSV ─────────────────────────────────────────────────────────────

  ouvrirImportCsv(): void {
    this.csvPreview = null;
    this.showImportModal = true;
  }

  fermerImportModal(): void {
    this.showImportModal = false;
    this.csvPreview = null;
  }

  onCsvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.csvImportLoading = true;
    this.livraisonService.previewCsv(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preview) => {
          this.csvPreview = preview;
          this.csvImportLoading = false;
        },
        error: (err) => {
          this.csvImportLoading = false;
          this.toastService.error('Erreur', err.error?.message || 'Impossible d\'analyser le fichier CSV');
        }
      });
  }

  confirmerImport(): void {
    if (!this.csvPreview?.token) return;
    this.csvConfirmLoading = true;

    this.livraisonService.confirmerCsv(this.csvPreview.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.csvConfirmLoading = false;
          this.fermerImportModal();
          this.toastService.success('Import réussi', `${result.zonesImportees} zone(s) importée(s)`);
          this.chargerZones();
        },
        error: (err) => {
          this.csvConfirmLoading = false;
          this.toastService.error('Erreur', err.error?.message || 'Erreur lors de l\'import');
        }
      });
  }
}
