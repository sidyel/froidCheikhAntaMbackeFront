import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ImageHero, Partenaire, Prestation, MembreEquipe, Realisation, OrdreItem
} from '../models/contenu.interface';

@Injectable({ providedIn: 'root' })
export class ContenuService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== PUBLIC =====

  getHeroImages(): Observable<ImageHero[]> {
    return this.http.get<ImageHero[]>(`${this.api}/contenu/hero`);
  }

  getPartenaires(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(`${this.api}/contenu/partenaires`);
  }

  getPrestations(): Observable<Prestation[]> {
    return this.http.get<Prestation[]>(`${this.api}/contenu/prestations`);
  }

  getEquipe(): Observable<MembreEquipe[]> {
    return this.http.get<MembreEquipe[]>(`${this.api}/contenu/equipe`);
  }

  getRealisations(): Observable<Realisation[]> {
    return this.http.get<Realisation[]>(`${this.api}/contenu/realisations`);
  }

  // ===== ADMIN — générique =====

  getAdminItems(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/admin/contenu/${type}`);
  }

  createItem(type: string, dto: any): Observable<any> {
    return this.http.post<any>(`${this.api}/admin/contenu/${type}`, dto);
  }

  updateItem(type: string, id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.api}/admin/contenu/${type}/${id}`, dto);
  }

  deleteItem(type: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/contenu/${type}/${id}`);
  }

  uploadImage(type: string, id: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.api}/admin/contenu/${type}/${id}/image`, form);
  }

  updateOrdre(type: string, items: OrdreItem[]): Observable<void> {
    return this.http.put<void>(`${this.api}/admin/contenu/${type}/ordre`, { items });
  }
}
