import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ModalConfig } from '../../../models/interfaces';

@Component({
  selector: 'app-modal',
  template: `
    <!-- Modal Overlay -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      (click)="onOverlayClick($event)">

      <!-- Background Overlay -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
           [class.opacity-100]="isOpen"
           [class.opacity-0]="!isOpen">
      </div>

      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          #modalContent
          class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full"
          [class]="getModalSizeClasses()"
          [class.animate-fade-in]="isOpen"
          (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4" *ngIf="config?.title || showCloseButton">
            <div class="flex items-center justify-between">
              <h3 *ngIf="config?.title" class="text-lg font-semibold leading-6 text-gray-900">
                {{ config?.title }}
              </h3>

              <button
                *ngIf="showCloseButton"
                type="button"
                class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                (click)="close()">
                <span class="sr-only">Fermer</span>
                <lucide-icon name="x" class="h-6 w-6"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6" [class.sm:pt-0]="config?.title || showCloseButton">
            <!-- Content Slot -->
            <ng-content></ng-content>

            <!-- Message Content -->
            <div *ngIf="config?.message" class="mt-3 text-center sm:mt-0 sm:text-left">
              <p class="text-sm text-gray-500">{{ config?.message }}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6"
               *ngIf="config?.confirmText || config?.cancelText || showFooter">

            <!-- Custom Footer Content -->
            <ng-content select="[slot=footer]" *ngIf="showFooter"></ng-content>

            <!-- Default Action Buttons -->
            <div *ngIf="config?.confirmText || config?.cancelText" class="flex flex-col sm:flex-row-reverse gap-3 sm:gap-2">
              <button
                *ngIf="config?.confirmText"
                type="button"
                class="btn-primary w-full sm:w-auto"
                [disabled]="isProcessing"
                (click)="confirm()">
                <div *ngIf="isProcessing" class="spinner mr-2"></div>
                <span>{{ config?.confirmText || 'Confirmer' }}</span>
              </button>

              <button
                *ngIf="config?.showCancel !== false"
                type="button"
                class="btn-outline w-full sm:w-auto"
                [disabled]="isProcessing"
                (click)="cancel()">
                {{ config?.cancelText || 'Annuler' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent implements OnInit, OnDestroy {
  @ViewChild('modalContent') modalContent!: ElementRef;

  @Input() isOpen = false;
  @Input() config?: ModalConfig;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() showCloseButton = true;
  @Input() showFooter = false;
  @Input() closeOnOverlayClick = true;
  @Input() closeOnEscape = true;
  @Input() isProcessing = false;

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @Input() confirmDisabled = false;

  private previousActiveElement: HTMLElement | null = null;

  ngOnInit(): void {
    if (this.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscapeKey.bind(this));
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
    this.restoreFocus();
  }

  open(): void {
    if (!this.isOpen) {
      this.previousActiveElement = document.activeElement as HTMLElement;
      this.isOpen = true;
      this.opened.emit();

      // Focus management
      setTimeout(() => {
        this.focusFirstElement();
      }, 100);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.closed.emit();
      this.restoreFocus();

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  onOverlayClick(event: Event): void {
    if (this.closeOnOverlayClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  private focusFirstElement(): void {
    if (this.modalContent) {
      const focusableElements = this.modalContent.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }

  private restoreFocus(): void {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  getModalSizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'sm:max-w-sm';
      case 'md':
        return 'sm:max-w-md';
      case 'lg':
        return 'sm:max-w-lg';
      case 'xl':
        return 'sm:max-w-2xl';
      case 'full':
        return 'sm:max-w-full sm:m-4';
      default:
        return 'sm:max-w-md';
    }
  }

  // Public methods for programmatic control
  static create(config: ModalConfig): ModalComponent {
    // This would be implemented with a service for dynamic modal creation
    // For now, it's just a placeholder
    const modal = new ModalComponent();
    modal.config = config;
    return modal;
  }
}
