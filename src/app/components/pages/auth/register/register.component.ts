import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';

// Custom validators
function passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
  const password = control.get('motDePasse');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { 'passwordMismatch': true };
}

function phoneValidator(control: AbstractControl): {[key: string]: any} | null {
  if (!control.value) {
    return null; // Le téléphone est optionnel
  }

  const phoneRegex = /^(\+221)?[0-9]{8,9}$/;
  return phoneRegex.test(control.value) ? null : { 'invalidPhone': true };
}

@Component({
  selector: 'app-register',
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-2xl">FC</span>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Créer votre compte
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ou
          <a routerLink="/connexion" class="font-medium text-primary-600 hover:text-primary-500">
            connectez-vous à votre compte existant
          </a>
        </p>
      </div>

      <!-- Registration Form -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">

            <!-- Personal Information -->
            <div class="grid grid-cols-2 gap-4">
              <!-- First Name -->
              <div>
                <label for="prenom" class="form-label">
                  Prénom *
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  autocomplete="given-name"
                  required
                  formControlName="prenom"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('prenom')"
                  [class.focus:ring-red-500]="isFieldInvalid('prenom')"
                  placeholder="Votre prénom">
                <div *ngIf="isFieldInvalid('prenom')" class="form-error">
                  <span *ngIf="registerForm.get('prenom')?.errors?.['required']">
                    Le prénom est obligatoire
                  </span>
                  <span *ngIf="registerForm.get('prenom')?.errors?.['minlength']">
                    Au moins 2 caractères
                  </span>
                </div>
              </div>

              <!-- Last Name -->
              <div>
                <label for="nom" class="form-label">
                  Nom *
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  autocomplete="family-name"
                  required
                  formControlName="nom"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('nom')"
                  [class.focus:ring-red-500]="isFieldInvalid('nom')"
                  placeholder="Votre nom">
                <div *ngIf="isFieldInvalid('nom')" class="form-error">
                  <span *ngIf="registerForm.get('nom')?.errors?.['required']">
                    Le nom est obligatoire
                  </span>
                  <span *ngIf="registerForm.get('nom')?.errors?.['minlength']">
                    Au moins 2 caractères
                  </span>
                </div>
              </div>
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="form-label">
                Adresse email *
              </label>
              <div class="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  formControlName="email"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('email')"
                  [class.focus:ring-red-500]="isFieldInvalid('email')"
                  placeholder="votre@email.com">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <lucide-icon name="mail" class="w-5 h-5 text-gray-400"></lucide-icon>
                </div>
              </div>
              <div *ngIf="isFieldInvalid('email')" class="form-error">
                <span *ngIf="registerForm.get('email')?.errors?.['required']">
                  L'adresse email est obligatoire
                </span>
                <span *ngIf="registerForm.get('email')?.errors?.['email']">
                  Format d'email invalide
                </span>
              </div>
            </div>

            <!-- Phone Field -->
            <div>
              <label for="telephone" class="form-label">
                Téléphone
              </label>
              <div class="mt-1 relative">
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autocomplete="tel"
                  formControlName="telephone"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('telephone')"
                  [class.focus:ring-red-500]="isFieldInvalid('telephone')"
                  placeholder="77 123 45 67">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <lucide-icon name="phone" class="w-5 h-5 text-gray-400"></lucide-icon>
                </div>
              </div>
              <div *ngIf="isFieldInvalid('telephone')" class="form-error">
                <span *ngIf="registerForm.get('telephone')?.errors?.['invalidPhone']">
                  Format de téléphone invalide (ex: 77 123 45 67)
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Format: 77 123 45 67 ou +221 77 123 45 67
              </p>
            </div>

            <!-- Password Fields -->
            <div class="space-y-4">
              <!-- Password -->
              <div>
                <label for="password" class="form-label">
                  Mot de passe *
                </label>
                <div class="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    [type]="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    required
                    formControlName="motDePasse"
                    class="form-input pr-10"
                    [class.border-red-300]="isFieldInvalid('motDePasse')"
                    [class.focus:ring-red-500]="isFieldInvalid('motDePasse')"
                    placeholder="Votre mot de passe">
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    (click)="togglePasswordVisibility()">
                    <lucide-icon
                      [name]="showPassword ? 'eye-off' : 'eye'"
                      class="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors">
                    </lucide-icon>
                  </button>
                </div>
                <div *ngIf="isFieldInvalid('motDePasse')" class="form-error">
                  <span *ngIf="registerForm.get('motDePasse')?.errors?.['required']">
                    Le mot de passe est obligatoire
                  </span>
                  <span *ngIf="registerForm.get('motDePasse')?.errors?.['minlength']">
                    Le mot de passe doit contenir au moins 6 caractères
                  </span>
                </div>

                <!-- Password Strength Indicator -->
                <div class="mt-2">
                  <div class="flex space-x-1">
                    <div
                      *ngFor="let strength of passwordStrengthLevels"
                      class="h-1 flex-1 rounded"
                      [class]="getPasswordStrengthClass(strength)">
                    </div>
                  </div>
                  <p class="text-xs mt-1" [class]="getPasswordStrengthTextClass()">
                    {{ getPasswordStrengthText() }}
                  </p>
                </div>
              </div>

              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="form-label">
                  Confirmer le mot de passe *
                </label>
                <div class="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    required
                    formControlName="confirmPassword"
                    class="form-input pr-10"
                    [class.border-red-300]="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']"
                    [class.focus:ring-red-500]="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']"
                    placeholder="Confirmez votre mot de passe">
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    (click)="toggleConfirmPasswordVisibility()">
                    <lucide-icon
                      [name]="showConfirmPassword ? 'eye-off' : 'eye'"
                      class="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors">
                    </lucide-icon>
                  </button>
                </div>
                <div *ngIf="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']" class="form-error">
                  <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">
                    La confirmation du mot de passe est obligatoire
                  </span>
                  <span *ngIf="registerForm.errors?.['passwordMismatch']">
                    Les mots de passe ne correspondent pas
                  </span>
                </div>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  formControlName="acceptTerms"
                  class="form-checkbox"
                  [class.border-red-300]="isFieldInvalid('acceptTerms')">
              </div>
              <div class="ml-2 text-sm">
                <label for="acceptTerms" class="text-gray-900">
                  J'accepte les
                  <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">
                    conditions générales
                  </a>
                  et la
                  <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">
                    politique de confidentialité
                  </a>
                </label>
                <div *ngIf="isFieldInvalid('acceptTerms')" class="form-error mt-1">
                  Vous devez accepter les conditions générales
                </div>
              </div>
            </div>

            <!-- Newsletter Subscription -->
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="newsletter"
                  name="newsletter"
                  type="checkbox"
                  formControlName="newsletter"
                  class="form-checkbox">
              </div>
              <div class="ml-2 text-sm">
                <label for="newsletter" class="text-gray-900">
                  Je souhaite recevoir les offres et nouveautés par email
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="!registerForm.valid || isLoading"
                class="w-full btn-primary justify-center py-3">
                <div *ngIf="isLoading" class="spinner mr-2"></div>
                <span>{{ isLoading ? 'Création du compte...' : 'Créer mon compte' }}</span>
              </button>
            </div>
          </form>

          <!-- Divider -->
          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <!-- Alternative Actions -->
            <div class="mt-6">
              <button
                type="button"
                (click)="continueAsGuest()"
                class="w-full btn-outline justify-center py-3">
                <lucide-icon name="user" class="w-5 h-5 mr-2"></lucide-icon>
                <span>Continuer sans compte</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Additional Links -->
        <div class="mt-6 text-center space-y-2">
          <p class="text-sm text-gray-600">
            Vous avez déjà un compte ?
            <a routerLink="/connexion" class="font-medium text-primary-600 hover:text-primary-500">
              Se connecter
            </a>
          </p>

          <p class="text-sm text-gray-600">
            <a routerLink="/" class="font-medium text-primary-600 hover:text-primary-500">
              ← Retour à l'accueil
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrengthLevels = [1, 2, 3, 4];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit(): void {
    // Si déjà connecté, rediriger
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/profil']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createRegisterForm(): FormGroup {
    return this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [phoneValidator]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      newsletter: [false]
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;

      const registerData = {
        nom: this.registerForm.value.nom,
        prenom: this.registerForm.value.prenom,
        email: this.registerForm.value.email,
        motDePasse: this.registerForm.value.motDePasse,
        telephone: this.registerForm.value.telephone || undefined
      };

      this.authService.register(registerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastService.registrationSuccess();
            this.toastService.loginSuccess(response.userInfo.prenom);
            this.router.navigate(['/profil']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur d\'inscription:', error);

            if (error.status === 400 && error.error?.message?.includes('email')) {
              this.toastService.error('Email déjà utilisé', 'Un compte avec cet email existe déjà');
            } else {
              this.toastService.error('Erreur', 'Une erreur s\'est produite lors de l\'inscription');
            }
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  continueAsGuest(): void {
    this.router.navigate(['/produits']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Password strength methods
  getPasswordStrength(): number {
    const password = this.registerForm.get('motDePasse')?.value || '';
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return Math.min(strength, 4);
  }

  getPasswordStrengthClass(level: number): string {
    const currentStrength = this.getPasswordStrength();

    if (level <= currentStrength) {
      switch (currentStrength) {
        case 1:
          return 'bg-red-500';
        case 2:
          return 'bg-orange-500';
        case 3:
          return 'bg-yellow-500';
        case 4:
          return 'bg-green-500';
        default:
          return 'bg-gray-200';
      }
    }

    return 'bg-gray-200';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const password = this.registerForm.get('motDePasse')?.value || '';

    if (!password) {
      return 'Entrez un mot de passe';
    }

    switch (strength) {
      case 1:
        return 'Mot de passe faible';
      case 2:
        return 'Mot de passe moyen';
      case 3:
        return 'Mot de passe fort';
      case 4:
        return 'Mot de passe très fort';
      default:
        return 'Mot de passe trop court';
    }
  }

  getPasswordStrengthTextClass(): string {
    const strength = this.getPasswordStrength();

    switch (strength) {
      case 1:
        return 'text-red-600';
      case 2:
        return 'text-orange-600';
      case 3:
        return 'text-yellow-600';
      case 4:
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  }
}
