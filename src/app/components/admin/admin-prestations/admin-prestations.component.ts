import { Component } from '@angular/core';
import { ContentManagerConfig } from '../content-manager/content-manager.component';

@Component({
  selector: 'app-admin-prestations',
  template: `<app-content-manager [config]="config"></app-content-manager>`
})
export class AdminPrestationsComponent {
  config: ContentManagerConfig = {
    entityType: 'prestations',
    title: 'Prestations / Services',
    imageField: 'urlImage',
    columns: [
      { key: 'titre', label: 'Titre', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    formFields: [
      { key: 'titre', label: 'Titre de la prestation', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'urlImage', label: 'URL de l\'image', type: 'url' },
    ]
  };
}
