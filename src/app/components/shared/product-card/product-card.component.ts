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
        <div class="aspect-w-1 aspect-h-1 w-full">
          <img
            [src]="getMainImageUrl()"
            [alt]="produit.nomProduit"
            class="w-full h-48 sm:h-56 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
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

        <!-- Discount Badge (if needed) -->
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
          class="sm:hidden absolute bottom-2 right-2 p-2 rounded-full shadow-lg hover:scale-105 transition-all"
          [title]="isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'">
          <lucide-icon name="heart" class="w-4 h-4" [class.fill-current]="isInWishlist"></lucide-icon>
        </button>
      </div>

      <!-- Product Info -->
      <div class="card-body p-3 sm:p-4">
        <!-- Brand & Reference - Compact sur mobile -->
        <div class="flex items-center justify-between mb-2">
          <span *ngIf="produit.marque" class="text-xs sm:text-sm text-gray-500 font-medium truncate">
            {{ produit.marque.nomMarque }}
          </span>
          <span *ngIf="produit.refProduit" class="text-xs text-gray-400 ml-2">
            {{ produit.refProduit }}
          </span>
        </div>

        <!-- Product Name - Taille adaptative -->
        <h3 class="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {{ produit.nomProduit }}
        </h3>

        <!-- Price - Taille adaptative -->
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <div class="flex items-center space-x-1 sm:space-x-2">
            <span class="text-lg sm:text-xl md:text-2xl font-bold text-primary-600">
              {{ produit.prix | currency:'XOF':'symbol':'1.0-0' }}
            </span>
            <span *ngIf="hasDiscount()" class="text-sm sm:text-base md:text-lg text-gray-500 line-through">
              {{ getOriginalPrice() | currency:'XOF':'symbol':'1.0-0' }}
            </span>
          </div>
        </div>

        <!-- Actions - Layout adaptatif -->
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <!-- Bouton Ajouter au panier - Pleine largeur sur mobile -->
          <button
            (click)="addToCart($event)"
            [disabled]="!produit.disponibilite || produit.stockDisponible === 0 || isAddingToCart"
            class="flex-1 btn-primary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed py-2 sm:py-2.5"
            [class.opacity-50]="!produit.disponibilite">
            <lucide-icon name="shopping-cart" class="w-3 h-3 sm:w-4 sm:h-4" *ngIf="!isAddingToCart"></lucide-icon>
            <div class="spinner-small sm:spinner" *ngIf="isAddingToCart"></div>
            <span class="truncate">{{ getAddToCartText() }}</span>
          </button>

          <!-- Bouton Voir - Plus petit sur mobile -->
          <button
            (click)="navigateToProduct($event)"
            class="px-3 sm:px-4 py-2 sm:py-2.5 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-xs sm:text-sm">
            <lucide-icon name="eye" class="w-3 h-3 sm:w-4 sm:h-4"></lucide-icon>
          </button>
        </div>

        <!-- Stock Info - Taille réduite sur mobile -->
        <div class="mt-2 text-xs sm:text-sm text-gray-500" *ngIf="produit.disponibilite">
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
    /* Styles de base pour la carte */
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

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Spinner pour le chargement */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-small {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Badge styles */
    .badge {
      display: inline-block;
      border-radius: 0.375rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    /* Line clamp pour tronquer le texte */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Boutons responsive */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 600;
      border-radius: 0.5rem;
      transition: all 0.3s ease;
    }

    /* Ajustements pour petits écrans */
    @media (max-width: 640px) {
      .card-body {
        padding: 0.75rem;
      }

      /* Réduire l'espace entre les éléments sur mobile */
      .card-body > * + * {
        margin-top: 0.5rem;
      }

      /* Optimiser la hauteur de l'image sur mobile */
      .aspect-w-1 img {
        height: 180px;
        object-fit: cover;
      }

      /* Ajuster les badges sur mobile */
      .badge {
        font-size: 0.625rem;
        padding: 0.25rem 0.5rem;
      }

      /* Réduire la taille du bouton wishlist mobile */
      .sm\\:hidden {
        padding: 0.5rem;
      }

      .sm\\:hidden lucide-icon {
        width: 1rem;
        height: 1rem;
      }
    }

    /* Ajustements pour très petits écrans */
    @media (max-width: 420px) {
      .card-body h3 {
        font-size: 0.875rem;
        line-height: 1.25;
      }

      .btn-primary {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
      }

      /* Prix plus compact */
      .text-lg {
        font-size: 1rem;
      }

      /* Réduire le padding global */
      .card-body {
        padding: 0.5rem;
      }
    }

    /* Ajustements pour écrans moyens (tablettes) */
    @media (min-width: 641px) and (max-width: 900px) {
      .aspect-w-1 img {
        height: 224px;
      }
    }

    /* Optimisation du hover pour desktop uniquement */
    @media (hover: hover) and (pointer: fine) {
      .card:hover {
        transform: translateY(-6px);
      }

      .group:hover .group-hover\\:scale-105 {
        transform: scale(1.05);
      }
    }

    /* Désactiver les transformations sur mobile pour de meilleures performances */
    @media (hover: none) {
      .card:active {
        transform: scale(0.98);
      }
    }

    /* Améliorer la lisibilité du texte tronqué */
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Style pour les boutons désactivés */
    .disabled\\:opacity-50:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .disabled\\:cursor-not-allowed:disabled {
      cursor: not-allowed;
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

    // Vérifier si le produit est dans la wishlist
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
      return `http://localhost:8080/uploads/${this.produit.listeImages[0]}`;
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

    // Simuler un délai pour l'UX
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
    if (!this.produit.disponibilite) {
      return 'Indisponible';
    }
    if (this.produit.stockDisponible === 0) {
      return 'Rupture';
    }
    if (this.isAddingToCart) {
      return 'Ajout...';
    }
    return 'Ajouter';
  }

  hasTechnicalInfo(): boolean {
    return !!(this.produit.puissanceBTU || this.produit.labelEnergie || this.produit.consommationWatt);
  }

  hasDiscount(): boolean {
    // Logique pour détecter une remise (à adapter selon vos besoins)
    // Pour l'instant, on retourne false car pas de champ discount dans le modèle
    return false;
  }

  getDiscountPercentage(): number {
    // Logique pour calculer le pourcentage de remise
    return 0;
  }

  getOriginalPrice(): number {
    // Logique pour récupérer le prix original avant remise
    return this.produit.prix;
  }

  // Méthodes utiles pour le parent
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
