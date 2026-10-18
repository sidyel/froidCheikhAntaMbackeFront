import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-install-wizard',
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

        <!-- En-tête + indicateur d'étapes -->
        <div class="bg-primary-600 text-white px-8 py-6">
          <h1 class="text-2xl font-bold">Installation initiale</h1>
          <p class="text-primary-100 text-sm mt-1">Configurez votre site en 3 étapes</p>
          <div class="flex items-center gap-2 mt-4">
            <ng-container *ngFor="let s of [1,2,3]; let i = index">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                   [class.bg-white]="step === s"
                   [class.text-primary-600]="step === s"
                   [class.bg-primary-400]="step !== s && step > s"
                   [class.bg-primary-500]="step < s">
                <lucide-icon *ngIf="step > s" name="check" class="w-4 h-4"></lucide-icon>
                <span *ngIf="step <= s">{{ s }}</span>
              </div>
              <div *ngIf="i < 2" class="flex-1 h-0.5"
                   [class.bg-primary-400]="step > s"
                   [class.bg-primary-500]="step <= s"></div>
            </ng-container>
          </div>
        </div>

        <div class="p-8">
          <!-- Erreur globale -->
          <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ errorMessage }}
          </div>

          <!-- ÉTAPE 1 : Sécurité & compte admin -->
          <div *ngIf="step === 1" [formGroup]="step1Form" class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Compte administrateur</h2>
            <div>
              <label class="form-label">Jeton d'installation (INSTALL_TOKEN) *</label>
              <input formControlName="installToken" type="password" class="form-input"
                     placeholder="Valeur de la variable INSTALL_TOKEN">
              <p class="text-xs text-gray-400 mt-1">Définie dans les variables d'environnement du serveur.</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Nom *</label>
                <input formControlName="nom" class="form-input">
              </div>
              <div>
                <label class="form-label">Prénom *</label>
                <input formControlName="prenom" class="form-input">
              </div>
            </div>
            <div>
              <label class="form-label">Email *</label>
              <input formControlName="email" type="email" class="form-input">
            </div>
            <div>
              <label class="form-label">Mot de passe (min. 8 caractères) *</label>
              <input formControlName="motDePasse" type="password" class="form-input">
              <div *ngIf="step1Form.get('motDePasse')?.errors?.['minlength']" class="form-error">
                Au moins 8 caractères requis
              </div>
            </div>
          </div>

          <!-- ÉTAPE 2 : Identité du site -->
          <div *ngIf="step === 2" [formGroup]="step2Form" class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Identité du site</h2>
            <div>
              <label class="form-label">Nom du site *</label>
              <input formControlName="nomSite" class="form-input" placeholder="Mon E-commerce">
            </div>
            <div>
              <label class="form-label">Slogan</label>
              <input formControlName="sloganSite" class="form-input" placeholder="Votre slogan">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="form-label">Couleur primaire</label>
                <input type="color" formControlName="couleurPrimaire"
                       class="w-full h-10 rounded cursor-pointer border border-gray-300">
              </div>
              <div>
                <label class="form-label">Secondaire</label>
                <input type="color" formControlName="couleurSecondaire"
                       class="w-full h-10 rounded cursor-pointer border border-gray-300">
              </div>
              <div>
                <label class="form-label">Accent</label>
                <input type="color" formControlName="couleurAccent"
                       class="w-full h-10 rounded cursor-pointer border border-gray-300">
              </div>
            </div>
            <!-- Aperçu -->
            <div class="flex gap-2 mt-1">
              <span class="px-3 py-1 rounded text-white text-xs"
                    [style.background]="step2Form.get('couleurPrimaire')?.value">Primaire</span>
              <span class="px-3 py-1 rounded text-white text-xs"
                    [style.background]="step2Form.get('couleurSecondaire')?.value">Secondaire</span>
              <span class="px-3 py-1 rounded text-white text-xs"
                    [style.background]="step2Form.get('couleurAccent')?.value">Accent</span>
            </div>
          </div>

          <!-- ÉTAPE 3 : Contact -->
          <div *ngIf="step === 3" [formGroup]="step3Form" class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Informations de contact</h2>
            <div>
              <label class="form-label">Email de contact</label>
              <input formControlName="emailContact" type="email" class="form-input">
            </div>
            <div>
              <label class="form-label">Téléphone principal</label>
              <input formControlName="telephone" class="form-input" placeholder="77 000 00 00">
            </div>
            <div>
              <label class="form-label">Adresse</label>
              <input formControlName="adresse" class="form-input">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Ville</label>
                <input formControlName="ville" class="form-input">
              </div>
              <div>
                <label class="form-label">Pays</label>
                <input formControlName="pays" class="form-input">
              </div>
            </div>
          </div>

          <!-- Succès -->
          <div *ngIf="step === 4" class="text-center py-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon name="check-circle" class="w-8 h-8 text-green-600"></lucide-icon>
            </div>
            <h2 class="text-xl font-bold text-gray-800">Installation réussie !</h2>
            <p class="text-gray-500 mt-2">Votre site est configuré. Connectez-vous pour accéder à l'administration.</p>
            <button (click)="goToLogin()" class="btn-primary mt-6 w-full justify-center">
              Aller à la connexion
            </button>
          </div>

          <!-- Navigation -->
          <div *ngIf="step < 4" class="flex justify-between mt-8">
            <button *ngIf="step > 1" type="button" (click)="step = step - 1"
                    class="btn-outline">
              Précédent
            </button>
            <div *ngIf="step === 1"></div>

            <button *ngIf="step < 3" type="button" (click)="nextStep()"
                    class="btn-primary" [disabled]="currentForm.invalid">
              Suivant
            </button>
            <button *ngIf="step === 3" type="button" (click)="install()"
                    class="btn-primary" [disabled]="installing">
              <span>{{ installing ? 'Installation…' : 'Terminer l\'installation' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InstallWizardComponent {
  step = 1;
  installing = false;
  errorMessage = '';

  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.step1Form = this.fb.group({
      installToken: ['', Validators.required],
      nom:          ['', Validators.required],
      prenom:       ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      motDePasse:   ['', [Validators.required, Validators.minLength(8)]]
    });

    this.step2Form = this.fb.group({
      nomSite:           ['', Validators.required],
      sloganSite:        [''],
      couleurPrimaire:   ['#2563eb'],
      couleurSecondaire: ['#16a34a'],
      couleurAccent:     ['#dc2626'],
    });

    this.step3Form = this.fb.group({
      emailContact: ['', Validators.email],
      telephone:    [''],
      adresse:      [''],
      ville:        [''],
      pays:         ['']
    });
  }

  get currentForm(): FormGroup {
    return [this.step1Form, this.step2Form, this.step3Form][this.step - 1];
  }

  nextStep(): void {
    if (this.currentForm.valid) this.step++;
  }

  install(): void {
    if (this.step3Form.invalid) return;
    this.installing = true;
    this.errorMessage = '';

    const s1 = this.step1Form.value;
    const s2 = this.step2Form.value;
    const s3 = this.step3Form.value;

    const body = {
      nom: s1.nom,
      prenom: s1.prenom,
      email: s1.email,
      motDePasse: s1.motDePasse,
      nomSite: s2.nomSite,
      sloganSite: s2.sloganSite,
      emailContact: s3.emailContact,
    };

    this.http.post(`${environment.apiUrl}/auth/install`, body, {
      headers: new HttpHeaders({ 'X-Install-Token': s1.installToken })
    }).subscribe({
      next: () => {
        // Si des couleurs non-défaut ont été choisies, les sauvegarder immédiatement
        this.step = 4;
        this.installing = false;
      },
      error: err => {
        this.installing = false;
        this.errorMessage = err?.error?.error || 'Erreur lors de l\'installation.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/connexion']);
  }
}
