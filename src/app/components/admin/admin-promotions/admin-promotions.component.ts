import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import {
  PromotionRequest,
  PromotionResponse,
  PromotionApercuPage,
  PromotionApercuProduit,
  Categorie,
  Marque,
  Produit,
  PagedResponse
} from '../../../models/interfaces';

type Onglet = 'actives' | 'programmees' | 'expirees';
type TypePromotion = 'POURCENTAGE' | 'MONTANT_FIXE';
type CiblePromotion = 'TOUS' | 'PRODUITS' | 'CATEGORIES' | 'MARQUES';

@Component({
  selector: 'app-admin-promotions',
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Promotions</h1>
        <button (click)="ouvrirFormulaire()" class="btn-primary px-4 py-2 text-sm font-semibold">
          + Nouvelle promotion
        </button>
      </div>

      <!-- Onglets -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button *ngFor="let t of onglets" (click)="changerOnglet(t.key)"
            [class.border-blue-600]="ongletActif === t.key"
            [class.text-blue-600]="ongletActif === t.key"
            [class.border-transparent]="ongletActif !== t.key"
            [class.text-gray-500]="ongletActif !== t.key"
            class="border-b-2 pb-3 text-sm font-medium whitespace-nowrap">
            {{ t.label }}
          </button>
        </nav>
      </div>

      <!-- Liste -->
      <div *ngIf="!chargement; else loader">
        <div *ngIf="promotions.length === 0" class="text-center py-12 text-gray-400">
          Aucune promotion {{ ongletActif === 'actives' ? 'active' : ongletActif === 'programmees' ? 'programmée' : 'expirée' }}.
        </div>
        <div class="space-y-3">
          <div *ngFor="let promo of promotions"
               class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-gray-900">{{ promo.nom }}</span>
                <span [class]="badgeStatut(promo.statut)" class="text-xs px-2 py-0.5 rounded-full font-bold">
                  {{ promo.statut }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ promo.typePromotion === 'POURCENTAGE' ? promo.valeur + '%' : promo.valeur + ' FCFA' }} —
                Cible : {{ promo.cible }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                Du {{ promo.dateDebut | date:'dd/MM/yyyy HH:mm' }}
                <span *ngIf="promo.dateFin"> au {{ promo.dateFin | date:'dd/MM/yyyy HH:mm' }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button (click)="ouvrirFormulaire(promo)" class="p-2 text-gray-500 hover:text-blue-600" title="Modifier">
                <lucide-icon name="edit" class="w-4 h-4"></lucide-icon>
              </button>
              <button (click)="supprimer(promo)" class="p-2 text-gray-500 hover:text-red-600" title="Supprimer">
                <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
      <ng-template #loader>
        <div class="text-center py-12 text-gray-400">Chargement…</div>
      </ng-template>

      <!-- Modal formulaire -->
      <div *ngIf="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-5">
            {{ editMode ? 'Modifier la promotion' : 'Nouvelle promotion' }}
          </h2>

          <form (ngSubmit)="sauvegarder()" #promoForm="ngForm" class="space-y-4">
            <!-- Nom -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" [(ngModel)]="form.nom" name="nom" required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <!-- Type + Valeur -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select [(ngModel)]="form.typePromotion" name="typePromotion" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="POURCENTAGE">Pourcentage (%)</option>
                  <option value="MONTANT_FIXE">Montant fixe (FCFA)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Valeur *</label>
                <input type="number" [(ngModel)]="form.valeur" name="valeur" required min="1"
                  [max]="form.typePromotion === 'POURCENTAGE' ? 99 : 999999999"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                <input type="datetime-local" [(ngModel)]="form.dateDebut" name="dateDebut" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date fin (optionnel)</label>
                <input type="datetime-local" [(ngModel)]="form.dateFin" name="dateFin"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <!-- Priorité + Actif -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <input type="number" [(ngModel)]="form.priorite" name="priorite" min="0"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div class="flex items-center gap-2 mt-5">
                <input type="checkbox" [(ngModel)]="form.actif" name="actif" id="actif" class="w-4 h-4">
                <label for="actif" class="text-sm font-medium text-gray-700">Promotion active</label>
              </div>
            </div>

            <!-- Cible -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cible *</label>
              <select [(ngModel)]="form.cible" name="cible" required (ngModelChange)="onCibleChange()"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="TOUS">Tous les produits</option>
                <option value="PRODUITS">Produits spécifiques</option>
                <option value="CATEGORIES">Catégories</option>
                <option value="MARQUES">Marques</option>
              </select>
            </div>

            <!-- IDs selon cible -->
            <div *ngIf="form.cible === 'PRODUITS'" class="text-sm text-gray-500 italic">
              Saisir les IDs produits séparés par virgule :
              <input type="text" [(ngModel)]="produitIdsRaw" name="produitIdsRaw"
                placeholder="1, 2, 3"
                class="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div *ngIf="form.cible === 'CATEGORIES'" class="text-sm text-gray-500 italic">
              Saisir les IDs catégories séparés par virgule :
              <input type="text" [(ngModel)]="categorieIdsRaw" name="categorieIdsRaw"
                placeholder="1, 2, 3"
                class="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div *ngIf="form.cible === 'MARQUES'" class="text-sm text-gray-500 italic">
              Saisir les IDs marques séparés par virgule :
              <input type="text" [(ngModel)]="marqueIdsRaw" name="marqueIdsRaw"
                placeholder="1, 2, 3"
                class="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <!-- Aperçu -->
            <div class="border-t border-gray-100 pt-4">
              <button type="button" (click)="chargerApercu()"
                class="text-sm text-blue-600 font-medium hover:underline mb-3">
                Voir l'aperçu des produits concernés
              </button>
              <div *ngIf="apercu" class="bg-gray-50 rounded-lg p-3 text-sm">
                <p class="text-gray-600 font-medium mb-2">{{ apercu.totalElements }} produit(s) concerné(s)</p>
                <div class="space-y-1 max-h-40 overflow-y-auto">
                  <div *ngFor="let p of apercu.produits"
                    [class.text-orange-600]="p.prixPlancher"
                    class="flex justify-between text-xs">
                    <span class="truncate mr-2">{{ p.nomProduit }}</span>
                    <span *ngIf="!p.prixPlancher">{{ p.prixOrigine | number }} → {{ p.prixApresPromo | number }} FCFA (-{{ p.pourcentageReduction }}%)</span>
                    <span *ngIf="p.prixPlancher" class="text-orange-600 font-semibold">⚠ Prix plancher — promo non appliquée</span>
                  </div>
                </div>
                <div *ngIf="apercu.totalPages > 1" class="mt-2 text-xs text-gray-400">
                  Page {{ apercu.page + 1 }}/{{ apercu.totalPages }}
                  <button type="button" *ngIf="apercu.page < apercu.totalPages - 1"
                    (click)="apercuPage(apercu.page + 1)" class="ml-2 text-blue-500 hover:underline">Suivant</button>
                </div>
              </div>
            </div>

            <!-- Boutons -->
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="fermerFormulaire()"
                class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" [disabled]="sauvegarde || !promoForm.valid"
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {{ sauvegarde ? 'Enregistrement…' : (editMode ? 'Modifier' : 'Créer') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-primary {
      background: #2563eb;
      color: white;
      border-radius: 0.5rem;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #1d4ed8; }
  `]
})
export class AdminPromotionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  onglets = [
    { key: 'actives' as Onglet, label: 'Actives' },
    { key: 'programmees' as Onglet, label: 'Programmées' },
    { key: 'expirees' as Onglet, label: 'Expirées' }
  ];
  ongletActif: Onglet = 'actives';

  promotions: PromotionResponse[] = [];
  chargement = false;

  showForm = false;
  editMode = false;
  editId: number | null = null;
  sauvegarde = false;

  form: PromotionRequest = this.formVide();
  produitIdsRaw = '';
  categorieIdsRaw = '';
  marqueIdsRaw = '';

  apercu: PromotionApercuPage | null = null;

  constructor(
    private api: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.chargerListe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changerOnglet(onglet: Onglet): void {
    this.ongletActif = onglet;
    this.chargerListe();
  }

  chargerListe(): void {
    this.chargement = true;
    const obs$ = this.ongletActif === 'actives'
      ? this.api.getPromotionsActives()
      : this.ongletActif === 'programmees'
        ? this.api.getPromotionsProgrammees()
        : this.api.getPromotionsExpirees();

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (page) => { this.promotions = page.content; this.chargement = false; },
      error: () => { this.toastService.error('Erreur', 'Impossible de charger les promotions'); this.chargement = false; }
    });
  }

  ouvrirFormulaire(promo?: PromotionResponse): void {
    this.apercu = null;
    if (promo) {
      this.editMode = true;
      this.editId = promo.idPromotion;
      this.form = {
        nom: promo.nom,
        typePromotion: promo.typePromotion,
        valeur: promo.valeur,
        dateDebut: promo.dateDebut.slice(0, 16),
        dateFin: promo.dateFin ? promo.dateFin.slice(0, 16) : undefined,
        actif: promo.actif,
        priorite: promo.priorite,
        cible: promo.cible,
        produitIds: promo.produitIds,
        categorieIds: promo.categorieIds,
        marqueIds: promo.marqueIds
      };
      this.produitIdsRaw = (promo.produitIds || []).join(', ');
      this.categorieIdsRaw = (promo.categorieIds || []).join(', ');
      this.marqueIdsRaw = (promo.marqueIds || []).join(', ');
    } else {
      this.editMode = false;
      this.editId = null;
      this.form = this.formVide();
      this.produitIdsRaw = '';
      this.categorieIdsRaw = '';
      this.marqueIdsRaw = '';
    }
    this.showForm = true;
  }

  fermerFormulaire(): void {
    this.showForm = false;
    this.apercu = null;
  }

  onCibleChange(): void {
    this.apercu = null;
  }

  sauvegarder(): void {
    this.buildIdsFromRaw();
    this.sauvegarde = true;
    const obs$ = this.editMode && this.editId
      ? this.api.modifierPromotion(this.editId, this.form)
      : this.api.creerPromotion(this.form);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.success('Succès', this.editMode ? 'Promotion modifiée' : 'Promotion créée');
        this.fermerFormulaire();
        this.chargerListe();
        this.sauvegarde = false;
      },
      error: (err) => {
        this.toastService.error('Erreur', err?.error?.message || 'Impossible de sauvegarder');
        this.sauvegarde = false;
      }
    });
  }

  supprimer(promo: PromotionResponse): void {
    if (!confirm(`Supprimer "${promo.nom}" ?`)) return;
    this.api.supprimerPromotion(promo.idPromotion).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Promotion supprimée (ou désactivée si utilisée)');
        this.chargerListe();
      },
      error: () => this.toastService.error('Erreur', 'Impossible de supprimer')
    });
  }

  chargerApercu(page = 0): void {
    this.buildIdsFromRaw();
    this.api.apercuPromotion(this.form, page).pipe(takeUntil(this.destroy$)).subscribe({
      next: (a) => { this.apercu = a; },
      error: () => this.toastService.error('Erreur', 'Aperçu indisponible')
    });
  }

  apercuPage(page: number): void {
    this.chargerApercu(page);
  }

  badgeStatut(statut: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PROGRAMMEE: 'bg-blue-100 text-blue-700',
      EXPIREE: 'bg-gray-100 text-gray-500',
      INACTIVE: 'bg-red-100 text-red-600'
    };
    return map[statut] ?? 'bg-gray-100 text-gray-500';
  }

  private buildIdsFromRaw(): void {
    const parse = (raw: string) => raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    this.form.produitIds = this.form.cible === 'PRODUITS' ? parse(this.produitIdsRaw) : [];
    this.form.categorieIds = this.form.cible === 'CATEGORIES' ? parse(this.categorieIdsRaw) : [];
    this.form.marqueIds = this.form.cible === 'MARQUES' ? parse(this.marqueIdsRaw) : [];
  }

  private formVide(): PromotionRequest {
    return {
      nom: '',
      typePromotion: 'POURCENTAGE',
      valeur: 10,
      dateDebut: '',
      dateFin: undefined,
      actif: true,
      priorite: 0,
      cible: 'TOUS',
      produitIds: [],
      categorieIds: [],
      marqueIds: []
    };
  }
}
