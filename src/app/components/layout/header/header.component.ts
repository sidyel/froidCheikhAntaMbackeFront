import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { ApiService } from '../../../services/api.service';
import { UserInfo, Categorie, Cart } from '../../../models/interfaces';

@Component({
  selector: 'app-header',
  template: `
    <header class="bg-white shadow-lg sticky top-0 z-50">
      <!-- Top Bar -->
      <div class="bg-primary-600 text-white py-2">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center text-sm">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <lucide-icon name="phone" class="w-4 h-4"></lucide-icon>
                <span>77 335 20 00 / 76 888 04 42</span>
              </div>
              <div class="hidden md:flex items-center space-x-2">
                <lucide-icon name="map-pin" class="w-4 h-4"></lucide-icon>
                <span>Ouest Foire, Cité Aelmas</span>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <ng-container *ngIf="currentUser$ | async as user; else authLinks">
                <span class="hidden sm:inline">Bonjour {{ user.prenom }}</span>
                <button
                  (click)="logout()"
                  class="hover:text-primary-200 transition-colors flex items-center space-x-1">
                  <lucide-icon name="log-out" class="w-4 h-4"></lucide-icon>
                  <span class="hidden sm:inline">Déconnexion</span>
                </button>
              </ng-container>
              <ng-template #authLinks>
                <a routerLink="/connexion" class="hover:text-primary-200 transition-colors">Connexion</a>
                <span class="text-primary-300">|</span>
                <a routerLink="/inscription" class="hover:text-primary-200 transition-colors">Inscription</a>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center space-x-2">
            <button
              class="lg:hidden mr-2"
              (click)="toggleMobileMenu()"
              aria-label="Menu mobile">
              <lucide-icon [name]="isMobileMenuOpen ? 'x' : 'menu'" class="w-6 h-6 text-gray-700"></lucide-icon>
            </button>

            <a routerLink="/" class="flex items-center space-x-3">
              <!-- Logo Image - Agrandi et repositionné -->
              <div class="flex-shrink-0">
                <img
                  src="assets/images/logo.png"
                  alt="Froid Cheikh Logo"
                  class="h-16 w-auto object-contain"
                >
              </div>
              <!-- Texte du logo (optionnel - peut être masqué sur mobile) -->
              <div class="hidden sm:block">
                <h1 class="text-xl font-bold text-gray-900">Froid Cheikh</h1>
                <p class="text-sm text-gray-600">Anta Mbacké</p>
              </div>
            </a>
          </div>

          <!-- Search Bar -->
          <div class="hidden md:flex flex-1 max-w-2xl mx-8">
            <app-search-bar></app-search-bar>
          </div>

          <!-- Right Actions -->
          <div class="flex items-center space-x-4">
            <!-- Wishlist -->
            <a
              *ngIf="isAuthenticated$ | async"
              routerLink="/wishlist"
              class="p-2 text-gray-700 hover:text-primary-600 transition-colors relative"
              title="Ma liste de souhaits">
              <lucide-icon name="heart" class="w-6 h-6"></lucide-icon>
            </a>

            <!-- Cart -->
            <a
              routerLink="/panier"
              class="p-2 text-gray-700 hover:text-primary-600 transition-colors relative"
              title="Mon panier">
              <lucide-icon name="shopping-cart" class="w-6 h-6"></lucide-icon>
              <span
                *ngIf="(cart$ | async)?.totalItems as itemCount"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ itemCount > 99 ? '99+' : itemCount }}
              </span>
            </a>

            <!-- User Menu -->
            <div class="relative" *ngIf="isAuthenticated$ | async">
              <button
                (click)="toggleUserMenu()"
                class="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                title="Mon compte">
                <lucide-icon name="user" class="w-6 h-6"></lucide-icon>
              </button>

              <!-- User Dropdown -->
              <div
                *ngIf="isUserMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <a routerLink="/profil"
                   (click)="closeUserMenu()"
                   class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Mon Profil
                </a>
                <a routerLink="/mes-commandes"
                   (click)="closeUserMenu()"
                   class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Mes Commandes
                </a>
                <a routerLink="/wishlist"
                   (click)="closeUserMenu()"
                   class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Ma Wishlist
                </a>
                <!-- Lien admin - NOUVEAU -->
                <hr class="my-1" *ngIf="isAdmin()">
                <a *ngIf="isAdmin()"
                   routerLink="/admin"
                   (click)="closeUserMenu()"
                   class="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-medium">
                  <lucide-icon name="settings" class="inline mr-2 h-4 w-4"></lucide-icon>
                  Administration
                </a>
                <hr class="my-1">
                <button
                  (click)="logout()"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Search -->
        <div class="md:hidden mt-4">
          <app-search-bar></app-search-bar>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="bg-gray-50 border-t border-gray-200">
        <div class="container mx-auto px-4">
          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center justify-between py-3">
            <div class="flex items-center space-x-8">
              <a routerLink="/"
                 routerLinkActive="text-primary-600"
                 [routerLinkActiveOptions]="{exact: true}"
                 class="nav-link">
                Accueil
              </a>
              <div class="relative group">
                <button class="nav-link flex items-center space-x-1">
                  <span>Nos Produits</span>
                  <lucide-icon name="chevron-down" class="w-4 h-4"></lucide-icon>
                </button>
                <!-- Products Dropdown - Multi-column Grid -->
                <div class="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-max">
                  <div class="p-4">
                    <a routerLink="/produits"
                       class="block px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-gray-100 rounded mb-2">
                      Tous les produits
                    </a>
                    <hr class="my-2">
                    <!-- Grid de catégories sur 2-3 colonnes -->
                    <div class="grid grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-1">
                      <ng-container *ngFor="let categorie of categories">
                        <a [routerLink]="['/produits/categorie', categorie.idCategorie]"
                           class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded whitespace-nowrap">
                          {{ categorie.nomCategorie }}
                        </a>
                      </ng-container>
                    </div>
                  </div>
                </div>
              </div>
              <a routerLink="/a-propos"
                 routerLinkActive="text-primary-600"
                 class="nav-link">
                À Propos
              </a>
              <a routerLink="/contact"
                 routerLinkActive="text-primary-600"
                 class="nav-link">
                Contact
              </a>
            </div>
          </div>

          <!-- Mobile Navigation -->
          <div
            *ngIf="isMobileMenuOpen"
            class="lg:hidden py-4 border-t border-gray-200">
            <div class="space-y-2">
              <a routerLink="/"
                 (click)="closeMobileMenu()"
                 routerLinkActive="text-primary-600"
                 [routerLinkActiveOptions]="{exact: true}"
                 class="block py-2 text-gray-700 hover:text-primary-600">
                Accueil
              </a>
              <a routerLink="/produits"
                 (click)="closeMobileMenu()"
                 routerLinkActive="text-primary-600"
                 class="block py-2 text-gray-700 hover:text-primary-600">
                Nos Produits
              </a>
              <div class="ml-4 space-y-1" *ngIf="categories.length > 0">
                <ng-container *ngFor="let categorie of categories">
                  <a [routerLink]="['/produits/categorie', categorie.idCategorie]"
                     (click)="closeMobileMenu()"
                     class="block py-1 text-sm text-gray-600 hover:text-primary-600">
                    {{ categorie.nomCategorie }}
                  </a>
                </ng-container>
              </div>
              <a routerLink="/a-propos"
                 (click)="closeMobileMenu()"
                 routerLinkActive="text-primary-600"
                 class="block py-2 text-gray-700 hover:text-primary-600">
                À Propos
              </a>
              <a routerLink="/contact"
                 (click)="closeMobileMenu()"
                 routerLinkActive="text-primary-600"
                 class="block py-2 text-gray-700 hover:text-primary-600">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser$: Observable<UserInfo | null>;
  isAuthenticated$: Observable<boolean>;
  cart$: Observable<Cart>;

  categories: Categorie[] = [];
  isMobileMenuOpen = false;
  isUserMenuOpen = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.cart$ = this.cartService.cart$;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupClickOutside();
  }

  // Dans header.component.ts - Ajoutez cette méthode
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories; // Afficher toutes les catégories
        },
        error: (error) => {
          console.error('Erreur lors du chargement des catégories:', error);
        }
      });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
  }

  private setupClickOutside(): void {
    // Fermer les menus quand on clique ailleurs
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.isUserMenuOpen = false;
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth >= 1024) {
      this.isMobileMenuOpen = false;
    }
  }
}
