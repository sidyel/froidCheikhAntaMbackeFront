// contact.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:8080/api/contacts';

  constructor(private http: HttpClient) {}

  envoyerMessage(contact: ContactMessage): Observable<any> {
    return this.http.post<any>(this.apiUrl, contact);
  }
}
