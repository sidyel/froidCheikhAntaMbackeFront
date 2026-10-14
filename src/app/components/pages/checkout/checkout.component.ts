import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../../services/cart.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ConfigService } from '../../../services/config.service';
import { LivraisonService } from '../../../services/livraison.service';
import {
  Cart,
  Breadcrumb,
  ModeLivraison,
  Commande,
  ZoneLivraisonPublic,
  EstimationLivraisonResponse
} from '../../../models/interfaces';

@Component({
  selector: 'app-checkout',
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <div class="container mx-auto px-4 py-8">

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Finaliser ma commande
          </h1>
          <p class="text-gray-600">
            Vérifiez vos informations et validez votre commande
          </p>
        </div>

        <form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()" *ngIf="cart.items.length > 0">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Checkout Form -->
            <div class="lg:col-span-2 space-y-6">

              <!-- Customer Information -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Prénom *</label>
                    <input
                      type="text"
                      formControlName="prenom"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('prenom')">
                    <div *ngIf="isFieldInvalid('prenom')" class="text-red-500 text-sm mt-1">
                      Le prénom est requis
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Nom *</label>
                    <input
                      type="text"
                      formControlName="nom"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('nom')">
                    <div *ngIf="isFieldInvalid('nom')" class="text-red-500 text-sm mt-1">
                      Le nom est requis
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Email <span class="text-gray-400 text-sm">(optionnel)</span></label>
                    <input
                      type="email"
                      formControlName="email"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('email')"
                      placeholder="votre.email@example.com">
                    <div *ngIf="isFieldInvalid('email')" class="text-red-500 text-sm mt-1">
                      Format d'email invalide
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Téléphone *</label>
                    <input
                      type="tel"
                      formControlName="telephone"
                      placeholder="+221 77 123 45 67"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('telephone')">
                    <div *ngIf="isFieldInvalid('telephone')" class="text-red-500 text-sm mt-1">
                      <span *ngIf="checkoutForm.get('telephone')?.errors?.['required']">Le téléphone est requis</span>
                      <span *ngIf="checkoutForm.get('telephone')?.errors?.['minlength'] || checkoutForm.get('telephone')?.errors?.['pattern']">
                        Le numéro doit contenir au minimum 9 chiffres
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery Address -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Adresse de livraison</h2>

                <!-- Loading zones -->
                <div *ngIf="zonesLoading" class="flex items-center space-x-2 text-gray-500 mb-4">
                  <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-sm">Chargement des zones de livraison...</span>
                </div>

                <div class="space-y-4">
                  <!-- Ville (sélection) -->
                  <div>
                    <label class="form-label">Ville *</label>
                    <select
                      formControlName="ville"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('ville')"
                      (change)="onVilleChange($event)">
                      <option value="">Sélectionnez votre ville</option>
                      <option *ngFor="let villeLabel of villesDisponibles" [value]="villeLabel">
                        {{ villeLabel }}
                      </option>
                    </select>
                    <div *ngIf="isFieldInvalid('ville')" class="text-red-500 text-sm mt-1">
                      La ville est requise
                    </div>
                  </div>

                  <!-- Quartier (sélection) -->
                  <div>
                    <label class="form-label">Quartier/Zone *</label>

                    <!-- Filtre de recherche -->
                    <div *ngIf="zonesQuartierDisponibles.length > 5" class="relative mb-1">
                      <input
                        type="text"
                        [(ngModel)]="quartierSearchTerm"
                        [ngModelOptions]="{standalone: true}"
                        placeholder="Rechercher un quartier..."
                        class="form-input text-sm py-1.5">
                    </div>

                    <select
                      formControlName="adresseLigne1"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('adresseLigne1')"
                      [attr.disabled]="!selectedVilleLabel ? '' : null"
                      (change)="onQuartierChange($event)">
                      <option value="">Sélectionnez votre quartier</option>
                      <ng-container *ngFor="let zone of zonesQuartiersFiltres">
                        <option [value]="zone.quartierLabel">
                          {{ zone.quartierLabel }}
                          <span *ngIf="zone.prixStandard > 0"> — {{ zone.prixStandard | currency:devise:'symbol':'1.0-0' }}</span>
                          <span *ngIf="zone.prixStandard === 0"> — Livraison gratuite</span>
                        </option>
                      </ng-container>
                    </select>
                    <div *ngIf="isFieldInvalid('adresseLigne1')" class="text-red-500 text-sm mt-1">
                      Le quartier est requis
                    </div>

                    <!-- Délai estimé -->
                    <div *ngIf="selectedZone" class="text-xs text-blue-600 mt-1 flex items-center space-x-1">
                      <lucide-icon name="clock" class="w-3 h-3"></lucide-icon>
                      <span>Délai estimé : {{ selectedZone.delaiEstime }}</span>
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Complément d'adresse (point de repère)</label>
                    <input
                      type="text"
                      formControlName="adresseLigne2"
                      placeholder="Numéro de maison, bâtiment, étage... (optionnel)"
                      class="form-input">
                    <div class="text-xs text-gray-500 mt-1">
                      Précisez votre adresse exacte (numéro, bâtiment, point de repère...)
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Code postal</label>
                    <input
                      type="text"
                      formControlName="codePostal"
                      placeholder="Optionnel"
                      class="form-input">
                  </div>
                </div>
              </div>

              <!-- Delivery Method -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Mode de livraison</h2>

                <div class="space-y-3">

                  <!-- Livraison à domicile -->
                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="LIVRAISON_DOMICILE"
                      formControlName="modeLivraison"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex items-center space-x-3 flex-1">
                      <img
                        src="assets/images/livraison1.jpg"
                        alt="Livraison à domicile"
                        class="h-12 w-16 object-contain rounded"
                        onerror="this.style.display='none'">
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="font-medium text-gray-900">Livraison à domicile</div>
                            <div class="text-sm text-gray-500">Livraison selon délai de la zone</div>
                          </div>
                          <div [class]="getDeliveryFees() > 0 ? 'text-gray-900 font-medium' : 'text-green-600 font-medium'">
                            <span *ngIf="isModeLivraison('LIVRAISON_DOMICILE') && estimationLoading" class="text-gray-400 text-sm">Calcul...</span>
                            <span *ngIf="!estimationLoading">{{ getDeliveryFees() > 0 ? (getDeliveryFees() | currency:devise:'symbol':'1.0-0') : (isModeLivraison('LIVRAISON_DOMICILE') && selectedZoneId ? 'Gratuit' : '—') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  <!-- Livraison express -->
                  <label
                    class="flex items-center p-4 border border-gray-200 rounded-lg transition-colors"
                    [class.cursor-pointer]="!isExpressDisabled()"
                    [class.cursor-not-allowed]="isExpressDisabled()"
                    [class.opacity-50]="isExpressDisabled()"
                    [class.hover:border-primary-300]="!isExpressDisabled()">
                    <input
                      type="radio"
                      value="LIVRAISON_EXPRESS"
                      formControlName="modeLivraison"
                      class="form-radio text-primary-600"
                      [disabled]="isExpressDisabled()">
                    <div class="ml-3 flex items-center space-x-3 flex-1">
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="font-medium text-gray-900">Livraison express</div>
                            <div class="text-sm text-gray-500">
                              <span *ngIf="!selectedZone">Sélectionnez d'abord une zone</span>
                              <span *ngIf="selectedZone && !selectedZone.expressDisponible" class="text-orange-500">Non disponible pour cette zone</span>
                              <span *ngIf="selectedZone && selectedZone.expressDisponible">Livraison prioritaire</span>
                            </div>
                          </div>
                          <div class="text-gray-900 font-medium">
                            <span *ngIf="isModeLivraison('LIVRAISON_EXPRESS') && estimationLoading" class="text-gray-400 text-sm">Calcul...</span>
                            <span *ngIf="isModeLivraison('LIVRAISON_EXPRESS') && !estimationLoading && estimation">{{ estimation.fraisLivraisonTotal | currency:devise:'symbol':'1.0-0' }}</span>
                            <span *ngIf="!isModeLivraison('LIVRAISON_EXPRESS')">—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  <!-- Retrait en magasin -->
                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="RETRAIT_MAGASIN"
                      formControlName="modeLivraison"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex items-center space-x-3 flex-1">
                      <img
                        src="assets/images/magasin.jpg"
                        alt="Retrait en magasin"
                        class="h-12 w-16 object-contain rounded"
                        onerror="this.style.display='none'">
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="font-medium text-gray-900">Retrait en magasin</div>
                            <div class="text-sm text-gray-500">Disponible sous 2h</div>
                          </div>
                          <div class="text-green-600 font-medium">Gratuit</div>
                        </div>
                      </div>
                    </div>
                  </label>

                </div>

                <!-- Estimation error -->
                <div *ngIf="estimationError && !isModeLivraison('RETRAIT_MAGASIN')" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <lucide-icon name="alert-circle" class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"></lucide-icon>
                  <p class="text-sm text-red-700">{{ estimationError }}</p>
                </div>
              </div>

              <!-- Payment Method -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Mode de paiement</h2>

                <div class="space-y-3">

                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="WAVE"
                      formControlName="methodePaiement"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex items-center space-x-3 flex-1">
                      <img
                        src="assets/images/wave.png"
                        alt="Wave"
                        class="h-12 w-auto object-contain rounded"
                        onerror="this.style.display='none'">
                      <div>
                        <div class="font-medium text-gray-900">Wave</div>
                        <div class="text-sm text-gray-500">Paiement mobile sécurisé</div>
                      </div>
                    </div>
                  </label>

                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="ORANGE_MONEY"
                      formControlName="methodePaiement"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex items-center space-x-3 flex-1">
                      <img
                        src="assets/images/om.png"
                        alt="Orange Money"
                        class="h-12 w-auto object-contain rounded"
                        onerror="this.style.display='none'">
                      <div>
                        <div class="font-medium text-gray-900">Orange Money</div>
                        <div class="text-sm text-gray-500">Paiement mobile Orange</div>
                      </div>
                    </div>
                  </label>

                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="ESPECES"
                      formControlName="methodePaiement"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex items-center space-x-3 flex-1">
                      <img
                        src="assets/images/livraison.png"
                        alt="Paiement à la livraison"
                        class="h-12 w-auto object-contain rounded"
                        onerror="this.style.display='none'">
                      <div>
                        <div class="font-medium text-gray-900">Paiement à la livraison</div>
                        <div class="text-sm text-gray-500">Paiement en espèces</div>
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              <!-- Comments -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Commentaires (optionnel)</h2>
                <textarea
                  formControlName="commentaire"
                  rows="3"
                  placeholder="Ajoutez un commentaire à votre commande..."
                  class="form-input"></textarea>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>

                <!-- Cart Items -->
                <div class="space-y-3 mb-4">
                  <div *ngFor="let item of cart.items" class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <lucide-icon name="package" class="w-6 h-6 text-gray-400"></lucide-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate">{{ item.produit.nomProduit }}</div>
                      <div class="text-xs text-gray-500">Qté: {{ item.quantite }}</div>
                    </div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ item.sousTotal | currency:devise:'symbol':'1.0-0' }}
                    </div>
                  </div>
                </div>

                <!-- Price Breakdown -->
                <div class="border-t border-gray-200 pt-4 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Sous-total</span>
                    <span class="font-medium">{{ cart.totalPrice | currency:devise:'symbol':'1.0-0' }}</span>
                  </div>

                  <!-- Frais de livraison -->
                  <ng-container *ngIf="isModeLivraison('RETRAIT_MAGASIN')">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Frais de livraison</span>
                      <span class="text-green-600 font-medium">Gratuit</span>
                    </div>
                  </ng-container>

                  <ng-container *ngIf="!isModeLivraison('RETRAIT_MAGASIN')">
                    <div *ngIf="estimationLoading" class="flex justify-between text-sm">
                      <span class="text-gray-600">Frais de livraison</span>
                      <span class="text-gray-400 text-xs animate-pulse">Calcul en cours...</span>
                    </div>

                    <div *ngIf="!estimationLoading && estimation" class="space-y-1">
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Frais zone</span>
                        <span [class]="estimation.livraisonGratuite ? 'text-green-600 font-medium' : 'font-medium'">
                          {{ estimation.livraisonGratuite ? 'Gratuit' : (estimation.fraisZone | currency:devise:'symbol':'1.0-0') }}
                        </span>
                      </div>
                      <div *ngIf="estimation.supplementExpress > 0" class="flex justify-between text-sm">
                        <span class="text-gray-600">Supplément express</span>
                        <span class="font-medium">{{ estimation.supplementExpress | currency:devise:'symbol':'1.0-0' }}</span>
                      </div>
                      <div *ngIf="estimation.supplementGabarit > 0" class="flex justify-between text-sm">
                        <span class="text-gray-600">Supplément gabarit</span>
                        <span class="font-medium">{{ estimation.supplementGabarit | currency:devise:'symbol':'1.0-0' }}</span>
                      </div>
                      <div *ngIf="estimation.delaiEstime" class="text-xs text-blue-600">
                        Délai estimé : {{ estimation.delaiEstime }}
                      </div>
                    </div>

                    <div *ngIf="!estimationLoading && !estimation && !estimationError" class="flex justify-between text-sm">
                      <span class="text-gray-600">Frais de livraison</span>
                      <span class="text-gray-400 text-xs">Sélectionnez une zone</span>
                    </div>

                    <div *ngIf="estimationError" class="text-xs text-red-500">
                      {{ estimationError }}
                    </div>
                  </ng-container>

                  <div class="border-t border-gray-200 pt-2">
                    <div class="flex justify-between text-lg font-bold">
                      <span class="text-gray-900">Total</span>
                      <span class="text-primary-600">{{ getTotalWithDelivery() | currency:devise:'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="!canSubmit"
                  class="w-full btn-primary py-3 text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
                  <div *ngIf="isSubmitting" class="flex items-center justify-center space-x-2">
                    <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Traitement...</span>
                  </div>
                  <div *ngIf="!isSubmitting" class="flex items-center justify-center space-x-2">
                    <lucide-icon name="credit-card" class="w-5 h-5"></lucide-icon>
                    <span>Valider ma commande</span>
                  </div>
                </button>

                <!-- Estimation required notice -->
                <div *ngIf="!canSubmit && checkoutForm.valid && !isModeLivraison('RETRAIT_MAGASIN') && !selectedZoneId && !isSubmitting"
                     class="mt-2 text-xs text-center text-orange-600">
                  Sélectionnez votre zone de livraison pour valider
                </div>
                <div *ngIf="!canSubmit && checkoutForm.valid && !isModeLivraison('RETRAIT_MAGASIN') && selectedZoneId && estimationError && !isSubmitting"
                     class="mt-2 text-xs text-center text-red-600">
                  Estimation impossible — veuillez modifier votre sélection
                </div>

                <!-- Security Info -->
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <div class="flex items-center space-x-2 text-sm text-gray-600">
                    <lucide-icon name="shield" class="w-4 h-4 text-green-500"></lucide-icon>
                    <span>Commande 100% sécurisée</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Empty Cart -->
        <div *ngIf="cart.items.length === 0" class="text-center py-16">
          <lucide-icon name="shopping-cart" class="w-24 h-24 text-gray-300 mx-auto mb-6"></lucide-icon>
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">Votre panier est vide</h2>
          <p class="text-gray-600 mb-8">Ajoutez des produits à votre panier pour passer une commande.</p>
          <button (click)="goToProducts()" class="btn-primary">
            <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
            <span>Continuer mes achats</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  checkoutForm: FormGroup;
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  isSubmitting = false;
  isAuthenticated = false;

  // Zones livraison
  zonesLoading = false;
  zones: ZoneLivraisonPublic[] = [];
  villesDisponibles: string[] = [];
  zonesParVille = new Map<string, ZoneLivraisonPublic[]>();
  zonesQuartierDisponibles: ZoneLivraisonPublic[] = [];
  quartierSearchTerm = '';
  selectedVilleLabel = '';
  selectedZoneId: number | null = null;
  selectedZone: ZoneLivraisonPublic | null = null;

  // Estimation
  estimation: EstimationLivraisonResponse | null = null;
  estimationLoading = false;
  estimationError: string | null = null;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Accueil', route: '/' },
    { label: 'Mon Panier', route: '/panier' },
    { label: 'Commande', route: undefined }
  ];

  get devise(): string {
    return this.configService.config.devise || 'XOF';
  }

  get zonesQuartiersFiltres(): ZoneLivraisonPublic[] {
    if (!this.quartierSearchTerm.trim()) return this.zonesQuartierDisponibles;
    const term = this.quartierSearchTerm.toLowerCase();
    return this.zonesQuartierDisponibles.filter(z =>
      z.quartierLabel.toLowerCase().includes(term)
    );
  }

  get canSubmit(): boolean {
    if (this.isSubmitting || !this.checkoutForm.valid) return false;
    if (this.isModeLivraison('RETRAIT_MAGASIN')) return true;
    return !!this.selectedZoneId && !this.estimationLoading && !this.estimationError;
  }

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private configService: ConfigService,
    private livraisonService: LivraisonService
  ) {
    this.checkoutForm = this.createCheckoutForm();
  }

  ngOnInit(): void {
    this.loadZones();
    this.loadCart();
    this.checkAuthentication();
    this.prefillUserData();

    // Relancer l'estimation à chaque changement de mode
    this.checkoutForm.get('modeLivraison')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lancerEstimation());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadZones(): void {
    this.zonesLoading = true;
    this.livraisonService.getZonesActives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zones) => {
          this.zones = zones;
          this.buildVillesMap(zones);
          this.zonesLoading = false;
        },
        error: () => {
          this.zonesLoading = false;
          this.toastService.error('Erreur', 'Impossible de charger les zones de livraison');
        }
      });
  }

  private buildVillesMap(zones: ZoneLivraisonPublic[]): void {
    const villesSet = new Set<string>();
    const map = new Map<string, ZoneLivraisonPublic[]>();

    for (const zone of zones) {
      if (!map.has(zone.villeLabel)) {
        map.set(zone.villeLabel, []);
        villesSet.add(zone.villeLabel);
      }
      map.get(zone.villeLabel)!.push(zone);
    }

    this.zonesParVille = map;
    this.villesDisponibles = Array.from(villesSet);
  }

  onVilleChange(event: Event): void {
    const villeLabel = (event.target as HTMLSelectElement).value;
    this.selectedVilleLabel = villeLabel;
    this.zonesQuartierDisponibles = villeLabel ? (this.zonesParVille.get(villeLabel) ?? []) : [];
    this.quartierSearchTerm = '';

    // Réinitialiser quartier et estimation
    this.selectedZoneId = null;
    this.selectedZone = null;
    this.estimation = null;
    this.estimationError = null;
    this.checkoutForm.patchValue({ adresseLigne1: '' });
  }

  onQuartierChange(event: Event): void {
    const quartierLabel = (event.target as HTMLSelectElement).value;

    if (quartierLabel) {
      const zone = this.zonesQuartierDisponibles.find(z => z.quartierLabel === quartierLabel);
      this.selectedZoneId = zone?.id ?? null;
      this.selectedZone = zone ?? null;
      this.lancerEstimation();
    } else {
      this.selectedZoneId = null;
      this.selectedZone = null;
      this.estimation = null;
      this.estimationError = null;
    }
  }

  lancerEstimation(): void {
    const modeLivraison = this.checkoutForm.get('modeLivraison')?.value;

    if (modeLivraison === 'RETRAIT_MAGASIN') {
      this.estimation = null;
      this.estimationError = null;
      return;
    }

    if (!this.selectedZoneId || this.cart.items.length === 0) {
      this.estimation = null;
      this.estimationError = null;
      return;
    }

    this.estimationLoading = true;
    this.estimationError = null;

    this.livraisonService.estimer({
      zoneId: this.selectedZoneId,
      modeLivraison,
      lignes: this.cart.items.map(item => ({
        produitId: item.produit.idProduit,
        quantite: item.quantite
      }))
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.estimation = resp;
          this.estimationLoading = false;
          if (resp.livraisonGratuite) {
            this.toastService.success('Livraison gratuite !', 'Votre commande bénéficie de la livraison gratuite pour cette zone.');
          }
        },
        error: (err) => {
          this.estimationLoading = false;
          this.estimation = null;
          let msg = 'Impossible d\'estimer les frais de livraison.';
          if (err.error?.message) msg = err.error.message;
          else if (typeof err.error === 'string') msg = err.error;
          this.estimationError = msg;
        }
      });
  }

  isModeLivraison(mode: string): boolean {
    return this.checkoutForm.get('modeLivraison')?.value === mode;
  }

  isExpressDisabled(): boolean {
    if (!this.selectedZone) return true;
    return !this.selectedZone.expressDisponible;
  }

  private createCheckoutForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      telephone: ['', [Validators.required, Validators.minLength(9), Validators.pattern(/^[0-9+\s]{9,15}$/)]],
      ville: ['', [Validators.required]],
      adresseLigne1: ['', [Validators.required]],
      adresseLigne2: [''],
      codePostal: [''],
      modeLivraison: ['LIVRAISON_DOMICILE', [Validators.required]],
      methodePaiement: ['WAVE', [Validators.required]],
      commentaire: ['']
    });
  }

  private loadCart(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });
  }

  private checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  private prefillUserData(): void {
    if (this.isAuthenticated) {
      const userData = this.authService.getCurrentUser();
      if (userData) {
        this.checkoutForm.patchValue({
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          email: userData.email || '',
        });
        this.checkoutForm.get('email')?.disable();
      } else {
        this.loadUserProfile();
      }
    }
  }

  private loadUserProfile(): void {
    if (this.isAuthenticated) {
      this.apiService.getProfile()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (profile) => {
            this.checkoutForm.patchValue({
              nom: profile.nom,
              prenom: profile.prenom,
              email: profile.email,
              telephone: profile.telephone || ''
            });
            this.checkoutForm.get('email')?.disable();
          },
          error: () => {}
        });
    }
  }

  getDeliveryFees(): number {
    if (this.isModeLivraison('RETRAIT_MAGASIN')) return 0;
    return this.estimation?.fraisLivraisonTotal ?? 0;
  }

  getTotalWithDelivery(): number {
    if (this.isModeLivraison('RETRAIT_MAGASIN')) return this.cart.totalPrice;
    return this.estimation?.montantTotal ?? this.cart.totalPrice;
  }

  onSubmit(): void {
    this.checkAuthentication();

    if (this.isAuthenticated) {
      this.checkoutForm.get('email')?.enable();
    }

    if (!this.checkoutForm.valid) {
      this.markFormGroupTouched(this.checkoutForm);
      this.toastService.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      if (this.isAuthenticated) {
        this.checkoutForm.get('email')?.disable();
      }
      return;
    }

    if (this.cart.items.length === 0) {
      this.toastService.error('Erreur', 'Votre panier est vide');
      return;
    }

    if (!this.canSubmit) {
      this.toastService.error('Erreur', 'Veuillez sélectionner une zone de livraison valide');
      return;
    }

    this.isSubmitting = true;
    const formData = this.checkoutForm.value;

    const baseCommandeData: Partial<Commande> = {
      adresseLivraison: {
        nom: formData.nom,
        prenom: formData.prenom,
        ligne1: formData.adresseLigne1,
        ligne2: formData.adresseLigne2 || '',
        ville: formData.ville,
        codePostal: formData.codePostal || '',
        telephone: formData.telephone
      },
      modeLivraison: formData.modeLivraison as ModeLivraison,
      zoneId: this.selectedZoneId ?? undefined,
      commentaire: formData.commentaire || '',
      lignesCommande: this.cart.items.map(item => ({
        produitId: item.produit.idProduit,
        quantite: item.quantite,
        prixUnitaire: item.produit.prix,
        sousTotal: item.sousTotal
      }))
    };

    let commandeObservable: Observable<Commande>;

    if (this.isAuthenticated) {
      commandeObservable = this.apiService.creerCommandeClient(baseCommandeData);
    } else {
      commandeObservable = this.apiService.creerCommandeInvite({
        ...baseCommandeData,
        emailInvite: formData.email,
        nomInvite: formData.nom,
        prenomInvite: formData.prenom,
        telephoneInvite: formData.telephone
      });
    }

    commandeObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Commande) => {
          this.isSubmitting = false;
          this.cartService.clearCart();
          this.toastService.success(
            'Commande créée !',
            `Votre commande ${response.numeroCommande} a été créée avec succès`
          );
          if (response.idCommande) {
            this.router.navigate(['/commande', response.idCommande]);
          } else {
            this.router.navigate(['/commandes']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          let errorMessage = 'Une erreur s\'est produite lors de la création de votre commande';
          if (error.error) {
            if (typeof error.error === 'string') errorMessage = error.error;
            else if (error.error.message) errorMessage = error.error.message;
          }
          if (error.status === 401) {
            errorMessage = 'Vous devez être connecté pour passer une commande client';
          } else if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Les données de la commande sont invalides';
          }
          this.toastService.error('Erreur', errorMessage);
          if (this.isAuthenticated) {
            this.checkoutForm.get('email')?.disable();
          }
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  goToProducts(): void {
    this.router.navigate(['/produits']);
  }
}
