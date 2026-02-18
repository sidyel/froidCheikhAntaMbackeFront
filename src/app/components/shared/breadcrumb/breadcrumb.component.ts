import { Component, Input } from '@angular/core';
import { Breadcrumb } from '../../../models/interfaces';

@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav class="bg-gray-100 border-b border-gray-200" *ngIf="breadcrumbs && breadcrumbs.length > 0">
      <div class="container mx-auto px-4 py-3">
        <ol class="flex items-center space-x-2 text-sm">
          <li *ngFor="let breadcrumb of breadcrumbs; let last = last" class="flex items-center">

            <!-- Breadcrumb Link -->
            <a
              *ngIf="breadcrumb.route && !last"
              [routerLink]="breadcrumb.route"
              class="text-gray-500 hover:text-primary-600 transition-colors font-medium">
              {{ breadcrumb.label }}
            </a>

            <!-- Current Page (no link) -->
            <span
              *ngIf="!breadcrumb.route || last"
              class="text-gray-900 font-medium"
              [class.text-gray-500]="!last">
              {{ breadcrumb.label }}
            </span>

            <!-- Separator -->
            <lucide-icon
              *ngIf="!last"
              name="chevron-right"
              class="w-4 h-4 text-gray-400 mx-2">
            </lucide-icon>
          </li>
        </ol>
      </div>
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input() breadcrumbs: Breadcrumb[] = [];
}
