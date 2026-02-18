import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { Cart, CartItem, Breadcrumb } from '../../../models/interfaces';

@Component({
  selector: 'app-cart',
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Breadcrumb -->
      <app-breadcrumb [breadcrumbs]="breadcrumbs"></app-breadcrumb>

      <div class="container mx-auto px-4 py-8">

        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Mon Panier
          </h1>
          <p class="text-gray-600" *ngIf="cart.totalItems > 0">
            {{ cart.totalItems }} article{{ cart.totalItems > 1 ? 's' : '' }} dans votre panier
          </p>
        </div>

        <!-- Cart Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" *ngIf="cart.items.length > 0">

          <!-- Cart Items -->
          <div class="lg:col-span-2 space-y-4">
            <div
              *ngFor="let item of cart.items; trackBy: trackByItem"
              class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">

              <div class="p-6">
                <div class="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">

                  <!-- Product Image -->
                  <div class="flex-shrink-0">
                    <img
                      [src]="getProductImageUrl(item.produit)"
                      [alt]="item.produit.nomProduit"
                      class="w-24 h-24 object-cover rounded-lg cursor-pointer"
                      (click)="navigateToProduct(item.produit.idProduit)"
                      onerror="this.src='assets/images/placeholder-product.jpg'">
                  </div>

                  <!-- Product Info -->
                  <div class="flex-1">
                    <div class="flex items-start justify-between">
                      <div>
                        <h3
                          class="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
                          (click)="navigateToProduct(item.produit.idProduit)">
                          {{ item.produit.nomProduit }}
                        </h3>
                        <p class="text-sm text-gray-500 mt-1" *ngIf="item.produit.marque">
                          {{ item.produit.marque.nomMarque }}
                        </p>
                        <p class="text-sm text-gray-500" *ngIf="item.produit.refProduit">
                          Réf: {{ item.produit.refProduit }}
                        </p>
                      </div>

                      <!-- Remove Button -->
                      <button
                        (click)="removeItem(item.produit.idProduit)"
                        class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Retirer du panier">
                        <lucide-icon name="trash-2" class="w-5 h-5"></lucide-icon>
                      </button>
                    </div>

                    <!-- Stock Status -->
                    <div class="mt-2">
                      <span
                        *ngIf="item.produit.disponibilite && item.produit.stockDisponible >= item.quantite"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <lucide-icon name="check" class="w-3 h-3 mr-1"></lucide-icon>
                        En stock
                      </span>
                      <span
                        *ngIf="!item.produit.disponibilite || item.produit.stockDisponible < item.quantite"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <lucide-icon name="alert-circle" class="w-3 h-3 mr-1"></lucide-icon>
                        Stock insuffisant
                      </span>
                    </div>

                    <!-- Price and Quantity -->
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 space-y-3 sm:space-y-0">

                      <!-- Quantity Selector -->
                      <div class="flex items-center space-x-3">
                        <span class="text-sm text-gray-700">Quantité:</span>
                        <app-quantity-selector
                          [ngModel]="item.quantite"
                          [min]="1"
                          [max]="item.produit.stockDisponible"
                          [maxStock]="item.produit.stockDisponible"
                          [disabled]="!item.produit.disponibilite"
                          (quantityChange)="updateQuantity(item.produit.idProduit, $event)">
                        </app-quantity-selector>
                      </div>

                      <!-- Prices -->
                      <div class="text-right">
                        <div class="text-sm text-gray-500">
                          {{ item.produit.prix | currency:'XOF':'symbol':'1.0-0' }} × {{ item.quantite }}
                        </div>
                        <div class="text-lg font-bold text-primary-600">
                          {{ item.sousTotal | currency:'XOF':'symbol':'1.0-0' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cart Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">Résumé de la commande</h2>

              <!-- Price Breakdown -->
              <div class="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Sous-total ({{ cart.totalItems }} article{{ cart.totalItems > 1 ? 's' : '' }})</span>
                  <span class="font-medium">{{ cart.totalPrice | currency:'XOF':'symbol':'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Frais de livraison</span>
                  <span class="font-medium text-green-600">Gratuit</span>
                </div>
              </div>

              <!-- Total -->
              <div class="flex justify-between text-lg font-bold text-gray-900 mb-6">
                <span>Total</span>
                <span class="text-primary-600">{{ cart.totalPrice | currency:'XOF':'symbol':'1.0-0' }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="space-y-3">
                <button
                  (click)="proceedToCheckout()"
                  [disabled]="!canProceedToCheckout()"
                  class="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <lucide-icon name="credit-card" class="w-5 h-5"></lucide-icon>
                  <span>Passer la commande</span>
                </button>

                <button
                  (click)="continueShopping()"
                  class="w-full btn-outline py-3">
                  <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
                  <span>Continuer mes achats</span>
                </button>
              </div>

              <!-- Security Info -->
              <div class="mt-6 pt-4 border-t border-gray-200">
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <lucide-icon name="shield" class="w-4 h-4 text-green-500"></lucide-icon>
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div class="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                  <lucide-icon name="truck" class="w-4 h-4 text-blue-500"></lucide-icon>
                  <span>Livraison gratuite à Dakar</span>
                </div>
              </div>

              <!-- Stock Issues Warning -->
              <div class="mt-4" *ngIf="hasStockIssues()">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div class="flex items-center space-x-2">
                    <lucide-icon name="alert-circle" class="w-4 h-4 text-yellow-600"></lucide-icon>
                    <span class="text-yellow-800 text-sm font-medium">Attention</span>
                  </div>
                  <p class="text-yellow-700 text-xs mt-1">
                    Certains articles ont un stock limité. Finalisez votre commande rapidement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Cart -->
        <div *ngIf="cart.items.length === 0" class="text-center py-16">
          <div class="max-w-md mx-auto">
            <lucide-icon name="shopping-cart" class="w-24 h-24 text-gray-300 mx-auto mb-6"></lucide-icon>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">
              Votre panier est vide
            </h2>
            <p class="text-gray-600 mb-8">
              Découvrez notre large gamme de produits et ajoutez vos articles favoris au panier.
            </p>
            <button
              (click)="continueShopping()"
              class="btn-primary text-lg px-8 py-3">
              <lucide-icon name="package" class="w-5 h-5"></lucide-icon>
              <span>Découvrir nos produits</span>
            </button>
          </div>
        </div>

        <!-- Recommended Products -->
        <div class="mt-12" *ngIf="cart.items.length > 0 && recommendedProducts.length > 0">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Vous pourriez aussi aimer</h2>
          <div class="products-grid">
            <app-product-card
              *ngFor="let product of recommendedProducts.slice(0, 4)"
              [produit]="product">
            </app-product-card>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8 bg-white rounded-xl shadow-lg p-6" *ngIf="cart.items.length > 0">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Actions rapides</h3>
              <p class="text-gray-600 text-sm">Gérez votre panier facilement</p>
            </div>

            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                (click)="saveForLater()"
                class="btn-outline text-sm py-2 px-4">
                <lucide-icon name="heart" class="w-4 h-4"></lucide-icon>
                <span>Sauvegarder pour plus tard</span>
              </button>

              <button
                (click)="clearCart()"
                class="btn-danger text-sm py-2 px-4">
                <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                <span>Vider le panier</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  recommendedProducts: any[] = [];
  breadcrumbs: Breadcrumb[] = [
    { label: 'Accueil', route: '/' },
    { label: 'Mon Panier', route: undefined }
  ];

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadRecommendedProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCart(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });
  }

  private loadRecommendedProducts(): void {
    // Logique pour charger des produits recommandés
    // basée sur les articles du panier ou les catégories
    this.recommendedProducts = [];
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      this.cartService.clearCart();
    }
  }

  proceedToCheckout(): void {
    if (this.canProceedToCheckout()) {
      this.router.navigate(['/commande']);
    }
  }

  continueShopping(): void {
    this.router.navigate(['/produits']);
  }

  navigateToProduct(productId: number): void {
    this.router.navigate(['/produit', productId]);
  }

  saveForLater(): void {
    // Implémenter la sauvegarde pour plus tard (wishlist)
    this.toastService.info('Fonctionnalité bientôt disponible', 'Vous pourrez bientôt sauvegarder votre panier');
  }

  // Helper methods
  canProceedToCheckout(): boolean {
    if (this.cart.items.length === 0) return false;

    // Vérifier que tous les articles sont disponibles
    return this.cart.items.every(item =>
      item.produit.disponibilite &&
      item.produit.stockDisponible >= item.quantite
    );
  }

  hasStockIssues(): boolean {
    return this.cart.items.some(item =>
      !item.produit.disponibilite ||
      item.produit.stockDisponible < item.quantite ||
      item.produit.stockDisponible <= 5
    );
  }

  getProductImageUrl(produit: any): string {
    if (produit.listeImages && produit.listeImages.length > 0) {
      return `http://localhost:8080/uploads/${produit.listeImages[0]}`;
    }
    return 'assets/images/placeholder-product.jpg';
  }

  trackByItem(index: number, item: CartItem): number {
    return item.produit.idProduit;
  }

  // Formatage et calculs
  getItemSubtotal(item: CartItem): number {
    return item.produit.prix * item.quantite;
  }

  getCartWeight(): number {
    return this.cart.items.reduce((total, item) => {
      const weight = item.produit.poids || 0;
      return total + (weight * item.quantite);
    }, 0);
  }

  getEstimatedDeliveryDate(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 2); // Livraison sous 48h
    return now;
  }

  // Validation du panier
  validateCartItems(): { valid: boolean; errors: string[] } {
    return this.cartService.validateCart();
  }
}
