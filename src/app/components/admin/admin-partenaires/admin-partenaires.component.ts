import { Component } from '@angular/core';
import { ContentManagerConfig } from '../content-manager/content-manager.component';

@Component({
  selector: 'app-admin-partenaires',
  template: `<app-content-manager [config]="config"></app-content-manager>`
})
export class AdminPartenairesComponent {
  config: ContentManagerConfig = {
    entityType: 'partenaires',
    title: 'Partenaires',
    imageField: 'urlLogo',
    columns: [
      { key: 'nom', label: 'Nom', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    formFields: [
      { key: 'nom', label: 'Nom du partenaire', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'urlLogo', label: 'URL du logo', type: 'url' },
      { key: 'urlSite', label: 'URL du site web', type: 'url' },
    ]
  };
}
