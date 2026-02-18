import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Produit,
  Categorie,
  Marque,
  Client,
  Commande,
  Adresse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  PagedResponse,
  SearchParams,
  ProductFilters,
  LigneCommande,
  Paiement, ResetPasswordResponse
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== AUTHENTIFICATION ====================
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken });
  }

  logout(): Observable<string> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, {
      responseType: 'text'
    });
  }

  // ==================== PRODUITS ====================
  getProduits(params?: SearchParams): Observable<PagedResponse<Produit>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
      if (params.q) httpParams = httpParams.set('q', params.q);

      if (params.filters) {
        const filters = params.filters;
        if (filters.nom) httpParams = httpParams.set('nom', filters.nom);
        if (filters.prixMin !== undefined) httpParams = httpParams.set('prixMin', filters.prixMin.toString());
        if (filters.prixMax !== undefined) httpParams = httpParams.set('prixMax', filters.prixMax.toString());
        if (filters.categorieId) httpParams = httpParams.set('categorieId', filters.categorieId.toString());
        if (filters.marqueId) httpParams = httpParams.set('marqueId', filters.marqueId.toString());
      }
    }

    const endpoint = params?.q ? '/produits/search' :
      params?.filters ? '/produits/filter' : '/produits';

    return this.http.get<PagedResponse<Produit>>(`${this.apiUrl}${endpoint}`, { params: httpParams });
  }

  getProduitById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/produits/${id}`);
  }

  getProduitsByCategorie(categorieId: number, params?: SearchParams): Observable<PagedResponse<Produit>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PagedResponse<Produit>>(`${this.apiUrl}/produits/categorie/${categorieId}`, { params: httpParams });
  }

  getProduitsByMarque(marqueId: number, params?: SearchParams): Observable<PagedResponse<Produit>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PagedResponse<Produit>>(`${this.apiUrl}/produits/marque/${marqueId}`, { params: httpParams });
  }

  getLatestProduits(params?: SearchParams): Observable<PagedResponse<Produit>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PagedResponse<Produit>>(`${this.apiUrl}/produits/latest`, { params: httpParams });
  }

  getProduitsById(ids: number[]): Observable<Produit[]> {
    return this.http.post<Produit[]>(`${this.apiUrl}/produits/batch`, ids);
  }

  // CRUD Produits (Admin)
  createProduit(produit: Partial<Produit>): Observable<Produit> {
    return this.http.post<Produit>(`${this.apiUrl}/produits`, produit);
  }

  updateProduit(id: number, produit: Partial<Produit>): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/produits/${id}`, produit);
  }

  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/produits/${id}`);
  }

  updateStock(id: number, quantite: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/produits/${id}/stock`, null, {
      params: { quantite: quantite.toString() }
    });
  }

  // ==================== CATÉGORIES ====================
  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/categories`);
  }

  getCategoriesTree(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/categories/tree`);
  }

  getCategorieById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.apiUrl}/categories/${id}`);
  }

  getSousCategories(parentId: number): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/categories/${parentId}/sous-categories`);
  }

  // CRUD Catégories (Admin)
  createCategorie(categorie: Partial<Categorie>): Observable<Categorie> {
    return this.http.post<Categorie>(`${this.apiUrl}/categories`, categorie);
  }

  updateCategorie(id: number, categorie: Partial<Categorie>): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.apiUrl}/categories/${id}`, categorie);
  }

  deleteCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // ==================== MARQUES ====================
  getMarques(): Observable<Marque[]> {
    return this.http.get<Marque[]>(`${this.apiUrl}/marques`);
  }

  getMarquesWithProducts(): Observable<Marque[]> {
    return this.http.get<Marque[]>(`${this.apiUrl}/marques/available`);
  }

  getMarqueById(id: number): Observable<Marque> {
    return this.http.get<Marque>(`${this.apiUrl}/marques/${id}`);
  }

  // CRUD Marques (Admin)
  createMarque(marque: Partial<Marque>): Observable<Marque> {
    return this.http.post<Marque>(`${this.apiUrl}/marques`, marque);
  }

  updateMarque(id: number, marque: Partial<Marque>): Observable<Marque> {
    return this.http.put<Marque>(`${this.apiUrl}/marques/${id}`, marque);
  }

  deleteMarque(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/marques/${id}`);
  }

  // ==================== CLIENT PROFILE ====================
  getProfile(): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/profile`);
  }

  updateProfile(client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/profile`, client);
  }

  updatePassword(data: { ancienMotDePasse: string; nouveauMotDePasse: string }): Observable<string> {
    return this.http.patch(`${this.apiUrl}/clients/password`, data, {
      responseType: 'text'
    });
  }

  // ==================== ADRESSES ====================
  getAdresses(): Observable<Adresse[]> {
    return this.http.get<Adresse[]>(`${this.apiUrl}/clients/adresses`);
  }

  ajouterAdresse(adresse: Adresse): Observable<Adresse> {
    return this.http.post<Adresse>(`${this.apiUrl}/clients/adresses`, adresse);
  }

  updateAdresse(adresseId: number, adresse: Adresse): Observable<Adresse> {
    return this.http.put<Adresse>(`${this.apiUrl}/clients/adresses/${adresseId}`, adresse);
  }

  supprimerAdresse(adresseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/adresses/${adresseId}`);
  }

  // ==================== WISHLIST ====================
  getWishlist(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/clients/wishlist`);
  }

  ajouterAWishlist(produitId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/clients/wishlist/${produitId}`, {}, {
      responseType: 'text'
    });
  }

  retirerDeWishlist(produitId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/clients/wishlist/${produitId}`, {
      responseType: 'text'
    });
  }

  // ==================== COMMANDES - CLIENT ====================
  creerCommandeClient(commande: Partial<Commande>): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/commandes/client`, commande);
  }

  getMesCommandes(params?: SearchParams): Observable<PagedResponse<Commande>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PagedResponse<Commande>>(`${this.apiUrl}/commandes/client/mes-commandes`, { params: httpParams });
  }

  getCommandeClient(commandeId: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/commandes/client/${commandeId}`);
  }

  // ==================== COMMANDES - INVITÉ ====================
  creerCommandeInvite(commande: any): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/commandes/invite`, commande);
  }

  getCommandeInvite(numeroCommande: string): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/commandes/invite/${numeroCommande}`);
  }

  // ==================== COMMANDES - GÉNÉRAL ====================
  getCommande(commandeId: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/commandes/${commandeId}`);
  }

  getCommandeByNumero(numeroCommande: string): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/commandes/numero/${numeroCommande}`);
  }

  // ==================== PAIEMENT ====================
  confirmerPaiement(commandeId: number, paiement: Partial<Paiement>): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/commandes/${commandeId}/paiement`, paiement);
  }

  /**
  // ==================== UPLOAD DE FICHIERS ====================
  uploadImages(produitId: number, files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<string[]>(`${this.apiUrl}/produits/${produitId}/images`, formData);
  }

  uploadFicheTechnique(produitId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('ficheTechnique', file);
    return this.http.post<string>(`${this.apiUrl}/produits/${produitId}/fiche-technique`, formData);
  }

  uploadCategorieImage(categorieId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<string>(`${this.apiUrl}/categories/${categorieId}/image`, formData);
  }

  uploadMarqueLogo(marqueId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<string>(`${this.apiUrl}/marques/${marqueId}/logo`, formData);
  }
   */

  // ==================== UPLOAD DE FICHIERS - VERSION CORRIGÉE ====================

  /**
   * Upload d'images pour un produit
   */
  uploadImages(produitId: number, files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file, file.name);
    });

    return this.http.post<string[]>(`${this.apiUrl}/produits/${produitId}/images`, formData);
  }

  /**
   * Upload d'une fiche technique PDF
   */
  uploadFicheTechnique(produitId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('ficheTechnique', file, file.name);

    return this.http.post<string>(`${this.apiUrl}/produits/${produitId}/fiche-technique`, formData);
  }

  /**
   * Upload d'image de catégorie
   */
  uploadCategorieImage(categorieId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post<string>(`${this.apiUrl}/categories/${categorieId}/image`, formData);
  }

  /**
   * Upload de logo de marque
   */
  /**
   * Upload de logo de marque - Version corrigée
   */
  uploadMarqueLogo(marqueId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('logo', file, file.name);

    return this.http.post(`${this.apiUrl}/marques/${marqueId}/logo`, formData, {
      responseType: 'text' // Spécifier que nous attendons du texte, pas du JSON
    });
  }

  /**
   * Supprimer une image de produit
   */
  deleteProductImage(produitId: number, imageIndex: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/produits/${produitId}/images/${imageIndex}`);
  }

  /**
   * Supprimer image de catégorie
   */
  deleteCategorieImage(categorieId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${categorieId}/image`);
  }

  /**
   * Supprimer logo de marque
   */
  deleteMarqueLogo(marqueId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/marques/${marqueId}/logo`);
  }

  /**
   * Construire l'URL complète d'une image
   */
  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'assets/images/placeholder.jpg';
    }

    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Construire l'URL avec le serveur backend
    return `${this.apiUrl.replace('/api', '')}/uploads/${imagePath}`;
  }

  /**
   * Vérifier si un fichier existe
   */
  fileExists(filePath: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/files/exists`, {
      params: { filePath }
    });
  }

  // Ajoutez cette méthode dans votre ApiService
  resetPassword(email: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/auth/reset-password`, { email });
  }
}
