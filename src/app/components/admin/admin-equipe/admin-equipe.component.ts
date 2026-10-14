import { Component } from '@angular/core';
import { ContentManagerConfig } from '../content-manager/content-manager.component';

@Component({
  selector: 'app-admin-equipe',
  template: `<app-content-manager [config]="config"></app-content-manager>`
})
export class AdminEquipeComponent {
  config: ContentManagerConfig = {
    entityType: 'equipe',
    title: 'Membres de l\'équipe',
    imageField: 'urlPhoto',
    columns: [
      { key: 'nom', label: 'Nom', type: 'text' },
      { key: 'poste', label: 'Poste', type: 'text' },
      { key: 'experience', label: 'Expérience', type: 'text' },
    ],
    formFields: [
      { key: 'nom', label: 'Nom complet', required: true },
      { key: 'poste', label: 'Poste / Fonction' },
      { key: 'experience', label: 'Expérience (ex: 10 ans d\'expérience)' },
      { key: 'bio', label: 'Biographie', type: 'textarea' },
      { key: 'urlPhoto', label: 'URL de la photo', type: 'url' },
      { key: 'urlLinkedin', label: 'URL LinkedIn', type: 'url' },
      { key: 'emailMembre', label: 'Email' },
    ]
  };
}
