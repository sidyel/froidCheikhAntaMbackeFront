import { Component } from '@angular/core';
import { ContentManagerConfig } from '../content-manager/content-manager.component';

@Component({
  selector: 'app-admin-hero',
  template: `<app-content-manager [config]="config"></app-content-manager>`
})
export class AdminHeroComponent {
  config: ContentManagerConfig = {
    entityType: 'hero',
    title: 'Images Hero (Slider)',
    imageField: 'urlImage',
    columns: [
      { key: 'altText', label: 'Texte alternatif', type: 'text' },
      { key: 'titre', label: 'Titre', type: 'text' },
    ],
    formFields: [
      { key: 'urlImage', label: 'URL de l\'image', type: 'url' },
      { key: 'altText', label: 'Texte alternatif', required: true },
      { key: 'titre', label: 'Titre affiché' },
      { key: 'sousTitre', label: 'Sous-titre' },
      { key: 'texteCta', label: 'Texte du bouton CTA' },
      { key: 'lienCta', label: 'Lien du bouton CTA', type: 'url' },
    ]
  };
}
