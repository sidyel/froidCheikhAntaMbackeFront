import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, filter } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { Produit } from '../../../models/interfaces';

@Component({
  selector: 'app-search-bar',
  template: `
    <div class="relative w-full max-w-2xl">
      <!-- Search Input -->
      <div class="relative">
        <input
          #searchInput
          type="text"
          [formControl]="searchControl"
          placeholder="Rechercher des produits..."
          class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown.escape)="clearSearch()"
          (keydown.enter)="onEnterPress()"
        >

        <!-- Search Icon -->
        <div class="absolute left-4 top-1/2 transform -translate-y-1/2">
          <lucide-icon name="search" class="w-5 h-5 text-gray-400"></lucide-icon>
        </div>

        <!-- Clear Button -->
        <button
          *ngIf="searchControl.value"
          (click)="clearSearch()"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
        </button>
      </div>

      <!-- Search Suggestions Dropdown -->
      <div
        *ngIf="showSuggestions && (searchSuggestions.length > 0 || isLoading)"
        class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
      >
        <!-- Loading State -->
        <div *ngIf="isLoading" class="p-4 text-center">
          <div class="inline-flex items-center space-x-2">
            <div class="spinner"></div>
            <span class="text-gray-600">Recherche en cours...</span>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="!isLoading && searchSuggestions.length === 0 && searchControl.value" class="p-4 text-center text-gray-500">
          Aucun produit trouvé pour "{{ searchControl.value }}"
        </div>

        <!-- Suggestions -->
        <div *ngIf="!isLoading && searchSuggestions.length > 0" class="py-2">
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Produits suggérés
          </div>

          <ng-container *ngFor="let produit of searchSuggestions; let i = index">
            <button
              (click)="selectProduct(produit)"
              class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
              [class.bg-gray-50]="selectedIndex === i"
            >
              <div class="flex items-center space-x-3">
                <!-- Product Image -->
                <div class="flex-shrink-0">
                  <img
                    [src]="getProductImageUrl(produit)"
                    [alt]="produit.nomProduit"
                    class="w-12 h-12 object-cover rounded-lg"
                    onerror="this.src='assets/images/placeholder-product.jpg'"
                  >
                </div>

                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ produit.nomProduit }}
                  </p>
                  <p class="text-sm text-gray-500 truncate" *ngIf="produit.marque">
                    {{ produit.marque.nomMarque }}
                  </p>
                  <p class="text-sm font-semibold text-primary-600">
                    {{ produit.prix | currency:'XOF':'symbol':'1.0-0' }}
                  </p>
                </div>

                <!-- Stock Status -->
                <div class="flex-shrink-0">
                  <span
                    *ngIf="produit.stockDisponible > 0"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    En stock
                  </span>
                  <span
                    *ngIf="produit.stockDisponible === 0"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    Rupture
                  </span>
                </div>
              </div>
            </button>
          </ng-container>

          <!-- View All Results -->
          <div class="border-t border-gray-100 p-2" *ngIf="searchSuggestions.length > 0">
            <button
              (click)="viewAllResults()"
              class="w-full px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors text-center font-medium"
            >
              Voir tous les résultats pour "{{ searchControl.value }}"
            </button>
          </div>
        </div>
      </div>

      <!-- Search Overlay (for mobile) -->
      <div
        *ngIf="showSuggestions"
        class="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
        (click)="hideSuggestions()"
      ></div>
    </div>
  `
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');
  searchSuggestions: Produit[] = [];
  showSuggestions = false;
  isLoading = false;
  selectedIndex = -1;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.setupKeyboardNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        // Type guard : indique à TypeScript que `term` est une string ici
        filter((term): term is string => typeof term === 'string' && term.length >= 2),
        switchMap((term: string) => {
          this.isLoading = true;
          return this.apiService.getProduits({
            q: term,
            size: 8 // Limiter le nombre de suggestions
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.searchSuggestions = response.content;
          this.isLoading = false;
          this.showSuggestions = true;
          this.selectedIndex = -1;
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          this.isLoading = false;
          this.searchSuggestions = [];
        }
      });

    // Masquer les suggestions quand le champ est vide
    this.searchControl.valueChanges
      .pipe(
        filter((term) => !term || (typeof term === 'string' && term.length < 2)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.hideSuggestions();
      });
  }


  private setupKeyboardNavigation(): void {
    // Navigation au clavier dans les suggestions
    document.addEventListener('keydown', (event) => {
      if (!this.showSuggestions || this.searchSuggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchSuggestions.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.selectedIndex >= 0) {
            this.selectProduct(this.searchSuggestions[this.selectedIndex]);
          } else {
            this.onEnterPress();
          }
          break;
        case 'Escape':
          this.hideSuggestions();
          break;
      }
    });
  }

  onFocus(): void {
    if (this.searchControl.value && this.searchControl.value.length >= 2) {
      this.showSuggestions = true;
    }
  }

  onBlur(): void {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      this.hideSuggestions();
    }, 150);
  }

  onEnterPress(): void {
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm) {
      this.performSearch(searchTerm);
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.hideSuggestions();
    this.searchInput.nativeElement.focus();
  }

  selectProduct(produit: Produit): void {
    this.hideSuggestions();
    this.router.navigate(['/produit', produit.idProduit]);
  }

  viewAllResults(): void {
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm) {
      this.performSearch(searchTerm);
    }
  }

  private performSearch(term: string): void {
    this.hideSuggestions();
    this.router.navigate(['/produits/recherche'], {
      queryParams: { q: term }
    });
  }

  public hideSuggestions(): void {
    this.showSuggestions = false;
    this.selectedIndex = -1;
  }

  getProductImageUrl(produit: Produit): string {
    if (produit.listeImages && produit.listeImages.length > 0) {
      return `http://localhost:8080/uploads/${produit.listeImages[0]}`;
    }
    return 'assets/images/placeholder-product.jpg';
  }

  // Méthodes utiles pour l'interaction
  focusSearch(): void {
    this.searchInput.nativeElement.focus();
  }

  hasSearchTerm(): boolean {
    return !!(this.searchControl.value && this.searchControl.value.trim());
  }

  getCurrentSearchTerm(): string {
    return this.searchControl.value?.trim() || '';
  }
}
