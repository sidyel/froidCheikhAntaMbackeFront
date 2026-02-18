import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ImageUrlService } from '../../../services/image-url.service';
import { Produit, Categorie, Marque, PagedResponse, ProductFilters, SearchParams } from '../../../models/interfaces';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-list',
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <!-- Barre de catégories scrollable -->
      <!-- Barre de catégories scrollable -->
      <section class="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm categories-section">
        <div class="container mx-auto px-2 sm:px-4">
          <div class="flex items-center space-x-2 sm:space-x-4 py-2 sm:py-3">
            <!-- Bouton "Toutes" -->
            <button
              (click)="selectCategory(null)"
              [class.active]="!currentCategoryId"
              class="category-circle-btn flex-shrink-0">
              <div class="category-circle">
                <lucide-icon name="grid" class="category-icon text-primary-600"></lucide-icon>
              </div>
              <span class="category-name">Toutes</span>
            </button>

            <!-- Scroll container -->
            <div class="flex-1 relative overflow-hidden">
              <!-- Gradient fade gauche (mobile uniquement) -->
              <div class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden z-10"></div>

              <!-- Bouton scroll gauche (desktop uniquement) -->
              <button
                *ngIf="showScrollButtons"
                (click)="scrollCategories('left')"
                class="scroll-btn scroll-btn-left hidden sm:flex">
                <lucide-icon name="chevron-left" class="w-5 h-5"></lucide-icon>
              </button>

              <!-- Liste des catégories -->
              <div
                #categoriesScroll
                class="categories-scroll-container"
                (scroll)="onCategoriesScroll()">
                <button
                  *ngFor="let categorie of categories; trackBy: trackByCategory"
                  (click)="selectCategory(categorie.idCategorie)"
                  [class.active]="currentCategoryId === categorie.idCategorie"
                  class="category-circle-btn">
                  <div class="category-circle">
                    <img
                      *ngIf="!isImageError(categorie.idCategorie)"
                      [src]="getCategoryImageUrl(categorie)"
                      [alt]="categorie.nomCategorie"
                      class="w-full h-full object-cover"
                      (error)="onImageError(categorie.idCategorie)"
                      loading="lazy">
                    <lucide-icon
                      *ngIf="isImageError(categorie.idCategorie)"
                      name="package"
                      class="category-icon text-gray-400">
                    </lucide-icon>
                  </div>
                  <span class="category-name">{{ categorie.nomCategorie }}</span>
                </button>
              </div>

              <!-- Gradient fade droite (mobile uniquement) -->
              <div class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden z-10"></div>

              <!-- Bouton scroll droite (desktop uniquement) -->
              <button
                *ngIf="showScrollButtons"
                (click)="scrollCategories('right')"
                class="scroll-btn scroll-btn-right hidden sm:flex">
                <lucide-icon name="chevron-right" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="container mx-auto px-4 py-8">

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {{ getPageTitle() }}
          </h1>
          <p class="text-xl text-gray-600" *ngIf="getPageDescription()">
            {{ getPageDescription() }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

          <!-- Sidebar Filters -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-lg p-6 sticky top-24">

              <!-- Mobile Filter Toggle -->
              <div class="lg:hidden mb-4">
                <button
                  (click)="toggleMobileFilters()"
                  class="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span class="flex items-center space-x-2">
                    <lucide-icon name="filter" class="w-5 h-5"></lucide-icon>
                    <span class="font-medium">Filtres</span>
                  </span>
                  <lucide-icon
                    [name]="showMobileFilters ? 'chevron-up' : 'chevron-down'"
                    class="w-5 h-5">
                  </lucide-icon>
                </button>
              </div>

              <!-- Filters Form -->
              <form [formGroup]="filtersForm"
                    [class.hidden]="!showMobileFilters"
                    [class.lg:block]="true"
                    class="space-y-6">

                <!-- Price Range -->
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Prix</h3>
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="form-label">Min (FCFA)</label>
                        <input
                          type="number"
                          formControlName="prixMin"
                          placeholder="0"
                          class="form-input">
                      </div>
                      <div>
                        <label class="form-label">Max (FCFA)</label>
                        <input
                          type="number"
                          formControlName="prixMax"
                          placeholder="999999"
                          class="form-input">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Brands -->
                <div *ngIf="brands.length > 0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Marques</h3>
                  <div class="space-y-2 max-h-48 overflow-y-auto">
                    <label *ngFor="let marque of brands"
                           class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        [value]="marque.idMarque"
                        formControlName="marqueId"
                        class="form-radio text-primary-600">
                      <span class="text-sm text-gray-700">{{ marque.nomMarque }}</span>
                    </label>
                  </div>
                </div>

                <!-- Availability -->
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Disponibilité</h3>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      formControlName="disponibilite"
                      class="form-checkbox text-primary-600">
                    <span class="text-sm text-gray-700">Produits disponibles uniquement</span>
                  </label>
                </div>

                <!-- Filter Actions -->
                <div class="border-t pt-4 space-y-3">
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="w-full btn-outline text-sm py-2">
                    Effacer les filtres
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Main Content -->
          <div class="lg:col-span-3">

            <!-- Toolbar -->
            <div class="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

                <!-- Results Info -->
                <div class="text-sm text-gray-600">
                  <span *ngIf="productsResponse">
                    {{ productsResponse.totalElements }} produit{{ productsResponse.totalElements > 1 ? 's' : '' }} trouvé{{ productsResponse.totalElements > 1 ? 's' : '' }}
                  </span>
                  <span *ngIf="searchQuery" class="font-medium">
                    pour "{{ searchQuery }}"
                  </span>
                </div>

                <!-- Sort and View Options -->
                <div class="flex items-center space-x-4">
                  <!-- Sort -->
                  <div class="flex items-center space-x-2">
                    <label class="text-sm text-gray-700">Trier par:</label>
                    <select
                      [(ngModel)]="sortOption"
                      (ngModelChange)="onSortChange()"
                      class="form-input text-sm py-2">
                      <option value="dateAjout-desc">Plus récents</option>
                      <option value="prix-asc">Prix croissant</option>
                      <option value="prix-desc">Prix décroissant</option>
                      <option value="nomProduit-asc">Nom A-Z</option>
                      <option value="nomProduit-desc">Nom Z-A</option>
                    </select>
                  </div>

                  <!-- View Mode -->
                  <div class="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      (click)="setViewMode('grid')"
                      [class]="viewMode === 'grid' ? 'bg-white shadow-sm' : ''"
                      class="p-2 rounded transition-all">
                      <lucide-icon name="grid" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button
                      (click)="setViewMode('list')"
                      [class]="viewMode === 'list' ? 'bg-white shadow-sm' : ''"
                      class="p-2 rounded transition-all">
                      <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Grid/List -->
            <div *ngIf="!isLoading && products.length > 0">

              <!-- Grid View -->
              <div *ngIf="viewMode === 'grid'" class="products-grid-3-columns">
                <app-product-card
                  *ngFor="let produit of products; trackBy: trackByProduct"
                  [produit]="produit"
                  (quickView)="onQuickView($event)"
                  (wishlistToggle)="onWishlistToggle($event)"
                  class="product-card-uniform">
                </app-product-card>
              </div>

              <!-- List View -->
              <div *ngIf="viewMode === 'list'" class="space-y-6">
                <div
                  *ngFor="let produit of products; trackBy: trackByProduct"
                  class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div class="flex flex-col lg:flex-row">
                    <!-- Product Image -->
                    <div class="lg:w-1/3 flex-shrink-0">
                      <img
                        [src]="getProductImageUrl(produit)"
                        [alt]="produit.nomProduit"
                        class="w-full h-64 lg:h-80 object-cover cursor-pointer"
                        (click)="navigateToProduct(produit)"
                        onerror="this.src='assets/images/placeholder-product.jpg'">
                    </div>

                    <!-- Product Info -->
                    <div class="flex-1 p-6 lg:p-8">
                      <div class="flex flex-col lg:flex-row justify-between items-start h-full">
                        <div class="flex-1 lg:pr-6">
                          <div class="flex items-center space-x-2 mb-3">
                            <span *ngIf="produit.marque" class="text-sm font-medium text-gray-500">
                              {{ produit.marque.nomMarque }}
                            </span>
                          </div>

                          <h3
                            class="text-xl lg:text-2xl font-semibold text-gray-900 mb-3 cursor-pointer hover:text-primary-600 transition-colors"
                            (click)="navigateToProduct(produit)">
                            {{ produit.nomProduit }}
                          </h3>

                          <p *ngIf="produit.descriptionProduit"
                             class="text-gray-600 line-clamp-3 mb-4 text-base">
                            {{ produit.descriptionProduit }}
                          </p>
                        </div>

                        <!-- Price and Actions -->
                        <div class="text-right lg:w-64 flex-shrink-0">
                          <div class="text-2xl lg:text-3xl font-bold text-primary-600 mb-6">
                            {{ produit.prix | currency:'XOF':'symbol':'1.0-0' }}
                          </div>

                          <div class="space-y-3">
                            <button
                              (click)="addToCart(produit)"
                              [disabled]="!produit.disponibilite"
                              class="w-full btn-primary disabled:opacity-50 py-3">
                              <lucide-icon name="shopping-cart" class="w-5 h-5"></lucide-icon>
                              <span>Ajouter au panier</span>
                            </button>

                            <button
                              (click)="navigateToProduct(produit)"
                              class="w-full btn-outline py-3">
                              <lucide-icon name="eye" class="w-5 h-5"></lucide-icon>
                              <span>Voir détails</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="isLoading" class="products-grid-3-columns">
              <div *ngFor="let i of [1,2,3,4,5,6,7,8,9]" class="animate-pulse">
                <div class="bg-white rounded-xl shadow-lg h-full">
                  <div class="bg-gray-200 h-80 rounded-t-xl"></div>
                  <div class="p-6 space-y-3">
                    <div class="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div class="bg-gray-200 h-6 rounded w-1/2"></div>
                    <div class="bg-gray-200 h-10 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Results -->
            <div *ngIf="!isLoading && products.length === 0"
                 class="text-center py-16">
              <div class="max-w-md mx-auto">
                <lucide-icon name="package" class="w-24 h-24 text-gray-300 mx-auto mb-4"></lucide-icon>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p class="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche ou explorez nos catégories.
                </p>
                <button
                  (click)="clearFilters()"
                  class="btn-primary">
                  Effacer les filtres
                </button>
              </div>
            </div>

            <!-- Pagination -->
            <app-pagination
              *ngIf="productsResponse && productsResponse.totalElements > 0"
              [currentPage]="currentPage"
              [totalPages]="productsResponse.totalPages"
              [totalElements]="productsResponse.totalElements"
              [pageSize]="pageSize"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)">
            </app-pagination>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Barre de catégories scrollable */
    /* Section complète responsive */
    section.categories-section {
      overflow-x: hidden;
    }

    /* Barre de catégories scrollable */
    .categories-scroll-container {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 0.75rem 0.5rem;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .categories-scroll-container::-webkit-scrollbar {
      display: none;
    }

    /* Bouton de catégorie circulaire */
    .category-circle-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
      min-width: 64px;
    }

    .category-circle-btn:hover .category-circle {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .category-circle-btn.active .category-circle {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    .category-circle-btn.active .category-name {
      color: #2563eb;
      font-weight: 600;
    }

    /* Cercle de catégorie */
    .category-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 3px solid #e5e7eb;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      transition: all 0.3s ease;
    }

    /* Nom de catégorie */
    .category-name {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      text-align: center;
      max-width: 80px;
      line-height: 1.2;
      transition: all 0.3s ease;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    /* Boutons de scroll */
    .scroll-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .scroll-btn:hover {
      background: #f9fafb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .scroll-btn-left {
      left: -18px;
    }

    .scroll-btn-right {
      right: -18px;
    }

    /* ========================================
       GRILLE PRODUITS RESPONSIVE
       Identique à la page d'accueil
       ======================================== */

    .products-grid-3-columns {
      display: grid;
      gap: 1.5rem;
      align-items: stretch;
      /* Desktop: 3 colonnes */
      grid-template-columns: repeat(3, 1fr);
    }

    .product-card-uniform {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 420px;
    }

    /* Assure que les cartes de produits occupent toute la hauteur disponible */
    .product-card-uniform ::ng-deep app-product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .product-card-uniform ::ng-deep app-product-card .card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .product-card-uniform ::ng-deep app-product-card .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Tablettes moyennes: 2 colonnes */
    @media (max-width: 900px) {
      .products-grid-3-columns {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      .product-card-uniform {
        min-height: 400px;
      }
    }

    /* Tablettes petites: 2 colonnes compactes */
    @media (max-width: 640px) {
      .products-grid-3-columns {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .product-card-uniform {
        min-height: 360px;
      }
    }

    /* ⭐ MOBILE: 1 COLONNE (comme les catégories) ⭐ */
    @media (max-width: 480px) {
      .products-grid-3-columns {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .product-card-uniform {
        min-height: 420px;
      }
    }

    /* Très petits écrans: optimisation maximale */
    @media (max-width: 360px) {
      .products-grid-3-columns {
        gap: 0.75rem;
      }

      .product-card-uniform {
        min-height: 400px;
      }
    }

    /* Responsive - Tablettes */
    @media (max-width: 1024px) {
      .scroll-btn {
        width: 32px;
        height: 32px;
      }

      .scroll-btn-left {
        left: -16px;
      }

      .scroll-btn-right {
        right: -16px;
      }
    }

    /* Responsive - Mobile moyen */
    @media (max-width: 768px) {
      .category-circle {
        width: 56px;
        height: 56px;
        border-width: 2px;
      }

      .category-name {
        font-size: 0.7rem;
        max-width: 70px;
      }

      .category-circle-btn {
        min-width: 56px;
        gap: 0.25rem;
      }

      .categories-scroll-container {
        gap: 0.5rem;
        padding: 0.5rem 0.25rem;
      }

      .scroll-btn {
        display: none;
      }
    }

    /* Responsive - Petits mobiles */
    @media (max-width: 480px) {
      .category-circle {
        width: 48px;
        height: 48px;
        border-width: 2px;
      }

      .category-name {
        font-size: 0.65rem;
        max-width: 56px;
        line-height: 1.1;
      }

      .category-circle-btn {
        min-width: 48px;
        gap: 0.25rem;
      }

      .categories-scroll-container {
        gap: 0.5rem;
        padding: 0.5rem 0.25rem;
      }

      /* Réduire la taille de l'icône dans le cercle */
      .category-circle lucide-icon {
        width: 1.25rem !important;
        height: 1.25rem !important;
      }
    }

    /* Très petits écrans */
    @media (max-width: 360px) {
      .category-circle {
        width: 44px;
        height: 44px;
      }

      .category-name {
        font-size: 0.625rem;
        max-width: 50px;
      }

      .category-circle-btn {
        min-width: 44px;
      }

      .categories-scroll-container {
        gap: 0.375rem;
      }

      .category-circle lucide-icon {
        width: 1.125rem !important;
        height: 1.125rem !important;
      }
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  products: Produit[] = [];
  productsResponse: PagedResponse<Produit> | null = null;
  categories: Categorie[] = [];
  brands: Marque[] = [];
  breadcrumbs: any[] = [];

  // Form and filters
  filtersForm: FormGroup;

  // Search and pagination
  searchQuery = '';
  currentPage = 0;
  pageSize = environment.pagination.defaultPageSize;
  sortOption = 'dateAjout-desc';

  // UI state
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';
  showMobileFilters = false;
  showScrollButtons = false;

  // Route parameters
  currentCategoryId: number | null = null;
  currentMarqueId: number | null = null;

  // Image errors
  private imageErrors = new Set<string>();

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.createFiltersForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
    this.setupRouteSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFiltersForm(): FormGroup {
    return this.fb.group({
      prixMin: [null],
      prixMax: [null],
      categorieId: [null],
      marqueId: [null],
      disponibilite: [true]
    });
  }

  private initializeComponent(): void {
    this.loadStaticData();
  }

  private loadStaticData(): void {
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
        this.checkScrollButtons();
      });

    this.apiService.getMarquesWithProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(brands => {
        this.brands = brands;
      });
  }

  private setupFormSubscriptions(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadProducts();
      });
  }

  private setupRouteSubscriptions(): void {
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        this.handleRouteChanges(params, queryParams);
      });
  }

  private handleRouteChanges(params: any, queryParams: any): void {
    this.filtersForm.patchValue({
      categorieId: null,
      marqueId: null
    }, { emitEvent: false });

    if (params['id'] && this.router.url.includes('/categorie/')) {
      this.currentCategoryId = +params['id'];
      this.filtersForm.patchValue({
        categorieId: this.currentCategoryId
      }, { emitEvent: false });
    }

    if (params['id'] && this.router.url.includes('/marque/')) {
      this.currentMarqueId = +params['id'];
      this.filtersForm.patchValue({
        marqueId: this.currentMarqueId
      }, { emitEvent: false });
    }

    if (queryParams['q']) {
      this.searchQuery = queryParams['q'];
    }

    if (queryParams['page']) {
      this.currentPage = +queryParams['page'];
    }

    this.updateBreadcrumbs();
    this.loadProducts();
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = [
      { label: 'Accueil', route: '/' },
      { label: 'Produits', route: '/produits' }
    ];

    if (this.currentCategoryId) {
      const categorie = this.categories.find(c => c.idCategorie === this.currentCategoryId);
      if (categorie) {
        this.breadcrumbs.push({
          label: categorie.nomCategorie,
          route: null
        });
      }
    }
  }

  private loadProducts(): void {
    this.isLoading = true;

    const [sortBy, sortDir] = this.sortOption.split('-');
    const filters = this.getActiveFilters();

    const searchParams: SearchParams = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy,
      sortDir: sortDir as 'asc' | 'desc',
      q: this.searchQuery || undefined,
      filters
    };

    let apiCall;

    if (this.currentCategoryId) {
      apiCall = this.apiService.getProduitsByCategorie(this.currentCategoryId, searchParams);
    } else if (this.currentMarqueId) {
      apiCall = this.apiService.getProduitsByMarque(this.currentMarqueId, searchParams);
    } else {
      apiCall = this.apiService.getProduits(searchParams);
    }

    apiCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productsResponse = response;
          this.products = response.content;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading = false;
        }
      });
  }

  private getActiveFilters(): ProductFilters {
    const formValue = this.filtersForm.value;
    const filters: ProductFilters = {};

    if (formValue.prixMin) filters.prixMin = formValue.prixMin;
    if (formValue.prixMax) filters.prixMax = formValue.prixMax;
    if (formValue.categorieId) filters.categorieId = formValue.categorieId;
    if (formValue.marqueId) filters.marqueId = formValue.marqueId;
    if (formValue.disponibilite) filters.disponibilite = formValue.disponibilite;

    return filters;
  }

  // Gestion des catégories
  selectCategory(categoryId: number | null): void {
    this.currentCategoryId = categoryId;
    this.filtersForm.patchValue({
      categorieId: categoryId
    });

    if (categoryId) {
      this.router.navigate(['/produits/categorie', categoryId]);
    } else {
      this.router.navigate(['/produits']);
    }
  }

  scrollCategories(direction: 'left' | 'right'): void {
    const container = document.querySelector('.categories-scroll-container') as HTMLElement;
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  }

  onCategoriesScroll(): void {
    this.checkScrollButtons();
  }

  private checkScrollButtons(): void {
    setTimeout(() => {
      const container = document.querySelector('.categories-scroll-container') as HTMLElement;
      if (container) {
        this.showScrollButtons = container.scrollWidth > container.clientWidth;
      }
    }, 100);
  }

  getCategoryImageUrl(categorie: Categorie): string {
    return this.imageUrlService.getCategoryImageUrl(categorie.imageCategorie);
  }

  onImageError(key: string | number): void {
    this.imageErrors.add(key.toString());
  }

  isImageError(key: string | number): boolean {
    return this.imageErrors.has(key.toString());
  }

  // Event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
    this.scrollToTop();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadProducts();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  clearFilters(): void {
    this.filtersForm.reset({
      disponibilite: true
    });
    this.searchQuery = '';
    this.currentPage = 0;
    this.currentCategoryId = null;
    this.router.navigate(['/produits']);
  }

  navigateToProduct(produit: Produit): void {
    this.router.navigate(['/produit', produit.idProduit]);
  }

  onQuickView(produit: Produit): void {
    this.navigateToProduct(produit);
  }

  onWishlistToggle(event: any): void {
    // Géré par le composant product-card
  }

  addToCart(produit: Produit): void {
    // Géré par le composant product-card
  }

  getPageTitle(): string {
    if (this.currentCategoryId) {
      const categorie = this.categories.find(c => c.idCategorie === this.currentCategoryId);
      return categorie ? categorie.nomCategorie : 'Nos Produits';
    }

    if (this.searchQuery) {
      return `Résultats de recherche`;
    }

    return 'Nos Produits';
  }

  getPageDescription(): string {
    if (this.currentCategoryId) {
      const categorie = this.categories.find(c => c.idCategorie === this.currentCategoryId);
      return categorie?.descriptionCategorie || '';
    }

    if (this.searchQuery) {
      return `Résultats pour "${this.searchQuery}"`;
    }

    return 'Découvrez notre gamme complète de produits';
  }

  getProductImageUrl(produit: Produit): string {
    if (produit.listeImages && produit.listeImages.length > 0) {
      return `http://localhost:8080/uploads/${produit.listeImages[0]}`;
    }
    return 'assets/images/placeholder-product.jpg';
  }

  trackByProduct(index: number, produit: Produit): number {
    return produit.idProduit;
  }

  trackByCategory(index: number, categorie: Categorie): number {
    return categorie.idCategorie;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
