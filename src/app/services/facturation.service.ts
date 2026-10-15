import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DocumentFacturationDTO,
  DocumentFacturationListDTO,
  CreerDocumentRequest,
  AjouterReglementRequest,
  WhatsAppJetonResponse,
  TelechargerDocumentPublicDTO,
  ClientFacturation,
  PagedDocuments,
  TypeDocument,
  StatutDocument
} from '../models/facturation.interface';

@Injectable({ providedIn: 'root' })
export class FacturationService {

  private readonly adminUrl = `${environment.apiUrl}/admin/documents`;
  private readonly publicUrl = `${environment.apiUrl}/public/documents`;

  constructor(private http: HttpClient) {}

  // ── Liste ──────────────────────────────────────────────────────────────────

  listerDocuments(params: {
    type?: TypeDocument;
    statut?: StatutDocument;
    client?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    size?: number;
  }): Observable<PagedDocuments> {
    let p = new HttpParams();
    if (params.type)      p = p.set('type', params.type);
    if (params.statut)    p = p.set('statut', params.statut);
    if (params.client)    p = p.set('client', params.client);
    if (params.dateDebut) p = p.set('dateDebut', params.dateDebut);
    if (params.dateFin)   p = p.set('dateFin', params.dateFin);
    p = p.set('page', (params.page ?? 0).toString());
    p = p.set('size', (params.size ?? 20).toString());
    return this.http.get<PagedDocuments>(this.adminUrl, { params: p });
  }

  // ── CRUD brouillon ─────────────────────────────────────────────────────────

  getDocument(id: number): Observable<DocumentFacturationDTO> {
    return this.http.get<DocumentFacturationDTO>(`${this.adminUrl}/${id}`);
  }

  creerDocument(req: CreerDocumentRequest): Observable<DocumentFacturationDTO> {
    return this.http.post<DocumentFacturationDTO>(this.adminUrl, req);
  }

  modifierDocument(id: number, req: CreerDocumentRequest): Observable<DocumentFacturationDTO> {
    return this.http.put<DocumentFacturationDTO>(`${this.adminUrl}/${id}`, req);
  }

  supprimerDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  // ── Émission ───────────────────────────────────────────────────────────────

  emettreDocument(id: number): Observable<DocumentFacturationDTO> {
    return this.http.post<DocumentFacturationDTO>(`${this.adminUrl}/${id}/emettre`, {});
  }

  // ── Depuis commande ────────────────────────────────────────────────────────

  genererDepuisCommande(commandeId: number, type: 'FACTURE' | 'BON_LIVRAISON'): Observable<DocumentFacturationDTO> {
    if (type === 'BON_LIVRAISON') {
      return this.http.post<DocumentFacturationDTO>(
        `${environment.apiUrl}/admin/commandes/${commandeId}/bon-livraison`, {}
      );
    }
    return this.http.post<DocumentFacturationDTO>(
      `${environment.apiUrl}/admin/commandes/${commandeId}/facture`, {}
    );
  }

  // ── Avoir ──────────────────────────────────────────────────────────────────

  creerAvoir(id: number): Observable<DocumentFacturationDTO> {
    return this.http.post<DocumentFacturationDTO>(`${this.adminUrl}/${id}/avoir`, {});
  }

  // ── Devis → Facture ────────────────────────────────────────────────────────

  convertirDevis(id: number): Observable<DocumentFacturationDTO> {
    return this.http.post<DocumentFacturationDTO>(`${this.adminUrl}/devis/${id}/convertir`, {});
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  telechargerPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.adminUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  telechargerPdfClient(commandeId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/commandes/${commandeId}/facture/pdf`, { responseType: 'blob' });
  }

  // ── WhatsApp jeton ─────────────────────────────────────────────────────────

  genererJetonWhatsapp(id: number): Observable<WhatsAppJetonResponse> {
    return this.http.post<WhatsAppJetonResponse>(`${this.adminUrl}/${id}/whatsapp-jeton`, {});
  }

  // ── Règlements ─────────────────────────────────────────────────────────────

  ajouterReglement(id: number, req: AjouterReglementRequest): Observable<DocumentFacturationDTO> {
    return this.http.post<DocumentFacturationDTO>(`${this.adminUrl}/${id}/reglements`, req);
  }

  supprimerReglement(id: number, reglementId: number): Observable<DocumentFacturationDTO> {
    return this.http.delete<DocumentFacturationDTO>(`${this.adminUrl}/${id}/reglements/${reglementId}`);
  }

  // ── Clients facturation ────────────────────────────────────────────────────

  rechercherClients(q: string): Observable<ClientFacturation[]> {
    return this.http.get<ClientFacturation[]>(
      `${environment.apiUrl}/admin/clients-facturation`,
      { params: new HttpParams().set('q', q) }
    );
  }

  // ── Page publique ──────────────────────────────────────────────────────────

  getInfosPubliques(jeton: string): Observable<TelechargerDocumentPublicDTO> {
    return this.http.get<TelechargerDocumentPublicDTO>(`${this.publicUrl}/telecharger/${jeton}/info`);
  }

  telechargerPublic(jeton: string): Observable<Blob> {
    return this.http.get(`${this.publicUrl}/telecharger/${jeton}`, { responseType: 'blob' });
  }

  // ── Aperçu en-tête ─────────────────────────────────────────────────────────

  apercuEnTete(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/admin/documents/apercu-entete`, { responseType: 'blob' });
  }

  // ── Utilitaires ────────────────────────────────────────────────────────────

  ouvrirBlob(blob: Blob, nomFichier: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    a.click();
    URL.revokeObjectURL(url);
  }
}
