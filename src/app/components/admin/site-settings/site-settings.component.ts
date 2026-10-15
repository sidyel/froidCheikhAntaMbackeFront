import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ConfigService } from '../../../services/config.service';
import { FacturationService } from '../../../services/facturation.service';
import { environment } from '../../../../environments/environment';

type Tab = 'identite' | 'contact' | 'reseaux' | 'apparence' | 'legaux' | 'facturation' | 'livraison' | 'seo' | 'whatsapp';

@Component({
  selector: 'app-site-settings',
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Paramètres du site</h2>
        <p class="text-gray-500 text-sm mt-1">Toutes les modifications sont appliquées immédiatement après sauvegarde.</p>
      </div>

      <!-- Onglets -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex space-x-1 overflow-x-auto">
          <button *ngFor="let tab of tabs" (click)="activeTab = tab.id"
            [class.border-b-2]="activeTab === tab.id"
            [class.border-primary-600]="activeTab === tab.id"
            [class.text-primary-600]="activeTab === tab.id"
            class="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-500 hover:text-gray-700 transition-colors">
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <!-- IDENTITE -->
        <div *ngIf="activeTab === 'identite'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Nom du site *</label>
              <input formControlName="nomSite" class="form-input" placeholder="Mon E-commerce">
            </div>
            <div>
              <label class="form-label">Slogan</label>
              <input formControlName="sloganSite" class="form-input" placeholder="Votre slogan accrocheur">
            </div>
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea formControlName="descriptionSite" class="form-input" rows="3"></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">URL du logo</label>
              <input formControlName="logoUrl" class="form-input" placeholder="https://...">
            </div>
            <div>
              <label class="form-label">URL du favicon</label>
              <input formControlName="faviconUrl" class="form-input" placeholder="https://...">
            </div>
          </div>
        </div>

        <!-- CONTACT -->
        <div *ngIf="activeTab === 'contact'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Email de contact</label>
              <input formControlName="emailContact" type="email" class="form-input">
            </div>
            <div>
              <label class="form-label">Email support</label>
              <input formControlName="emailSupport" type="email" class="form-input">
            </div>
          </div>
          <div>
            <label class="form-label">Adresse complète</label>
            <input formControlName="adresseComplete" class="form-input">
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Ville</label>
              <input formControlName="ville" class="form-input">
            </div>
            <div>
              <label class="form-label">Pays</label>
              <input formControlName="pays" class="form-input">
            </div>
          </div>

          <!-- Téléphones -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="form-label mb-0">Téléphones</label>
              <button type="button" (click)="addTelephone()" class="text-primary-600 text-sm font-medium hover:text-primary-700">
                + Ajouter
              </button>
            </div>
            <div formArrayName="telephones" class="space-y-2">
              <div *ngFor="let tel of telephonesArray.controls; let i = index" [formGroupName]="i"
                   class="flex items-center gap-2">
                <input formControlName="numero" class="form-input flex-1" placeholder="77 000 00 00">
                <input formControlName="libelle" class="form-input w-32" placeholder="Label">
                <label class="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input formControlName="whatsapp" type="checkbox" class="rounded"> WhatsApp
                </label>
                <button type="button" (click)="removeTelephone(i)" class="text-red-500 hover:text-red-700 p-1">
                  <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RESEAUX SOCIAUX -->
        <div *ngIf="activeTab === 'reseaux'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Facebook</label>
              <input formControlName="facebookUrl" class="form-input" placeholder="https://facebook.com/...">
            </div>
            <div>
              <label class="form-label">Instagram</label>
              <input formControlName="instagramUrl" class="form-input" placeholder="https://instagram.com/...">
            </div>
            <div>
              <label class="form-label">Twitter / X</label>
              <input formControlName="twitterUrl" class="form-input" placeholder="https://x.com/...">
            </div>
            <div>
              <label class="form-label">LinkedIn</label>
              <input formControlName="linkedinUrl" class="form-input" placeholder="https://linkedin.com/...">
            </div>
            <div>
              <label class="form-label">YouTube</label>
              <input formControlName="youtubeUrl" class="form-input" placeholder="https://youtube.com/...">
            </div>
            <div>
              <label class="form-label">TikTok</label>
              <input formControlName="tiktokUrl" class="form-input" placeholder="https://tiktok.com/...">
            </div>
          </div>
        </div>

        <!-- APPARENCE -->
        <div *ngIf="activeTab === 'apparence'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label">Couleur primaire</label>
              <div class="flex gap-2 items-center">
                <input type="color" formControlName="couleurPrimaire"
                       class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                <input formControlName="couleurPrimaire" class="form-input font-mono"
                       placeholder="#2563eb" maxlength="7">
              </div>
              <div *ngIf="form.get('couleurPrimaire')?.errors?.['pattern']" class="form-error">
                Format #RRGGBB requis
              </div>
            </div>
            <div>
              <label class="form-label">Couleur secondaire</label>
              <div class="flex gap-2 items-center">
                <input type="color" formControlName="couleurSecondaire"
                       class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                <input formControlName="couleurSecondaire" class="form-input font-mono"
                       placeholder="#16a34a" maxlength="7">
              </div>
              <div *ngIf="form.get('couleurSecondaire')?.errors?.['pattern']" class="form-error">
                Format #RRGGBB requis
              </div>
            </div>
            <div>
              <label class="form-label">Couleur d'accent</label>
              <div class="flex gap-2 items-center">
                <input type="color" formControlName="couleurAccent"
                       class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                <input formControlName="couleurAccent" class="form-input font-mono"
                       placeholder="#dc2626" maxlength="7">
              </div>
              <div *ngIf="form.get('couleurAccent')?.errors?.['pattern']" class="form-error">
                Format #RRGGBB requis
              </div>
            </div>
          </div>
          <div>
            <label class="form-label">Police</label>
            <select formControlName="police" class="form-input">
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
            </select>
          </div>
          <!-- Aperçu des couleurs -->
          <div class="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p class="text-sm text-gray-500 mb-3">Aperçu</p>
            <div class="flex gap-2 flex-wrap">
              <span class="px-3 py-1 rounded text-white text-sm"
                    [style.background]="form.get('couleurPrimaire')?.value">Primaire</span>
              <span class="px-3 py-1 rounded text-white text-sm"
                    [style.background]="form.get('couleurSecondaire')?.value">Secondaire</span>
              <span class="px-3 py-1 rounded text-white text-sm"
                    [style.background]="form.get('couleurAccent')?.value">Accent</span>
            </div>
          </div>
        </div>

        <!-- TEXTES LEGAUX -->
        <div *ngIf="activeTab === 'legaux'" class="space-y-4">
          <div>
            <label class="form-label">Mentions légales</label>
            <textarea formControlName="mentionsLegales" class="form-input font-mono text-sm" rows="8"
                      placeholder="Markdown accepté..."></textarea>
          </div>
          <div>
            <label class="form-label">Politique de confidentialité</label>
            <textarea formControlName="politiqueConfidentialite" class="form-input font-mono text-sm" rows="8"></textarea>
          </div>
          <div>
            <label class="form-label">CGV</label>
            <textarea formControlName="cgv" class="form-input font-mono text-sm" rows="8"></textarea>
          </div>
        </div>

        <!-- FACTURATION -->
        <div *ngIf="activeTab === 'facturation'" class="space-y-6">

          <!-- Identité entreprise -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Identité entreprise</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="form-label">Raison sociale</label>
                <input formControlName="raisonSociale" class="form-input">
              </div>
              <div>
                <label class="form-label">Forme juridique</label>
                <input formControlName="formeJuridique" class="form-input" placeholder="SARL, SA, EI...">
              </div>
              <div>
                <label class="form-label">N° CFE</label>
                <input formControlName="numeroCfe" class="form-input">
              </div>
              <div>
                <label class="form-label">NINEA</label>
                <input formControlName="ninea" class="form-input">
              </div>
              <div>
                <label class="form-label">RCCM</label>
                <input formControlName="rccm" class="form-input">
              </div>
              <div>
                <label class="form-label">Capital social</label>
                <input formControlName="capitalSocial" class="form-input" placeholder="1 000 000 FCFA">
              </div>
            </div>
          </div>

          <!-- Coordonnées en-tête -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Coordonnées (en-tête PDF)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="form-label">Adresse du siège</label>
                <textarea formControlName="adresseSiege" class="form-input" rows="2"></textarea>
              </div>
              <div>
                <label class="form-label">Boîte postale</label>
                <input formControlName="boitePostale" class="form-input" placeholder="B.P. 7605 Dakar">
              </div>
              <div>
                <label class="form-label">Nom de la banque</label>
                <input formControlName="banqueNom" class="form-input" placeholder="CBAO">
              </div>
              <div>
                <label class="form-label">N° de compte bancaire</label>
                <input formControlName="numeroCompteBancaire" class="form-input">
              </div>
              <div class="md:col-span-2">
                <label class="form-label">Texte descriptif des activités</label>
                <textarea formControlName="texteDescriptifActivites" class="form-input" rows="2"
                  placeholder="Vente, installation et maintenance d'équipements..."></textarea>
              </div>
            </div>
          </div>

          <!-- TVA et devise -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">TVA et devise</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Taux TVA par défaut (%)</label>
                <input formControlName="tauxTvaDefaut" type="number" min="0" max="100" step="0.5" class="form-input" placeholder="18">
              </div>
              <div class="flex items-center gap-3 pt-6">
                <input formControlName="prixAfficheTTC" type="checkbox" id="prixTTC" class="rounded">
                <label for="prixTTC" class="text-sm text-gray-700 cursor-pointer">Prix affiché TTC (sinon HT)</label>
              </div>
              <div>
                <label class="form-label">Libellé devise (PDF)</label>
                <input formControlName="libelleDevise" class="form-input" placeholder="FCFA">
                <p class="text-xs text-gray-400 mt-1">Affiché dans les documents PDF (ex: FCFA). Le code ISO reste "XOF".</p>
              </div>
              <div>
                <label class="form-label">Mention d'exonération TVA</label>
                <input formControlName="mentionExonerationTva" class="form-input" placeholder="TVA non applicable — art. 293B du CGI">
              </div>
            </div>
          </div>

          <!-- Numérotation -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Numérotation des documents</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="form-label">Préfixe Facture</label>
                <input formControlName="prefixeFacture" class="form-input font-mono" placeholder="FAC">
              </div>
              <div>
                <label class="form-label">Préfixe Avoir</label>
                <input formControlName="prefixeAvoir" class="form-input font-mono" placeholder="AVO">
              </div>
              <div>
                <label class="form-label">Préfixe Devis</label>
                <input formControlName="prefixeDevis" class="form-input font-mono" placeholder="DEV">
              </div>
              <div>
                <label class="form-label">Préfixe Bon livraison</label>
                <input formControlName="prefixeBonLivraison" class="form-input font-mono" placeholder="BL">
              </div>
            </div>
          </div>

          <!-- Mentions -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Mentions et conditions</h3>
            <div class="space-y-4">
              <div>
                <label class="form-label">Conditions de paiement par défaut</label>
                <textarea formControlName="conditionsPaiementDefaut" class="form-input" rows="2"
                  placeholder="Paiement à réception de la facture..."></textarea>
              </div>
              <div>
                <label class="form-label">Mentions pied de document</label>
                <textarea formControlName="mentionsPiedDocument" class="form-input" rows="2"
                  placeholder="Merci de votre confiance..."></textarea>
              </div>
            </div>
          </div>

          <!-- Apparence PDF -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Apparence des documents PDF</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Couleur des documents</label>
                <div class="flex gap-2 items-center">
                  <input type="color" formControlName="couleurDocuments"
                    class="w-10 h-10 rounded cursor-pointer border border-gray-300">
                  <input formControlName="couleurDocuments" class="form-input font-mono"
                    placeholder="#2563eb" maxlength="7">
                </div>
              </div>
              <div>
                <label class="form-label">Mode d'en-tête</label>
                <select formControlName="modeEnTeteDocuments" class="form-input">
                  <option value="COMPOSE">Composé (texte — coordonnées)</option>
                  <option value="IMAGE">Image personnalisée</option>
                </select>
              </div>
              <div>
                <label class="form-label">URL image en-tête (mode IMAGE)</label>
                <input formControlName="urlImageEnTete" class="form-input" placeholder="https://...">
              </div>
              <div>
                <label class="form-label">URL image pied de page (mode IMAGE)</label>
                <input formControlName="urlImagePied" class="form-input" placeholder="https://...">
              </div>
              <div>
                <label class="form-label">URL cachet / signature</label>
                <input formControlName="urlCachetSignature" class="form-input" placeholder="https://...">
              </div>
              <div>
                <label class="form-label">Durée validité jeton WhatsApp (heures)</label>
                <input formControlName="dureeValiditeJetonHeures" type="number" min="1" max="168" class="form-input" placeholder="72">
              </div>
            </div>
          </div>

          <!-- Aperçu PDF -->
          <div class="pt-2">
            <button type="button" (click)="apercuPdf()" [disabled]="generationApercu"
              class="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
              {{ generationApercu ? 'Génération…' : 'Aperçu PDF (en-tête actuel)' }}
            </button>
            <p class="text-xs text-gray-400 mt-1">
              Génère un PDF de prévisualisation avec les données actuellement en base (pas les modifications non sauvegardées).
            </p>
          </div>

        </div>

        <!-- LIVRAISON -->
        <div *ngIf="activeTab === 'livraison'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Devise</label>
              <input formControlName="devise" class="form-input" placeholder="XOF">
            </div>
            <div>
              <label class="form-label">Seuil livraison gratuite (montant)</label>
              <input formControlName="seuilLivraisonGratuite" type="number" class="form-input" placeholder="50000">
            </div>
          </div>
          <p class="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
            Les tarifs de livraison par zone sont gérés dans le code back-end (CommandeService).
          </p>
        </div>

        <!-- SEO -->
        <div *ngIf="activeTab === 'seo'" class="space-y-4">
          <div>
            <label class="form-label">Titre meta (balise &lt;title&gt;)</label>
            <input formControlName="metaTitle" class="form-input" placeholder="Mon Site | Description courte">
          </div>
          <div>
            <label class="form-label">Description meta</label>
            <textarea formControlName="metaDescription" class="form-input" rows="3"
                      placeholder="Description de votre site pour les moteurs de recherche..."></textarea>
          </div>
          <div>
            <label class="form-label">Mots-clés (séparés par des virgules)</label>
            <input formControlName="metaKeywords" class="form-input" placeholder="climatisation, froid, Sénégal">
          </div>
          <div class="text-xs text-gray-400 mt-1" *ngIf="form.get('dateModification')?.value">
            Dernière modification : {{ form.get('dateModification')?.value | date:'dd/MM/yyyy HH:mm' }}
            <span *ngIf="form.get('modifiePar')?.value"> par {{ form.get('modifiePar')?.value }}</span>
          </div>
        </div>

        <!-- WHATSAPP -->
        <div *ngIf="activeTab === 'whatsapp'" class="space-y-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p class="font-medium mb-1">Variables disponibles dans les messages :</p>
            <code class="text-xs">&#123;numeroCommande&#125;</code>,
            <code class="text-xs">&#123;articles&#125;</code>,
            <code class="text-xs">&#123;total&#125;</code>,
            <code class="text-xs">&#123;devise&#125;</code>,
            <code class="text-xs">&#123;zoneNom&#125;</code>,
            <code class="text-xs">&#123;modeLivraison&#125;</code>,
            <code class="text-xs">&#123;nomClient&#125;</code>,
            <code class="text-xs">&#123;motif&#125;</code>
          </div>
          <div>
            <label class="form-label">Téléphone WhatsApp boutique (indicatif inclus)</label>
            <input formControlName="telephoneWhatsappBoutique" class="form-input" placeholder="221771234567">
            <p class="text-xs text-gray-400 mt-1">Calculé automatiquement depuis le 1er téléphone WhatsApp=true en Contact.</p>
          </div>
          <div>
            <label class="form-label">Indicatif pays par défaut</label>
            <input formControlName="indicatifPaysDefaut" class="form-input" placeholder="221">
          </div>
          <div>
            <label class="form-label">Message — Nouvelle commande</label>
            <textarea formControlName="whatsappMsgNouvelleCommande" class="form-input font-mono text-sm" rows="4"></textarea>
          </div>
          <div>
            <label class="form-label">Message — Commande confirmée</label>
            <textarea formControlName="whatsappMsgConfirmee" class="form-input font-mono text-sm" rows="4"></textarea>
          </div>
          <div>
            <label class="form-label">Message — Commande livrée</label>
            <textarea formControlName="whatsappMsgLivree" class="form-input font-mono text-sm" rows="4"></textarea>
          </div>
          <div>
            <label class="form-label">Message — Commande annulée</label>
            <textarea formControlName="whatsappMsgAnnulee" class="form-input font-mono text-sm" rows="4"></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button type="button" (click)="load()" class="btn-outline" [disabled]="saving">
            Annuler
          </button>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || saving">
            <lucide-icon name="save" class="w-4 h-4"></lucide-icon>
            <span>{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</span>
          </button>
        </div>

        <div *ngIf="successMessage" class="mt-3 text-green-600 text-sm text-right">{{ successMessage }}</div>
        <div *ngIf="errorMessage" class="mt-3 text-red-600 text-sm text-right">{{ errorMessage }}</div>
      </form>
    </div>
  `
})
export class SiteSettingsComponent implements OnInit {
  form!: FormGroup;
  activeTab: Tab = 'identite';
  saving = false;
  successMessage = '';
  errorMessage = '';
  generationApercu = false;

  tabs: { id: Tab; label: string }[] = [
    { id: 'identite',    label: 'Identité' },
    { id: 'contact',     label: 'Contact' },
    { id: 'reseaux',     label: 'Réseaux sociaux' },
    { id: 'apparence',   label: 'Apparence' },
    { id: 'legaux',      label: 'Textes légaux' },
    { id: 'facturation', label: 'Facturation' },
    { id: 'livraison',   label: 'Livraison' },
    { id: 'seo',         label: 'SEO' },
    { id: 'whatsapp',    label: '💬 WhatsApp' },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private configService: ConfigService,
    private facturationService: FacturationService
  ) {}

  apercuPdf(): void {
    if (this.generationApercu) return;
    this.generationApercu = true;
    this.facturationService.apercuEnTete().subscribe({
      next: (blob) => {
        this.facturationService.ouvrirBlob(blob, 'apercu-entete.pdf');
        this.generationApercu = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la génération de l\'aperçu PDF.';
        this.generationApercu = false;
      }
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  get telephonesArray(): FormArray {
    return this.form.get('telephones') as FormArray;
  }

  addTelephone(): void {
    this.telephonesArray.push(this.fb.group({
      numero: [''],
      libelle: [''],
      whatsapp: [false]
    }));
  }

  removeTelephone(index: number): void {
    this.telephonesArray.removeAt(index);
  }

  load(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/config`, { headers: this.authHeaders() })
      .subscribe({
        next: data => {
          this.telephonesArray.clear();
          (data.telephones || []).forEach((t: any) => {
            this.telephonesArray.push(this.fb.group({
              numero: [t.numero],
              libelle: [t.libelle],
              whatsapp: [t.whatsapp]
            }));
          });
          this.form.patchValue(data);
        },
        error: () => this.errorMessage = 'Impossible de charger la configuration.'
      });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.put<any>(`${environment.apiUrl}/admin/config`, this.form.value, { headers: this.authHeaders() })
      .subscribe({
        next: data => {
          this.saving = false;
          this.successMessage = 'Configuration enregistrée.';
          // Propager les nouvelles couleurs immédiatement
          this.configService.loadConfig();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: err => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Erreur lors de l\'enregistrement.';
        }
      });
  }

  private buildForm(): void {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    this.form = this.fb.group({
      // IDENTITE
      nomSite: [''],
      sloganSite: [''],
      descriptionSite: [''],
      logoUrl: [''],
      faviconUrl: [''],
      // CONTACT
      emailContact: ['', Validators.email],
      emailSupport: ['', Validators.email],
      telephones: this.fb.array([]),
      adresseComplete: [''],
      ville: [''],
      pays: [''],
      // RESEAUX
      facebookUrl: [''],
      instagramUrl: [''],
      twitterUrl: [''],
      linkedinUrl: [''],
      youtubeUrl: [''],
      tiktokUrl: [''],
      // APPARENCE
      couleurPrimaire:   ['#2563eb', Validators.pattern(hexPattern)],
      couleurSecondaire: ['#16a34a', Validators.pattern(hexPattern)],
      couleurAccent:     ['#dc2626', Validators.pattern(hexPattern)],
      police: ['Inter'],
      // LEGAUX
      mentionsLegales: [''],
      politiqueConfidentialite: [''],
      cgv: [''],
      // FACTURATION
      raisonSociale: [''],
      formeJuridique: [''],
      ninea: [''],
      rccm: [''],
      numeroCfe: [''],
      capitalSocial: [''],
      adresseSiege: [''],
      boitePostale: [''],
      banqueNom: [''],
      numeroCompteBancaire: [''],
      texteDescriptifActivites: [''],
      tauxTvaDefaut: [18],
      prixAfficheTTC: [false],
      libelleDevise: ['FCFA'],
      mentionExonerationTva: [''],
      prefixeFacture: ['FAC'],
      prefixeAvoir: ['AVO'],
      prefixeDevis: ['DEV'],
      prefixeBonLivraison: ['BL'],
      conditionsPaiementDefaut: [''],
      mentionsPiedDocument: [''],
      urlCachetSignature: [''],
      couleurDocuments: ['#2563eb'],
      modeEnTeteDocuments: ['COMPOSE'],
      urlImageEnTete: [''],
      urlImagePied: [''],
      dureeValiditeJetonHeures: [72],
      // LIVRAISON
      devise: ['XOF'],
      seuilLivraisonGratuite: [null],
      // SEO
      metaTitle: [''],
      metaDescription: [''],
      metaKeywords: [''],
      // METADATA (lecture seule)
      dateModification: [{ value: null, disabled: true }],
      modifiePar: [{ value: '', disabled: true }],
      // WHATSAPP
      telephoneWhatsappBoutique: [''],
      indicatifPaysDefaut: ['221'],
      whatsappMsgNouvelleCommande: [''],
      whatsappMsgConfirmee: [''],
      whatsappMsgLivree: [''],
      whatsappMsgAnnulee: [''],
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
