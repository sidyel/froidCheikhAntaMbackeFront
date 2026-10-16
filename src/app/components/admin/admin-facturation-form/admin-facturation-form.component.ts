import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { FacturationService } from '../../../services/facturation.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import {
  DocumentFacturationDTO,
  TypeDocument,
  LigneDocumentDTO,
  ClientFacturation
} from '../../../models/facturation.interface';

@Component({
  selector: 'app-admin-facturation-form',
  template: `
    <div class="p-6 max-w-5xl mx-auto">

      <!-- En-tête -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button (click)="retour()" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
          </button>
          <div>
            <h1 class="text-xl font-bold text-gray-900">
              {{ idDocument ? 'Modifier' : 'Nouveau' }} {{ labelType }}
            </h1>
            <p class="text-sm text-gray-500">{{ idDocument ? 'Brouillon — modifications en temps réel' : 'Créer un nouveau document' }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button (click)="sauvegarder()" [disabled]="sauvegarde"
            class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <lucide-icon name="save" class="w-4 h-4"></lucide-icon>
            {{ sauvegarde ? 'Sauvegarde…' : 'Sauvegarder' }}
          </button>
          <button *ngIf="idDocument" type="button" (click)="apercuBrouillon()" [disabled]="generationApercu"
            class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
            {{ generationApercu ? 'Génération…' : 'Aperçu PDF' }}
          </button>
          <button *ngIf="peutEmettre" (click)="confirmerEmission()" [disabled]="sauvegarde"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
            Émettre
          </button>
        </div>
      </div>

      <form [formGroup]="form" class="space-y-6">

        <!-- Type + client -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 class="font-semibold text-gray-900">Informations générales</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type de document *</label>
              <select formControlName="type"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="FACTURE">Facture</option>
                <option value="DEVIS">Devis</option>
                <option value="AVOIR" *ngIf="!estGestionnaire">Avoir</option>
                <option value="BON_LIVRAISON">Bon de livraison</option>
              </select>
            </div>
            <div *ngIf="typeActuel === 'DEVIS'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Validité jusqu'au</label>
              <input formControlName="dateValidite" type="date"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <!-- Client -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <div class="relative">
              <input [(ngModel)]="rechercheClient" [ngModelOptions]="{standalone: true}"
                (input)="onRechercheClient()"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rechercher un client ou saisir un nom libre…">
              <div *ngIf="suggestionsClients.length > 0"
                class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                <button *ngFor="let c of suggestionsClients" type="button"
                  (click)="selectionnerClient(c)"
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <span class="font-medium">{{ c.nom }}</span>
                  <span *ngIf="c.telephone" class="text-gray-500 ml-2">{{ c.telephone }}</span>
                  <span *ngIf="c.ninea" class="text-xs text-gray-400 ml-2">NINEA {{ c.ninea }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" formGroupName="client">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input formControlName="nomClient" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input formControlName="prenomClient" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input formControlName="telephoneClient" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input formControlName="emailClient" type="email" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input formControlName="adresseClient" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">NINEA</label>
              <input formControlName="nineaClient" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
              <input formControlName="rccmClient" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <!-- Bon de livraison : livreur -->
          <div *ngIf="typeActuel === 'BON_LIVRAISON'" class="grid grid-cols-1 md:grid-cols-2 gap-4" formGroupName="client">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Livreur — Nom</label>
              <input formControlName="livreurNom" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Livreur — Téléphone</label>
              <input formControlName="livreurTelephone" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>

        <!-- Lignes -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">Lignes du document</h2>
            <button type="button" (click)="ajouterLigne()"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
              Ajouter une ligne
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left pb-2 font-medium text-gray-600 min-w-48">Désignation</th>
                  <th class="text-right pb-2 font-medium text-gray-600 w-20">Qté</th>
                  <th class="text-right pb-2 font-medium text-gray-600 w-28">P.U. HT</th>
                  <th class="text-right pb-2 font-medium text-gray-600 w-20">TVA %</th>
                  <th class="text-right pb-2 font-medium text-gray-600 w-20">Remise %</th>
                  <th class="text-right pb-2 font-medium text-gray-600 w-28">Montant HT</th>
                  <th class="w-8"></th>
                </tr>
              </thead>
              <tbody formArrayName="lignes">
                <tr *ngFor="let ligne of lignesArray.controls; let i = index" [formGroupName]="i"
                  class="border-b border-gray-100 last:border-0">
                  <td class="py-2 pr-2">
                    <input formControlName="designation"
                      class="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Désignation…">
                  </td>
                  <td class="py-2 pr-2">
                    <input formControlName="quantite" type="number" min="0" step="0.01"
                      (input)="recalculer()"
                      class="w-full text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  </td>
                  <td class="py-2 pr-2">
                    <input formControlName="prixUnitaireHT" type="number" min="0" step="1"
                      (input)="recalculer()"
                      class="w-full text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  </td>
                  <td class="py-2 pr-2">
                    <input formControlName="tauxTva" type="number" min="0" max="100" step="0.5"
                      (input)="recalculer()"
                      class="w-full text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  </td>
                  <td class="py-2 pr-2">
                    <input formControlName="remisePourcent" type="number" min="0" max="100" step="0.5"
                      (input)="recalculer()"
                      class="w-full text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  </td>
                  <td class="py-2 pr-2 text-right font-semibold text-gray-800">
                    {{ montantHtLigne(i) | number:'1.0-0' }}
                  </td>
                  <td class="py-2">
                    <button type="button" (click)="supprimerLigne(i)"
                      class="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totaux -->
          <div class="mt-4 flex justify-end">
            <div class="w-72 space-y-1 text-sm">
              <div class="flex justify-between text-gray-600">
                <span>Total HT</span>
                <span class="font-mono">{{ totalHT | number:'1.0-0' }} FCFA</span>
              </div>
              <div class="flex justify-between items-center text-gray-600">
                <span>Remise globale (%)</span>
                <input formControlName="remiseTotale" type="number" min="0" max="100" step="0.5"
                  (input)="recalculer()"
                  class="w-20 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              </div>
              <div *ngIf="remiseGlobale > 0" class="flex justify-between text-red-600">
                <span>Remise</span>
                <span class="font-mono">- {{ montantRemiseGlobale | number:'1.0-0' }} FCFA</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>TVA</span>
                <span class="font-mono">{{ totalTVA | number:'1.0-0' }} FCFA</span>
              </div>
              <div class="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total TTC</span>
                <span class="font-mono text-blue-600">{{ totalTTC | number:'1.0-0' }} FCFA</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes internes</label>
          <textarea formControlName="notes" rows="3"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes non imprimées sur le document…"></textarea>
        </div>

      </form>

      <!-- Modal confirmation émission -->
      <div *ngIf="showModalEmission"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
          <h3 class="font-bold text-gray-900 mb-2">Émettre le document ?</h3>
          <p class="text-sm text-gray-600 mb-6">
            Une fois émis, le document sera numéroté et ne pourra plus être modifié.
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
export class AdminFacturationFormComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  idDocument?: number;
  sauvegarde = false;
  generationApercu = false;
  showModalEmission = false;
  suggestionsClients: ClientFacturation[] = [];
  rechercheClient = '';
  totalHT = 0;
  totalTVA = 0;
  totalTTC = 0;
  remiseGlobale = 0;
  montantRemiseGlobale = 0;

  get estGestionnaire(): boolean {
    return this.authService.hasRole('GESTIONNAIRE');
  }

  get typeActuel(): TypeDocument {
    return this.form?.get('type')?.value as TypeDocument ?? 'FACTURE';
  }

  get peutEmettre(): boolean {
    if (this.estGestionnaire) return this.typeActuel === 'BON_LIVRAISON';
    return true;
  }

  get labelType(): string {
    const map: Record<TypeDocument, string> = {
      FACTURE: 'Facture', DEVIS: 'Devis', AVOIR: 'Avoir', BON_LIVRAISON: 'Bon de livraison'
    };
    return map[this.typeActuel] ?? 'Document';
  }

  get lignesArray(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  private destroy$ = new Subject<void>();
  private rechercheClient$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private facturationService: FacturationService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Type pré-sélectionné depuis query param
    const typeParam = this.route.snapshot.queryParamMap.get('type') as TypeDocument;
    if (typeParam) this.form.patchValue({ type: typeParam });

    // Chargement si édition
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nouveau') {
      this.idDocument = +id;
      this.chargerDocument(this.idDocument);
    } else {
      this.ajouterLigne();
    }

    // Autocomplétion client avec debounce
    this.rechercheClient$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      if (q.length < 2) { this.suggestionsClients = []; return; }
      this.facturationService.rechercherClients(q)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: (r) => this.suggestionsClients = r, error: () => {} });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      type: ['FACTURE', Validators.required],
      dateValidite: [''],
      remiseTotale: [0],
      notes: [''],
      client: this.fb.group({
        nomClient: [''],
        prenomClient: [''],
        telephoneClient: [''],
        emailClient: [''],
        adresseClient: [''],
        nineaClient: [''],
        rccmClient: [''],
        livreurNom: [''],
        livreurTelephone: ['']
      }),
      lignes: this.fb.array([])
    });
  }

  private chargerDocument(id: number): void {
    this.facturationService.getDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doc) => this.remplirFormulaire(doc),
        error: () => this.toastService.error('Impossible de charger le document')
      });
  }

  private remplirFormulaire(doc: DocumentFacturationDTO): void {
    this.form.patchValue({
      type: doc.type,
      dateValidite: doc.dateValidite ?? '',
      remiseTotale: doc.remiseTotale ?? 0,
      notes: doc.notes ?? '',
      client: {
        nomClient: doc.nomClient ?? '',
        prenomClient: doc.prenomClient ?? '',
        telephoneClient: doc.telephoneClient ?? '',
        emailClient: doc.emailClient ?? '',
        adresseClient: doc.adresseClient ?? '',
        nineaClient: doc.nineaClient ?? '',
        rccmClient: doc.rccmClient ?? '',
        livreurNom: doc.livreurNom ?? '',
        livreurTelephone: doc.livreurTelephone ?? ''
      }
    });
    // Lignes
    while (this.lignesArray.length) this.lignesArray.removeAt(0);
    (doc.lignes ?? []).forEach(l => this.lignesArray.push(this.creerLigneGroup(l)));
    this.recalculer();
  }

  private creerLigneGroup(l?: Partial<LigneDocumentDTO>): FormGroup {
    return this.fb.group({
      id: [l?.id ?? null],
      designation: [l?.designation ?? '', Validators.required],
      quantite: [l?.quantite ?? 1, [Validators.required, Validators.min(0)]],
      prixUnitaireHT: [l?.prixUnitaireHT ?? 0, [Validators.required, Validators.min(0)]],
      tauxTva: [l?.tauxTva ?? 18, [Validators.min(0), Validators.max(100)]],
      remisePourcent: [l?.remisePourcent ?? 0, [Validators.min(0), Validators.max(100)]]
    });
  }

  ajouterLigne(): void {
    this.lignesArray.push(this.creerLigneGroup());
  }

  supprimerLigne(i: number): void {
    this.lignesArray.removeAt(i);
    this.recalculer();
  }

  montantHtLigne(i: number): number {
    const g = this.lignesArray.at(i);
    const qte = +g.get('quantite')?.value || 0;
    const pu = +g.get('prixUnitaireHT')?.value || 0;
    const remise = +g.get('remisePourcent')?.value || 0;
    return Math.round(qte * pu * (1 - remise / 100));
  }

  recalculer(): void {
    let ht = 0;
    let tva = 0;
    for (let i = 0; i < this.lignesArray.length; i++) {
      const g = this.lignesArray.at(i);
      const qte = +g.get('quantite')?.value || 0;
      const pu = +g.get('prixUnitaireHT')?.value || 0;
      const tauxTva = +g.get('tauxTva')?.value || 0;
      const remiseLigne = +g.get('remisePourcent')?.value || 0;
      const htLigne = qte * pu * (1 - remiseLigne / 100);
      ht += htLigne;
      tva += htLigne * (tauxTva / 100);
    }
    this.remiseGlobale = +this.form.get('remiseTotale')?.value || 0;
    this.montantRemiseGlobale = Math.round(ht * this.remiseGlobale / 100);
    const htApresRemise = ht * (1 - this.remiseGlobale / 100);
    const tvaApresRemise = tva * (1 - this.remiseGlobale / 100);
    this.totalHT = Math.round(htApresRemise);
    this.totalTVA = Math.round(tvaApresRemise);
    this.totalTTC = Math.round(htApresRemise + tvaApresRemise);
  }

  onRechercheClient(): void {
    this.rechercheClient$.next(this.rechercheClient);
  }

  selectionnerClient(c: ClientFacturation): void {
    this.form.get('client')?.patchValue({
      nomClient: c.nom ?? '',
      prenomClient: '',
      telephoneClient: c.telephone ?? '',
      emailClient: c.email ?? '',
      adresseClient: c.adresse ?? '',
      nineaClient: c.ninea ?? '',
      rccmClient: c.rccm ?? ''
    });
    this.rechercheClient = c.nom;
    this.suggestionsClients = [];
  }

  private buildRequest() {
    const v = this.form.value;
    return {
      type: v.type as TypeDocument,
      dateValidite: v.dateValidite || undefined,
      remiseTotale: v.remiseTotale || 0,
      notes: v.notes || undefined,
      nomClient: v.client.nomClient || undefined,
      prenomClient: v.client.prenomClient || undefined,
      telephoneClient: v.client.telephoneClient || undefined,
      emailClient: v.client.emailClient || undefined,
      adresseClient: v.client.adresseClient || undefined,
      nineaClient: v.client.nineaClient || undefined,
      rccmClient: v.client.rccmClient || undefined,
      livreurNom: v.client.livreurNom || undefined,
      livreurTelephone: v.client.livreurTelephone || undefined,
      lignes: (v.lignes as any[]).map((l: any, i: number) => ({
        id: l.id || undefined,
        ordre: i + 1,
        designation: l.designation,
        quantite: +l.quantite,
        prixUnitaireHT: +l.prixUnitaireHT,
        tauxTva: +l.tauxTva,
        remisePourcent: +l.remisePourcent
      }))
    };
  }

  sauvegarder(): void {
    if (this.sauvegarde) return;
    this.sauvegarde = true;
    const req = this.buildRequest();
    const op = this.idDocument
      ? this.facturationService.modifierDocument(this.idDocument, req as any)
      : this.facturationService.creerDocument(req as any);

    op.pipe(takeUntil(this.destroy$)).subscribe({
      next: (doc) => {
        this.sauvegarde = false;
        if (!this.idDocument) {
          this.router.navigate(['/admin/facturation', doc.id]);
        } else {
          this.toastService.success('Document sauvegardé');
        }
      },
      error: () => {
        this.sauvegarde = false;
        this.toastService.error('Erreur lors de la sauvegarde');
      }
    });
  }

  apercuBrouillon(): void {
    if (!this.idDocument || this.generationApercu) return;
    this.generationApercu = true;
    this.facturationService.previsualiserBrouillon(this.idDocument).subscribe({
      next: (blob) => {
        this.facturationService.ouvrirBlob(blob, `brouillon-${this.idDocument}.pdf`);
        this.generationApercu = false;
      },
      error: () => {
        this.toastService.error('Erreur lors de la génération de l\'aperçu PDF');
        this.generationApercu = false;
      }
    });
  }

  confirmerEmission(): void {
    this.showModalEmission = true;
  }

  emettre(): void {
    this.showModalEmission = false;
    if (!this.idDocument) {
      // Sauvegarder d'abord puis émettre
      const req = this.buildRequest();
      this.sauvegarde = true;
      this.facturationService.creerDocument(req as any)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (doc) => {
            this.idDocument = doc.id;
            this.emettreDocument(doc.id);
          },
          error: () => { this.sauvegarde = false; this.toastService.error('Erreur lors de la sauvegarde'); }
        });
    } else {
      this.emettreDocument(this.idDocument);
    }
  }

  private emettreDocument(id: number): void {
    this.facturationService.emettreDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sauvegarde = false;
          this.toastService.success('Document émis avec succès');
          this.router.navigate(['/admin/facturation', id]);
        },
        error: () => { this.sauvegarde = false; this.toastService.error('Erreur lors de l\'émission'); }
      });
  }

  retour(): void {
    this.router.navigate(['/admin/facturation']);
  }
}
