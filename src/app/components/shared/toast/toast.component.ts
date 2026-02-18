import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '../../../services/toast.service';
import { Toast } from '../../../models/interfaces';

@Component({
  selector: 'app-toast',
  template: `
    <!-- Toast Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full" *ngIf="toasts.length > 0">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToast"
        [class]="getToastClasses(toast)"
        class="transform transition-all duration-300 ease-in-out animate-slide-up">

        <div class="flex items-start space-x-3">
          <!-- Icon -->
          <div class="flex-shrink-0 pt-0.5">
            <lucide-icon
              [name]="getToastIcon(toast.type)"
              class="w-5 h-5"
              [class]="getIconClasses(toast.type)">
            </lucide-icon>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold" [class]="getTextClasses(toast.type)">
              {{ toast.title }}
            </h4>
            <p
              *ngIf="toast.message"
              class="text-sm mt-1"
              [class]="getMessageClasses(toast.type)">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            (click)="removeToast(toast.id)"
            class="flex-shrink-0 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            [class]="getCloseButtonClasses(toast.type)">
            <span class="sr-only">Fermer</span>
            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <!-- Progress Bar (for auto-dismiss) -->
        <div
          *ngIf="toast.duration && toast.duration > 0"
          class="mt-2 h-1 bg-black bg-opacity-10 rounded-full overflow-hidden">
          <div
            class="h-full bg-current rounded-full animate-progress"
            [style.animation-duration]="toast.duration + 'ms'">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }

    .animate-progress {
      animation: progress linear forwards;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => {
        this.toasts = toasts;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  getToastClasses(toast: Toast): string {
    const baseClasses = 'rounded-lg shadow-lg border p-4 backdrop-blur-sm';

    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-200`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-200`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200`;
    }
  }

  getToastIcon(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'check';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-circle';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  getIconClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  getTextClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  }

  getMessageClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  }

  getCloseButtonClasses(type: Toast['type']): string {
    const baseClasses = 'hover:bg-black hover:bg-opacity-10';

    switch (type) {
      case 'success':
        return `${baseClasses} text-green-600 focus:ring-green-500`;
      case 'error':
        return `${baseClasses} text-red-600 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} text-yellow-600 focus:ring-yellow-500`;
      case 'info':
        return `${baseClasses} text-blue-600 focus:ring-blue-500`;
      default:
        return `${baseClasses} text-gray-600 focus:ring-gray-500`;
    }
  }

  trackByToast(index: number, toast: Toast): string {
    return toast.id;
  }
}
