import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Produit } from '../../../models/interfaces';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-product-card',
  template: `
    <div class="card group cursor-pointer overflow-hidden"
         (click)="navigateToProduct()"
         [class.opacity-60]="!produit.disponibilite">

      <!-- Product Image -->
      <div class="relative overflow-hidden">
        <div class="product-image-wrapper">
          <img
            [src]="getMainImageUrl()"
            [alt]="produit.nomProduit"
            class="product-image transition-transform duration-300 group-hover:scale-105"
            onerror="this.src='assets/images/placeholder-product.jpg'"
          >
        </div>

        <!-- Overlay Actions - Masqué sur mobile -->
        <div class="hidden sm:flex absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="flex space-x-2">
            <!-- Quick View -->
            <button
              (click)="onQuickView($event)"
              class="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              title="Aperçu rapide">
              <lucide-icon name="eye" class="w-5 h-5 text-gray-700"></lucide-icon>
            </button>

            <!-- Add to Wishlist -->
            <button
              *ngIf="isAuthenticated"
              (click)="toggleWishlist($event)"
              [class]="isInWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-700'"
              class="p-2 rounded-full shadow-lg hover:scale-105 transition-all"
              [title]="isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'">
              <lucide-icon name="heart" class="w-5 h-5" [class.fill-current]="isInWishlist"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Stock Status Badge -->
        <div class="absolute top-2 left-2">
          <span *ngIf="!produit.disponibilite"
                class="badge bg-red-500 text-white px-2 py-1 text-xs font-semibold">
            Indisponible
          </span>
          <span *ngIf="produit.disponibilite && produit.stockDisponible <= 5"
                class="badge bg-orange-500 text-white px-2 py-1 text-xs font-semibold">
            Stock limité
          </span>
        </div>

        <!-- Discount Badge -->
        <div class="absolute top-2 right-2" *ngIf="hasDiscount()">
          <span class="badge bg-red-500 text-white px-2 py-1 text-xs font-semibold">
            -{{ getDiscountPercentage() }}%
          </span>
        </div>

        <!-- Wishlist Button for Mobile - Always visible -->
        <button
          *ngIf="isAuthenticated"
          (click)="toggleWishlist($event)"
          [class]="isInWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700'"
          class="sm:hidden absolute bottom-2 right-2 p-1.5 rounded-full shadow-lg hover:scale-105 transition-all"
          [title]="isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'">
          <lucide-icon name="heart" class="w-3.5 h-3.5" [class.fill-current]="isInWishlist"></lucide-icon>
        </button>
      </div>

      <!-- Product Info -->
      <div class="card-body">
        <!-- Brand & Reference -->
        <div class="flex items-center justify-between mb-1">
          <span *ngIf="produit.marque" class="brand-label truncate">
            {{ produit.marque.nomMarque }}
          </span>
          <span *ngIf="produit.refProduit" class="ref-label ml-1 flex-shrink-0">
            {{ produit.refProduit }}
          </span>
        </div>

        <!-- Product Name -->
        <h3 class="product-name line-clamp-2 group-hover:text-primary-600 transition-colors">
          {{ produit.nomProduit }}
        </h3>

        <!-- Price -->
        <div class="price-row">
          <span class="price-main">
            {{ produit.prix | currency:'XOF':'symbol':'1.0-0' }}
          </span>
          <span *ngIf="hasDiscount()" class="price-original">
            {{ getOriginalPrice() | currency:'XOF':'symbol':'1.0-0' }}
          </span>
        </div>

        <!-- Actions -->
        <div class="actions-row">
          <!-- Bouton Ajouter au panier -->
          <button
            (click)="addToCart($event)"
            [disabled]="!produit.disponibilite || produit.stockDisponible === 0 || isAddingToCart"
            class="btn-add-cart"
            [class.opacity-50]="!produit.disponibilite">
            <lucide-icon name="shopping-cart" class="btn-icon" *ngIf="!isAddingToCart"></lucide-icon>
            <div class="spinner-small" *ngIf="isAddingToCart"></div>
            <span class="truncate">{{ getAddToCartText() }}</span>
          </button>

          <!-- Bouton Voir — masqué sur très petits écrans -->
          <button
            (click)="navigateToProduct($event)"
            class="btn-view hidden sm:flex">
            <lucide-icon name="eye" class="btn-icon"></lucide-icon>
          </button>
        </div>

        <!-- Stock Info -->
        <div class="stock-info" *ngIf="produit.disponibilite">
          <span *ngIf="produit.stockDisponible > 10">
            En stock ({{ produit.stockDisponible }}+)
          </span>
          <span *ngIf="produit.stockDisponible <= 10 && produit.stockDisponible > 0"
                class="text-orange-600">
            Plus que {{ produit.stockDisponible }} en stock
          </span>
          <span *ngIf="produit.stockDisponible === 0" class="text-red-600">
            Rupture de stock
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ========================================
       CARTE DE BASE
       ======================================== */
    .card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);
    }

    /* ========================================
       IMAGE PRODUIT
       Ratio carré fixe + object-fit: contain
       ======================================== */
    .product-image-wrapper {
      width: 100%;
      aspect-ratio: 1 / 1;
      background-color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 0.5rem;
    }

    /* ========================================
       CARD BODY — flex colonne
       ======================================== */
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0.875rem;
      gap: 0.375rem;
    }

    /* ========================================
       TEXTES
       ======================================== */
    .brand-label {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .ref-label {
      font-size: 0.65rem;
      color: #9ca3af;
    }

    .product-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      line-height: 1.3;
      margin: 0;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ========================================
       PRIX
       ======================================== */
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 0.375rem;
      margin-top: 0.25rem;
    }

    .price-main {
      font-size: 1.1rem;
      font-weight: 700;
      color: #2563eb;
    }

    .price-original {
      font-size: 0.8rem;
      color: #9ca3af;
      text-decoration: line-through;
    }

    /* ========================================
       ACTIONS
       ======================================== */
    .actions-row {
      display: flex;
      gap: 0.375rem;
      margin-top: auto;
      padding-top: 0.5rem;
    }

    .btn-add-cart {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      background-color: #2563eb;
      color: white;
      font-weight: 600;
      font-size: 0.75rem;
      padding: 0.5rem 0.5rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 0;
    }

    .btn-add-cart:hover:not(:disabled) {
      background-color: #1d4ed8;
    }

    .btn-add-cart:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-view {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.625rem;
      border: 1px solid #2563eb;
      color: #2563eb;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      background: transparent;
      flex-shrink: 0;
    }

    .btn-view:hover {
      background-color: #eff6ff;
    }

    .btn-icon {
      width: 0.875rem;
      height: 0.875rem;
      flex-shrink: 0;
    }

    /* ========================================
       STOCK INFO
       ======================================== */
    .stock-info {
      font-size: 0.7rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    /* ========================================
       BADGE
       ======================================== */
    .badge {
      display: inline-block;
      border-radius: 0.375rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    /* ========================================
       SPINNER
       ======================================== */
    .spinner-small {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ========================================
       MOBILE — cartes étroites (2 colonnes)
       ======================================== */
    @media (max-width: 480px) {
      .card-body {
        padding: 0.625rem;
        gap: 0.25rem;
      }

      .product-name {
        font-size: 0.8rem;
        line-height: 1.25;
      }

      .price-main {
        font-size: 0.95rem;
      }

      .brand-label {
        font-size: 0.65rem;
      }

      .actions-row {
        padding-top: 0.375rem;
      }

      .btn-add-cart {
        font-size: 0.7rem;
        padding: 0.4rem 0.375rem;
        gap: 0.2rem;
      }

      /* Icône légèrement plus petite */
      .btn-icon {
        width: 0.75rem;
        height: 0.75rem;
      }

      /* Stock info encore plus compact */
      .stock-info {
        font-size: 0.625rem;
      }

      /* Badge plus petit */
      .badge {
        font-size: 0.55rem;
        padding: 0.2rem 0.375rem;
      }

      /* Image padding réduit */
      .product-image {
        padding: 0.35rem;
      }
    }

    /* Très petits écrans (≤ 360px) */
    @media (max-width: 360px) {
      .card-body {
        padding: 0.5rem;
      }

      .product-name {
        font-size: 0.75rem;
      }

      .price-main {
        font-size: 0.875rem;
      }

      .btn-add-cart {
        font-size: 0.65rem;
        padding: 0.375rem 0.25rem;
      }

      .product-image {
        padding: 0.25rem;
      }
    }

    /* ========================================
       DESKTOP — hover optimisé
       ======================================== */
    @media (hover: hover) and (pointer: fine) {
      .card:hover {
        transform: translateY(-6px);
      }
    }

    /* Désactiver les transformations sur mobile */
    @media (hover: none) {
      .card:active {
        transform: scale(0.98);
      }
    }

    /* Utilitaires */
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class ProductCardComponent {
  @Input() produit!: Produit;
  @Input() showQuickActions = true;
  @Input() showTechnicalInfo = true;
  @Output() quickView = new EventEmitter<Produit>();
  @Output() wishlistToggle = new EventEmitter<{produit: Produit, isAdding: boolean}>();

  isAddingToCart = false;
  isInWishlist = false;
  isAuthenticated = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private apiService: ApiService,
    private toastService: ToastService
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();

    if (this.isAuthenticated) {
      this.checkWishlistStatus();
    }
  }

  private checkWishlistStatus(): void {
    this.apiService.getWishlist().subscribe({
      next: (wishlist) => {
        this.isInWishlist = wishlist.includes(this.produit.idProduit);
      },
      error: (error) => {
        console.error('Erreur lors de la vérification de la wishlist:', error);
      }
    });
  }

  getMainImageUrl(): string {
    if (this.produit.listeImages && this.produit.listeImages.length > 0) {
      const image = this.produit.listeImages[0];
      if (image.startsWith('http')) return image;
    }
    return 'assets/images/placeholder-product.jpg';
  }

  navigateToProduct(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/produit', this.produit.idProduit]);
  }

  addToCart(event: Event): void {
    event.stopPropagation();

    if (!this.produit.disponibilite || this.produit.stockDisponible === 0) {
      this.toastService.error('Produit indisponible', 'Ce produit n\'est pas disponible actuellement');
      return;
    }

    this.isAddingToCart = true;

    setTimeout(() => {
      this.cartService.addToCart(this.produit, 1);
      this.isAddingToCart = false;
    }, 300);
  }

  onQuickView(event: Event): void {
    event.stopPropagation();
    this.quickView.emit(this.produit);
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();

    if (!this.isAuthenticated) {
      this.toastService.warning('Connexion requise', 'Veuillez vous connecter pour ajouter des produits à votre liste de souhaits');
      this.router.navigate(['/connexion']);
      return;
    }

    const isAdding = !this.isInWishlist;

    if (isAdding) {
      this.apiService.ajouterAWishlist(this.produit.idProduit).subscribe({
        next: () => {
          this.isInWishlist = true;
          this.toastService.wishlistAdded(this.produit.nomProduit);
          this.wishlistToggle.emit({ produit: this.produit, isAdding: true });
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout à la wishlist:', error);
          this.toastService.error('Erreur', 'Impossible d\'ajouter le produit à la wishlist');
        }
      });
    } else {
      this.apiService.retirerDeWishlist(this.produit.idProduit).subscribe({
        next: () => {
          this.isInWishlist = false;
          this.toastService.wishlistRemoved(this.produit.nomProduit);
          this.wishlistToggle.emit({ produit: this.produit, isAdding: false });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la wishlist:', error);
          this.toastService.error('Erreur', 'Impossible de retirer le produit de la wishlist');
        }
      });
    }
  }

  getAddToCartText(): string {
    if (!this.produit.disponibilite) return 'Indisponible';
    if (this.produit.stockDisponible === 0) return 'Rupture';
    if (this.isAddingToCart) return 'Ajout...';
    return 'Ajouter';
  }

  hasTechnicalInfo(): boolean {
    return !!(this.produit.puissanceBTU || this.produit.labelEnergie || this.produit.consommationWatt);
  }

  hasDiscount(): boolean {
    return false;
  }

  getDiscountPercentage(): number {
    return 0;
  }

  getOriginalPrice(): number {
    return this.produit.prix;
  }

  isProductInCart(): boolean {
    return this.cartService.isInCart(this.produit.idProduit);
  }

  getCartQuantity(): number {
    const cartItem = this.cartService.getCartItem(this.produit.idProduit);
    return cartItem ? cartItem.quantite : 0;
  }

  canAddToCart(): boolean {
    return this.produit.disponibilite && this.produit.stockDisponible > 0;
  }
}
