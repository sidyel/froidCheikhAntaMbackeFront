import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { Produit } from '../../../models/interfaces';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  wishlistIds: number[] = [];
  wishlistProduits: Produit[] = [];
  isLoading = true;
  isLoadingProduits = false;
  removingItems: Set<number> = new Set();

  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWishlist(): void {
    this.isLoading = true;

    this.apiService.getWishlist()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (ids) => {
          this.wishlistIds = ids;
          if (ids.length > 0) {
            this.loadWishlistProduits();
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement de la wishlist:', error);
          this.toastService.error('Erreur lors du chargement de votre liste de souhaits');
        }
      });
  }

  loadWishlistProduits(): void {
    if (this.wishlistIds.length === 0) {
      this.wishlistProduits = [];
      return;
    }

    this.isLoadingProduits = true;

    this.apiService.getProduitsById(this.wishlistIds)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProduits = false)
      )
      .subscribe({
        next: (produits) => {
          this.wishlistProduits = produits;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.toastService.error('Erreur lors du chargement des produits');
        }
      });
  }
  onImgError(event: Event) {
    // Vérifie que target est bien une image
    if (event.target instanceof HTMLImageElement) {
      event.target.src = '/assets/images/placeholder.jpg';
    }
  }


  retirerDeWishlist(produitId: number): void {
    this.removingItems.add(produitId);

    this.apiService.retirerDeWishlist(produitId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.removingItems.delete(produitId))
      )
      .subscribe({
        next: () => {
          this.wishlistIds = this.wishlistIds.filter(id => id !== produitId);
          this.wishlistProduits = this.wishlistProduits.filter(p => p.idProduit !== produitId);
          this.toastService.success('Produit retiré de votre liste de souhaits');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.toastService.error('Erreur lors de la suppression du produit');
        }
      });
  }

  ajouterAuPanier(produit: Produit): void {
    this.cartService.addToCart(produit, 1);
    this.toastService.success(`${produit.nomProduit} ajouté au panier`);
  }

  ajouterToutAuPanier(): void {
    this.wishlistProduits.forEach(produit => {
      if (produit.disponibilite && produit.stockDisponible > 0) {
        this.cartService.addToCart(produit, 1);
      }
    });
    this.toastService.success('Produits disponibles ajoutés au panier');
  }

  viderWishlist(): void {
    if (this.wishlistProduits.length === 0) return;

    const promises = this.wishlistIds.map(id =>
      this.apiService.retirerDeWishlist(id).toPromise()
    );

    Promise.all(promises)
      .then(() => {
        this.wishlistIds = [];
        this.wishlistProduits = [];
        this.toastService.success('Liste de souhaits vidée');
      })
      .catch(error => {
        console.error('Erreur lors du vidage de la wishlist:', error);
        this.toastService.error('Erreur lors du vidage de la liste');
      });
  }

  partagerWishlist(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Ma liste de souhaits - Froid Cheikh',
        text: 'Découvrez ma sélection de produits',
        url: url
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.toastService.success('Lien copié dans le presse-papiers');
    }
  }

  isItemRemoving(produitId: number): boolean {
    return this.removingItems.has(produitId);
  }

  get produitsDisponibles(): Produit[] {
    return this.wishlistProduits.filter(p => p.disponibilite && p.stockDisponible > 0);
  }

  get produitsIndisponibles(): Produit[] {
    return this.wishlistProduits.filter(p => !p.disponibilite || p.stockDisponible === 0);
  }
}
