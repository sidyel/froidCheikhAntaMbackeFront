import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FacturationService } from '../../../services/facturation.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import {
  DocumentFacturationDTO,
  StatutPaiementDocument,
  ModeReglement,
  TypeDocument
} from '../../../models/facturation.interface';

@Component({
  selector: 'app-admin-facturation-detail',
  template: `
    <div class="p-6 max-w-5xl mx-auto">

      <!-- Loader -->
      <div *ngIf="chargement" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <ng-container *ngIf="!chargement && doc">

        <!-- En-tête -->
        <div class="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <button (click)="retour()" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
            </button>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold text-gray-900">
                  {{ doc.numero || ('Brouillon — ' + labelType(doc.type)) }}
                </h1>
                <span [class]="badgeStatut(doc.statut)" class="text-xs px-2 py-0.5 rounded-full font-semibold">
                  {{ doc.statut === 'BROUILLON' ? 'Brouillon' : 'Émis' }}
                </span>
                <span *ngIf="doc.statutPaiement && doc.type === 'FACTURE'"
                  [class]="badgePaiement(doc.statutPaiement)"
                  class="text-xs px-2 py-0.5 rounded-full font-semibold">
                  {{ labelPaiement(doc.statutPaiement) }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ labelType(doc.type) }} ·
                {{ (doc.dateEmission || doc.dateCreation) | date:'dd/MM/yyyy HH:mm' }}
                <span *ngIf="doc.numeroCommande"> · Commande {{ doc.numeroCommande }}</span>
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            <button *ngIf="doc.statut === 'BROUILLON'" (click)="modifierDocument()"
              class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <lucide-icon name="edit" class="w-4 h-4"></lucide-icon>
              Modifier
            </button>
            <button *ngIf="doc.statut === 'EMIS'" (click)="telechargerPdf()" [disabled]="telechargementPdf"
              class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <lucide-icon name="download" class="w-4 h-4"></lucide-icon>
              {{ telechargementPdf ? 'Génération…' : 'PDF' }}
            </button>
            <button *ngIf="doc.statut === 'EMIS' && peutAdmin" (click)="regenererPdf()" [disabled]="regenerationPdf"
              title="Régénère le PDF avec les paramètres actuels (logo, cachet, en-tête)"
              class="bg-white border border-orange-300 hover:bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <lucide-icon name="refresh-cw" class="w-4 h-4"></lucide-icon>
              {{ regenerationPdf ? '…' : 'Régén.' }}
            </button>
            <button *ngIf="doc.statut === 'EMIS'" (click)="genererJetonWhatsapp()" [disabled]="generationJeton"
              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <lucide-icon name="share" class="w-4 h-4"></lucide-icon>
              {{ generationJeton ? '…' : 'WhatsApp' }}
            </button>
            <button *ngIf="peutEmettre && doc.statut === 'BROUILLON'" (click)="confirmerEmission()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
              <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
              Émettre
            </button>
            <button *ngIf="doc.statut === 'EMIS' && doc.type === 'FACTURE' && peutAdmin" (click)="creerAvoir()"
              class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <lucide-icon name="rotate-ccw" class="w-4 h-4"></lucide-icon>
              Créer avoir
            </button>
            <button *ngIf="doc.statut === 'EMIS' && doc.type === 'DEVIS' && peutAdmin" (click)="convertirDevis()"
              class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <lucide-icon name="file-text" class="w-4 h-4"></lucide-icon>
              → Facture
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Colonne principale -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Client -->
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <h2 class="font-semibold text-gray-900 mb-3">Client</h2>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div *ngIf="doc.nomClient || doc.prenomClient" class="col-span-2">
                  <span class="font-medium text-gray-900">{{ doc.prenomClient }} {{ doc.nomClient }}</span>
                </div>
                <div *ngIf="doc.telephoneClient" class="flex items-center gap-1.5 text-gray-600">
                  <lucide-icon name="phone" class="w-3.5 h-3.5"></lucide-icon>
                  {{ doc.telephoneClient }}
                </div>
                <div *ngIf="doc.emailClient" class="flex items-center gap-1.5 text-gray-600">
                  <lucide-icon name="mail" class="w-3.5 h-3.5"></lucide-icon>
                  {{ doc.emailClient }}
                </div>
                <div *ngIf="doc.adresseClient" class="col-span-2 flex items-start gap-1.5 text-gray-600">
                  <lucide-icon name="map-pin" class="w-3.5 h-3.5 mt-0.5 shrink-0"></lucide-icon>
                  {{ doc.adresseClient }}
                </div>
                <div *ngIf="doc.nineaClient" class="text-gray-500">NINEA : {{ doc.nineaClient }}</div>
                <div *ngIf="doc.rccmClient" class="text-gray-500">RCCM : {{ doc.rccmClient }}</div>
                <div *ngIf="!doc.nomClient && !doc.prenomClient" class="col-span-2 text-gray-400 italic text-xs">
                  Aucun client renseigné
                </div>
              </div>
            </div>

            <!-- Lignes -->
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div class="px-5 py-3 border-b border-gray-100">
                <h2 class="font-semibold text-gray-900">Lignes</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="text-left px-4 py-2 font-medium text-gray-600">Désignation</th>
                      <th class="text-right px-4 py-2 font-medium text-gray-600 w-16">Qté</th>
                      <th class="text-right px-4 py-2 font-medium text-gray-600 w-24">P.U. HT</th>
                      <th class="text-right px-4 py-2 font-medium text-gray-600 w-20">TVA</th>
                      <th class="text-right px-4 py-2 font-medium text-gray-600 w-24">Montant HT</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr *ngFor="let l of doc.lignes">
                      <td class="px-4 py-2.5 text-gray-900">{{ l.designation }}</td>
                      <td class="px-4 py-2.5 text-right text-gray-700">{{ l.quantite }}</td>
                      <td class="px-4 py-2.5 text-right text-gray-700 font-mono">
                        {{ l.prixUnitaireHT | number:'1.0-0' }}
                      </td>
                      <td class="px-4 py-2.5 text-right text-gray-500">{{ l.tauxTva }}%</td>
                      <td class="px-4 py-2.5 text-right font-semibold text-gray-900 font-mono">
                        {{ l.montantHT | number:'1.0-0' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Totaux -->
              <div class="px-5 py-4 border-t border-gray-100 flex justify-end" *ngIf="doc.statut === 'EMIS'">
                <div class="w-64 space-y-1 text-sm">
                  <div class="flex justify-between text-gray-600">
                    <span>Total HT</span>
                    <span class="font-mono">{{ doc.montantHT | number:'1.0-0' }} FCFA</span>
                  </div>
                  <div class="flex justify-between text-gray-600">
                    <span>TVA</span>
                    <span class="font-mono">{{ doc.montantTva | number:'1.0-0' }} FCFA</span>
                  </div>
                  <div class="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                    <span>Total TTC</span>
                    <span class="font-mono text-blue-600">{{ doc.montantTTC | number:'1.0-0' }} FCFA</span>
                  </div>
                  <div *ngIf="doc.montantEnLettres" class="text-xs text-gray-400 italic pt-1">
                    {{ doc.montantEnLettres }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Règlements (factures émises seulement) -->
            <div *ngIf="doc.statut === 'EMIS' && doc.type === 'FACTURE'"
              class="bg-white rounded-xl border border-gray-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-semibold text-gray-900">Règlements</h2>
                <button (click)="afficherFormReglement = !afficherFormReglement"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                  Ajouter
                </button>
              </div>

              <!-- Formulaire règlement -->
              <form *ngIf="afficherFormReglement" [formGroup]="formReglement" (ngSubmit)="ajouterReglement()"
                class="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input formControlName="dateReglement" type="date"
                      class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Montant *</label>
                    <input formControlName="montant" type="number" min="1"
                      class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 50000">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Mode *</label>
                    <select formControlName="mode"
                      class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="ESPECES">Espèces</option>
                      <option value="WAVE">Wave</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Référence</label>
                    <input formControlName="reference"
                      class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="N° Wave, réf. virement…">
                  </div>
                </div>
                <div class="flex gap-2 justify-end">
                  <button type="button" (click)="afficherFormReglement = false"
                    class="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
                    Annuler
                  </button>
                  <button type="submit" [disabled]="formReglement.invalid || ajoutReglement"
                    class="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {{ ajoutReglement ? '…' : 'Enregistrer' }}
                  </button>
                </div>
              </form>

              <!-- Liste règlements -->
              <div *ngIf="!doc.reglements || doc.reglements.length === 0" class="text-sm text-gray-400 text-center py-4">
                Aucun règlement enregistré
              </div>
              <div *ngFor="let r of doc.reglements" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                <div>
                  <span class="font-medium text-gray-900">{{ r.montant | number:'1.0-0' }} FCFA</span>
                  <span class="text-gray-500 ml-2">{{ r.dateReglement | date:'dd/MM/yyyy' }}</span>
                  <span class="text-gray-500 ml-2">· {{ labelMode(r.mode) }}</span>
                  <span *ngIf="r.reference" class="text-gray-400 ml-1">({{ r.reference }})</span>
                </div>
                <button *ngIf="peutAdmin" (click)="supprimerReglement(r.id)"
                  class="p-1 text-gray-400 hover:text-red-600 transition-colors">
                  <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
                </button>
              </div>

              <!-- Bilan paiement -->
              <div *ngIf="doc.montantTTC" class="mt-4 pt-4 border-t border-gray-100 text-sm">
                <div class="flex justify-between text-gray-600">
                  <span>Total réglé</span>
                  <span class="font-mono">{{ doc.totalRegle | number:'1.0-0' }} FCFA</span>
                </div>
                <div class="flex justify-between font-semibold" [class.text-red-600]="resteARegler > 0" [class.text-green-600]="resteARegler <= 0">
                  <span>Reste à régler</span>
                  <span class="font-mono">{{ resteARegler | number:'1.0-0' }} FCFA</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Colonne latérale -->
          <div class="space-y-4">

            <!-- Montant (brouillon) -->
            <div *ngIf="doc.statut === 'BROUILLON'" class="bg-white rounded-xl border border-gray-200 p-5">
              <h3 class="text-sm font-medium text-gray-600 mb-2">Estimation (brouillon)</h3>
              <div class="text-2xl font-bold text-gray-900">
                <span *ngIf="estimationTTC > 0; else aucuneLigne">{{ estimationTTC | number:'1.0-0' }} FCFA</span>
                <ng-template #aucuneLigne><span class="text-gray-400 text-base">Aucune ligne</span></ng-template>
              </div>
            </div>

            <!-- Lien WhatsApp -->
            <div *ngIf="urlWhatsApp" class="bg-green-50 rounded-xl border border-green-200 p-4">
              <h3 class="text-sm font-semibold text-green-700 mb-2">Lien de téléchargement</h3>
              <p class="text-xs text-green-600 mb-3 break-all">{{ urlWhatsApp }}</p>
              <div class="flex gap-2">
                <button (click)="copierLien()"
                  class="flex-1 bg-white border border-green-300 text-green-700 text-xs font-medium py-1.5 rounded-lg hover:bg-green-50 flex items-center justify-center gap-1">
                  <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
                  Copier
                </button>
                <a [href]="whatsAppShareUrl" target="_blank" rel="noopener"
                  class="flex-1 bg-green-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1">
                  Partager
                </a>
              </div>
            </div>

            <!-- Infos document -->
            <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-2 text-sm text-gray-600">
              <h3 class="font-semibold text-gray-900 text-base mb-3">Informations</h3>
              <div class="flex justify-between">
                <span>Créé le</span>
                <span>{{ doc.dateCreation | date:'dd/MM/yyyy' }}</span>
              </div>
              <div *ngIf="doc.dateEmission" class="flex justify-between">
                <span>Émis le</span>
                <span>{{ doc.dateEmission | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div *ngIf="doc.dateValidite" class="flex justify-between">
                <span>Valable jusqu'au</span>
                <span>{{ doc.dateValidite | date:'dd/MM/yyyy' }}</span>
              </div>
              <div *ngIf="doc.creePar" class="flex justify-between">
                <span>Créé par</span>
                <span class="font-medium">{{ doc.creePar }}</span>
              </div>
              <div *ngIf="doc.numeroDocumentOrigine" class="flex justify-between">
                <span>Origine</span>
                <button (click)="ouvrirOrigine()" class="text-blue-600 hover:underline">
                  {{ doc.numeroDocumentOrigine }}
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div *ngIf="doc.notes" class="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-sm text-yellow-800">
              <h3 class="font-semibold mb-1">Notes</h3>
              <p class="whitespace-pre-wrap">{{ doc.notes }}</p>
            </div>

          </div>
        </div>
      </ng-container>

      <!-- Modal confirmation émission -->
      <div *ngIf="showModalEmission"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
          <h3 class="font-bold text-gray-900 mb-2">Émettre le document ?</h3>
          <p class="text-sm text-gray-600 mb-6">
            Une fois émis, le document sera numéroté <strong>{{ doc?.numero || '(numéro attribué)' }}</strong>
            et ne pourra plus être modifié.
          </p>
          <div class="flex gap-3 justify-end">
            <button (click)="showModalEmission = false"
              class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button (click)="emettre()"
              class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Émettre
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminFacturationDetailComponent implements OnInit, OnDestroy {

  doc?: DocumentFacturationDTO;
  chargement = true;
  telechargementPdf = false;
  regenerationPdf = false;
  generationJeton = false;
  ajoutReglement = false;
  afficherFormReglement = false;
  showModalEmission = false;
  urlWhatsApp?: string;
  formReglement!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private facturationService: FacturationService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.formReglement = this.fb.group({
      dateReglement: [new Date().toISOString().slice(0, 10), Validators.required],
      montant: [null, [Validators.required, Validators.min(1)]],
      mode: ['ESPECES', Validators.required],
      reference: ['']
    });

    const id = +this.route.snapshot.paramMap.get('id')!;
    this.charger(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get peutAdmin(): boolean {
    return this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN');
  }

  get peutEmettre(): boolean {
    if (this.authService.hasRole('GESTIONNAIRE')) return this.doc?.type === 'BON_LIVRAISON';
    return true;
  }

  get resteARegler(): number {
    if (!this.doc?.montantTTC) return 0;
    return Math.max(0, this.doc.montantTTC - (this.doc.totalRegle ?? 0));
  }

  get estimationTTC(): number {
    if (!this.doc?.lignes) return 0;
    return this.doc.lignes.reduce((sum, l) => sum + (l.montantTTC ?? 0), 0);
  }

  get whatsAppShareUrl(): string {
    return `https://wa.me/?text=${encodeURIComponent(this.urlWhatsApp ?? '')}`;
  }

  private charger(id: number): void {
    this.chargement = true;
    this.facturationService.getDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => { this.doc = d; this.chargement = false; },
        error: () => { this.toastService.error('Document introuvable'); this.chargement = false; }
      });
  }

  labelType(t: TypeDocument): string {
    const map: Record<TypeDocument, string> = {
      FACTURE: 'Facture', DEVIS: 'Devis', AVOIR: 'Avoir', BON_LIVRAISON: 'Bon de livraison'
    };
    return map[t] ?? t;
  }

  badgeStatut(s: string): string {
    return s === 'BROUILLON' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
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
      NON_PAYEE: 'Non payée', PARTIELLEMENT_PAYEE: 'Partielle', PAYEE: 'Payée'
    };
    return map[s] ?? s;
  }

  labelMode(m: ModeReglement): string {
    const map: Record<ModeReglement, string> = {
      ESPECES: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', VIREMENT: 'Virement', AUTRE: 'Autre'
    };
    return map[m] ?? m;
  }

  retour(): void {
    this.router.navigate(['/admin/facturation']);
  }

  modifierDocument(): void {
    this.router.navigate(['/admin/facturation', this.doc!.id, 'edit']);
  }

  telechargerPdf(): void {
    if (!this.doc) return;
    this.telechargementPdf = true;
    this.facturationService.telechargerPdf(this.doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.facturationService.ouvrirBlob(blob, `${this.doc!.numero ?? 'document'}.pdf`);
          this.telechargementPdf = false;
        },
        error: () => { this.toastService.error('Erreur lors de la génération du PDF'); this.telechargementPdf = false; }
      });
  }

  regenererPdf(): void {
    if (!this.doc) return;
    this.regenerationPdf = true;
    this.facturationService.regenererPdf(this.doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('PDF régénéré avec les paramètres actuels');
          this.regenerationPdf = false;
        },
        error: () => { this.toastService.error('Erreur lors de la régénération'); this.regenerationPdf = false; }
      });
  }

  genererJetonWhatsapp(): void {
    if (!this.doc) return;
    this.generationJeton = true;
    this.facturationService.genererJetonWhatsapp(this.doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.urlWhatsApp = r.urlTelechargement;
          this.generationJeton = false;
          this.toastService.success('Lien généré — valable 72h');
        },
        error: () => { this.toastService.error('Erreur lors de la génération du lien'); this.generationJeton = false; }
      });
  }

  copierLien(): void {
    if (!this.urlWhatsApp) return;
    navigator.clipboard.writeText(this.urlWhatsApp).then(
      () => this.toastService.success('Lien copié'),
      () => this.toastService.error('Impossible de copier')
    );
  }

  confirmerEmission(): void {
    this.showModalEmission = true;
  }

  emettre(): void {
    this.showModalEmission = false;
    if (!this.doc) return;
    this.facturationService.emettreDocument(this.doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => { this.doc = d; this.toastService.success('Document émis avec succès'); },
        error: () => this.toastService.error('Erreur lors de l\'émission')
      });
  }

  creerAvoir(): void {
    if (!this.doc) return;
    this.facturationService.creerAvoir(this.doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avoir) => {
          this.toastService.success('Avoir créé');
          this.router.navigate(['/admin/facturation', avoir.id]);
        },
        error: () => this.toastService.error('Erreur lors de la création de l\'avoir')
      });
  }

  convertirDevis(): void {
    if (!this.doc) return;
    this.facturationService.convertirDevis(this.doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facture) => {
          this.toastService.success('Devis converti en facture brouillon');
          this.router.navigate(['/admin/facturation', facture.id]);
        },
        error: () => this.toastService.error('Erreur lors de la conversion')
      });
  }

  ajouterReglement(): void {
    if (this.formReglement.invalid || !this.doc) return;
    this.ajoutReglement = true;
    this.facturationService.ajouterReglement(this.doc.id, this.formReglement.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.doc = d;
          this.ajoutReglement = false;
          this.afficherFormReglement = false;
          this.formReglement.reset({
            dateReglement: new Date().toISOString().slice(0, 10),
            montant: null, mode: 'ESPECES', reference: ''
          });
          this.toastService.success('Règlement enregistré');
        },
        error: () => { this.ajoutReglement = false; this.toastService.error('Erreur lors de l\'enregistrement'); }
      });
  }

  supprimerReglement(reglementId: number): void {
    if (!this.doc) return;
    this.facturationService.supprimerReglement(this.doc.id, reglementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => { this.doc = d; this.toastService.success('Règlement supprimé'); },
        error: () => this.toastService.error('Erreur lors de la suppression')
      });
  }

  ouvrirOrigine(): void {
    if (!this.doc?.documentOrigineId) return;
    this.router.navigate(['/admin/facturation', this.doc.documentOrigineId]);
  }
}
