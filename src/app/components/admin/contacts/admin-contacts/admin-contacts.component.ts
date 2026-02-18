// src/app/components/admin/contacts/admin-contacts.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {AdminService, Contact} from "../../../../services/admin.service";

@Component({
  selector: 'app-admin-contacts',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Messages de contact</h1>
          <p class="text-gray-600">Gérez les messages reçus de vos clients</p>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white shadow rounded-lg p-4">
        <div class="flex items-center space-x-4">
          <button *ngFor="let filtre of filtres"
                  (click)="filtreActif = filtre.value; chargerContacts()"
                  class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  [class.bg-primary-600]="filtreActif === filtre.value"
                  [class.text-white]="filtreActif === filtre.value"
                  [class.bg-gray-100]="filtreActif !== filtre.value"
                  [class.text-gray-700]="filtreActif !== filtre.value"
                  [class.hover:bg-gray-200]="filtreActif !== filtre.value">
            {{ filtre.label }}
            <span *ngIf="filtre.count !== undefined"
                  class="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full"
                  [class.bg-white]="filtreActif === filtre.value"
                  [class.text-primary-600]="filtreActif === filtre.value"
                  [class.bg-gray-200]="filtreActif !== filtre.value"
                  [class.text-gray-700]="filtreActif !== filtre.value">
              {{ filtre.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- Liste des contacts -->
      <div class="bg-white shadow rounded-lg">
        <div class="divide-y divide-gray-200" *ngIf="contacts.length > 0; else noContacts">
          <div *ngFor="let contact of contacts"
               class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
               [class.bg-blue-50]="contact.statut === 'NON_LU'"
               (click)="selectionnerContact(contact)">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <lucide-icon
                    [name]="contact.statut === 'NON_LU' ? 'mail' : 'mail-open'"
                    class="h-5 w-5"
                    [class.text-blue-600]="contact.statut === 'NON_LU'"
                    [class.text-gray-400]="contact.statut !== 'NON_LU'">
                  </lucide-icon>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-lg font-medium text-gray-900">
                        {{ contact.prenom }} {{ contact.nom }}
                      </h3>
                      <span class="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full"
                            [ngClass]="{
                              'bg-blue-100 text-blue-800': contact.statut === 'NON_LU',
                              'bg-gray-100 text-gray-800': contact.statut === 'LU',
                              'bg-yellow-100 text-yellow-800': contact.statut === 'EN_COURS',
                              'bg-green-100 text-green-800': contact.statut === 'TRAITE'
                            }">
                        {{ getStatutLabel(contact.statut) }}
                      </span>
                    </div>
                    <p class="text-sm font-medium text-gray-700 mt-1">{{ contact.sujet }}</p>
                    <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ contact.message }}</p>
                    <div class="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                      <span class="flex items-center">
                        <lucide-icon name="mail" class="h-4 w-4 mr-1"></lucide-icon>
                        {{ contact.email }}
                      </span>
                      <span *ngIf="contact.telephone" class="flex items-center">
                        <lucide-icon name="phone" class="h-4 w-4 mr-1"></lucide-icon>
                        {{ contact.telephone }}
                      </span>
                      <span class="flex items-center">
                        <lucide-icon name="calendar" class="h-4 w-4 mr-1"></lucide-icon>
                        {{ contact.dateEnvoi | date:'short' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 ml-4">
                <button (click)="changerStatut(contact, $event)"
                        class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                  <lucide-icon name="edit" class="h-5 w-5"></lucide-icon>
                </button>
                <button (click)="supprimerContact(contact, $event)"
                        class="p-2 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50">
                  <lucide-icon name="trash-2" class="h-5 w-5"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noContacts>
          <div class="text-center py-12">
            <lucide-icon name="mail-open" class="mx-auto h-12 w-12 text-gray-400"></lucide-icon>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun message</h3>
            <p class="mt-1 text-sm text-gray-500">Aucun message ne correspond à ce filtre</p>
          </div>
        </ng-template>
      </div>

      <!-- Modal de détails -->
      <div *ngIf="contactSelectionne"
           class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
           (click)="fermerModal()">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
             (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Détails du message</h3>
            <button (click)="fermerModal()" class="text-gray-400 hover:text-gray-600">
              <lucide-icon name="x" class="h-6 w-6"></lucide-icon>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Informations client -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Informations du client</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">Nom complet:</span>
                  <p class="font-medium">{{ contactSelectionne.prenom }} {{ contactSelectionne.nom }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Email:</span>
                  <p class="font-medium">{{ contactSelectionne.email }}</p>
                </div>
                <div *ngIf="contactSelectionne.telephone">
                  <span class="text-gray-500">Téléphone:</span>
                  <p class="font-medium">{{ contactSelectionne.telephone }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Date d'envoi:</span>
                  <p class="font-medium">{{ contactSelectionne.dateEnvoi | date:'medium' }}</p>
                </div>
              </div>
            </div>

            <!-- Sujet -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <p class="text-gray-900">{{ contactSelectionne.sujet }}</p>
            </div>

            <!-- Message -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-gray-900 whitespace-pre-wrap">{{ contactSelectionne.message }}</p>
              </div>
            </div>

            <!-- Statut -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Changer le statut</label>
              <div class="flex space-x-2">
                <button *ngFor="let statut of statuts"
                        (click)="mettreAJourStatut(contactSelectionne.id, statut.value)"
                        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        [class.ring-2]="contactSelectionne.statut === statut.value"
                        [class.ring-offset-2]="contactSelectionne.statut === statut.value"
                        [ngClass]="statut.class">
                  {{ statut.label }}
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button (click)="fermerModal()"
                      class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Fermer
              </button>
              <a [href]="'mailto:' + contactSelectionne.email"
                 class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                <lucide-icon name="mail" class="mr-2 h-4 w-4"></lucide-icon>
                Répondre par email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminContactsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  contacts: Contact[] = [];
  contactSelectionne: Contact | null = null;
  filtreActif: string = 'tous';

  filtres = [
    { label: 'Tous', value: 'tous', count: 0 },
    { label: 'Non lus', value: 'NON_LU', count: 0 },
    { label: 'Lus', value: 'LU', count: 0 },
    { label: 'En cours', value: 'EN_COURS', count: 0 },
    { label: 'Traités', value: 'TRAITE', count: 0 }
  ];

  statuts = [
    { label: 'Non lu', value: 'NON_LU', class: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    { label: 'Lu', value: 'LU', class: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    { label: 'En cours', value: 'EN_COURS', class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    { label: 'Traité', value: 'TRAITE', class: 'bg-green-100 text-green-800 hover:bg-green-200' }
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.chargerContacts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  chargerContacts(): void {
    const observable = this.filtreActif === 'tous'
      ? this.adminService.getContacts()
      : this.adminService.getContactsParStatut(this.filtreActif);

    observable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.mettreAJourCompteurs();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des contacts:', error);
      }
    });
  }

  private mettreAJourCompteurs(): void {
    this.adminService.getContacts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tousContacts) => {
          this.filtres[0].count = tousContacts.length;
          this.filtres[1].count = tousContacts.filter(c => c.statut === 'NON_LU').length;
          this.filtres[2].count = tousContacts.filter(c => c.statut === 'LU').length;
          this.filtres[3].count = tousContacts.filter(c => c.statut === 'EN_COURS').length;
          this.filtres[4].count = tousContacts.filter(c => c.statut === 'TRAITE').length;
        }
      });
  }

  selectionnerContact(contact: Contact): void {
    this.contactSelectionne = contact;

    // Marquer comme lu si non lu
    if (contact.statut === 'NON_LU') {
      this.mettreAJourStatut(contact.id, 'LU');
    }
  }

  fermerModal(): void {
    this.contactSelectionne = null;
  }

  changerStatut(contact: Contact, event: Event): void {
    event.stopPropagation();
    this.selectionnerContact(contact);
  }

  mettreAJourStatut(id: number, statut: string): void {
    this.adminService.updateContactStatut(id, statut)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chargerContacts();
          if (this.contactSelectionne && this.contactSelectionne.id === id) {
            this.contactSelectionne.statut = statut as any;
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      });
  }

  supprimerContact(contact: Contact, event: Event): void {
    event.stopPropagation();

    if (confirm(`Êtes-vous sûr de vouloir supprimer le message de ${contact.prenom} ${contact.nom} ?`)) {
      this.adminService.deleteContact(contact.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.chargerContacts();
            if (this.contactSelectionne && this.contactSelectionne.id === contact.id) {
              this.fermerModal();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
          }
        });
    }
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'NON_LU': 'Non lu',
      'LU': 'Lu',
      'EN_COURS': 'En cours',
      'TRAITE': 'Traité'
    };
    return labels[statut] || statut;
  }
}
