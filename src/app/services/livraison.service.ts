import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ZoneLivraisonPublic,
  ZoneLivraisonAdmin,
  ZoneLivraisonCreate,
  EstimationLivraisonRequest,
  EstimationLivraisonResponse,
  CsvPreviewResponse
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ──── Public ────────────────────────────────────────────────────────────────

  getZonesActives(): Observable<ZoneLivraisonPublic[]> {
    return this.http.get<ZoneLivraisonPublic[]>(`${this.apiUrl}/livraison/zones`);
  }

  estimer(request: EstimationLivraisonRequest): Observable<EstimationLivraisonResponse> {
    return this.http.post<EstimationLivraisonResponse>(`${this.apiUrl}/livraison/estimation`, request);
  }

  // ──── Admin CRUD ─────────────────────────────────────────────────────────────

  getAllZones(): Observable<ZoneLivraisonAdmin[]> {
    return this.http.get<ZoneLivraisonAdmin[]>(`${this.apiUrl}/admin/livraison/zones`);
  }

  creerZone(dto: ZoneLivraisonCreate): Observable<ZoneLivraisonAdmin> {
    return this.http.post<ZoneLivraisonAdmin>(`${this.apiUrl}/admin/livraison/zones`, dto);
  }

  modifierZone(id: number, dto: ZoneLivraisonCreate): Observable<ZoneLivraisonAdmin> {
    return this.http.put<ZoneLivraisonAdmin>(`${this.apiUrl}/admin/livraison/zones/${id}`, dto);
  }

  toggleActif(id: number): Observable<ZoneLivraisonAdmin> {
    return this.http.patch<ZoneLivraisonAdmin>(`${this.apiUrl}/admin/livraison/zones/${id}/toggle-actif`, {});
  }

  desactiverZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/livraison/zones/${id}`);
  }

  // ──── Admin Import CSV ───────────────────────────────────────────────────────

  previewCsv(fichier: File): Observable<CsvPreviewResponse> {
    const formData = new FormData();
    formData.append('fichier', fichier);
    return this.http.post<CsvPreviewResponse>(
      `${this.apiUrl}/admin/livraison/zones/import-csv/preview`,
      formData
    );
  }

  confirmerCsv(token: string): Observable<{ zonesImportees: number }> {
    return this.http.post<{ zonesImportees: number }>(
      `${this.apiUrl}/admin/livraison/zones/import-csv/confirmer`,
      null,
      { params: { token } }
    );
  }
}
