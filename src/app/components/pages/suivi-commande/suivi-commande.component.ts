import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { SeoService } from '../../../services/seo.service';
import { Commande, StatutCommande } from '../../../models/interfaces';

@Component({
  selector: 'app-suivi-commande',
  standalone: false,
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4">
      <div class="max-w-xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Suivi de commande</h1>
        <p class="text-gray-500 mb-8">Retrouvez l'état de votre commande sans créer de compte.</p>

        <!-- Formulaire -->
        <div class="bg-white rounded-xl shadow p-6 mb-6" *ngIf="!commande">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Numéro de commande</label>
              <input
                [(ngModel)]="numeroCommande"
                type="text"
                placeholder="CMD-1234567890"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
              <input
                [(ngModel)]="telephone"
                type="tel"
                placeholder="77 XXX XX XX"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>

            <div *ngIf="erreur" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {{ erreur }}
            </div>

            <button
              (click)="rechercher()"
              [disabled]="isLoading || !numeroCommande.trim() || !telephone.trim()"
              class="w-full btn-primary py-2">
              {{ isLoading ? 'Recherche...' : 'Rechercher ma commande' }}
            </button>
          </div>
        </div>

        <!-- Résultat -->
        <div *ngIf="commande" class="bg-white rounded-xl shadow p-6 space-y-4">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="font-semibold text-gray-900">{{ commande.numeroCommande }}</h2>
              <p class="text-sm text-gray-500">{{ commande.dateCommande | date:'dd/MM/yyyy à HH:mm' }}</p>
            </div>
            <span [ngClass]="getStatutClass(commande.statutCommande)"
                  class="px-3 py-1 rounded-full text-sm font-medium border">
              {{ getStatutLabel(commande.statutCommande) }}
            </span>
          </div>

          <!-- Articles -->
          <div *ngIf="commande.lignesCommande?.length" class="border-t pt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Articles</h3>
            <ul class="space-y-1">
              <li *ngFor="let ligne of commande.lignesCommande" class="text-sm text-gray-600">
                {{ ligne.nomProduitCommande }} × {{ ligne.quantite }}
              </li>
            </ul>
          </div>

          <!-- Historique simplifié -->
          <div *ngIf="commande.historiqueStatuts?.length" class="border-t pt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Historique</h3>
            <ul class="space-y-2">
              <li *ngFor="let h of commande.historiqueStatuts" class="flex items-center gap-2 text-sm">
                <span class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></span>
                <span class="text-gray-600">{{ getStatutLabel(h.nouveauStatut) }}</span>
                <span class="text-gray-400 ml-auto">{{ h.dateChangement | date:'dd/MM HH:mm' }}</span>
              </li>
            </ul>
          </div>

          <button (click)="recommencer()" class="text-sm text-primary-600 hover:underline">
            Rechercher une autre commande
          </button>
        </div>
      </div>
    </div>
  `
})
export class SuiviCommandeComponent {
  numeroCommande = '';
  telephone = '';
  commande: Commande | null = null;
  isLoading = false;
  erreur = '';

  constructor(
    private apiService: ApiService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.seoService.setDefault('Suivi de commande');
  }

  rechercher(): void {
    if (!this.numeroCommande.trim() || !this.telephone.trim()) return;
    this.isLoading = true;
    this.erreur = '';

    this.apiService.getSuiviCommande(this.numeroCommande.trim(), this.telephone.trim())
      .subscribe({
        next: (c) => {
          this.commande = c;
          this.isLoading = false;
        },
        error: () => {
          this.erreur = 'Aucune commande trouvée avec ces informations.';
          this.isLoading = false;
        }
      });
  }

  recommencer(): void {
    this.commande = null;
    this.erreur = '';
    this.numeroCommande = '';
    this.telephone = '';
  }

  getStatutLabel(statut: StatutCommande): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En attente', CONFIRMEE: 'Confirmée',
      LIVREE: 'Livrée', ANNULEE: 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: StatutCommande): string {
    const classes: Record<string, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMEE: 'bg-blue-100 text-blue-800 border-blue-300',
      LIVREE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      ANNULEE: 'bg-red-100 text-red-800 border-red-300'
    };
    return classes[statut] || 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
