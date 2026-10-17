import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AdminDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GESTIONNAIRE';
  actif: boolean;
  dateCreation: string | null;
}

@Component({
  selector: 'app-admin-manager',
  standalone: false,
  templateUrl: './admin-manager.component.html'
})
export class AdminManagerComponent implements OnInit {

  token = '';
  tokenPresent = false;
  admins: AdminDto[] = [];
  chargement = true;
  erreurChargement = '';

  modalOuvert = false;
  editId: number | null = null;
  sauvegardant = false;
  erreurModal = '';

  form = { nom: '', prenom: '', email: '', motDePasse: '', role: 'ADMIN' };

  toastMsg = '';
  toastType = 'ok';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly manageUrl: string;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    const base = environment.apiUrl.replace(/\/api$/, '');
    this.manageUrl = base + '/manage/api';
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.tokenPresent = !!this.token;
    if (this.tokenPresent) this.charger();
    else this.chargement = false;
  }

  private apiUrl(path: string): string {
    return `${this.manageUrl}${path}?token=${encodeURIComponent(this.token)}`;
  }

  charger(): void {
    this.chargement = true;
    this.erreurChargement = '';
    this.http.get<AdminDto[]>(this.apiUrl('/admins')).subscribe({
      next: data => { this.admins = data; this.chargement = false; },
      error: err => {
        this.erreurChargement = err.status === 403
          ? 'Token invalide ou ADMIN_MANAGER_TOKEN non configuré dans .env'
          : 'Erreur ' + err.status;
        this.chargement = false;
      }
    });
  }

  ouvrirCreer(): void {
    this.editId = null;
    this.form = { nom: '', prenom: '', email: '', motDePasse: '', role: 'ADMIN' };
    this.erreurModal = '';
    this.modalOuvert = true;
  }

  ouvrirModifier(a: AdminDto): void {
    this.editId = a.id;
    this.form = { nom: a.nom, prenom: a.prenom, email: a.email, motDePasse: '', role: a.role };
    this.erreurModal = '';
    this.modalOuvert = true;
  }

  fermerModal(): void { this.modalOuvert = false; }

  sauvegarder(): void {
    this.sauvegardant = true;
    this.erreurModal = '';
    const body: Record<string, unknown> = {
      nom: this.form.nom, prenom: this.form.prenom,
      email: this.form.email, role: this.form.role
    };
    if (this.form.motDePasse) body['motDePasse'] = this.form.motDePasse;

    const obs = this.editId
      ? this.http.put<AdminDto>(this.apiUrl('/admins/' + this.editId), body)
      : this.http.post<AdminDto>(this.apiUrl('/admins'), body);

    obs.subscribe({
      next: () => { this.fermerModal(); this.charger(); this.toast(this.editId ? 'Mis à jour' : 'Créé', 'ok'); this.sauvegardant = false; },
      error: err => { this.erreurModal = err.error?.erreur || ('Erreur ' + err.status); this.sauvegardant = false; }
    });
  }

  toggleActif(a: AdminDto): void {
    this.http.put<AdminDto>(this.apiUrl('/admins/' + a.id), { actif: !a.actif }).subscribe({
      next: () => { this.charger(); this.toast(a.actif ? 'Désactivé' : 'Activé', 'ok'); },
      error: err => this.toast('Erreur ' + err.status, 'err')
    });
  }

  supprimer(a: AdminDto): void {
    if (!confirm(`Supprimer ${a.prenom} ${a.nom} (${a.email}) ?`)) return;
    this.http.delete(this.apiUrl('/admins/' + a.id)).subscribe({
      next: () => { this.charger(); this.toast('Supprimé', 'ok'); },
      error: err => this.toast('Erreur ' + err.status, 'err')
    });
  }

  private toast(msg: string, type: 'ok' | 'err'): void {
    this.toastMsg = msg; this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg = '', 3500);
  }
}
