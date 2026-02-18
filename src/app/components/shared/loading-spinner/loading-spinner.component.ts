import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <!-- Overlay Spinner -->
    <div
      *ngIf="overlay"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 shadow-xl">
        <div class="flex flex-col items-center space-y-3">
          <div [class]="getSpinnerClasses()"></div>
          <p *ngIf="message" class="text-gray-700 text-sm">{{ message }}</p>
        </div>
      </div>
    </div>

    <!-- Inline Spinner -->
    <div
      *ngIf="!overlay"
      class="flex items-center justify-center"
      [class.py-8]="!compact"
      [class.py-2]="compact">
      <div class="flex flex-col items-center space-y-2">
        <div [class]="getSpinnerClasses()"></div>
        <p *ngIf="message && !compact" class="text-gray-600 text-sm">{{ message }}</p>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: 'primary' | 'secondary' | 'white' | 'gray' = 'primary';
  @Input() message?: string;
  @Input() compact = false;

  getSpinnerClasses(): string {
    let classes = 'animate-spin rounded-full border-solid border-t-transparent';

    // Size
    switch (this.size) {
      case 'sm':
        classes += ' w-4 h-4 border-2';
        break;
      case 'md':
        classes += ' w-8 h-8 border-2';
        break;
      case 'lg':
        classes += ' w-12 h-12 border-4';
        break;
    }

    // Color
    switch (this.color) {
      case 'primary':
        classes += ' border-primary-600';
        break;
      case 'secondary':
        classes += ' border-secondary-600';
        break;
      case 'white':
        classes += ' border-white';
        break;
      case 'gray':
        classes += ' border-gray-600';
        break;
    }

    return classes;
  }
}
