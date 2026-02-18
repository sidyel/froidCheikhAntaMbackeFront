import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Produit, CartItem, Cart } from '../models/interfaces';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'froid_cheikh_cart';
  private cartSubject = new BehaviorSubject<Cart>(this.getInitialCart());
  public cart$ = this.cartSubject.asObservable();

  constructor(private toastService: ToastService) {}

  private getInitialCart(): Cart {
    const savedCart = localStorage.getItem(this.CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        return this.validateAndFixCart(parsedCart);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      }
    }
    return {
      items: [],
      totalItems: 0,
      totalPrice: 0
    };
  }

  private validateAndFixCart(cart: any): Cart {
    if (!cart || !Array.isArray(cart.items)) {
      return { items: [], totalItems: 0, totalPrice: 0 };
    }

    // Valider chaque élément du panier
    const validItems = cart.items.filter((item: any) =>
      item &&
      item.produit &&
      typeof item.quantite === 'number' &&
      item.quantite > 0 &&
      typeof item.sousTotal === 'number'
    );

    return this.calculateTotals({ ...cart, items: validItems });
  }

  private calculateTotals(cart: Cart): Cart {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantite, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + item.sousTotal, 0);

    return {
      ...cart,
      totalItems,
      totalPrice: Math.round(totalPrice * 100) / 100 // Arrondir à 2 décimales
    };
  }

  private saveCart(cart: Cart): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }

  private updateCart(cart: Cart): void {
    const updatedCart = this.calculateTotals(cart);
    this.cartSubject.next(updatedCart);
    this.saveCart(updatedCart);
  }

  addToCart(produit: Produit, quantite: number = 1): void {
    if (!produit || quantite <= 0) {
      this.toastService.error('Erreur', 'Produit ou quantité invalide');
      return;
    }

    if (!produit.disponibilite) {
      this.toastService.error('Produit indisponible', 'Ce produit n\'est actuellement pas disponible');
      return;
    }

    if (quantite > produit.stockDisponible) {
      this.toastService.error('Stock insuffisant', `Seulement ${produit.stockDisponible} unité(s) disponible(s)`);
      return;
    }

    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.items.findIndex(
      item => item.produit.idProduit === produit.idProduit
    );

    if (existingItemIndex >= 0) {
      // Produit déjà dans le panier, mettre à jour la quantité
      const existingItem = currentCart.items[existingItemIndex];
      const newQuantite = existingItem.quantite + quantite;

      if (newQuantite > produit.stockDisponible) {
        this.toastService.error('Stock insuffisant',
          `Impossible d'ajouter ${quantite} unité(s). Stock disponible: ${produit.stockDisponible}, déjà dans le panier: ${existingItem.quantite}`);
        return;
      }

      currentCart.items[existingItemIndex] = {
        ...existingItem,
        quantite: newQuantite,
        sousTotal: newQuantite * produit.prix
      };
    } else {
      // Nouveau produit
      const newItem: CartItem = {
        produit,
        quantite,
        sousTotal: quantite * produit.prix
      };
      currentCart.items.push(newItem);
    }

    this.updateCart(currentCart);
    this.toastService.success('Produit ajouté', `${produit.nomProduit} a été ajouté au panier`);
  }

  removeFromCart(produitId: number): void {
    const currentCart = this.cartSubject.value;
    const filteredItems = currentCart.items.filter(item => item.produit.idProduit !== produitId);

    if (filteredItems.length < currentCart.items.length) {
      this.updateCart({ ...currentCart, items: filteredItems });
      this.toastService.success('Produit retiré', 'Le produit a été retiré du panier');
    }
  }

  updateQuantity(produitId: number, quantite: number): void {
    if (quantite <= 0) {
      this.removeFromCart(produitId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const itemIndex = currentCart.items.findIndex(item => item.produit.idProduit === produitId);

    if (itemIndex >= 0) {
      const item = currentCart.items[itemIndex];

      if (quantite > item.produit.stockDisponible) {
        this.toastService.error('Stock insuffisant', `Seulement ${item.produit.stockDisponible} unité(s) disponible(s)`);
        return;
      }

      currentCart.items[itemIndex] = {
        ...item,
        quantite,
        sousTotal: quantite * item.produit.prix
      };

      this.updateCart(currentCart);
    }
  }

  increaseQuantity(produitId: number): void {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.produit.idProduit === produitId);

    if (item) {
      this.updateQuantity(produitId, item.quantite + 1);
    }
  }

  decreaseQuantity(produitId: number): void {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(item => item.produit.idProduit === produitId);

    if (item) {
      this.updateQuantity(produitId, item.quantite - 1);
    }
  }

  clearCart(): void {
    const emptyCart: Cart = {
      items: [],
      totalItems: 0,
      totalPrice: 0
    };

    this.updateCart(emptyCart);
    this.toastService.success('Panier vidé', 'Tous les produits ont été retirés du panier');
  }

  getCart(): Cart {
    return this.cartSubject.value;
  }

  getCartItemCount(): number {
    return this.cartSubject.value.totalItems;
  }

  getCartTotal(): number {
    return this.cartSubject.value.totalPrice;
  }

  isInCart(produitId: number): boolean {
    return this.cartSubject.value.items.some(item => item.produit.idProduit === produitId);
  }

  getCartItem(produitId: number): CartItem | undefined {
    return this.cartSubject.value.items.find(item => item.produit.idProduit === produitId);
  }

  // Méthodes pour la commande
  getCartItemsForOrder(): any[] {
    return this.cartSubject.value.items.map(item => ({
      produitId: item.produit.idProduit,
      quantite: item.quantite,
      prixUnitaire: item.produit.prix,
      sousTotal: item.sousTotal
    }));
  }

  // Validation du panier avant commande
  validateCart(): { valid: boolean; errors: string[] } {
    const cart = this.cartSubject.value;
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Le panier est vide');
    }

    cart.items.forEach(item => {
      if (!item.produit.disponibilite) {
        errors.push(`${item.produit.nomProduit} n'est plus disponible`);
      }

      if (item.quantite > item.produit.stockDisponible) {
        errors.push(`Stock insuffisant pour ${item.produit.nomProduit} (disponible: ${item.produit.stockDisponible})`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Synchroniser avec les données produit actualisées
  syncWithUpdatedProducts(produits: Produit[]): void {
    const currentCart = this.cartSubject.value;
    let hasChanges = false;

    const updatedItems = currentCart.items.map(item => {
      const updatedProduit = produits.find(p => p.idProduit === item.produit.idProduit);

      if (updatedProduit) {
        // Vérifier si le prix a changé
        if (updatedProduit.prix !== item.produit.prix) {
          hasChanges = true;
          return {
            ...item,
            produit: updatedProduit,
            sousTotal: item.quantite * updatedProduit.prix
          };
        }

        // Mettre à jour les informations du produit
        return {
          ...item,
          produit: updatedProduit
        };
      }

      return item;
    }).filter(item => item.produit.disponibilite); // Retirer les produits non disponibles

    if (hasChanges || updatedItems.length !== currentCart.items.length) {
      this.updateCart({ ...currentCart, items: updatedItems });

      if (updatedItems.length !== currentCart.items.length) {
        this.toastService.warning('Panier mis à jour', 'Certains produits non disponibles ont été retirés');
      }
    }
  }
}
