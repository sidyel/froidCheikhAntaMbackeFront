import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../../services/cart.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Cart, Breadcrumb } from '../../../models/interfaces';
import { Observable } from 'rxjs';
import { ModeLivraison, Commande } from '../../../models/interfaces';

// Interfaces pour les listes de sélection
interface AdresseOption {
  value: string;
  label: string;
  ville?: string;
  prixLivraison?: number; // Prix de livraison par quartier
}

interface VilleOption {
  value: string;
  label: string;
  codePostal?: string;
}

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
                    <label class="form-label">Email *</label>
                    <input
                      type="email"
                      formControlName="email"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('email')">
                    <div *ngIf="isFieldInvalid('email')" class="text-red-500 text-sm mt-1">
                      <span *ngIf="checkoutForm.get('email')?.errors?.['required']">L'email est requis</span>
                      <span *ngIf="checkoutForm.get('email')?.errors?.['email']">Format d'email invalide</span>
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
                      Le téléphone est requis
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery Address -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Adresse de livraison</h2>

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
                      <option *ngFor="let ville of villesDisponibles" [value]="ville.value">
                        {{ ville.label }}
                      </option>
                    </select>
                    <div *ngIf="isFieldInvalid('ville')" class="text-red-500 text-sm mt-1">
                      La ville est requise
                    </div>
                  </div>

                  <!-- Adresse ligne 1 (sélection) -->
                  <div>
                    <label class="form-label">Quartier/Zone *</label>
                    <select
                      formControlName="adresseLigne1"
                      class="form-input"
                      [class.border-red-500]="isFieldInvalid('adresseLigne1')"
                      [disabled]="!selectedVille"
                      (change)="onQuartierChange($event)">
                      <option value="">
                        Sélectionnez votre quartier
                      </option>
                      <option *ngFor="let adresse of adressesDisponibles" [value]="adresse.value">
                        {{ adresse.label }}
                        <span *ngIf="adresse.prixLivraison && adresse.prixLivraison > 0">
                          ({{ adresse.prixLivraison | currency:'XOF':'symbol':'1.0-0' }} livraison)
                        </span>
                        <span *ngIf="!adresse.prixLivraison || adresse.prixLivraison === 0">
                          (Livraison gratuite)
                        </span>
                      </option>
                    </select>
                    <div *ngIf="isFieldInvalid('adresseLigne1')" class="text-red-500 text-sm mt-1">
                      Le quartier est requis
                    </div>
                    <div *ngIf="selectedQuartierPrixLivraison !== null" class="text-xs text-blue-600 mt-1">
                      <span *ngIf="selectedQuartierPrixLivraison === 0">
                        ✅ Livraison gratuite pour ce quartier
                      </span>
                      <span *ngIf="selectedQuartierPrixLivraison > 0">
                        ℹ️ Frais de livraison: {{ selectedQuartierPrixLivraison | currency:'XOF':'symbol':'1.0-0' }}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Complément d'adresse</label>
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
                      class="form-input"
                      [value]="selectedVilleCodePostal"
                      readonly>
                    <div class="text-xs text-gray-500 mt-1">
                      Rempli automatiquement selon la ville sélectionnée
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery Method -->
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Mode de livraison</h2>

                <div class="space-y-3">
                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="LIVRAISON_DOMICILE"
                      formControlName="modeLivraison"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex-1">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="font-medium text-gray-900">Livraison à domicile</div>
                          <div class="text-sm text-gray-500">Livraison sous 24-48h</div>
                        </div>
                        <div [class]="getDeliveryFees() > 0 ? 'text-gray-900 font-medium' : 'text-green-600 font-medium'">
                          {{ getDeliveryFees() > 0 ? (getDeliveryFees() | currency:'XOF':'symbol':'1.0-0') : 'Gratuit' }}
                        </div>
                      </div>
                    </div>
                  </label>

                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="RETRAIT_MAGASIN"
                      formControlName="modeLivraison"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex-1">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="font-medium text-gray-900">Retrait en magasin</div>
                          <div class="text-sm text-gray-500">Disponible sous 2h</div>
                        </div>
                        <div class="text-green-600 font-medium">Gratuit</div>
                      </div>
                    </div>
                  </label>
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
                    <div class="ml-3 flex-1">
                      <div class="font-medium text-gray-900">Wave</div>
                      <div class="text-sm text-gray-500">Paiement mobile sécurisé</div>
                    </div>
                  </label>

                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="ORANGE_MONEY"
                      formControlName="methodePaiement"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex-1">
                      <div class="font-medium text-gray-900">Orange Money</div>
                      <div class="text-sm text-gray-500">Paiement mobile Orange</div>
                    </div>
                  </label>

                  <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      value="ESPECES"
                      formControlName="methodePaiement"
                      class="form-radio text-primary-600">
                    <div class="ml-3 flex-1">
                      <div class="font-medium text-gray-900">Paiement à la livraison</div>
                      <div class="text-sm text-gray-500">Paiement en espèces</div>
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
                      {{ item.sousTotal | currency:'XOF':'symbol':'1.0-0' }}
                    </div>
                  </div>
                </div>

                <!-- Price Breakdown -->
                <div class="border-t border-gray-200 pt-4 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Sous-total</span>
                    <span class="font-medium">{{ cart.totalPrice | currency:'XOF':'symbol':'1.0-0' }}</span>
                  </div>

                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Frais de livraison</span>
                    <span class="font-medium" [class]="getDeliveryFees() > 0 ? 'text-gray-900' : 'text-green-600'">
                      {{ getDeliveryFees() > 0 ? (getDeliveryFees() | currency:'XOF':'symbol':'1.0-0') : 'Gratuit' }}
                    </span>
                  </div>

                  <div *ngIf="selectedQuartierPrixLivraison !== null" class="text-xs text-gray-500 italic">
                    <span *ngIf="selectedQuartierPrixLivraison === 0">
                      Zone de livraison gratuite
                    </span>
                    <span *ngIf="selectedQuartierPrixLivraison > 0">
                      Frais quartier: {{ selectedQuartierPrixLivraison | currency:'XOF':'symbol':'1.0-0' }}
                    </span>
                  </div>

                  <div class="border-t border-gray-200 pt-2">
                    <div class="flex justify-between text-lg font-bold">
                      <span class="text-gray-900">Total</span>
                      <span class="text-primary-600">{{ getTotalWithDelivery() | currency:'XOF':'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="isSubmitting || !checkoutForm.valid"
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

  // Propriétés pour les listes de sélection
  villesDisponibles: VilleOption[] = [];
  adressesDisponibles: AdresseOption[] = [];
  selectedVille: string = '';
  selectedVilleCodePostal: string = '';

  // Propriété pour gérer les prix de livraison (suppression de l'express)
  selectedQuartierPrixLivraison: number | null = null;

  // Données statiques avec prix de livraison par quartier (suppression des prix express)
  private readonly villesData: VilleOption[] = [
    { value: 'dakar', label: 'Dakar', codePostal: '10000' },
    { value: 'pikine', label: 'Pikine', codePostal: '12000' },
    { value: 'guediawaye', label: 'Guédiawaye', codePostal: '13000' },
    { value: 'rufisque', label: 'Rufisque', codePostal: '14000' },
    { value: 'thies', label: 'Thiès', codePostal: '21000' },
    { value: 'kaolack', label: 'Kaolack', codePostal: '22000' },
    { value: 'saint-louis', label: 'Saint-Louis', codePostal: '32000' },
    { value: 'ziguinchor', label: 'Ziguinchor', codePostal: '27000' }
  ];

  private readonly adressesData: AdresseOption[] = [
    // Dakar - Quartiers centraux (gratuit ou peu cher)
    { value: 'plateau', label: 'Plateau', ville: 'dakar', prixLivraison: 0 },
    { value: 'medina', label: 'Medina', ville: 'dakar', prixLivraison: 0 },
    { value: 'fann', label: 'Fann', ville: 'dakar', prixLivraison: 1000 },
    { value: 'liberte', label: 'Liberte', ville: 'dakar', prixLivraison: 1000 },
    { value: 'point-e', label: 'Point-e', ville: 'dakar', prixLivraison: 1000 },
    { value: 'mermoz', label: 'Mermoz', ville: 'dakar', prixLivraison: 1500 },
    { value: 'sacre-coeur', label: 'Sacre-coeur', ville: 'dakar', prixLivraison: 1500 },

    // Dakar - Quartiers périphériques (plus cher)
    { value: 'almadies', label: 'Almadies', ville: 'dakar', prixLivraison: 2500 },
    { value: 'ngor', label: 'Ngor', ville: 'dakar', prixLivraison: 3000 },
    { value: 'ouakam', label: 'Ouakam', ville: 'dakar', prixLivraison: 2500 },
    { value: 'yoff', label: 'Yoff / Ouest Foire / Nord Foire', ville: 'dakar', prixLivraison: 3000 },
    { value: 'hann-bel-air', label: 'Hann Bel-Air', ville: 'dakar', prixLivraison: 2000 },
    { value: 'parcelles-assainies', label: 'Parcelles Assainies', ville: 'dakar', prixLivraison: 2000 },

    // Pikine - Tarifs variables selon l'éloignement
    { value: 'pikine-nord', label: 'Pikine Nord', ville: 'pikine', prixLivraison: 2000 },
    { value: 'pikine-sud', label: 'Pikine Sud', ville: 'pikine', prixLivraison: 2500 },
    { value: 'pikine-est', label: 'Pikine Est', ville: 'pikine', prixLivraison: 3000 },
    { value: 'pikine-ouest', label: 'Pikine Ouest', ville: 'pikine', prixLivraison: 2500 },
    { value: 'thiaroye', label: 'Thiaroye', ville: 'pikine', prixLivraison: 3500 },
    { value: 'yeumbeul', label: 'Yeumbeul', ville: 'pikine', prixLivraison: 4000 },

    // Guédiawaye
    { value: 'golf-sud', label: 'Golf Sud', ville: 'guediawaye', prixLivraison: 2500 },
    { value: 'medina-gounass', label: 'Médina Gounass', ville: 'guediawaye', prixLivraison: 3000 },
    { value: 'sam-notaire', label: 'Sam Notaire', ville: 'guediawaye', prixLivraison: 3000 },
    { value: 'wakhinane-nimzatt', label: 'Wakhinane Nimzatt', ville: 'guediawaye', prixLivraison: 3500 },

    // Rufisque
    { value: 'rufisque-centre', label: 'Rufisque Centre', ville: 'rufisque', prixLivraison: 3000 },
    { value: 'rufisque-est', label: 'Rufisque Est', ville: 'rufisque', prixLivraison: 3500 },
    { value: 'rufisque-ouest', label: 'Rufisque Ouest', ville: 'rufisque', prixLivraison: 3500 },
    { value: 'rufisque-nord', label: 'Rufisque Nord', ville: 'rufisque', prixLivraison: 4000 },

    // Thiès - Plus éloigné
    { value: 'thies-centre', label: 'Thiès Centre', ville: 'thies', prixLivraison: 5000 },
    { value: 'thies-nord', label: 'Thiès Nord', ville: 'thies', prixLivraison: 5500 },
    { value: 'thies-est', label: 'Thiès Est', ville: 'thies', prixLivraison: 5500 },
    { value: 'thies-ouest', label: 'Thiès Ouest', ville: 'thies', prixLivraison: 6000 },

    // Kaolack - Très éloigné
    { value: 'kaolack-centre', label: 'Kaolack Centre', ville: 'kaolack', prixLivraison: 7000 },
    { value: 'kaolack-nord', label: 'Kaolack Nord', ville: 'kaolack', prixLivraison: 7500 },
    { value: 'kaolack-sud', label: 'Kaolack Sud', ville: 'kaolack', prixLivraison: 7500 },

    // Saint-Louis - Très éloigné
    { value: 'saint-louis-centre', label: 'Saint-Louis Centre', ville: 'saint-louis', prixLivraison: 8000 },
    { value: 'sor', label: 'Sor', ville: 'saint-louis', prixLivraison: 8500 },
    { value: 'guet-ndar', label: 'Guet Ndar', ville: 'saint-louis', prixLivraison: 9000 },

    // Ziguinchor - Très éloigné (sud du pays)
    { value: 'ziguinchor-centre', label: 'Ziguinchor Centre', ville: 'ziguinchor', prixLivraison: 10000 },
    { value: 'ziguinchor-nord', label: 'Ziguinchor Nord', ville: 'ziguinchor', prixLivraison: 10500 },
    { value: 'ziguinchor-sud', label: 'Ziguinchor Sud', ville: 'ziguinchor', prixLivraison: 11000 }
  ];

  breadcrumbs: Breadcrumb[] = [
    { label: 'Accueil', route: '/' },
    { label: 'Mon Panier', route: '/panier' },
    { label: 'Commande', route: undefined }
  ];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.checkoutForm = this.createCheckoutForm();
  }

  ngOnInit(): void {
    console.log('🔍 === CHECKOUT COMPONENT INIT ===');

    this.initializeAddressData();
    this.loadCart();
    this.checkAuthentication();
    this.prefillUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAddressData(): void {
    console.log('🏠 Initialisation des données d\'adresse...');
    this.villesDisponibles = [...this.villesData];
    console.log('🏙️ Villes disponibles:', this.villesDisponibles.length);
  }

  onVilleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const villeValue = target.value;

    console.log('🏙️ Changement de ville:', villeValue);

    this.selectedVille = villeValue;

    if (villeValue) {
      const villeData = this.villesData.find(v => v.value === villeValue);
      this.selectedVilleCodePostal = villeData?.codePostal || '';

      this.checkoutForm.patchValue({
        codePostal: this.selectedVilleCodePostal
      });

      this.adressesDisponibles = this.adressesData.filter(
        adresse => adresse.ville === villeValue
      );

      this.checkoutForm.patchValue({
        adresseLigne1: ''
      });

      this.selectedQuartierPrixLivraison = null;

      console.log('🏠 Quartiers disponibles:', this.adressesDisponibles.length);
    } else {
      this.selectedVilleCodePostal = '';
      this.adressesDisponibles = [];
      this.selectedQuartierPrixLivraison = null;

      this.checkoutForm.patchValue({
        codePostal: '',
        adresseLigne1: ''
      });
    }
  }

  onQuartierChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const quartierValue = target.value;

    console.log('🏠 Changement de quartier:', quartierValue);

    if (quartierValue) {
      const quartierData = this.adressesData.find(a => a.value === quartierValue);

      if (quartierData) {
        this.selectedQuartierPrixLivraison = quartierData.prixLivraison || 0;

        console.log('💰 Prix livraison:', this.selectedQuartierPrixLivraison);

        if (this.selectedQuartierPrixLivraison === 0) {
          this.toastService.success('Livraison gratuite !', 'Ce quartier bénéficie de la livraison gratuite');
        }
      }
    } else {
      this.selectedQuartierPrixLivraison = null;
    }
  }

  private createCheckoutForm(): FormGroup {
    return this.fb.group({
      // Informations client
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required]],

      // Adresse de livraison
      ville: ['', [Validators.required]],
      adresseLigne1: ['', [Validators.required]],
      adresseLigne2: [''],
      codePostal: [''],

      // Options
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
    console.log('🔐 Utilisateur authentifié:', this.isAuthenticated);

    if (this.isAuthenticated) {
      const userData = this.authService.getCurrentUser();
      console.log('👤 Données utilisateur:', userData);
    }
  }

  private prefillUserData(): void {
    console.log('🔄 Pré-remplissage des données utilisateur...');

    if (this.isAuthenticated) {
      const userData = this.authService.getCurrentUser();

      if (userData) {
        console.log('👤 Données utilisateur trouvées:', userData);

        this.checkoutForm.patchValue({
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          email: userData.email || '',
        });

        this.checkoutForm.get('email')?.disable();
        console.log('✅ Données pré-remplies pour utilisateur connecté');
      } else {
        console.log('⚠️ Utilisateur connecté mais pas de données dans le token');
        this.loadUserProfile();
      }
    } else {
      console.log('🔓 Utilisateur invité - pas de pré-remplissage');
    }
  }

  private loadUserProfile(): void {
    if (this.isAuthenticated) {
      this.apiService.getProfile()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (profile) => {
            console.log('👤 Profil chargé depuis l\'API:', profile);

            this.checkoutForm.patchValue({
              nom: profile.nom,
              prenom: profile.prenom,
              email: profile.email,
              telephone: profile.telephone || ''
            });

            this.checkoutForm.get('email')?.disable();
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement du profil:', error);
          }
        });
    }
  }



  onSubmit(): void {
    console.log('🚀 === DÉBUT SOUMISSION COMMANDE ===');

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

    this.isSubmitting = true;
    const formData = this.checkoutForm.value;

    const baseCommandeData: Partial<Commande> = {
      adresseLivraison: {
        nom: formData.nom,
        prenom: formData.prenom,
        ligne1: this.getFormattedAdresse(formData.ville, formData.adresseLigne1),
        ligne2: formData.adresseLigne2 || '',
        ville: this.getVilleLabel(formData.ville),
        codePostal: formData.codePostal || '',
        telephone: formData.telephone
      },

      modeLivraison: formData.modeLivraison as ModeLivraison,
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
      console.log('👤 === CRÉATION COMMANDE CLIENT AUTHENTIFIÉ ===');
      commandeObservable = this.apiService.creerCommandeClient(baseCommandeData);
    } else {
      console.log('🔓 === CRÉATION COMMANDE INVITÉ ===');
      const commandeInviteData = {
        ...baseCommandeData,
        emailInvite: formData.email,
        nomInvite: formData.nom,
        prenomInvite: formData.prenom,
        telephoneInvite: formData.telephone
      };

      commandeObservable = this.apiService.creerCommandeInvite(commandeInviteData);
    }

    console.log('📤 Envoi de la commande...');
    console.log('🛒 Nombre d\'articles:', this.cart.items.length);
    console.log('💰 Total:', this.getTotalWithDelivery());
    console.log('🏠 Adresse formatée:', baseCommandeData.adresseLivraison);

    commandeObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Commande) => {
          console.log('✅ === COMMANDE CRÉÉE AVEC SUCCÈS ===');
          console.log('🔢 ID:', response.idCommande);
          console.log('📄 Numéro:', response.numeroCommande);

          this.isSubmitting = false;
          this.cartService.clearCart();

          // 📱 Envoyer notification WhatsApp

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
          console.error('❌ === ERREUR CRÉATION COMMANDE ===');
          console.error('Error object:', error);

          this.isSubmitting = false;

          let errorMessage = 'Une erreur s\'est produite lors de la création de votre commande';

          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          }

          if (error.status === 401) {
            errorMessage = 'Vous devez être connecté pour passer une commande client';
          } else if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires';
          } else if (error.status === 400) {
            errorMessage = 'Les données de la commande sont invalides';
          }

          this.toastService.error('Erreur', errorMessage);

          if (this.isAuthenticated) {
            this.checkoutForm.get('email')?.disable();
          }
        }
      });
  }

  private getFormattedAdresse(villeValue: string, adresseValue: string): string {
    const ville = this.villesData.find(v => v.value === villeValue);
    const adresse = this.adressesData.find(a => a.value === adresseValue);

    if (ville && adresse) {
      return `${adresse.label}, ${ville.label}`;
    }

    return adresseValue || '';
  }

  private getVilleLabel(villeValue: string): string {
    const ville = this.villesData.find(v => v.value === villeValue);
    return ville?.label || villeValue;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }



  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getDeliveryFees(): number {
    const modeLivraison = this.checkoutForm.get('modeLivraison')?.value;

    // Si retrait en magasin, pas de frais
    if (modeLivraison === 'RETRAIT_MAGASIN') {
      return 0;
    }

    // Si aucun quartier sélectionné, pas de frais
    if (this.selectedQuartierPrixLivraison === null) {
      return 0;
    }

    // Pour la livraison à domicile
    return this.selectedQuartierPrixLivraison || 0;
  }

  getTotalWithDelivery(): number {
    return this.cart.totalPrice + this.getDeliveryFees();
  }

  goToProducts(): void {
    this.router.navigate(['/produits']);
  }
}
