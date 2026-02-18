// À ajouter/modifier dans AdminService

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Produit,
  Client,
  Commande,
  Categorie,
  Marque,
  PagedResponse,
  StatutCommande
} from '../models/interfaces';
export interface Contact {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
  dateEnvoi: string;
  statut: 'NON_LU' | 'LU' | 'EN_COURS' | 'TRAITE';
}
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ==================== GESTION DES COMMANDES - VERSION CORRIGÉE ====================

  /**
   * Récupérer toutes les commandes avec pagination et filtrage
   */
  getAllCommandes(page: number = 0, size: number = 20, statut?: string): Observable<PagedResponse<Commande>> {
    console.log('🔄 AdminService.getAllCommandes appelé avec:', { page, size, statut });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (statut && statut.trim() !== '') {
      params = params.set('statut', statut);
      console.log('📋 Filtre statut appliqué:', statut);
    }

    console.log('📤 Requête vers:', `${this.apiUrl}/commandes`);
    console.log('📋 Paramètres:', params.toString());

    return this.http.get<PagedResponse<Commande>>(`${this.apiUrl}/commandes`, { params });
  }

  /**
   * Récupérer une commande par son ID (avec détails complets)
   */
  getCommandeById(commandeId: number): Observable<Commande> {
    console.log('🔍 AdminService.getCommandeById appelé avec ID:', commandeId);

    // Utiliser l'endpoint admin pour avoir tous les détails
    return this.http.get<Commande>(`${this.apiUrl}/commandes/${commandeId}`);
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  updateStatutCommande(commandeId: number, statut: StatutCommande): Observable<Commande> {
    console.log('🔄 AdminService.updateStatutCommande appelé:', { commandeId, statut });

    const body = { statut: statut };
    console.log('📤 Corps de la requête:', body);
    console.log('📤 URL:', `${this.apiUrl}/commandes/${commandeId}/statut`);

    return this.http.patch<Commande>(`${this.apiUrl}/commandes/${commandeId}/statut`, body);
  }

  /**
   * Annuler une commande avec motif
   */
  annulerCommande(commandeId: number, motif: string): Observable<Commande> {
    console.log('❌ AdminService.annulerCommande appelé:', { commandeId, motif });

    const body = { motif: motif };
    console.log('📤 Corps de la requête:', body);
    console.log('📤 URL:', `${this.apiUrl}/commandes/${commandeId}/annuler`);

    return this.http.post<Commande>(`${this.apiUrl}/commandes/${commandeId}/annuler`, body);
  }

  /**
   * Supprimer définitivement une commande
   */
  supprimerCommande(commandeId: number): Observable<any> {
    console.log('🗑️ AdminService.supprimerCommande appelé avec ID:', commandeId);
    console.log('📤 URL:', `${this.apiUrl}/commandes/${commandeId}`);

    return this.http.delete(`${this.apiUrl}/commandes/${commandeId}`);
  }

  /**
   * Rechercher des commandes par différents critères
   */
  rechercherCommandes(
    page: number = 0,
    size: number = 20,
    filters?: {
      statut?: string;
      numeroCommande?: string;
      emailInvite?: string;
      clientId?: number;
      dateDebut?: string;
      dateFin?: string;
    }
  ): Observable<PagedResponse<Commande>> {
    console.log('🔍 AdminService.rechercherCommandes appelé avec:', { page, size, filters });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.numeroCommande) params = params.set('numeroCommande', filters.numeroCommande);
      if (filters.emailInvite) params = params.set('emailInvite', filters.emailInvite);
      if (filters.clientId) params = params.set('clientId', filters.clientId.toString());
      if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
      if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    }

    return this.http.get<PagedResponse<Commande>>(`${this.apiUrl}/commandes/search`, { params });
  }

  /**
   * Obtenir les statistiques des commandes
   */
  getStatistiquesCommandes(): Observable<any> {
    console.log('📊 AdminService.getStatistiquesCommandes appelé');
    return this.http.get(`${this.apiUrl}/commandes/statistiques`);
  }

  // ==================== AUTRES MÉTHODES EXISTANTES ====================

  // ... (gardez toutes vos autres méthodes existantes)

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  getStatistiques(periode?: string): Observable<any> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode);
    return this.http.get(`${this.apiUrl}/stats`, { params });
  }

  getAllProduitsAdmin1(page: number = 0, size: number = 20, filters?: any): Observable<PagedResponse<Produit>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.search) params = params.set('q', filters.search);
      if (filters.categorieId) params = params.set('categorieId', filters.categorieId.toString());
      if (filters.marqueId) params = params.set('marqueId', filters.marqueId.toString());
      if (filters.stockFilter) params = params.set('stockFilter', filters.stockFilter);
    }

    return this.http.get<PagedResponse<Produit>>(`${environment.apiUrl}/produits`, { params });
  }
  getAllProduitsAdmin(page: number = 0, size: number = 20, filters?: any): Observable<PagedResponse<Produit>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.categorieId) params = params.set('categorieId', filters.categorieId.toString());
      if (filters.marqueId) params = params.set('marqueId', filters.marqueId.toString());
      if (filters.stockFilter) params = params.set('stockFilter', filters.stockFilter);
    }

    // Utiliser l'endpoint admin au lieu de l'endpoint public
    return this.http.get<PagedResponse<Produit>>(`${this.apiUrl}/admin1/produits`, { params });
  }

  createProduit(produit: Partial<Produit>): Observable<Produit> {
    return this.http.post<Produit>(`${environment.apiUrl}/produits`, produit);
  }

  updateProduit(id: number, produit: Partial<Produit>): Observable<Produit> {
    return this.http.put<Produit>(`${environment.apiUrl}/produits/${id}`, produit);
  }

  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/produits/${id}`);
  }

  updateStock(id: number, quantite: number): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/produits/${id}/stock`, null, {
      params: { quantite: quantite.toString() }
    });
  }

  getProduitsStockFaible(seuil: number = 5): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/stock/faible`, {
      params: { seuil: seuil.toString() }
    });
  }

  getAllClients(page: number = 0, size: number = 20): Observable<PagedResponse<Client>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<Client>>(`${this.apiUrl}/clients`, { params });
  }

  getClientById(clientId: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${clientId}`);
  }

  activerClient(clientId: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/clients/${clientId}/activer`, {}, {
      responseType: 'text'
    });
  }

  desactiverClient(clientId: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/clients/${clientId}/desactiver`, {}, {
      responseType: 'text'
    });
  }

  getAllCategoriesAdmin(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${environment.apiUrl}/categories`);
  }

  getCategorieByIdAdmin(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${environment.apiUrl}/categories/${id}`);
  }

  createCategorie(categorie: Partial<Categorie>): Observable<Categorie> {
    return this.http.post<Categorie>(`${environment.apiUrl}/categories`, categorie);
  }

  updateCategorie(id: number, categorie: Partial<Categorie>): Observable<Categorie> {
    return this.http.put<Categorie>(`${environment.apiUrl}/categories/${id}`, categorie);
  }

  deleteCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/categories/${id}`);
  }

  getAllMarquesAdmin(): Observable<Marque[]> {
    return this.http.get<Marque[]>(`${environment.apiUrl}/marques`);
  }

  getMarqueByIdAdmin(id: number): Observable<Marque> {
    return this.http.get<Marque>(`${environment.apiUrl}/marques/${id}`);
  }

  createMarque(marque: Partial<Marque>): Observable<Marque> {
    return this.http.post<Marque>(`${environment.apiUrl}/marques`, marque);
  }

  updateMarque(id: number, marque: Partial<Marque>): Observable<Marque> {
    return this.http.put<Marque>(`${environment.apiUrl}/marques/${id}`, marque);
  }

  deleteMarque(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/marques/${id}`);
  }

  getRapportVentes(dateDebut: string, dateFin: string): Observable<any> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);

    return this.http.get(`${this.apiUrl}/rapports/ventes`, { params });
  }

  getProduitsPopulaires(jours: number = 30): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rapports/produits-populaires`, {
      params: { jours: jours.toString() }
    });
  }

  uploadImages(produitId: number, files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<string[]>(`${environment.apiUrl}/produits/${produitId}/images`, formData);
  }

  uploadFicheTechnique(produitId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('ficheTechnique', file);
    return this.http.post<string>(`${environment.apiUrl}/produits/${produitId}/fiche-technique`, formData);
  }

  uploadCategorieImage(categorieId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<string>(`${environment.apiUrl}/categories/${categorieId}/image`, formData);
  }

  uploadMarqueLogo(marqueId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<string>(`${environment.apiUrl}/marques/${marqueId}/logo`, formData);
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, client);
  }

  updateClient(clientId: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/${clientId}`, client);
  }

  deleteClient(clientId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${clientId}`);
  }

  searchClients(searchTerm: string, page: number = 0, size: number = 20): Observable<PagedResponse<Client>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('search', searchTerm);

    return this.http.get<PagedResponse<Client>>(`${this.apiUrl}/clients/search`, { params });
  }

  getClientStats(clientId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/clients/${clientId}/stats`);
  }

  private apiUrl1 = 'http://localhost:8080/api';




  // Méthodes pour gérer les contacts
  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl1}/contacts`);
  }

  getContactsRecents(limit: number = 5): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl1}/contacts/recents?limit=${limit}`);
  }

  getContactsParStatut(statut: string): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl1}/contacts/statut/${statut}`);
  }

  getContactById(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl1}/contacts/${id}`);
  }

  updateContactStatut(id: number, statut: string): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl1}/contacts/${id}/statut?statut=${statut}`, {});
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl1}/contacts/${id}`);
  }

  getContactsNonLusCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl1}/contacts/non-lus/count`);
  }
}
