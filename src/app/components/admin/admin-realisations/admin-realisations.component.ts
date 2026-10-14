import { Component } from '@angular/core';
import { ContentManagerConfig } from '../content-manager/content-manager.component';

@Component({
  selector: 'app-admin-realisations',
  template: `<app-content-manager [config]="config"></app-content-manager>`
})
export class AdminRealisationsComponent {
  config: ContentManagerConfig = {
    entityType: 'realisations',
    title: 'Réalisations',
    columns: [
      { key: 'titre', label: 'Titre', type: 'text' },
      { key: 'categorie', label: 'Catégorie', type: 'text' },
      { key: 'annee', label: 'Année', type: 'text' },
      { key: 'localisation', label: 'Lieu', type: 'text' },
    ],
    formFields: [
      { key: 'titre', label: 'Titre', required: true },
      { key: 'categorie', label: 'Catégorie' },
      { key: 'localisation', label: 'Localisation' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'clientNom', label: 'Nom du client' },
      { key: 'annee', label: 'Année (ex: 2024)' },
      { key: 'duree', label: 'Durée (ex: 3 mois)' },
      { key: 'surface', label: 'Surface (ex: 2,500 m²)' },
    ]
  };
}
