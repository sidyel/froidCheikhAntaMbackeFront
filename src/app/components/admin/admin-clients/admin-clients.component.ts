// src/app/components/admin/clients/admin-clients.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { Client, PagedResponse, Genre } from '../../../models/interfaces';

@Component({
  selector: 'app-admin-clients',
  template: `
    <div class="space-y-6">
      <!-- Header avec bouton d'ajout -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
          <p class="text-gray-600">Gérez les comptes clients</p>
        </div>
        <button
          (click)="openCreateModal()"
          class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <lucide-icon name="plus" class="mr-2 h-4 w-4"></lucide-icon>
          Nouveau client
        </button>
      </div>

      <!-- Filtres et recherche -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange()"
                placeholder="Nom, prénom ou email..."
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <lucide-icon name="search" class="absolute left-3 top-3 h-4 w-4 text-gray-400"></lucide-icon>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              [(ngModel)]="selectedStatut"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tous les statuts</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <select
              [(ngModel)]="selectedGenre"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tous les genres</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <!-- Table des clients -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  [(ngModel)]="selectAll"
                  (change)="toggleSelectAll()"
                  class="rounded border-gray-300">
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inscription
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let client of clients; trackBy: trackByClientId"
                class="hover:bg-gray-50"
                [class.bg-blue-50]="selectedClients.has(client.idClient)">
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  [checked]="selectedClients.has(client.idClient)"
                  (change)="toggleClientSelection(client.idClient)"
                  class="rounded border-gray-300">
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-primary-700">
                        {{ getInitials(client) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ client.prenom }} {{ client.nom }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ client.idClient }}
                      <span *ngIf="client.genre" class="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        {{ getGenreLabel(client.genre) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ client.email }}</div>
                <div class="text-sm text-gray-500" *ngIf="client.telephone">
                  {{ client.telephone }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ client.dateCreation | date:'short' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': client.actif,
                        'bg-red-100 text-red-800': !client.actif
                      }">
                  {{ client.actif ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    (click)="voirDetails(client)"
                    class="text-primary-600 hover:text-primary-800"
                    title="Voir détails">
                    <lucide-icon name="eye" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button
                    (click)="openEditModal(client)"
                    class="text-blue-600 hover:text-blue-800"
                    title="Modifier">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button
                    *ngIf="client.actif"
                    (click)="desactiverClient(client)"
                    class="text-orange-600 hover:text-orange-800"
                    title="Désactiver">
                    <lucide-icon name="user-x" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button
                    *ngIf="!client.actif"
                    (click)="activerClient(client)"
                    class="text-green-600 hover:text-green-800"
                    title="Activer">
                    <lucide-icon name="user-check" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button
                    (click)="supprimerClient(client)"
                    class="text-red-600 hover:text-red-800"
                    title="Supprimer">
                    <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Actions de masse -->
        <div *ngIf="selectedClients.size > 0"
             class="bg-blue-50 px-6 py-3 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-700">
              {{ selectedClients.size }} client(s) sélectionné(s)
            </span>
            <div class="space-x-2">
              <button
                (click)="activerClientsSelectionnes()"
                class="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                <lucide-icon name="user-check" class="mr-1 h-4 w-4"></lucide-icon>
                Activer
              </button>
              <button
                (click)="desactiverClientsSelectionnes()"
                class="inline-flex items-center px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
                <lucide-icon name="user-x" class="mr-1 h-4 w-4"></lucide-icon>
                Désactiver
              </button>
              <button
                (click)="supprimerClientsSelectionnes()"
                class="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                <lucide-icon name="trash-2" class="mr-1 h-4 w-4"></lucide-icon>
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              [disabled]="currentPage === 0"
              (click)="previousPage()"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Précédent
            </button>
            <button
              [disabled]="currentPage >= totalPages - 1"
              (click)="nextPage()"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Suivant
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Affichage de
                <span class="font-medium">{{ currentPage * pageSize + 1 }}</span>
                à
                <span class="font-medium">{{ Math.min((currentPage + 1) * pageSize, totalElements) }}</span>
                sur
                <span class="font-medium">{{ totalElements }}</span>
                résultats
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  [disabled]="currentPage === 0"
                  (click)="previousPage()"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <lucide-icon name="chevron-left" class="h-5 w-5"></lucide-icon>
                </button>
                <span class="px-4 py-2 text-sm text-gray-700 border-t border-b border-gray-300 bg-white">
                  Page {{ currentPage + 1 }} sur {{ totalPages }}
                </span>
                <button
                  [disabled]="currentPage >= totalPages - 1"
                  (click)="nextPage()"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <lucide-icon name="chevron-right" class="h-5 w-5"></lucide-icon>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Message si aucun client -->
      <div *ngIf="!loading && clients.length === 0"
           class="text-center py-12 bg-white rounded-lg shadow">
        <lucide-icon name="users" class="mx-auto h-12 w-12 text-gray-400"></lucide-icon>
        <h3 class="mt-4 text-lg font-medium text-gray-900">Aucun client trouvé</h3>
        <p class="mt-2 text-gray-500">
          {{ searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Commencez par ajouter votre premier client.' }}
        </p>
        <button
          *ngIf="!searchTerm"
          (click)="openCreateModal()"
          class="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700">
          <lucide-icon name="plus" class="mr-2 h-4 w-4"></lucide-icon>
          Ajouter un client
        </button>
      </div>

      <!-- Modal création/modification client -->
      <!-- CORRECTION: Modal création/modification client -->
      <app-modal
        [isOpen]="showFormModal"
        [title]="isEditMode ? 'Modifier le client' : 'Nouveau client'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="true"
        [closeOnEscape]="true"
        (closed)="closeFormModal()"
        size="lg">

        <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
          <div class="space-y-6">
            <!-- Informations personnelles -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="prenom"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-red-300]="clientForm.get('prenom')?.invalid && clientForm.get('prenom')?.touched">
                <div *ngIf="clientForm.get('prenom')?.invalid && clientForm.get('prenom')?.touched"
                     class="mt-1 text-sm text-red-600">
                  Le prénom est requis (2-50 caractères)
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="nom"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-red-300]="clientForm.get('nom')?.invalid && clientForm.get('nom')?.touched">
                <div *ngIf="clientForm.get('nom')?.invalid && clientForm.get('nom')?.touched"
                     class="mt-1 text-sm text-red-600">
                  Le nom est requis (2-50 caractères)
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                [class.border-red-300]="clientForm.get('email')?.invalid && clientForm.get('email')?.touched">
              <div *ngIf="clientForm.get('email')?.invalid && clientForm.get('email')?.touched"
                   class="mt-1 text-sm text-red-600">
                Veuillez entrer un email valide
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  formControlName="telephone"
                  placeholder="+221XXXXXXXXX"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-red-300]="clientForm.get('telephone')?.invalid && clientForm.get('telephone')?.touched">
                <div *ngIf="clientForm.get('telephone')?.invalid && clientForm.get('telephone')?.touched"
                     class="mt-1 text-sm text-red-600">
                  Format de téléphone invalide
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select
                  formControlName="genre"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sélectionner un genre</option>
                  <option value="HOMME">Homme</option>
                  <option value="FEMME">Femme</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input
                type="date"
                formControlName="dateNaissance"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>

            <!-- Mot de passe (seulement en création) -->
            <div *ngIf="!isEditMode">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                formControlName="motDePasse"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                [class.border-red-300]="clientForm.get('motDePasse')?.invalid && clientForm.get('motDePasse')?.touched">
              <div *ngIf="clientForm.get('motDePasse')?.invalid && clientForm.get('motDePasse')?.touched"
                   class="mt-1 text-sm text-red-600">
                Le mot de passe doit contenir au moins 6 caractères
              </div>
            </div>

            <div class="flex items-center">
              <input
                type="checkbox"
                id="actif"
                formControlName="actif"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
              <label for="actif" class="ml-2 text-sm text-gray-700">Compte actif</label>
            </div>
          </div>

          <!-- CORRECTION: Actions du modal à l'intérieur du formulaire -->
          <div class="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              (click)="closeFormModal()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="clientForm.invalid || submitting"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
        <span *ngIf="submitting" class="inline-flex items-center">
          <lucide-icon name="loader-2" class="animate-spin mr-2 h-4 w-4"></lucide-icon>
          {{ isEditMode ? 'Modification...' : 'Création...' }}
        </span>
              <span *ngIf="!submitting">
          {{ isEditMode ? 'Modifier' : 'Créer' }}
        </span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- CORRECTION: Modal détails client -->
      <app-modal
        [isOpen]="showDetailsModal"
        [title]="'Détails du client'"
        [showCloseButton]="true"
        [closeOnOverlayClick]="true"
        [closeOnEscape]="true"
        (closed)="closeDetailsModal()"
        size="xl">

        <div class="space-y-6" *ngIf="selectedClient">
          <!-- Actions rapides -->
          <div class="flex justify-end space-x-2">
            <button
              (click)="openEditModal(selectedClient)"
              class="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              <lucide-icon name="edit" class="mr-2 h-4 w-4"></lucide-icon>
              Modifier
            </button>
            <button
              *ngIf="selectedClient.actif"
              (click)="desactiverClient(selectedClient)"
              class="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
              <lucide-icon name="user-x" class="mr-2 h-4 w-4"></lucide-icon>
              Désactiver
            </button>
            <button
              *ngIf="!selectedClient.actif"
              (click)="activerClient(selectedClient)"
              class="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              <lucide-icon name="user-check" class="mr-2 h-4 w-4"></lucide-icon>
              Activer
            </button>
          </div>

          <!-- Informations personnelles -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Informations personnelles</h3>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Nom complet</dt>
                <dd class="text-sm text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="text-sm text-gray-900">{{ selectedClient.email }}</dd>
              </div>
              <div *ngIf="selectedClient.telephone">
                <dt class="text-sm font-medium text-gray-500">Téléphone</dt>
                <dd class="text-sm text-gray-900">{{ selectedClient.telephone }}</dd>
              </div>
              <div *ngIf="selectedClient.genre">
                <dt class="text-sm font-medium text-gray-500">Genre</dt>
                <dd class="text-sm text-gray-900">{{ getGenreLabel(selectedClient.genre) }}</dd>
              </div>
              <div *ngIf="selectedClient.dateNaissance">
                <dt class="text-sm font-medium text-gray-500">Date de naissance</dt>
                <dd class="text-sm text-gray-900">{{ selectedClient.dateNaissance | date:'longDate' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Date d'inscription</dt>
                <dd class="text-sm text-gray-900">{{ selectedClient.dateCreation | date:'full' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Statut</dt>
                <dd>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  [ngClass]="{
                    'bg-green-100 text-green-800': selectedClient.actif,
                    'bg-red-100 text-red-800': !selectedClient.actif
                  }">
              {{ selectedClient.actif ? 'Actif' : 'Inactif' }}
            </span>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Adresses -->
          <div *ngIf="selectedClient.adresses && selectedClient.adresses.length > 0">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Adresses</h3>
            <div class="space-y-3">
              <div *ngFor="let adresse of selectedClient.adresses"
                   class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium text-gray-900">{{ adresse.ligne1 }}</p>
                    <p *ngIf="adresse.ligne2" class="text-gray-700">{{ adresse.ligne2 }}</p>
                    <p class="text-gray-700">{{ adresse.ville }} {{ adresse.codePostal }}</p>
                    <p *ngIf="adresse.telephone" class="text-gray-600">📞 {{ adresse.telephone }}</p>
                  </div>
                  <div class="flex flex-col items-end space-y-1">
              <span *ngIf="adresse.adressePrincipale"
                    class="inline-flex px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                Principale
              </span>
                    <span *ngIf="adresse.typeAdresse"
                          class="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {{ adresse.typeAdresse }}
              </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminClientsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Données
  clients: Client[] = [];
  loading = false;
  submitting = false;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  // Filtres
  searchTerm = '';
  selectedStatut = '';
  selectedGenre = '';

  // Sélection
  selectedClients = new Set<number>();
  selectAll = false;

  // Modals
  showFormModal = false;
  showDetailsModal = false;
  isEditMode = false;
  selectedClient: Client | null = null;

  // Formulaire
  clientForm!: FormGroup;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initForm();
    this.setupSearch();
  }

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^(\+221)?[0-9]{8,9}$/)]],
      dateNaissance: [''],
      genre: [''],
      motDePasse: [''],
      actif: [true]
    });
  }

  private setupSearch(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 0;
      this.loadClients();
    });
  }

  private loadClients(): void {
    this.loading = true;

    const loadMethod = this.searchTerm.trim() ?
      this.adminService.searchClients(this.searchTerm, this.currentPage, this.pageSize) :
      this.adminService.getAllClients(this.currentPage, this.pageSize);

    loadMethod
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PagedResponse<Client>) => {
          this.clients = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.loading = false;
          this.updateSelectAll();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des clients:', error);
          this.toastService.error('Erreur', 'Impossible de charger les clients');
          this.loading = false;
        }
      });
  }

  onSearchChange(): void {
    this.searchSubject$.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  trackByClientId(index: number, client: Client): number {
    return client.idClient;
  }

  // Navigation
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadClients();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadClients();
    }
  }

  // Sélection
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.clients.forEach(client => this.selectedClients.add(client.idClient));
    } else {
      this.selectedClients.clear();
    }
  }

  toggleClientSelection(clientId: number): void {
    if (this.selectedClients.has(clientId)) {
      this.selectedClients.delete(clientId);
    } else {
      this.selectedClients.add(clientId);
    }
    this.updateSelectAll();
  }

  private updateSelectAll(): void {
    this.selectAll = this.clients.length > 0 &&
      this.clients.every(client => this.selectedClients.has(client.idClient));
  }

  // Modals
  openCreateModal(): void {
    this.isEditMode = false;
    this.clientForm.reset({ actif: true });
    this.clientForm.get('motDePasse')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.clientForm.get('motDePasse')?.updateValueAndValidity();
    this.showFormModal = true;
  }

  openEditModal(client: Client): void {
    this.isEditMode = true;
    this.selectedClient = client;

    this.clientForm.patchValue({
      prenom: client.prenom,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone || '',
      dateNaissance: client.dateNaissance || '',
      genre: client.genre || '',
      actif: client.actif
    });

    this.clientForm.get('motDePasse')?.clearValidators();
    this.clientForm.get('motDePasse')?.updateValueAndValidity();
    this.showFormModal = true;
    this.showDetailsModal = false;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.selectedClient = null;
    this.clientForm.reset();
  }

  voirDetails(client: Client): void {
    this.adminService.getClientById(client.idClient)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientDetails) => {
          this.selectedClient = clientDetails;
          this.showDetailsModal = true;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des détails:', error);
          this.toastService.error('Erreur', 'Impossible de charger les détails du client');
        }
      });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedClient = null;
  }

  // CRUD Operations
  onSubmit(): void {
    if (this.clientForm.valid) {
      this.submitting = true;
      const formData = this.clientForm.value;

      const operation$ = this.isEditMode && this.selectedClient ?
        this.adminService.updateClient(this.selectedClient.idClient, formData) :
        this.adminService.createClient(formData);

      operation$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (client) => {
            const action = this.isEditMode ? 'modifié' : 'créé';
            this.toastService.success('Succès', `Client ${action} avec succès`);
            this.closeFormModal();
            this.loadClients();
            this.submitting = false;
          },
          error: (error) => {
            console.error('Erreur lors de la sauvegarde:', error);
            const action = this.isEditMode ? 'modification' : 'création';
            this.toastService.error('Erreur', `Erreur lors de la ${action} du client`);
            this.submitting = false;
          }
        });
    }
  }

  supprimerClient(client: Client): void {
    const message = `Êtes-vous sûr de vouloir supprimer définitivement le client ${client.prenom} ${client.nom} ?\n\nCette action est irréversible.`;

    if (confirm(message)) {
      this.adminService.deleteClient(client.idClient)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Succès', 'Client supprimé avec succès');
            this.loadClients();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.toastService.error('Erreur', 'Impossible de supprimer le client');
          }
        });
    }
  }

  activerClient(client: Client): void {
    this.adminService.activerClient(client.idClient)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          client.actif = true;
          this.toastService.success('Succès', 'Client activé');
          if (this.selectedClient?.idClient === client.idClient) {
            this.selectedClient.actif = true;
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'activation:', error);
          this.toastService.error('Erreur', 'Impossible d\'activer le client');
        }
      });
  }

  desactiverClient(client: Client): void {
    if (confirm(`Êtes-vous sûr de vouloir désactiver le compte de ${client.prenom} ${client.nom} ?`)) {
      this.adminService.desactiverClient(client.idClient)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            client.actif = false;
            this.toastService.success('Succès', 'Client désactivé');
            if (this.selectedClient?.idClient === client.idClient) {
              this.selectedClient.actif = false;
            }
          },
          error: (error) => {
            console.error('Erreur lors de la désactivation:', error);
            this.toastService.error('Erreur', 'Impossible de désactiver le client');
          }
        });
    }
  }

  // Actions de masse
  activerClientsSelectionnes(): void {
    if (this.selectedClients.size === 0) return;

    const count = this.selectedClients.size;
    if (confirm(`Êtes-vous sûr de vouloir activer ${count} client(s) ?`)) {
      const activations = Array.from(this.selectedClients).map(id =>
        this.adminService.activerClient(id)
      );

      // Ici on pourrait utiliser forkJoin pour traiter toutes les activations en parallèle
      // Pour la simplicité, on traite une par une
      this.processMultipleActions(activations, 'activés');
    }
  }

  desactiverClientsSelectionnes(): void {
    if (this.selectedClients.size === 0) return;

    const count = this.selectedClients.size;
    if (confirm(`Êtes-vous sûr de vouloir désactiver ${count} client(s) ?`)) {
      const desactivations = Array.from(this.selectedClients).map(id =>
        this.adminService.desactiverClient(id)
      );

      this.processMultipleActions(desactivations, 'désactivés');
    }
  }

  supprimerClientsSelectionnes(): void {
    if (this.selectedClients.size === 0) return;

    const count = this.selectedClients.size;
    const message = `Êtes-vous sûr de vouloir supprimer définitivement ${count} client(s) ?\n\nCette action est irréversible.`;

    if (confirm(message)) {
      const suppressions = Array.from(this.selectedClients).map(id =>
        this.adminService.deleteClient(id)
      );

      this.processMultipleActions(suppressions, 'supprimés');
    }
  }

  private processMultipleActions(actions: any[], actionLabel: string): void {
    // Cette méthode pourrait être améliorée avec forkJoin pour traiter en parallèle
    let completed = 0;
    let errors = 0;

    actions.forEach(action => {
      action.subscribe({
        next: () => {
          completed++;
          if (completed + errors === actions.length) {
            this.finishMultipleActions(completed, errors, actionLabel);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === actions.length) {
            this.finishMultipleActions(completed, errors, actionLabel);
          }
        }
      });
    });
  }

  private finishMultipleActions(completed: number, errors: number, actionLabel: string): void {
    if (completed > 0) {
      this.toastService.success('Succès', `${completed} client(s) ${actionLabel}`);
    }
    if (errors > 0) {
      this.toastService.error('Erreur', `${errors} erreur(s) lors de l'opération`);
    }

    this.selectedClients.clear();
    this.selectAll = false;
    this.loadClients();
  }

  // Utilitaires
  getInitials(client: Client): string {
    return `${client.prenom.charAt(0)}${client.nom.charAt(0)}`.toUpperCase();
  }

  getGenreLabel(genre: Genre): string {
    const labels = {
      'HOMME': 'Homme',
      'FEMME': 'Femme',
      'AUTRE': 'Autre'
    };
    return labels[genre] || genre;
  }

  Math = Math;
}
