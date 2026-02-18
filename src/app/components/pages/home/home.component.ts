import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { ImageUrlService } from '../../../services/image-url.service'; // Nouveau service
import { Produit, Categorie, Marque } from '../../../models/interfaces';

@Component({
  selector: 'app-home',
  template: `
    <div class="min-h-screen">
      <!-- Hero Section avec carrousel de fond -->
      <section class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        <!-- Carrousel d'images de fond -->
        <div class="absolute inset-0">
          <div
            *ngFor="let image of heroImages; let i = index"
            class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
            [style.background-image]="'url(' + image.url + ')'"
            [class.opacity-100]="currentImageIndex === i"
            [class.opacity-0]="currentImageIndex !== i">
          </div>
          <div class="absolute inset-0 bg-gradient-to-br from-primary-900/50 via-primary-800/40 to-primary-700/30"></div>
          <div class="absolute inset-0 bg-black/30"></div>
        </div>

        <!-- Indicateurs de carrousel -->
        <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          <button
            *ngFor="let image of heroImages; let i = index"
            (click)="setCurrentImage(i)"
            class="w-3 h-3 rounded-full transition-all duration-300 hover:scale-125"
            [class.bg-white]="currentImageIndex === i"
            [class.bg-white50]="currentImageIndex !== i">
          </button>
        </div>

        <!-- Contenu principal -->
        <div class="relative container mx-auto px-4 py-20 lg:py-32 z-10">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Hero Content avec animations -->
            <div class="space-y-6" [class.animate-fade-in-up]="isLoaded">
              <h1 class="text-4xl lg:text-6xl font-bold leading-tight transform transition-all duration-1000 delay-200"
                  [class.translate-y-0]="isLoaded"
                  [class.opacity-100]="isLoaded"
                  [class.translate-y-8]="!isLoaded"
                  [class.opacity-0]="!isLoaded">
                Froid Cheikh
                <br>
                <span class="text-secondary-400 animate-pulse">Anta Mbacké</span>
              </h1>

              <p class="text-xl lg:text-2xl text-primary-100 leading-relaxed transform transition-all duration-1000 delay-400"
                 [class.translate-y-0]="isLoaded"
                 [class.opacity-100]="isLoaded"
                 [class.translate-y-8]="!isLoaded"
                 [class.opacity-0]="!isLoaded">
                Spécialiste en climatisation, réfrigération et électroménager depuis plus de 15 ans
              </p>

              <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 transform transition-all duration-1000 delay-600"
                   [class.translate-y-0]="isLoaded"
                   [class.opacity-100]="isLoaded"
                   [class.translate-y-8]="!isLoaded"
                   [class.opacity-0]="!isLoaded">
                <button
                  (click)="navigateToProducts()"
                  class="btn-secondary text-lg px-8 py-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
                  <lucide-icon name="package" class="w-5 h-5"></lucide-icon>
                  <span>Découvrir nos produits</span>
                </button>

                <button
                  (click)="navigateToContact()"
                  class="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
                  <lucide-icon name="phone" class="w-5 h-5"></lucide-icon>
                  <span>Nous contacter</span>
                </button>
              </div>

              <!-- Contact Info avec animation -->
              <div class="pt-8 border-t border-primary-500 transform transition-all duration-1000 delay-800"
                   [class.translate-y-0]="isLoaded"
                   [class.opacity-100]="isLoaded"
                   [class.translate-y-8]="!isLoaded"
                   [class.opacity-0]="!isLoaded">
                <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-2 sm:space-y-0">
                  <div class="flex items-center space-x-2 hover:text-secondary-400 transition-colors duration-300">
                    <lucide-icon name="phone" class="w-5 h-5 text-secondary-400 animate-bounce-subtle"></lucide-icon>
                    <span class="text-primary-100">77 335 20 00 / 76 888 04 42</span>
                  </div>
                  <div class="flex items-center space-x-2 hover:text-secondary-400 transition-colors duration-300">
                    <lucide-icon name="map-pin" class="w-5 h-5 text-secondary-400 animate-bounce-subtle"></lucide-icon>
                    <span class="text-primary-100">Ouest Foire, Cité Aelmas</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hero Image avec animations -->
            <div class="relative transform transition-all duration-1000 delay-300"
                 [class.translate-x-0]="isLoaded"
                 [class.opacity-100]="isLoaded"
                 [class.translate-x-8]="!isLoaded"
                 [class.opacity-0]="!isLoaded">
              <div class="relative z-10 group">
                <img
                  src="assets/images/hero-climatiseur.jpg"
                  alt="Climatiseurs et électroménager Froid Cheikh"
                  class="w-full h-auto rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                  onerror="this.style.display='none'">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-2xl"></div>
              </div>
              <div class="absolute -top-4 -right-4 w-32 h-32 bg-secondary-400 rounded-full opacity-20 animate-float"></div>
              <div class="absolute -bottom-4 -left-4 w-24 h-24 bg-accent-400 rounded-full opacity-20 animate-float-reverse"></div>
              <div class="absolute top-1/2 -left-8 w-16 h-16 bg-primary-300 rounded-full opacity-10 animate-pulse"></div>
            </div>
          </div>
        </div>

        <!-- Effet de particules flottantes -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-30 animate-float-slow"></div>
          <div class="absolute top-3/4 left-3/4 w-1 h-1 bg-secondary-400 rounded-full opacity-40 animate-float-slow-reverse"></div>
          <div class="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-accent-400 rounded-full opacity-20 animate-float"></div>
          <div class="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-50 animate-float-reverse"></div>
        </div>
      </section>

      <!-- Categories Section avec animations au scroll -->
      <!-- Section Categories avec grille uniforme -->
      <section class="py-16 bg-white" #categoriesSection>
        <div class="container mx-auto px-4">
          <div class="text-center mb-12 transform transition-all duration-1000"
               [class.translate-y-0]="isCategoriesVisible"
               [class.opacity-100]="isCategoriesVisible"
               [class.translate-y-8]="!isCategoriesVisible"
               [class.opacity-0]="!isCategoriesVisible">
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos Catégories de Produits
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez notre large gamme de produits pour tous vos besoins en climatisation et électroménager
            </p>
          </div>

          <!-- Grille de catégories avec hauteurs uniformes -->
          <div class="categories-grid" *ngIf="categories.length > 0">
            <div
              *ngFor="let categorie of categories.slice(0, 8); let i = index"
              (click)="navigateToCategory(categorie)"
              class="category-card group cursor-pointer transform transition-all duration-500 hover:scale-105"
              [class.animate-fade-in-up]="isCategoriesVisible"
              [style.animation-delay.ms]="i * 100">

              <div class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 group-hover:-translate-y-2 h-full flex flex-col">

                <!-- Image de la catégorie avec hauteur fixe -->
                <div class="category-image relative overflow-hidden bg-gray-200">
                  <!-- Image principale seulement -->
                  <img
                    *ngIf="!isImageError(categorie.idCategorie)"
                    [src]="getCategoryImageUrl(categorie)"
                    [alt]="categorie.nomCategorie"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    (error)="onImageError(categorie.idCategorie)"
                    (load)="onImageLoad(categorie.idCategorie)"
                    loading="lazy">

                  <!-- Message simple si pas d'image -->
                  <div *ngIf="isImageError(categorie.idCategorie)"
                       class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span class="text-gray-500 text-sm">Image non disponible</span>
                  </div>

                  <!-- Overlay au hover -->
                  <div class="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>

                  <!-- Badge nombre de produits -->
                  <div class="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       *ngIf="categorie.nombreProduits">
                    {{ categorie.nombreProduits }} produit{{ categorie.nombreProduits > 1 ? 's' : '' }}
                  </div>
                </div>

                <!-- Contenu texte avec flexbox pour distribution uniforme -->
                <div class="category-content">
                  <h3 class="category-title text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                    {{ categorie.nomCategorie }}
                  </h3>

                  <div class="category-description">
                    <p class="text-sm text-gray-500" *ngIf="categorie.descriptionCategorie">
                      {{ categorie.descriptionCategorie | slice:0:80 }}{{ categorie.descriptionCategorie && categorie.descriptionCategorie.length > 80 ? '...' : '' }}
                    </p>
                  </div>

                  <div class="category-products-count">
                    <p class="text-sm text-primary-600 font-medium" *ngIf="categorie.nombreProduits">
                      {{ categorie.nombreProduits }} produit{{ categorie.nombreProduits > 1 ? 's' : '' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading state pour catégories -->
          <div *ngIf="isLoadingCategories" class="categories-grid">
            <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="animate-pulse">
              <div class="category-card bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="category-image bg-gray-200 animate-shimmer"></div>
                <div class="category-content space-y-3">
                  <div class="bg-gray-200 h-4 rounded w-3/4 mx-auto animate-shimmer"></div>
                  <div class="bg-gray-200 h-3 rounded w-1/2 mx-auto animate-shimmer"></div>
                  <div class="bg-gray-200 h-3 rounded w-1/3 mx-auto animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message si aucune catégorie -->
          <div *ngIf="!isLoadingCategories && categories.length === 0"
               class="text-center py-12">
            <lucide-icon name="package" class="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce"></lucide-icon>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">Aucune catégorie disponible</h3>
            <p class="text-gray-500">Les catégories seront bientôt disponibles.</p>
          </div>
        </div>
      </section>


      <!-- Featured Products Section -->
      <section class="py-16 bg-gray-50" #productsSection>
        <div class="container mx-auto px-4">
          <div class="text-center mb-12 transform transition-all duration-1000"
               [class.translate-y-0]="isProductsVisible"
               [class.opacity-100]="isProductsVisible"
               [class.translate-y-8]="!isProductsVisible"
               [class.opacity-0]="!isProductsVisible">
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Produits Récents
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez nos dernières arrivées et les produits les plus populaires
            </p>
          </div>

          <div class="products-grid" *ngIf="featuredProducts.length > 0">
            <div *ngFor="let produit of featuredProducts; let i = index"
                 class="transform transition-all duration-500"
                 [class.animate-fade-in-up]="isProductsVisible"
                 [style.animation-delay.ms]="i * 100">
              <app-product-card
                [produit]="produit"
                (quickView)="onQuickView($event)"
                (wishlistToggle)="onWishlistToggle($event)">
              </app-product-card>
            </div>
          </div>

          <!-- Loading state -->
          <div *ngIf="isLoadingProducts" class="products-grid">
            <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="animate-pulse">
              <div class="bg-white rounded-xl shadow-lg">
                <div class="bg-gray-200 h-64 rounded-t-xl animate-shimmer"></div>
                <div class="p-6 space-y-3">
                  <div class="bg-gray-200 h-4 rounded w-3/4 animate-shimmer"></div>
                  <div class="bg-gray-200 h-6 rounded w-1/2 animate-shimmer"></div>
                  <div class="bg-gray-200 h-10 rounded animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-12">
            <button
              (click)="navigateToProducts()"
              class="btn-primary text-lg px-8 py-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-bounce-subtle">
              <lucide-icon name="arrow-right" class="w-5 h-5"></lucide-icon>
              <span>Voir tous les produits</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Brands Section -->
      <section class="py-16 bg-gray-50" *ngIf="brands.length > 0" #brandsSection>
        <div class="container mx-auto px-4">
          <div class="text-center mb-12 transform transition-all duration-1000"
               [class.translate-y-0]="isBrandsVisible"
               [class.opacity-100]="isBrandsVisible"
               [class.translate-y-8]="!isBrandsVisible"
               [class.opacity-0]="!isBrandsVisible">
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos Marques Partenaires
            </h2>
            <p class="text-xl text-gray-600">
              Nous travaillons avec les meilleures marques du marché
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            <div
              *ngFor="let marque of brands.slice(0, 12); let i = index"
              class="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
              [class.animate-fade-in-up]="isBrandsVisible"
              [style.animation-delay.ms]="i * 100"
              (click)="navigateToBrand(marque)">
              <img
                *ngIf="!isImageError('brand-' + marque.idMarque)"
                [src]="getBrandLogoUrl(marque)"
                [alt]="marque.nomMarque"
                class="max-h-12 max-w-full object-contain filter hover:brightness-110 transition-all duration-300"
                (error)="onImageError('brand-' + marque.idMarque)"
                (load)="onImageLoad('brand-' + marque.idMarque)">
              <span
                *ngIf="isImageError('brand-' + marque.idMarque)"
                class="text-lg font-semibold text-gray-700 hover:text-primary-600 transition-colors duration-300">
                {{ marque.nomMarque }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-16 bg-white" #featuresSection>
        <div class="container mx-auto px-4">
          <div class="text-center mb-12 transform transition-all duration-1000"
               [class.translate-y-0]="isFeaturesVisible"
               [class.opacity-100]="isFeaturesVisible"
               [class.translate-y-8]="!isFeaturesVisible"
               [class.opacity-0]="!isFeaturesVisible">
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Froid Cheikh ?
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="text-center group transform transition-all duration-500 hover:scale-105"
                 [class.animate-fade-in-up]="isFeaturesVisible"
                 style="animation-delay: 0ms">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-300">
                <lucide-icon name="truck" class="w-8 h-8 text-primary-600 group-hover:animate-bounce"></lucide-icon>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">Livraison Rapide</h3>
              <p class="text-gray-600">Livraison gratuite à Dakar et ses environs</p>
            </div>

            <div class="text-center group transform transition-all duration-500 hover:scale-105"
                 [class.animate-fade-in-up]="isFeaturesVisible"
                 style="animation-delay: 200ms">
              <div class="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary-200 group-hover:scale-110 transition-all duration-300">
                <lucide-icon name="settings" class="w-8 h-8 text-secondary-600 group-hover:animate-spin"></lucide-icon>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-secondary-600 transition-colors duration-300">Installation & SAV</h3>
              <p class="text-gray-600">Service d'installation et maintenance professionnels</p>
            </div>

            <div class="text-center group transform transition-all duration-500 hover:scale-105"
                 [class.animate-fade-in-up]="isFeaturesVisible"
                 style="animation-delay: 400ms">
              <div class="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-200 group-hover:scale-110 transition-all duration-300">
                <lucide-icon name="shield" class="w-8 h-8 text-accent-600 group-hover:animate-pulse"></lucide-icon>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-accent-600 transition-colors duration-300">Garantie Étendue</h3>
              <p class="text-gray-600">Garantie sur tous nos produits avec service après-vente</p>
            </div>

            <div class="text-center group transform transition-all duration-500 hover:scale-105"
                 [class.animate-fade-in-up]="isFeaturesVisible"
                 style="animation-delay: 600ms">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <lucide-icon name="check" class="w-8 h-8 text-green-600 group-hover:animate-bounce"></lucide-icon>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">15 Ans d'Expérience</h3>
              <p class="text-gray-600">Plus de 15 ans d'expertise dans le domaine du froid</p>
            </div>
          </div>
        </div>
      </section>



      <!-- CTA Section -->
      <section class="py-16 bg-primary-600 text-white relative overflow-hidden">
        <div class="absolute inset-0">
          <div class="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 animate-gradient-x"></div>
        </div>

        <div class="container mx-auto px-4 text-center relative z-10">
          <h2 class="text-3xl lg:text-4xl font-bold mb-4 animate-fade-in-up">
            Besoin d'un Conseil Personnalisé ?
          </h2>
          <p class="text-xl text-primary-100 mb-8 max-w-3xl mx-auto animate-fade-in-up" style="animation-delay: 200ms">
            Nos experts sont là pour vous aider à choisir la solution qui correspond parfaitement à vos besoins
          </p>

          <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up" style="animation-delay: 400ms">
            <a
              href="tel:+221773352000"
              class="btn-secondary text-lg px-8 py-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
              <lucide-icon name="phone" class="w-5 h-5 animate-pulse"></lucide-icon>
              <span>77 335 20 00</span>
            </a>

            <button
              (click)="navigateToContact()"
              class="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300">
              <lucide-icon name="mail" class="w-5 h-5"></lucide-icon>
              <span>Nous écrire</span>
            </button>
          </div>
        </div>

        <!-- Particules flottantes -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-20 animate-float-slow"></div>
          <div class="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary-400 rounded-full opacity-30 animate-float-slow-reverse"></div>
          <div class="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-accent-400 rounded-full opacity-25 animate-float"></div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    /* Animations personnalisées */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translate3d(0, 30px, 0);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    @keyframes floatReverse {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(20px) rotate(-180deg); }
    }

    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      25% { transform: translateY(-10px) translateX(5px); }
      50% { transform: translateY(0px) translateX(10px); }
      75% { transform: translateY(-5px) translateX(5px); }
    }

    @keyframes floatSlowReverse {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      25% { transform: translateY(10px) translateX(-5px); }
      50% { transform: translateY(0px) translateX(-10px); }
      75% { transform: translateY(5px) translateX(-5px); }
    }

    @keyframes bounceSubtle {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }

    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }

    @keyframes gradientX {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.8s ease-out forwards;
    }

    .animate-float {
      animation: float 6s ease-in-out infinite;
    }

    .animate-float-reverse {
      animation: floatReverse 8s ease-in-out infinite;
    }

    .animate-float-slow {
      animation: floatSlow 12s ease-in-out infinite;
    }

    .animate-float-slow-reverse {
      animation: floatSlowReverse 15s ease-in-out infinite;
    }

    .animate-bounce-subtle {
      animation: bounceSubtle 2s ease-in-out infinite;
    }

    .animate-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .animate-gradient-x {
      background-size: 200% 200%;
      animation: gradientX 3s ease infinite;
    }

    /* ========================================
       GRILLE RESPONSIVE POUR LES PRODUITS
       Optimisée pour tous les écrans
       ======================================== */

    .products-grid {
      display: grid;
      gap: 1.5rem;
      align-items: stretch;

      /* Desktop: 4 colonnes */
      grid-template-columns: repeat(4, 1fr);
    }

    /* Assure que les cartes de produits occupent toute la hauteur disponible */
    .products-grid > div {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 420px;
    }

    .products-grid app-product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Force les cartes à être uniformes */
    .products-grid app-product-card ::ng-deep .card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .products-grid app-product-card ::ng-deep .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Grille pour les catégories avec hauteurs uniformes */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      align-items: stretch;
    }

    /* Cartes de catégories avec hauteur uniforme */
    .category-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 320px;
    }

    .category-card .category-image {
      flex-shrink: 0;
      height: 192px;
    }

    .category-card .category-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
    }

    .category-card .category-title {
      flex-shrink: 0;
      margin-bottom: 0.5rem;
    }

    .category-card .category-description {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 3rem;
    }

    .category-card .category-products-count {
      flex-shrink: 0;
      margin-top: 0.5rem;
    }

    /* Grille pour les marques avec hauteurs uniformes */
    .brands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 2rem;
      align-items: stretch;
    }

    .brand-card {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .brand-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px) scale(1.05);
    }

    .brand-card img {
      max-height: 48px;
      max-width: 100%;
      object-fit: contain;
      filter: grayscale(0.2);
      transition: all 0.3s ease;
    }

    .brand-card:hover img {
      filter: grayscale(0);
      transform: scale(1.1);
    }

    /* Styles pour les features avec hauteurs uniformes */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      align-items: stretch;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      text-align: center;
      height: 100%;
      min-height: 200px;
      padding: 1rem;
    }

    .feature-icon {
      flex-shrink: 0;
      margin-bottom: 1rem;
    }

    .feature-title {
      flex-shrink: 0;
      margin-bottom: 0.5rem;
    }

    .feature-description {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Styles pour les éléments au scroll */
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease-out;
    }

    .animate-on-scroll.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ========================================
       RESPONSIVE BREAKPOINTS
       ======================================== */

    /* Large tablets et petits desktops: 3 colonnes */
    @media (max-width: 1200px) {
      .products-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    /* Tablettes: 2 colonnes */
    @media (max-width: 900px) {
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      .products-grid > div {
        min-height: 400px;
      }

      .categories-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
    }

    /* Petits écrans / Grands mobiles: 2 colonnes compactes */
    @media (max-width: 640px) {
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .products-grid > div {
        min-height: 360px;
      }

      .categories-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .category-card {
        min-height: 280px;
      }

      .category-card .category-image {
        height: 140px;
      }

      /* Ajuster la taille de la police pour les petits écrans */
      .products-grid app-product-card ::ng-deep .card-body h3 {
        font-size: 0.9rem;
      }

      .products-grid app-product-card ::ng-deep .card-body .text-2xl {
        font-size: 1.25rem;
      }
    }

    /* Très petits mobiles: 1 colonne */
    @media (max-width: 420px) {
      .products-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .products-grid > div {
        min-height: 420px;
      }

      .categories-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .category-card {
        min-height: 320px;
      }

      .category-card .category-image {
        height: 180px;
      }

      .brands-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .brand-card {
        height: 60px;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .feature-card {
        min-height: 150px;
      }
    }

    /* Optimisation pour très petits écrans (< 360px) */
    @media (max-width: 360px) {
      .products-grid {
        gap: 0.5rem;
      }

      .products-grid > div {
        min-height: 380px;
      }

      .categories-grid {
        gap: 0.5rem;
      }

      /* Réduire encore plus les tailles de police */
      .products-grid app-product-card ::ng-deep .card-body h3 {
        font-size: 0.85rem;
        line-height: 1.2;
      }

      .products-grid app-product-card ::ng-deep .card-body .text-2xl {
        font-size: 1.1rem;
      }

      .products-grid app-product-card ::ng-deep .btn-primary {
        padding: 0.5rem;
        font-size: 0.85rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Propriétés pour le carrousel d'images
  heroImages = [
    {
      url: 'assets/images/im.jpg',
      alt: 'Climatiseurs professionnels'
    },
    {
      url: 'assets/images/im2.jpg',
      alt: 'Équipements de réfrigération'
    },
    {
      url: 'assets/images/im1.jpg',
      alt: 'Électroménager moderne'
    }
  ];

  currentImageIndex = 0;
  private carouselInterval: any;

  // Propriétés d'animation
  isLoaded = false;
  isCategoriesVisible = false;
  isProductsVisible = false;
  isFeaturesVisible = false;
  isBrandsVisible = false;

  // Propriété pour gérer les erreurs d'images avec des clés string
  private imageErrors = new Set<string>();

  categories: Categorie[] = [];
  featuredProducts: Produit[] = [];
  brands: Marque[] = [];

  isLoadingCategories = true;
  isLoadingProducts = true;
  isLoadingBrands = true;

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHomeData();
    this.initializeAnimations();
    this.startCarousel();
    this.setupScrollAnimations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  private initializeAnimations(): void {
    setTimeout(() => {
      this.isLoaded = true;
    }, 100);
  }

  private startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextImage();
    }, 5000);
  }

  private setupScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetId = entry.target.getAttribute('data-section') || entry.target.id;

          switch (targetId) {
            case 'categories':
              this.isCategoriesVisible = true;
              break;
            case 'products':
              this.isProductsVisible = true;
              break;
            case 'features':
              this.isFeaturesVisible = true;
              break;
            case 'brands':
              this.isBrandsVisible = true;
              break;
          }
        }
      });
    }, observerOptions);

    setTimeout(() => {
      const sections = [
        { selector: '[data-section="categories"]', id: 'categories' },
        { selector: '[data-section="products"]', id: 'products' },
        { selector: '[data-section="features"]', id: 'features' },
        { selector: '[data-section="brands"]', id: 'brands' }
      ];

      sections.forEach(section => {
        const element = document.querySelector(section.selector);
        if (element) {
          element.setAttribute('data-section', section.id);
          observer.observe(element);
        }
      });
    }, 500);
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.heroImages.length;
  }

  previousImage(): void {
    this.currentImageIndex = this.currentImageIndex === 0
      ? this.heroImages.length - 1
      : this.currentImageIndex - 1;
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.startCarousel();
    }
  }

  private loadHomeData(): void {
    forkJoin({
      categories: this.apiService.getCategories(),
      products: this.apiService.getLatestProduits({ size: 8 }),
      brands: this.apiService.getMarquesWithProducts()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.categories = data.categories;
          this.featuredProducts = data.products.content;
          this.brands = data.brands;

          console.log('🏷️ Catégories chargées:', this.categories);
          console.log('🔖 Marques chargées:', this.brands);

          this.preloadImages();

          this.isLoadingCategories = false;
          this.isLoadingProducts = false;
          this.isLoadingBrands = false;

          setTimeout(() => this.isCategoriesVisible = true, 1000);
          setTimeout(() => this.isProductsVisible = true, 1500);
          setTimeout(() => this.isFeaturesVisible = true, 2000);
          setTimeout(() => this.isBrandsVisible = true, 2500);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données:', error);
          this.isLoadingCategories = false;
          this.isLoadingProducts = false;
          this.isLoadingBrands = false;
        }
      });
  }

  /**
   * Génère l'URL complète de l'image de la catégorie
   */
  getCategoryImageUrl(categorie: Categorie): string {
    const url = this.imageUrlService.getCategoryImageUrl(categorie.imageCategorie);
    console.log('🖼️ URL catégorie générée:', url, 'pour:', categorie.nomCategorie);
    return url;
  }

  /**
   * Génère l'URL complète du logo de la marque
   */
  getBrandLogoUrl(marque: Marque): string {
    const url = this.imageUrlService.getBrandLogoUrl(marque.logo);
    console.log('🏷️ URL marque générée:', url, 'pour:', marque.nomMarque);
    return url;
  }

  /**
   * Gestionnaire d'erreur pour les images
   */
  onImageError(key: string | number): void {
    const errorKey = key.toString();
    console.log('❌ Erreur de chargement d\'image pour:', errorKey);
    this.imageErrors.add(errorKey);
  }

  /**
   * Gestionnaire de succès pour les images
   */
  onImageLoad(key: string | number): void {
    const loadKey = key.toString();
    console.log('✅ Image chargée avec succès pour:', loadKey);
    this.imageErrors.delete(loadKey);
  }

  /**
   * Vérifie si une image a une erreur
   */
  isImageError(key: string | number): boolean {
    return this.imageErrors.has(key.toString());
  }

  /**
   * Précharge les images pour une meilleure UX
   */
  private preloadImages(): void {
    // Précharger images de catégories
    this.categories.forEach(categorie => {
      if (categorie.imageCategorie) {
        const img = new Image();
        const url = this.getCategoryImageUrl(categorie);
        img.onload = () => {
          console.log('✅ Image catégorie préchargée:', categorie.nomCategorie);
          this.imageErrors.delete(categorie.idCategorie.toString());
        };
        img.onerror = () => {
          console.log('❌ Erreur préchargement catégorie:', categorie.nomCategorie);
          this.imageErrors.add(categorie.idCategorie.toString());
        };
        img.src = url;
      }
    });

    // Précharger logos de marques
    this.brands.forEach(marque => {
      if (marque.logo) {
        const img = new Image();
        const url = this.getBrandLogoUrl(marque);
        img.onload = () => {
          console.log('✅ Logo marque préchargé:', marque.nomMarque);
          this.imageErrors.delete('brand-' + marque.idMarque);
        };
        img.onerror = () => {
          console.log('❌ Erreur préchargement marque:', marque.nomMarque);
          this.imageErrors.add('brand-' + marque.idMarque);
        };
        img.src = url;
      }
    });

    // Précharger images du carrousel hero
    this.heroImages.forEach(image => {
      const img = new Image();
      img.src = image.url;
    });
  }

  navigateToProducts(): void {
    this.router.navigate(['/produits']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  navigateToCategory(categorie: Categorie): void {
    this.router.navigate(['/produits/categorie', categorie.idCategorie]);
  }

  navigateToBrand(marque: Marque): void {
    this.router.navigate(['/produits/marque', marque.idMarque]);
  }

  onQuickView(produit: Produit): void {
    this.router.navigate(['/produit', produit.idProduit]);
  }

  onWishlistToggle(event: {produit: Produit, isAdding: boolean}): void {
    console.log('Wishlist toggle:', event);
  }

  /**
   * Mapping des icônes selon le nom de la catégorie (fallback)
   */
  getCategoryIcon(categorie: Categorie): string {
    const categoryIcons: {[key: string]: string} = {
      'climatiseur': 'snowflake',
      'climatiseurs': 'snowflake',
      'réfrigérateur': 'refrigerator',
      'réfrigérateurs': 'refrigerator',
      'frigo': 'refrigerator',
      'frigos': 'refrigerator',
      'chambre froide': 'warehouse',
      'chambres froides': 'warehouse',
      'ventilateur': 'fan',
      'ventilateurs': 'fan',
      'électroménager': 'zap',
      'machine à laver': 'washing-machine',
      'lave-vaisselle': 'dishes',
      'micro-onde': 'microwave',
      'four': 'oven',
      'cuisinière': 'flame',
      'congelateur': 'snowflake',
      'congélateur': 'snowflake'
    };

    const categoryName = categorie.nomCategorie.toLowerCase();

    if (categoryIcons[categoryName]) {
      return categoryIcons[categoryName];
    }

    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (categoryName.includes(key)) {
        return icon;
      }
    }

    return 'package';
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  trackByCategory(index: number, categorie: Categorie): number {
    return categorie.idCategorie;
  }

  trackByProduct(index: number, produit: Produit): number {
    return produit.idProduit;
  }

  trackByBrand(index: number, marque: Marque): number {
    return marque.idMarque;
  }

  onCategoryHover(categorie: Categorie, isEntering: boolean): void {
    if (isEntering) {
      console.log(`Hover sur ${categorie.nomCategorie}`);
    }
  }

  onFeatureHover(featureName: string): void {
    console.log(`Hover sur la feature: ${featureName}`);
  }

  onTouchStart(event: TouchEvent): void {
    // Gérer le début du touch pour le carrousel mobile
  }

  onTouchEnd(event: TouchEvent): void {
    // Gérer la fin du touch pour le carrousel mobile
  }
}
