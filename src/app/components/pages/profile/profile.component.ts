import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Client, Adresse, UserInfo, Breadcrumb, Genre, TypeAdresse } from '../../../models/interfaces';

@Component({
  selector: 'app-profile',
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <div class="container mx-auto px-4 py-8">

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Mon Profil
          </h1>
          <p class="text-gray-600">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <!-- Profile Navigation -->
        <div class="mb-8">
          <nav class="flex space-x-8 overflow-x-auto">
            <button
              *ngFor="let tab of tabs; let i = index"
              (click)="setActiveTab(i)"
              [class]="getTabClasses(i)"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors">
              <lucide-icon [name]="tab.icon" class="w-4 h-4 inline mr-2"></lucide-icon>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Main Content -->
          <div class="lg:col-span-2">

            <!-- Personal Information Tab -->
            <div *ngIf="activeTab === 0" class="bg-white rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-gray-900">Informations personnelles</h2>
                <button
                  *ngIf="!editingProfile"
                  (click)="startEditingProfile()"
                  class="btn-outline text-sm py-2 px-4">
                  <lucide-icon name="edit" class="w-4 h-4"></lucide-icon>
                  <span>Modifier</span>
                </button>
              </div>

              <!-- View Mode -->
              <div *ngIf="!editingProfile && client" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <p class="text-gray-900">{{ client.prenom }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <p class="text-gray-900">{{ client.nom }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p class="text-gray-900">{{ client.email }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <p class="text-gray-900">{{ client.telephone || 'Non renseigné' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    <p class="text-gray-900">{{ client.dateNaissance || 'Non renseignée' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                    <p class="text-gray-900">{{ getGenreLabel(client.genre) || 'Non renseigné' }}</p>
                  </div>
                </div>

                <div class="pt-4 border-t border-gray-200">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Membre depuis</label>
                  <p class="text-gray-900">{{ client.dateCreation | date:'dd/MM/yyyy' }}</p>
                </div>
              </div>

              <!-- Edit Mode -->
              <form *ngIf="editingProfile" [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="form-label">Prénom *</label>
                    <input type="text" formControlName="prenom" class="form-input">
                    <div *ngIf="isProfileFieldInvalid('prenom')" class="form-error">
                      Le prénom est obligatoire
                    </div>
                  </div>
                  <div>
                    <label class="form-label">Nom *</label>
                    <input type="text" formControlName="nom" class="form-input">
                    <div *ngIf="isProfileFieldInvalid('nom')" class="form-error">
                      Le nom est obligatoire
                    </div>
                  </div>
                  <div>
                    <label class="form-label">Email *</label>
                    <input type="email" formControlName="email" class="form-input">
                    <div *ngIf="isProfileFieldInvalid('email')" class="form-error">
                      <span *ngIf="profileForm.get('email')?.errors?.['required']">L'email est obligatoire</span>
                      <span *ngIf="profileForm.get('email')?.errors?.['email']">Format d'email invalide</span>
                    </div>
                  </div>
                  <div>
                    <label class="form-label">Téléphone</label>
                    <input type="tel" formControlName="telephone" class="form-input" placeholder="77 123 45 67">
                  </div>
                  <div>
                    <label class="form-label">Date de naissance</label>
                    <input type="date" formControlName="dateNaissance" class="form-input">
                  </div>
                  <div>
                    <label class="form-label">Genre</label>
                    <select formControlName="genre" class="form-input">
                      <option value="">Sélectionner</option>
                      <option value="HOMME">Homme</option>
                      <option value="FEMME">Femme</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                </div>

                <div class="flex space-x-4">
                  <button
                    type="submit"
                    [disabled]="!profileForm.valid || isSavingProfile"
                    class="btn-primary">
                    <div *ngIf="isSavingProfile" class="spinner mr-2"></div>
                    <span>{{ isSavingProfile ? 'Enregistrement...' : 'Enregistrer' }}</span>
                  </button>
                  <button
                    type="button"
                    (click)="cancelEditProfile()"
                    class="btn-outline">
                    Annuler
                  </button>
                </div>
              </form>
            </div>

            <!-- Addresses Tab -->
            <div *ngIf="activeTab === 1" class="space-y-6">

              <!-- Add Address Button -->
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900">Mes adresses</h2>
                <button
                  (click)="startAddingAddress()"
                  class="btn-primary">
                  <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                  <span>Ajouter une adresse</span>
                </button>
              </div>

              <!-- Address List -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="addresses.length > 0">
                <div
                  *ngFor="let address of addresses"
                  class="bg-white rounded-xl shadow-lg p-6 relative">

                  <!-- Main Address Badge -->
                  <div
                    *ngIf="address.adressePrincipale"
                    class="absolute top-4 right-4 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                    Principale
                  </div>

                  <div class="space-y-3">
                    <div>
                      <h3 class="font-semibold text-gray-900">{{ getAddressTypeLabel(address.typeAdresse) }}</h3>
                      <p class="text-gray-700">{{ address.ligne1 }}</p>
                      <p class="text-gray-700" *ngIf="address.ligne2">{{ address.ligne2 }}</p>
                      <p class="text-gray-700">
                        {{ address.ville }}{{ address.codePostal ? ', ' + address.codePostal : '' }}
                      </p>
                      <p class="text-gray-700">{{ address.pays || 'Sénégal' }}</p>
                      <p class="text-gray-600 text-sm" *ngIf="address.telephone">
                        <lucide-icon name="phone" class="w-3 h-3 inline mr-1"></lucide-icon>
                        {{ address.telephone }}
                      </p>
                    </div>

                    <div class="flex space-x-2 pt-2">
                      <button
                        (click)="editAddress(address)"
                        class="flex-1 btn-outline text-sm py-2">
                        <lucide-icon name="edit" class="w-3 h-3"></lucide-icon>
                        <span>Modifier</span>
                      </button>
                      <button
                        (click)="deleteAddress(address)"
                        class="flex-1 btn-danger text-sm py-2">
                        <lucide-icon name="trash-2" class="w-3 h-3"></lucide-icon>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No Addresses -->
              <div *ngIf="addresses.length === 0" class="bg-white rounded-xl shadow-lg p-8 text-center">
                <lucide-icon name="map-pin" class="w-16 h-16 text-gray-300 mx-auto mb-4"></lucide-icon>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucune adresse enregistrée</h3>
                <p class="text-gray-600 mb-6">
                  Ajoutez vos adresses pour accélérer vos futures commandes.
                </p>
                <button
                  (click)="startAddingAddress()"
                  class="btn-primary">
                  <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                  <span>Ajouter ma première adresse</span>
                </button>
              </div>

              <!-- Address Form Modal -->
              <app-modal
                [isOpen]="showAddressModal"
                [config]="{ title: editingAddressId ? 'Modifier l\adresse' : 'Ajouter une adresse' }"
                [showCloseButton]="true"
                size="lg"
                (closed)="closeAddressModal()">

                <form [formGroup]="addressForm" (ngSubmit)="saveAddress()" class="space-y-4">
                  <div>
                    <label class="form-label">Type d'adresse</label>
                    <select formControlName="typeAdresse" class="form-input">
                      <option value="DOMICILE">Domicile</option>
                      <option value="BUREAU">Bureau</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label class="form-label">Adresse *</label>
                    <input type="text" formControlName="ligne1" class="form-input" placeholder="Rue, avenue, quartier">
                    <div *ngIf="isAddressFieldInvalid('ligne1')" class="form-error">
                      L'adresse est obligatoire
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Complément d'adresse</label>
                    <input type="text" formControlName="ligne2" class="form-input" placeholder="Appartement, étage, bâtiment">
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="form-label">Ville *</label>
                      <input type="text" formControlName="ville" class="form-input">
                      <div *ngIf="isAddressFieldInvalid('ville')" class="form-error">
                        La ville est obligatoire
                      </div>
                    </div>
                    <div>
                      <label class="form-label">Code postal</label>
                      <input type="text" formControlName="codePostal" class="form-input">
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Téléphone</label>
                    <input type="tel" formControlName="telephone" class="form-input" placeholder="77 123 45 67">
                  </div>

                  <div class="flex items-center">
                    <input type="checkbox" formControlName="adressePrincipale" class="form-checkbox">
                    <label class="ml-2 text-sm text-gray-700">Définir comme adresse principale</label>
                  </div>
                </form>

                <div slot="footer" class="flex space-x-3">
                  <button
                    type="button"
                    (click)="saveAddress()"
                    [disabled]="!addressForm.valid || isSavingAddress"
                    class="btn-primary">
                    <div *ngIf="isSavingAddress" class="spinner mr-2"></div>
                    <span>{{ isSavingAddress ? 'Enregistrement...' : 'Enregistrer' }}</span>
                  </button>
                  <button
                    type="button"
                    (click)="closeAddressModal()"
                    class="btn-outline">
                    Annuler
                  </button>
                </div>
              </app-modal>
            </div>

            <!-- Security Tab -->
            <div *ngIf="activeTab === 2" class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-6">Sécurité du compte</h2>

              <!-- Change Password -->
              <div class="mb-8">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Modifier le mot de passe</h3>

                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="space-y-4 max-w-md">
                  <div>
                    <label class="form-label">Mot de passe actuel *</label>
                    <div class="relative">
                      <input
                        [type]="showCurrentPassword ? 'text' : 'password'"
                        formControlName="currentPassword"
                        class="form-input pr-10">
                      <button
                        type="button"
                        (click)="showCurrentPassword = !showCurrentPassword"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <lucide-icon [name]="showCurrentPassword ? 'eye-off' : 'eye'" class="w-4 h-4 text-gray-400"></lucide-icon>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Nouveau mot de passe *</label>
                    <div class="relative">
                      <input
                        [type]="showNewPassword ? 'text' : 'password'"
                        formControlName="newPassword"
                        class="form-input pr-10">
                      <button
                        type="button"
                        (click)="showNewPassword = !showNewPassword"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <lucide-icon [name]="showNewPassword ? 'eye-off' : 'eye'" class="w-4 h-4 text-gray-400"></lucide-icon>
                      </button>
                    </div>
                    <div *ngIf="isPasswordFieldInvalid('newPassword')" class="form-error">
                      <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">Le nouveau mot de passe est obligatoire</span>
                      <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Le mot de passe doit contenir au moins 6 caractères</span>
                    </div>
                  </div>

                  <div>
                    <label class="form-label">Confirmer le nouveau mot de passe *</label>
                    <div class="relative">
                      <input
                        [type]="showConfirmPassword ? 'text' : 'password'"
                        formControlName="confirmPassword"
                        class="form-input pr-10">
                      <button
                        type="button"
                        (click)="showConfirmPassword = !showConfirmPassword"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <lucide-icon [name]="showConfirmPassword ? 'eye-off' : 'eye'" class="w-4 h-4 text-gray-400"></lucide-icon>
                      </button>
                    </div>
                    <div *ngIf="passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmPassword')?.touched" class="form-error">
                      Les mots de passe ne correspondent pas
                    </div>
                  </div>

                  <button
                    type="submit"
                    [disabled]="!passwordForm.valid || isChangingPassword"
                    class="btn-primary">
                    <div *ngIf="isChangingPassword" class="spinner mr-2"></div>
                    <span>{{ isChangingPassword ? 'Modification...' : 'Modifier le mot de passe' }}</span>
                  </button>
                </form>
              </div>

              <!-- Account Actions -->
              <div class="border-t border-gray-200 pt-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Actions du compte</h3>

                <div class="space-y-3">
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 class="font-medium text-gray-900">Déconnexion de tous les appareils</h4>
                      <p class="text-sm text-gray-600">Déconnectez-vous de tous les navigateurs et appareils</p>
                    </div>
                    <button class="btn-outline text-sm">
                      Déconnecter partout
                    </button>
                  </div>

                  <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h4 class="font-medium text-red-900">Supprimer le compte</h4>
                      <p class="text-sm text-red-600">Cette action est irréversible</p>
                    </div>
                    <button class="btn-danger text-sm">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <div class="text-center mb-6">
                <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span class="text-2xl font-bold text-primary-600">
                    {{ getUserInitials() }}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900" *ngIf="client">
                  {{ client.prenom }} {{ client.nom }}
                </h3>
                <p class="text-gray-600" *ngIf="client">{{ client.email }}</p>
              </div>

              <!-- Quick Stats -->
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <lucide-icon name="package" class="w-4 h-4 text-gray-600"></lucide-icon>
                    <span class="text-sm text-gray-700">Commandes</span>
                  </div>
                  <span class="font-semibold text-gray-900">{{ orderCount }}</span>
                </div>

                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <lucide-icon name="map-pin" class="w-4 h-4 text-gray-600"></lucide-icon>
                    <span class="text-sm text-gray-700">Adresses</span>
                  </div>
                  <span class="font-semibold text-gray-900">{{ addresses.length }}</span>
                </div>

                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <lucide-icon name="heart" class="w-4 h-4 text-gray-600"></lucide-icon>
                    <span class="text-sm text-gray-700">Favoris</span>
                  </div>
                  <span class="font-semibold text-gray-900">{{ wishlistCount }}</span>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="mt-6 space-y-3">
                <a routerLink="/mes-commandes" class="block w-full btn-outline text-center py-2">
                  <lucide-icon name="package" class="w-4 h-4 inline mr-2"></lucide-icon>
                  Mes commandes
                </a>
                <a routerLink="/wishlist" class="block w-full btn-outline text-center py-2">
                  <lucide-icon name="heart" class="w-4 h-4 inline mr-2"></lucide-icon>
                  Ma wishlist
                </a>
                <button (click)="logout()" class="w-full btn-danger text-center py-2">
                  <lucide-icon name="log-out" class="w-4 h-4 inline mr-2"></lucide-icon>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Forms
  profileForm: FormGroup;
  addressForm: FormGroup;
  passwordForm: FormGroup;

  // Data
  client: Client | null = null;
  addresses: Adresse[] = [];

  // UI State
  activeTab = 0;
  editingProfile = false;
  editingAddressId: number | null = null;
  showAddressModal = false;
  showNewAddressForm = false;

  // Loading states
  isSavingProfile = false;
  isSavingAddress = false;
  isChangingPassword = false;

  // Password visibility
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Stats
  orderCount = 0;
  wishlistCount = 0;

  // Configuration
  tabs = [
    { label: 'Informations personnelles', icon: 'user' },
    { label: 'Mes adresses', icon: 'map-pin' },
    { label: 'Sécurité', icon: 'shield' }
  ];

  breadcrumbs: Breadcrumb[] = [
    { label: 'Accueil', route: '/' },
    { label: 'Mon Profil', route: undefined }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private toastService: ToastService
  ) {
    this.profileForm = this.createProfileForm();
    this.addressForm = this.createAddressForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createProfileForm(): FormGroup {
    return this.fb.group({
      prenom: ['', [Validators.required]],
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      dateNaissance: [''],
      genre: ['']
    });
  }

  private createAddressForm(): FormGroup {
    return this.fb.group({
      typeAdresse: [TypeAdresse.DOMICILE],
      ligne1: ['', [Validators.required]],
      ligne2: [''],
      ville: ['Dakar', [Validators.required]],
      codePostal: [''],
      telephone: [''],
      adressePrincipale: [false]
    });
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;

    return newPassword.value === confirmPassword.value ? null : { 'passwordMismatch': true };
  }

  private loadProfile(): void {
    this.apiService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client) => {
          this.client = client;
          this.populateProfileForm();
        },
        error: (error) => {
          console.error('Erreur lors du chargement du profil:', error);
          this.toastService.error('Erreur', 'Impossible de charger votre profil');
        }
      });
  }

  private populateProfileForm(): void {
    if (this.client) {
      this.profileForm.patchValue({
        prenom: this.client.prenom,
        nom: this.client.nom,
        email: this.client.email,
        telephone: this.client.telephone,
        dateNaissance: this.client.dateNaissance,
        genre: this.client.genre
      });
    }
  }

  private loadAddresses(): void {
    this.apiService.getAdresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.addresses = addresses;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des adresses:', error);
        }
      });
  }

  private loadStats(): void {
    // Charger les statistiques (commandes, wishlist, etc.)
    // Pour l'instant, valeurs par défaut
    this.orderCount = 0;
    this.wishlistCount = 0;
  }

  // Profile methods
  startEditingProfile(): void {
    this.editingProfile = true;
    this.populateProfileForm();
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
    this.populateProfileForm();
  }

  saveProfile(): void {
    if (!this.profileForm.valid) return;

    this.isSavingProfile = true;

    this.apiService.updateProfile(this.profileForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedClient) => {
          this.client = updatedClient;
          this.editingProfile = false;
          this.isSavingProfile = false;
          this.toastService.profileUpdated();
        },
        error: (error) => {
          this.isSavingProfile = false;
          console.error('Erreur lors de la mise à jour du profil:', error);
          this.toastService.error('Erreur', 'Impossible de mettre à jour votre profil');
        }
      });
  }

  // Address methods
  startAddingAddress(): void {
    this.editingAddressId = null;
    this.addressForm.reset({
      typeAdresse: TypeAdresse.DOMICILE,
      ville: 'Dakar',
      adressePrincipale: this.addresses.length === 0
    });
    this.showAddressModal = true;
  }

  editAddress(address: Adresse): void {
    this.editingAddressId = address.idAdresse!;
    this.addressForm.patchValue(address);
    this.showAddressModal = true;
  }

  saveAddress(): void {
    if (!this.addressForm.valid) return;

    this.isSavingAddress = true;
    const addressData = this.addressForm.value;

    const apiCall = this.editingAddressId
      ? this.apiService.updateAdresse(this.editingAddressId, addressData)
      : this.apiService.ajouterAdresse(addressData);

    apiCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingAddress = false;
          this.closeAddressModal();
          this.loadAddresses();

          if (this.editingAddressId) {
            this.toastService.addressUpdated();
          } else {
            this.toastService.addressAdded();
          }
        },
        error: (error) => {
          this.isSavingAddress = false;
          console.error('Erreur lors de la sauvegarde de l\'adresse:', error);
          this.toastService.error('Erreur', 'Impossible de sauvegarder l\'adresse');
        }
      });
  }

  deleteAddress(address: Adresse): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) return;

    this.apiService.supprimerAdresse(address.idAdresse!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAddresses();
          this.toastService.addressDeleted();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de l\'adresse:', error);
          this.toastService.error('Erreur', 'Impossible de supprimer l\'adresse');
        }
      });
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.editingAddressId = null;
  }

  // Password methods
  changePassword(): void {
    if (!this.passwordForm.valid) return;

    this.isChangingPassword = true;
    const passwordData = {
      ancienMotDePasse: this.passwordForm.value.currentPassword,
      nouveauMotDePasse: this.passwordForm.value.newPassword
    };

    this.apiService.updatePassword(passwordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.toastService.passwordUpdated();
        },
        error: (error) => {
          this.isChangingPassword = false;
          console.error('Erreur lors du changement de mot de passe:', error);
          this.toastService.error('Erreur', 'Impossible de modifier le mot de passe');
        }
      });
  }

  // UI helper methods
  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  getTabClasses(index: number): string {
    return this.activeTab === index
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  }

  getUserInitials(): string {
    if (!this.client) return '';
    return `${this.client.prenom[0]}${this.client.nom[0]}`.toUpperCase();
  }

  getGenreLabel(genre?: Genre): string {
    switch (genre) {
      case Genre.HOMME: return 'Homme';
      case Genre.FEMME: return 'Femme';
      case Genre.AUTRE: return 'Autre';
      default: return '';
    }
  }

  getAddressTypeLabel(type?: TypeAdresse): string {
    switch (type) {
      case TypeAdresse.DOMICILE: return 'Domicile';
      case TypeAdresse.BUREAU: return 'Bureau';
      case TypeAdresse.AUTRE: return 'Autre';
      default: return 'Adresse';
    }
  }

  // Validation methods
  isProfileFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isAddressFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isPasswordFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  logout(): void {
    this.authService.logout();
  }
}
