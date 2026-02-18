import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-login',
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
          Connexion à votre compte
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ou
          <a routerLink="/inscription" class="font-medium text-primary-600 hover:text-primary-500">
            créez un nouveau compte
          </a>
        </p>
      </div>

      <!-- Login Form -->
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">

            <!-- Email Field -->
            <div>
              <label for="email" class="form-label">
                Adresse email
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
                <span *ngIf="loginForm.get('email')?.errors?.['required']">
                  L'adresse email est obligatoire
                </span>
                <span *ngIf="loginForm.get('email')?.errors?.['email']">
                  Format d'email invalide
                </span>
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="form-label">
                Mot de passe
              </label>
              <div class="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
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
                <span *ngIf="loginForm.get('motDePasse')?.errors?.['required']">
                  Le mot de passe est obligatoire
                </span>
                <span *ngIf="loginForm.get('motDePasse')?.errors?.['minlength']">
                  Le mot de passe doit contenir au moins 6 caractères
                </span>
              </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  formControlName="rememberMe"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              <div class="text-sm">
                <a
                  href="javascript:void(0)"
                  (click)="openResetModal()"
                  class="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="!loginForm.valid || isLoading"
                class="w-full btn-primary justify-center py-3">
                <div *ngIf="isLoading" class="spinner mr-2"></div>
                <span>{{ isLoading ? 'Connexion...' : 'Se connecter' }}</span>
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
                <span class="px-2 bg-white text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            <!-- Guest Actions -->
            <div class="mt-6 space-y-3">
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
            Nouveau chez Froid Cheikh ?
            <a routerLink="/inscription" class="font-medium text-primary-600 hover:text-primary-500">
              Créer un compte
            </a>
          </p>

          <p class="text-sm text-gray-600">
            <a routerLink="/" class="font-medium text-primary-600 hover:text-primary-500">
              ← Retour à l'accueil
            </a>
          </p>
        </div>
      </div>

      <!-- Features -->
      <div class="mt-12 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">
            Avantages d'un compte Froid Cheikh
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <lucide-icon name="truck" class="w-6 h-6 text-primary-600"></lucide-icon>
              </div>
              <h4 class="font-medium text-gray-900">Suivi des commandes</h4>
              <p class="text-sm text-gray-600">Suivez vos commandes en temps réel</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <lucide-icon name="heart" class="w-6 h-6 text-secondary-600"></lucide-icon>
              </div>
              <h4 class="font-medium text-gray-900">Liste de souhaits</h4>
              <p class="text-sm text-gray-600">Sauvegardez vos produits favoris</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <lucide-icon name="settings" class="w-6 h-6 text-accent-600"></lucide-icon>
              </div>
              <h4 class="font-medium text-gray-900">Profil personnalisé</h4>
              <p class="text-sm text-gray-600">Gérez vos informations et adresses</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div *ngIf="showResetModal"
         class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-5 border-b">
          <h3 class="text-xl font-semibold text-gray-900">
            Réinitialiser le mot de passe
          </h3>
          <button
            type="button"
            (click)="closeResetModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">
            Entrez votre adresse email et votre mot de passe sera réinitialisé à <strong class="text-primary-600">passe123</strong>
          </p>

          <div>
            <label for="reset-email" class="form-label">
              Adresse email
            </label>
            <div class="mt-1 relative">
              <input
                id="reset-email"
                type="email"
                [(ngModel)]="resetEmail"
                class="form-input"
                placeholder="votre@email.com">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <lucide-icon name="mail" class="w-5 h-5 text-gray-400"></lucide-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-end p-6 border-t space-x-3">
          <button
            type="button"
            (click)="closeResetModal()"
            class="btn-outline">
            Annuler
          </button>
          <button
            type="button"
            (click)="confirmResetPassword()"
            [disabled]="!resetEmail || isResetting"
            class="btn-primary">
            <div *ngIf="isResetting" class="spinner mr-2"></div>
            <span>{{ isResetting ? 'Réinitialisation...' : 'Réinitialiser' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  returnUrl = '/';

  // Reset password
  showResetModal = false;
  resetEmail = '';
  isResetting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Si déjà connecté, rediriger
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/profil']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;

      const loginData = {
        email: this.loginForm.value.email,
        motDePasse: this.loginForm.value.motDePasse
      };

      this.authService.login(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastService.loginSuccess(response.userInfo.prenom);
            this.authService.redirectAfterLogin(this.returnUrl);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur de connexion:', error);

            if (error.status === 401) {
              this.toastService.loginError();
            } else {
              this.toastService.error('Erreur', 'Une erreur s\'est produite lors de la connexion');
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

  continueAsGuest(): void {
    this.router.navigate(['/produits']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Reset Password Methods
  openResetModal(): void {
    this.resetEmail = this.loginForm.get('email')?.value || '';
    this.showResetModal = true;
  }

  closeResetModal(): void {
    this.showResetModal = false;
    this.resetEmail = '';
    this.isResetting = false;
  }

  confirmResetPassword(): void {
    if (!this.resetEmail || this.isResetting) {
      return;
    }

    this.isResetting = true;

    this.authService.resetPassword(this.resetEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isResetting = false;
          this.toastService.success(
            'Mot de passe réinitialisé',
            'Votre nouveau mot de passe est: passe123'
          );
          this.closeResetModal();

          // Pré-remplir le formulaire avec le nouveau mot de passe
          this.loginForm.patchValue({
            email: this.resetEmail,
            motDePasse: 'passe123'
          });
        },
        error: (error) => {
          this.isResetting = false;
          console.error('Erreur de réinitialisation:', error);

          if (error.error?.message) {
            this.toastService.error('Erreur', error.error.message);
          } else {
            this.toastService.error(
              'Erreur',
              'Aucun compte trouvé avec cet email'
            );
          }
        }
      });
  }

  // Méthodes utiles pour les tests ou l'administration
  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'demo@froidcheikh.sn',
      motDePasse: 'demo123'
    });
  }

  getFormErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control && control.errors && control.touched) {
        switch (key) {
          case 'email':
            if (control.errors['required']) errors.push('L\'email est obligatoire');
            if (control.errors['email']) errors.push('Format d\'email invalide');
            break;
          case 'motDePasse':
            if (control.errors['required']) errors.push('Le mot de passe est obligatoire');
            if (control.errors['minlength']) errors.push('Le mot de passe doit contenir au moins 6 caractères');
            break;
        }
      }
    });
    return errors;
  }
}
