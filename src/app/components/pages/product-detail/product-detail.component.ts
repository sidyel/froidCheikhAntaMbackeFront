import { Component, HostListener, Inject, OnInit, OnDestroy, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ConfigService } from '../../../services/config.service';
import { SeoService } from '../../../services/seo.service';
import { PixelService } from '../../../services/pixel.service';
import { Produit, Breadcrumb, VideoProduit } from '../../../models/interfaces';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SSR_RESPONSE } from '../../../utils/ssr.tokens';
import { extractId, buildProduitUrl, buildCategorieUrl } from '../../../utils/slug.utils';

@Component({
  selector: 'app-product-detail',
  template: `
    <div class="min-h-screen bg-gray-50" *ngIf="!isLoading && produit">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <div class="container mx-auto px-4 py-8">

        <!-- Product Detail -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <!-- Product Images -->
            <div class="p-6">
              <!-- Main Image - TAILLE AUGMENTÉE -->
              <div class="aspect-w-1 aspect-h-1 mb-4">
                <img
                  [src]="getMainImageUrl()"
                  [alt]="produit.nomProduit"
                  class="w-full h-[260px] sm:h-[380px] lg:h-[500px] object-contain bg-gray-50 rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  (click)="openImageGallery()"
                  onerror="this.src='assets/images/placeholder-product.jpg'">
              </div>

              <!-- Galerie unifiée photos + vidéos (même rangée scrollable) -->
              <div class="relative" *ngIf="imageUrls.length > 1 || (produit.videos && produit.videos.length > 0)">
                <!-- Gradient fade gauche (mobile) -->
                <div class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent z-10 md:hidden"></div>

                <!-- Rangée unique scrollable -->
                <div class="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 px-1 thumbnail-scroll-container">
                  <!-- Photos -->
                  <button
                    *ngFor="let image of imageUrls; let i = index"
                    (click)="selectImage(i)"
                    [class.ring-2]="selectedImageIndex === i"
                    [class.ring-primary-500]="selectedImageIndex === i"
                    [class.ring-offset-2]="selectedImageIndex === i"
                    class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                    <img
                      [src]="getImageUrl(image)"
                      [alt]="produit.nomProduit"
                      class="w-full h-full object-contain"
                      onerror="this.src='assets/images/placeholder-product.jpg'">
                  </button>
                  <!-- Vidéos (même taille, même style, dans le même scroll) -->
                  <button
                    *ngFor="let video of produit.videos"
                    (click)="selectionnerVideo(video)"
                    class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                    <img *ngIf="video.urlApercu" [src]="video.urlApercu" [alt]="video.titre || 'Vidéo'"
                         class="w-full h-full object-cover"
                         onerror="this.style.display='none'">
                    <div *ngIf="!video.urlApercu" class="w-full h-full bg-gray-800"></div>
                    <div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center gap-0.5">
                      <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-md">
                        <lucide-icon name="play" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 ml-0.5"></lucide-icon>
                      </div>
                      <span class="text-white text-xs font-medium drop-shadow leading-tight"
                            *ngIf="video.type === 'YOUTUBE'">YouTube</span>
                      <span class="text-white text-xs font-medium drop-shadow leading-tight"
                            *ngIf="video.type === 'FACEBOOK'">Facebook</span>
                    </div>
                  </button>
                </div>

                <!-- Gradient fade droite (mobile) -->
                <div class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10 md:hidden"></div>
              </div>
            </div>

            <!-- Product Information -->
            <div class="p-6">

              <!-- Brand and Reference -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <span *ngIf="produit.marque" class="text-sm font-medium text-primary-600">
                    {{ produit.marque.nomMarque }}
                  </span>
                  <span *ngIf="produit.refProduit" class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Réf: {{ produit.refProduit }}
                  </span>
                </div>

                <!-- Wishlist Button -->
                <button
                  *ngIf="isAuthenticated"
                  (click)="toggleWishlist()"
                  [class]="isInWishlist ? 'text-red-500' : 'text-gray-400'"
                  class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  [title]="isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'">
                  <lucide-icon name="heart" class="w-6 h-6" [class.fill-current]="isInWishlist"></lucide-icon>
                </button>
              </div>

              <!-- Product Name -->
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {{ produit.nomProduit }}
              </h1>

              <!-- Price -->
              <div class="mb-6">
                <div *ngIf="produit.prixPromo" class="flex items-center space-x-2 mb-2">
                  <span class="bg-red-600 text-white text-sm font-bold px-2 py-0.5 rounded">
                    -{{ produit.pourcentageReduction }}%
                  </span>
                  <span *ngIf="produit.nomPromotion" class="text-sm text-gray-500 italic">{{ produit.nomPromotion }}</span>
                </div>
                <div class="flex items-baseline space-x-3">
                  <span [class]="produit.prixPromo ? 'text-3xl sm:text-4xl font-bold text-green-600' : 'text-3xl sm:text-4xl font-bold text-primary-600'">
                    {{ (produit.prixPromo || produit.prix) | currency:('' | devise):'symbol':'1.0-0' }}
                  </span>
                  <span *ngIf="produit.prixPromo" class="text-xl text-gray-400 line-through">
                    {{ produit.prix | currency:('' | devise):'symbol':'1.0-0' }}
                  </span>
                </div>
                <p *ngIf="countdownText" class="text-sm text-orange-600 font-medium mt-1 flex items-center space-x-1">
                  <lucide-icon name="clock" class="w-4 h-4"></lucide-icon>
                  <span>Fin dans {{ countdownText }}</span>
                </p>
                <p class="text-sm text-gray-600 mt-1">Prix TTC</p>
              </div>

              <!-- Caractéristiques techniques — tableau unifié -->
              <div class="mb-6" *ngIf="allSpecs().length > 0">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Caractéristiques techniques</h3>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <tbody>
                      <tr *ngFor="let spec of allSpecs(); odd as isOdd"
                        [class]="isOdd ? 'bg-gray-50' : 'bg-white'">
                        <td class="py-2 px-3 font-medium text-gray-600 w-2/5 border-b border-gray-100">
                          {{ spec.label }}
                        </td>
                        <td class="py-2 px-3 text-gray-900 border-b border-gray-100">
                          {{ spec.value }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Stock Status -->
              <div class="mb-6">
                <div class="flex items-center space-x-2 mb-2">
                  <div [class]="getStockIndicatorClass()"></div>
                  <span [class]="getStockTextClass()">{{ getStockText() }}</span>
                </div>
                <p class="text-xs text-gray-500" *ngIf="produit.disponibilite && produit.stockDisponible > 0">
                  {{ produit.stockDisponible }} unité{{ produit.stockDisponible > 1 ? 's' : '' }} disponible{{ produit.stockDisponible > 1 ? 's' : '' }}
                </p>
              </div>

              <!-- Quantity Selector and Add to Cart -->
              <div class="mb-6" *ngIf="produit.disponibilite && produit.stockDisponible > 0">
                <div class="flex items-center space-x-4 mb-4">
                  <label class="text-sm font-medium text-gray-700">Quantité:</label>
                  <div class="flex items-center space-x-2">
                    <button
                      (click)="decreaseQuantity()"
                      [disabled]="selectedQuantity <= 1"
                      class="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
                      <lucide-icon name="minus" class="w-4 h-4"></lucide-icon>
                    </button>
                    <span class="px-4 py-2 border rounded-md min-w-[60px] text-center">{{ selectedQuantity }}</span>
                    <button
                      (click)="increaseQuantity()"
                      [disabled]="selectedQuantity >= produit.stockDisponible"
                      class="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
                      <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>

                <!-- Option installation -->
                <div *ngIf="produit.prixInstallation" class="flex items-center space-x-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="avecInstallation"
                    [(ngModel)]="avecInstallation"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <label for="avecInstallation" class="flex-1 text-sm text-gray-900 cursor-pointer">
                    <span class="font-medium">Installation professionnelle</span>
                    <span class="text-blue-700 font-semibold ml-1">
                      (+{{ produit.prixInstallation | currency:('' | devise):'symbol':'1.0-0' }})
                    </span>
                    <span class="block text-xs text-gray-500 mt-0.5">Pose et mise en service par nos techniciens</span>
                  </label>
                </div>

                <!-- Boutons Ajouter au panier / Acheter — compacts sur mobile -->
                <div class="flex space-x-2 sm:space-x-3">
                  <button
                    (click)="addToCart()"
                    [disabled]="isAddingToCart"
                    class="flex-1 btn-primary py-2 sm:py-3 text-sm sm:text-lg flex items-center justify-center space-x-1 sm:space-x-2">
                    <lucide-icon name="shopping-cart" class="w-4 h-4 sm:w-5 sm:h-5" *ngIf="!isAddingToCart"></lucide-icon>
                    <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" *ngIf="isAddingToCart"></div>
                    <span>{{ isAddingToCart ? 'Ajout...' : 'Ajouter au panier' }}</span>
                  </button>

                  <button
                    (click)="buyNow()"
                    class="px-4 sm:px-8 btn-secondary py-2 sm:py-3 text-sm sm:text-lg flex items-center space-x-1 sm:space-x-2">
                    <lucide-icon name="credit-card" class="w-4 h-4 sm:w-5 sm:h-5"></lucide-icon>
                    <span>Acheter</span>
                  </button>
                </div>
              </div>

              <!-- Product unavailable -->
              <div class="mb-6" *ngIf="!produit.disponibilite || produit.stockDisponible === 0">
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div class="flex items-center space-x-2">
                    <lucide-icon name="alert-circle" class="w-5 h-5 text-red-500"></lucide-icon>
                    <span class="text-red-800 font-medium">Produit indisponible</span>
                  </div>
                  <p class="text-red-700 text-sm mt-1">
                    Ce produit n'est actuellement pas disponible. Contactez-nous pour plus d'informations.
                  </p>
                </div>
              </div>

              <!-- Actions - TAILLES AUGMENTÉES -->
              <div class="border-t pt-6 space-y-6">
                <!-- Contact - TAILLE AUGMENTÉE -->
                <div class="flex items-center space-x-4">
                  <a
                    [href]="'tel:+221' + firstTelephone"
                    class="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 hover:bg-primary-100 px-4 py-3 rounded-lg">
                    <lucide-icon name="phone" class="w-5 h-5"></lucide-icon>
                    <span class="text-base font-medium">Appelez-nous pour plus d'infos</span>
                  </a>
                </div>

                <!-- Technical Sheet -->
                <div *ngIf="produit.ficheTechniquePDF">
                  <a
                    [href]="getTechnicalSheetUrl()"
                    target="_blank"
                    class="flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg">
                    <lucide-icon name="download" class="w-5 h-5"></lucide-icon>
                    <span class="text-base font-medium">Télécharger la fiche technique</span>
                  </a>
                </div>

                <!-- Share : uniquement WhatsApp (bouton Copier retiré) -->
                <div class="flex items-center space-x-4">
                  <span class="text-base font-medium text-gray-700">Négocier sur whatsapp:</span>
                  <button
                    (click)="shareProduct('whatsapp')"
                    class="flex items-center space-x-2 text-green-600 hover:text-green-800 transition-colors bg-green-50 hover:bg-green-100 px-4 py-3 rounded-lg">
                    <span class="text-base font-medium">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="mt-8 bg-white rounded-xl shadow-lg p-6" *ngIf="produit.descriptionProduit">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Description du produit</h3>
          <div class="prose max-w-none">
            <p class="text-gray-700 leading-relaxed">
              {{ produit.descriptionProduit }}
            </p>
          </div>
        </div>

        <!-- Specifications -->
        <div class="mt-8 bg-white rounded-xl shadow-lg p-6" *ngIf="getSpecifications().length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Spécifications techniques</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngFor="let spec of getSpecifications()" class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600">{{ spec.label }}</span>
              <span class="font-medium text-gray-900">{{ spec.value }}</span>
            </div>
          </div>
        </div>

        <!-- Related Products : 2 par ligne sur mobile -->
        <div class="mt-12" *ngIf="relatedProducts.length > 0">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Produits similaires</h2>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <app-product-card
              *ngFor="let relatedProduct of relatedProducts.slice(0, 4)"
              [produit]="relatedProduct">
            </app-product-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <div *ngIf="showImageGallery" class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" (click)="closeImageGallery()">
      <div class="relative max-w-4xl max-h-full" (click)="$event.stopPropagation()">
        <!-- Close Button -->
        <button
          (click)="closeImageGallery()"
          class="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
          <lucide-icon name="x" class="w-8 h-8"></lucide-icon>
        </button>

        <!-- Main Image -->
        <img
          [src]="getMainImageUrl()"
          [alt]="produit?.nomProduit"
          class="max-w-full max-h-full object-contain rounded-lg">

        <!-- Navigation arrows if multiple images -->
        <div *ngIf="imageUrls.length > 1" class="absolute inset-y-0 left-4 flex items-center">
          <button
            (click)="previousImage()"
            class="text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2">
            <lucide-icon name="chevron-left" class="w-6 h-6"></lucide-icon>
          </button>
        </div>

        <div *ngIf="imageUrls.length > 1" class="absolute inset-y-0 right-4 flex items-center">
          <button
            (click)="nextImage()"
            class="text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2">
            <lucide-icon name="chevron-right" class="w-6 h-6"></lucide-icon>
          </button>
        </div>

        <!-- Image counter -->
        <div *ngIf="imageUrls.length > 1" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
          {{ selectedImageIndex + 1 }} / {{ imageUrls.length }}
        </div>
      </div>
    </div>

    <!-- Modal vidéo plein écran (navigateur uniquement) -->
    <div *ngIf="videoSelectionne && isPlatformBrowserFlag"
         class="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center overflow-y-auto"
         style="padding: env(safe-area-inset-top,16px) env(safe-area-inset-right,16px) env(safe-area-inset-bottom,16px) env(safe-area-inset-left,16px)"
         (click)="fermerVideo()">
      <div class="relative w-full max-w-4xl px-4" (click)="$event.stopPropagation()">

        <!-- Barre supérieure : titre + bouton fermer -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-white text-sm font-medium truncate pr-3">
            {{ videoSelectionne.titre || 'Vidéo du produit' }}
          </span>
          <!-- Bouton min 44×44 px pour le pouce -->
          <button (click)="fermerVideo()"
                  class="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-white bg-opacity-15 active:bg-opacity-30 transition-colors"
                  aria-label="Fermer la vidéo">
            <lucide-icon name="x" class="w-6 h-6 text-white"></lucide-icon>
          </button>
        </div>

        <!-- Lecteur 16:9 -->
        <div class="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl" style="padding-top: 56.25%">
          <div class="absolute inset-0">
            <!-- YouTube (autoplay + plein écran iOS) -->
            <iframe *ngIf="videoSelectionne.type === 'YOUTUBE'"
                    [src]="getYoutubeEmbedUrl(videoSelectionne)"
                    class="w-full h-full"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowfullscreen
                    webkit-allowfullscreen
                    mozallowfullscreen>
            </iframe>
            <!-- Facebook -->
            <iframe *ngIf="videoSelectionne.type === 'FACEBOOK'"
                    [src]="getFacebookEmbedUrl(videoSelectionne)"
                    class="w-full h-full"
                    frameborder="0"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowfullscreen
                    webkit-allowfullscreen
                    mozallowfullscreen>
            </iframe>
            <!-- Cloudinary -->
            <video *ngIf="videoSelectionne.type === 'CLOUDINARY'"
                   class="w-full h-full"
                   controls autoplay playsinline
                   webkit-playsinline>
              <source [src]="videoSelectionne.url" type="video/mp4">
            </video>
          </div>
        </div>

        <!-- Aide tactile -->
        <p class="text-center text-gray-500 text-xs mt-3">Appuyer en dehors pour fermer</p>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600">Chargement du produit...</p>
        <p class="text-sm text-gray-500 mt-2">ID: {{ currentProductId }}</p>
      </div>
    </div>

    <!-- Product Not Found -->
    <div *ngIf="!isLoading && !produit && hasError" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <lucide-icon name="package" class="w-24 h-24 text-gray-300 mx-auto mb-4"></lucide-icon>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">Produit non trouvé</h2>
        <p class="text-gray-600 mb-6">Le produit que vous recherchez n'existe pas ou n'est plus disponible.</p>
        <button (click)="goBack()" class="btn-primary flex items-center space-x-2">
          <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
          <span>Retour</span>
        </button>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  produit: Produit | null = null;
  relatedProducts: Produit[] = [];
  breadcrumbs: Breadcrumb[] = [];

  isLoading = true;
  hasError = false;
  isAddingToCart = false;
  isInWishlist = false;
  isAuthenticated = false;
  showImageGallery = false;
  avecInstallation = false;

  selectedImageIndex = 0;
  selectedQuantity = 1;
  currentProductId: number = 0;
  countdownText: string | null = null;
  private countdownInterval: any = null;

  // Vidéos
  videoSelectionne: VideoProduit | null = null;
  isPlatformBrowserFlag = false;

  get firstTelephone(): string {
    const tels = this.configService.config.telephones;
    return (tels && tels.length > 0) ? tels[0].numero.replace(/\s/g, '') : '';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService,
    private configService: ConfigService,
    private seoService: SeoService,
    private pixelService: PixelService,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() @Inject(SSR_RESPONSE) private ssrResponse: any
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isPlatformBrowserFlag = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Le param peut être "3-climatiseur-astech" ou "3" (ancienne URL)
        const slug = params['slug'] ?? params['id'] ?? '';
        const productId = extractId(String(slug));
        this.currentProductId = productId;

        if (productId && !isNaN(productId)) {
          this.loadProduct(productId, slug);
        } else {
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private loadProduct(productId: number, slug?: string): void {
    this.isLoading = true;
    this.hasError = false;
    this.produit = null;

    this.apiService.getProduitById(productId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          // Vrai 404 HTTP côté serveur SSR
          if (isPlatformServer(this.platformId) && this.ssrResponse) {
            this.ssrResponse.status(404);
          }
          this.hasError = true;
          this.isLoading = false;
          throw error;
        })
      )
      .subscribe({
        next: (product) => {
          this.produit = product;

          // Redirection 301 vers l'URL canonique si le slug est absent ou obsolète
          const canonicalSlug = buildProduitUrl(product.idProduit, product.nomProduit);
          const currentParam = String(slug || productId);
          const canonicalParam = canonicalSlug.split('/').pop() || '';
          if (isPlatformServer(this.platformId) && this.ssrResponse && currentParam !== canonicalParam) {
            if (!this.ssrResponse.headersSent) this.ssrResponse.redirect(301, canonicalSlug);
            return;
          }

          this.seoService.setProduit(product);
          this.updateBreadcrumbs();
          this.isLoading = false;
          if (isPlatformBrowser(this.platformId)) {
            this.startCountdown();
            this.pixelService.trackViewContent({ contentId: String(product.idProduit), contentName: product.nomProduit, value: product.prixPromo ?? product.prix });
          }
          this.loadAdditionalData(productId);
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  private startCountdown(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownText = null;

    if (!this.produit?.dateFinPromo) return;
    const fin = new Date(this.produit.dateFinPromo).getTime();
    const LIMIT = 48 * 60 * 60 * 1000;

    const update = () => {
      const reste = fin - Date.now();
      if (reste <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.countdownText = null;
        this.reloadProduit();
        return;
      }
      if (reste > LIMIT) { this.countdownText = null; return; }
      const h = Math.floor(reste / 3_600_000);
      const m = Math.floor((reste % 3_600_000) / 60_000);
      const s = Math.floor((reste % 60_000) / 1_000);
      this.countdownText = `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    update();
    this.countdownInterval = setInterval(update, 1_000);
  }

  private reloadProduit(): void {
    if (this.currentProductId) this.loadProduct(this.currentProductId);
  }

  private loadAdditionalData(productId: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isAuthenticated) this.checkWishlistStatus(productId);
    // Produits similaires : UI uniquement, pas utile pour le SSR / SEO du produit courant
    this.loadRelatedProducts();
  }

  private checkWishlistStatus(productId: number): void {
    // TODO: Implémenter quand l'API wishlist sera prête
    // this.apiService.getWishlist()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (wishlist) => {
    //       this.isInWishlist = wishlist.includes(productId);
    //     },
    //     error: (error) => {
    //       console.log('Wishlist non disponible:', error);
    //     }
    //   });
  }

  get imageUrls(): string[] {
    return this.produit?.images?.map(i => i.url).filter(Boolean) || [];
  }

  getMainImageUrl(): string {
    const urls = this.imageUrls;
    if (urls.length > 0 && this.selectedImageIndex < urls.length) {
      return urls[this.selectedImageIndex];
    }
    return 'assets/images/placeholder-product.jpg';
  }

  getImageUrl(imageUrl: string): string {
    return imageUrl || 'assets/images/placeholder-product.jpg';
  }

  getTechnicalSheetUrl(): string {
    if (this.produit?.ficheTechniquePDF) {
      const filePath = this.produit.ficheTechniquePDF;
      if (filePath.startsWith('http')) return filePath;
    }
    return '';
  }
  private loadRelatedProducts(): void {
    if (!this.produit?.categorie?.idCategorie) return;

    const categoryId = this.produit.categorie.idCategorie;

    this.apiService.getProduitsByCategorie(categoryId, { size: 8 })
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.log('Produits similaires non disponibles:', error);
          return [];
        })
      )
      .subscribe(response => {
        if (response && response.content) {
          this.relatedProducts = response.content.filter(p => p.idProduit !== this.produit?.idProduit);
        }
      });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = [
      { label: 'Accueil', route: '/' },
      { label: 'Produits', route: '/produits' }
    ];

    if (this.produit?.categorie) {
      this.breadcrumbs.push({
        label: this.produit.categorie.nomCategorie,
        route: buildCategorieUrl(this.produit.categorie.idCategorie, this.produit.categorie.nomCategorie)
      });
    }

    if (this.produit) {
      this.breadcrumbs.push({ label: this.produit.nomProduit });
    }
  }



  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  // NOUVEAU: Méthodes pour la galerie d'images
  openImageGallery(): void {
    this.showImageGallery = true;
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  }

  closeImageGallery(): void {
    this.showImageGallery = false;
    // Rétablir le scroll du body
    document.body.style.overflow = 'auto';
  }

  nextImage(): void {
    const count = this.imageUrls.length;
    if (count > 0) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % count;
    }
  }

  previousImage(): void {
    const count = this.imageUrls.length;
    if (count > 0) {
      this.selectedImageIndex = (this.selectedImageIndex - 1 + count) % count;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.videoSelectionne) this.fermerVideo();
    else if (this.showImageGallery) this.closeImageGallery();
  }

  selectionnerVideo(video: VideoProduit): void {
    if (!this.isPlatformBrowserFlag) return;
    this.videoSelectionne = video;
    document.body.style.overflow = 'hidden';
  }

  fermerVideo(): void {
    this.videoSelectionne = null;
    document.body.style.overflow = 'auto';
  }

  getYoutubeEmbedUrl(video: VideoProduit): SafeResourceUrl {
    const url = `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getFacebookEmbedUrl(video: VideoProduit): SafeResourceUrl {
    const href = encodeURIComponent(video.url);
    const url = `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&appId=`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  playVideo(videoPath: string): void {
    console.log('Play video:', videoPath);
  }

  // Quantity methods
  increaseQuantity(): void {
    if (this.produit && this.selectedQuantity < this.produit.stockDisponible) {
      this.selectedQuantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

  // Product actions
  addToCart(): void {
    if (!this.produit) return;

    this.isAddingToCart = true;

    try {
      this.cartService.addToCart(this.produit, this.selectedQuantity);
      this.toastService.success('Produit ajouté', `${this.produit.nomProduit} a été ajouté au panier`);
    } catch (error) {
      this.toastService.error('Erreur', 'Impossible d\'ajouter le produit au panier');
    }

    setTimeout(() => {
      this.isAddingToCart = false;
    }, 500);
  }

  buyNow(): void {
    if (!this.produit) return;

    this.cartService.addToCart(this.produit, this.selectedQuantity);
    this.router.navigate(['/panier']);
  }

  toggleWishlist(): void {
    if (!this.produit || !this.isAuthenticated) return;

    // Placeholder - implement when wishlist API is ready
    this.isInWishlist = !this.isInWishlist;
    const message = this.isInWishlist ? 'ajouté aux favoris' : 'retiré des favoris';
    this.toastService.success('Favoris', `Produit ${message}`);
  }

  shareProduct(method: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = window.location.href;

    switch (method) {
      case 'whatsapp':
        const devise = this.configService.config.devise || 'XOF';
        const message = `Bonjour, je suis intéressé(e) par ce produit: ${this.produit?.nomProduit}\nPrix: ${this.produit?.prix} ${devise}\nLien: ${url}`;
        const tel = this.firstTelephone || '';
        window.open(`https://wa.me/221${tel}?text=${encodeURIComponent(message)}`, '_blank');
        break;
    }
  }

  // UI helper methods
  hasTechnicalSpecs(): boolean {
    return this.allSpecs().length > 0;
  }

  allSpecs(): {label: string; value: string}[] {
    const specs: {label: string; value: string}[] = [];
    if (!this.produit) return specs;

    // 1. Attributs dynamiques (prioritaires)
    (this.produit.attributs || []).forEach(a => {
      if (a.valeurAttribut) {
        const affichage = a.unite ? `${a.valeurAttribut} ${a.unite}` : a.valeurAttribut;
        specs.push({label: a.nomAttribut, value: affichage});
      }
    });

    // 2. Colonnes fixes non nulles (éviter les doublons avec les attributs)
    const dynamicNames = new Set(specs.map(s => s.label.toLowerCase()));
    if (this.produit.puissanceBTU && !dynamicNames.has('puissance'))
      specs.push({label: 'Puissance', value: `${this.produit.puissanceBTU} BTU`});
    if (this.produit.consommationWatt && !dynamicNames.has('consommation'))
      specs.push({label: 'Consommation', value: `${this.produit.consommationWatt} W`});
    if (this.produit.labelEnergie && !dynamicNames.has('classe énergétique'))
      specs.push({label: 'Classe énergétique', value: this.produit.labelEnergie.replace(/_PLUS/g, '+')});
    if (this.produit.dimensions && !dynamicNames.has('dimensions'))
      specs.push({label: 'Dimensions', value: this.produit.dimensions});
    if (this.produit.poids && !dynamicNames.has('poids'))
      specs.push({label: 'Poids', value: `${this.produit.poids} kg`});
    if (this.produit.garantie && !dynamicNames.has('garantie'))
      specs.push({label: 'Garantie', value: this.produit.garantie});

    // 3. Modèle fabricant et EAN
    if (this.produit.modeleFabricant)
      specs.push({label: 'Modèle', value: this.produit.modeleFabricant});
    if (this.produit.ean)
      specs.push({label: 'EAN', value: this.produit.ean});

    return specs;
  }

  getStockIndicatorClass(): string {
    if (!this.produit?.disponibilite || this.produit.stockDisponible === 0) {
      return 'w-3 h-3 bg-red-500 rounded-full';
    } else if (this.produit.stockDisponible <= 5) {
      return 'w-3 h-3 bg-orange-500 rounded-full';
    } else {
      return 'w-3 h-3 bg-green-500 rounded-full';
    }
  }

  getStockTextClass(): string {
    if (!this.produit?.disponibilite || this.produit.stockDisponible === 0) {
      return 'text-red-600 font-medium';
    } else if (this.produit.stockDisponible <= 5) {
      return 'text-orange-600 font-medium';
    } else {
      return 'text-green-600 font-medium';
    }
  }

  getStockText(): string {
    if (!this.produit?.disponibilite) {
      return 'Produit indisponible';
    } else if (this.produit.stockDisponible === 0) {
      return 'Rupture de stock';
    } else if (this.produit.stockDisponible <= 5) {
      return 'Stock limité';
    } else {
      return 'En stock';
    }
  }

  getSpecifications(): {label: string, value: string}[] {
    const specs = [];

    if (this.produit?.puissanceBTU) {
      specs.push({ label: 'Puissance', value: `${this.produit.puissanceBTU} BTU` });
    }
    if (this.produit?.labelEnergie) {
      specs.push({ label: 'Classe énergétique', value: this.produit.labelEnergie.replace('_PLUS', '+') });
    }
    if (this.produit?.consommationWatt) {
      specs.push({ label: 'Consommation', value: `${this.produit.consommationWatt}W` });
    }
    if (this.produit?.dimensions) {
      specs.push({ label: 'Dimensions', value: this.produit.dimensions });
    }
    if (this.produit?.poids) {
      specs.push({ label: 'Poids', value: `${this.produit.poids} kg` });
    }
    if (this.produit?.garantie) {
      specs.push({ label: 'Garantie', value: this.produit.garantie });
    }
    if (this.produit?.refProduit) {
      specs.push({ label: 'Référence', value: this.produit.refProduit });
    }
    if (this.produit?.codeProduit) {
      specs.push({ label: 'Code produit', value: this.produit.codeProduit });
    }

    return specs;
  }

  goBack(): void {
    this.router.navigate(['/produits']);
  }
}
