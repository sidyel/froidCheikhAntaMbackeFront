import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FacturationService } from '../../../services/facturation.service';
import { ToastService } from '../../../services/toast.service';
import {
  DocumentFacturationListDTO,
  TypeDocument,
  StatutDocument,
  StatutPaiementDocument
} from '../../../models/facturation.interface';

type OngletType = 'FACTURE' | 'DEVIS' | 'AVOIR' | 'BON_LIVRAISON';

@Component({
  selector: 'app-admin-facturation',
  template: `
    <div class="p-6 max-w-7xl mx-auto">

      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Facturation</h1>
        <button (click)="nouveauDocument()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
          Nouveau document
        </button>
      </div>

      <!-- Onglets types -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-1 overflow-x-auto">
          <button *ngFor="let o of onglets" (click)="changerOnglet(o.key)"
            [class.border-b-2]="ongletActif === o.key"
            [class.border-blue-600]="ongletActif === o.key"
            [class.text-blue-600]="ongletActif === o.key"
            [class.text-gray-500]="ongletActif !== o.key"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap hover:text-gray-700 transition-colors flex items-center gap-2">
            {{ o.label }}
            <span *ngIf="o.count > 0" class="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {{ o.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-48">
          <input [(ngModel)]="filtreClient" (ngModelChange)="onFiltreChange()"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rechercher par client…">
        </div>

        <select [(ngModel)]="filtreStatut" (ngModelChange)="charger()"
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="EMIS">Émis</option>
        </select>

        <div class="flex gap-2 items-center">
          <input [(ngModel)]="filtreDateDebut" (ngModelChange)="charger()" type="date"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <span class="text-gray-400 text-sm">→</span>
          <input [(ngModel)]="filtreDataFin" (ngModelChange)="charger()" type="date"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <button (click)="reinitialiserFiltres()"
          class="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          <lucide-icon name="refresh-ccw" class="w-3 h-3"></lucide-icon>
          Réinitialiser
        </button>
      </div>

      <!-- Liste -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <div *ngIf="chargement" class="flex justify-center items-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <div *ngIf="!chargement && documents.length === 0" class="text-center py-16 text-gray-400">
          <lucide-icon name="file-text" class="w-12 h-12 mx-auto mb-3 opacity-40"></lucide-icon>
          <p class="text-sm">Aucun document {{ labelOnglet.toLowerCase() }} trouvé</p>
        </div>

        <table *ngIf="!chargement && documents.length > 0" class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Numéro</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Montant TTC</th>
              <th class="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th *ngIf="ongletActif === 'FACTURE'" class="text-center px-4 py-3 font-semibold text-gray-600">Paiement</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let doc of documents"
                class="hover:bg-gray-50 cursor-pointer transition-colors"
                (click)="ouvrirDocument(doc.id)">
              <td class="px-4 py-3">
                <span *ngIf="doc.numero" class="font-mono font-semibold text-gray-900">{{ doc.numero }}</span>
                <span *ngIf="!doc.numero" class="text-gray-400 italic text-xs">Brouillon</span>
                <div *ngIf="doc.numeroCommande" class="text-xs text-gray-400">Cmd {{ doc.numeroCommande }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="text-gray-900">{{ doc.nomClient || '—' }} {{ doc.prenomClient || '' }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500">
                {{ (doc.dateEmission || doc.dateCreation) | date:'dd/MM/yyyy' }}
              </td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900">
                <span *ngIf="doc.montantTTC != null">{{ doc.montantTTC | number:'1.0-0' }} FCFA</span>
                <span *ngIf="doc.montantTTC == null" class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span [class]="badgeStatut(doc.statut)" class="text-xs px-2 py-0.5 rounded-full font-semibold">
                  {{ doc.statut === 'BROUILLON' ? 'Brouillon' : 'Émis' }}
                </span>
              </td>
              <td *ngIf="ongletActif === 'FACTURE'" class="px-4 py-3 text-center">
                <span *ngIf="doc.statutPaiement" [class]="badgePaiement(doc.statutPaiement)"
                  class="text-xs px-2 py-0.5 rounded-full font-semibold">
                  {{ labelPaiement(doc.statutPaiement) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                <button (click)="ouvrirDocument(doc.id)"
                  class="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Ouvrir">
                  <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div *ngIf="!chargement && totalPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span class="text-sm text-gray-500">{{ totalElements }} document{{ totalElements > 1 ? 's' : '' }}</span>
          <div class="flex items-center gap-2">
            <button (click)="pagePrecedente()" [disabled]="pageCourante === 0"
              class="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <lucide-icon name="chevron-left" class="w-4 h-4"></lucide-icon>
            </button>
            <span class="text-sm text-gray-700">{{ pageCourante + 1 }} / {{ totalPages }}</span>
            <button (click)="pageSuivante()" [disabled]="pageCourante >= totalPages - 1"
              class="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminFacturationComponent implements OnInit, OnDestroy {

  onglets = [
    { key: 'FACTURE' as OngletType, label: 'Factures', count: 0 },
    { key: 'DEVIS' as OngletType, label: 'Devis', count: 0 },
    { key: 'AVOIR' as OngletType, label: 'Avoirs', count: 0 },
    { key: 'BON_LIVRAISON' as OngletType, label: 'Bons de livraison', count: 0 }
  ];

  ongletActif: OngletType = 'FACTURE';
  filtreClient = '';
  filtreStatut = '';
  filtreDateDebut = '';
  filtreDataFin = '';

  documents: DocumentFacturationListDTO[] = [];
  chargement = false;
  pageCourante = 0;
  totalPages = 0;
  totalElements = 0;

  private destroy$ = new Subject<void>();
  private recherche$ = new Subject<void>();

  constructor(
    private facturationService: FacturationService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.recherche$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.charger());
    this.charger();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get labelOnglet(): string {
    return this.onglets.find(o => o.key === this.ongletActif)?.label ?? '';
  }

  changerOnglet(key: OngletType): void {
    this.ongletActif = key;
    this.pageCourante = 0;
    this.charger();
  }

  onFiltreChange(): void {
    this.pageCourante = 0;
    this.recherche$.next();
  }

  charger(): void {
    this.chargement = true;
    this.facturationService.listerDocuments({
      type: this.ongletActif,
      statut: this.filtreStatut as StatutDocument || undefined,
      client: this.filtreClient || undefined,
      dateDebut: this.filtreDateDebut || undefined,
      dateFin: this.filtreDataFin || undefined,
      page: this.pageCourante,
      size: 20
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (page) => {
        this.documents = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.chargement = false;
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des documents');
        this.chargement = false;
      }
    });
  }

  reinitialiserFiltres(): void {
    this.filtreClient = '';
    this.filtreStatut = '';
    this.filtreDateDebut = '';
    this.filtreDataFin = '';
    this.pageCourante = 0;
    this.charger();
  }

  nouveauDocument(): void {
    this.router.navigate(['/admin/facturation/nouveau'], {
      queryParams: { type: this.ongletActif }
    });
  }

  ouvrirDocument(id: number): void {
    this.router.navigate(['/admin/facturation', id]);
  }

  pagePrecedente(): void {
    if (this.pageCourante > 0) { this.pageCourante--; this.charger(); }
  }

  pageSuivante(): void {
    if (this.pageCourante < this.totalPages - 1) { this.pageCourante++; this.charger(); }
  }

  badgeStatut(s: StatutDocument): string {
    return s === 'BROUILLON'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';
  }

  badgePaiement(s: StatutPaiementDocument): string {
    const map: Record<StatutPaiementDocument, string> = {
      NON_PAYEE: 'bg-red-100 text-red-700',
      PARTIELLEMENT_PAYEE: 'bg-orange-100 text-orange-700',
      PAYEE: 'bg-green-100 text-green-700'
    };
    return map[s] ?? '';
  }

  labelPaiement(s: StatutPaiementDocument): string {
    const map: Record<StatutPaiementDocument, string> = {
      NON_PAYEE: 'Non payée',
      PARTIELLEMENT_PAYEE: 'Partielle',
      PAYEE: 'Payée'
    };
    return map[s] ?? s;
  }
}
