import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pagination',
  template: `
    <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-lg mt-8">

      <!-- Mobile View -->
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          (click)="goToPreviousPage()"
          [disabled]="currentPage === 0"
          [class.opacity-50]="currentPage === 0"
          [class.cursor-not-allowed]="currentPage === 0"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:hover:bg-white transition-colors">
          <lucide-icon name="chevron-left" class="w-4 h-4 mr-1"></lucide-icon>
          Précédent
        </button>

        <span class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
          Page {{ currentPage + 1 }} sur {{ totalPages }}
        </span>

        <button
          (click)="goToNextPage()"
          [disabled]="currentPage >= totalPages - 1"
          [class.opacity-50]="currentPage >= totalPages - 1"
          [class.cursor-not-allowed]="currentPage >= totalPages - 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:hover:bg-white transition-colors">
          Suivant
          <lucide-icon name="chevron-right" class="w-4 h-4 ml-1"></lucide-icon>
        </button>
      </div>

      <!-- Desktop View -->
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">

        <!-- Results Info -->
        <div class="flex items-center space-x-4">
          <p class="text-sm text-gray-700">
            Affichage de
            <span class="font-medium">{{ getStartIndex() }}</span>
            à
            <span class="font-medium">{{ getEndIndex() }}</span>
            sur
            <span class="font-medium">{{ totalElements }}</span>
            résultat{{ totalElements > 1 ? 's' : '' }}
          </p>

          <!-- Page Size Selector -->
          <div class="flex items-center space-x-2">
            <label for="pageSize" class="text-sm text-gray-700">Afficher:</label>
            <select
              id="pageSize"
              [value]="pageSize"
              (change)="onPageSizeChange($event)"
              class="form-input text-sm py-1 px-2 w-20">
              <option *ngFor="let size of pageSizeOptions" [value]="size">
                {{ size }}
              </option>
            </select>
            <span class="text-sm text-gray-700">par page</span>
          </div>
        </div>

        <!-- Pagination Navigation -->
        <div class="flex items-center space-x-1">

          <!-- Previous Button -->
          <button
            (click)="goToPreviousPage()"
            [disabled]="currentPage === 0"
            [class.opacity-50]="currentPage === 0"
            [class.cursor-not-allowed]="currentPage === 0"
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:hover:bg-white transition-colors">
            <span class="sr-only">Précédent</span>
            <lucide-icon name="chevron-left" class="w-5 h-5"></lucide-icon>
          </button>

          <!-- Page Numbers -->
          <ng-container *ngFor="let page of getVisiblePages()">

            <!-- Current Page -->
            <button
              *ngIf="page === currentPage"
              class="relative inline-flex items-center px-4 py-2 border border-primary-500 bg-primary-50 text-sm font-medium text-primary-600 cursor-default">
              {{ page + 1 }}
            </button>

            <!-- Other Pages -->
            <button
              *ngIf="page !== currentPage && page >= 0"
              (click)="goToPage(page)"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {{ page + 1 }}
            </button>

            <!-- Ellipsis -->
            <span
              *ngIf="page === -1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              ...
            </span>
          </ng-container>

          <!-- Next Button -->
          <button
            (click)="goToNextPage()"
            [disabled]="currentPage >= totalPages - 1"
            [class.opacity-50]="currentPage >= totalPages - 1"
            [class.cursor-not-allowed]="currentPage >= totalPages - 1"
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:hover:bg-white transition-colors">
            <span class="sr-only">Suivant</span>
            <lucide-icon name="chevron-right" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Input() pageSize = environment.pagination.defaultPageSize;
  @Input() maxVisiblePages = 7;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageSizeOptions = environment.pagination.pageSizeOptions;

  ngOnChanges(changes: SimpleChanges): void {
    // Validation des props
    if (changes['currentPage'] && this.currentPage < 0) {
      this.currentPage = 0;
    }

    if (changes['totalPages'] && this.totalPages < 0) {
      this.totalPages = 0;
    }

    if (changes['currentPage'] && this.currentPage >= this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages - 1;
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    if (newSize !== this.pageSize) {
      this.pageSizeChange.emit(newSize);
    }
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = (this.currentPage + 1) * this.pageSize;
    return Math.min(end, this.totalElements);
  }

  getVisiblePages(): number[] {
    if (this.totalPages <= this.maxVisiblePages) {
      // Afficher toutes les pages
      return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    const pages: number[] = [];
    const halfMax = Math.floor(this.maxVisiblePages / 2);

    // Toujours afficher la première page
    pages.push(0);

    let start = Math.max(1, this.currentPage - halfMax);
    let end = Math.min(this.totalPages - 2, this.currentPage + halfMax);

    // Ajuster si on est près du début
    if (this.currentPage < halfMax) {
      end = Math.min(this.totalPages - 2, this.maxVisiblePages - 2);
    }

    // Ajuster si on est près de la fin
    if (this.currentPage > this.totalPages - halfMax - 1) {
      start = Math.max(1, this.totalPages - this.maxVisiblePages + 1);
    }

    // Ajouter ellipsis avant si nécessaire
    if (start > 1) {
      pages.push(-1); // Ellipsis
    }

    // Ajouter les pages du milieu
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Ajouter ellipsis après si nécessaire
    if (end < this.totalPages - 2) {
      pages.push(-1); // Ellipsis
    }

    // Toujours afficher la dernière page (si plus d'une page)
    if (this.totalPages > 1) {
      pages.push(this.totalPages - 1);
    }

    return pages;
  }

  // Méthodes utiles pour le parent
  hasPages(): boolean {
    return this.totalPages > 1;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  isFirstPage(): boolean {
    return this.currentPage === 0;
  }

  isLastPage(): boolean {
    return this.currentPage === this.totalPages - 1;
  }

  getCurrentPageInfo(): string {
    return `Page ${this.currentPage + 1} sur ${this.totalPages}`;
  }
}
