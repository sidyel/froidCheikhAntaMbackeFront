import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FacturationService } from '../../../services/facturation.service';
import { TelechargerDocumentPublicDTO, TypeDocument } from '../../../models/facturation.interface';

@Component({
  selector: 'app-telecharger-document',
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">

        <!-- Chargement -->
        <div *ngIf="etat === 'chargement'" class="space-y-4">
          <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-gray-600 text-sm">Vérification du lien…</p>
        </div>

        <!-- Expiré / invalide -->
        <div *ngIf="etat === 'expire'" class="space-y-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <lucide-icon name="x-circle" class="w-8 h-8 text-red-500"></lucide-icon>
          </div>
          <h1 class="text-xl font-bold text-gray-900">Lien expiré</h1>
          <p class="text-gray-500 text-sm">
            Ce lien de téléchargement n'est plus valide (durée de validité dépassée ou lien révoqué).
          </p>
          <p class="text-gray-400 text-xs">Demandez un nouveau lien à l'émetteur du document.</p>
        </div>

        <!-- Disponible -->
        <div *ngIf="etat === 'ok' && infos" class="space-y-6">

          <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <lucide-icon name="file-text" class="w-10 h-10 text-blue-600"></lucide-icon>
          </div>

          <div>
            <div class="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              {{ labelType(infos.type) }}
            </div>
            <h1 class="text-xl font-bold text-gray-900">
              {{ infos.numero || infos.nomDocument }}
            </h1>
            <p *ngIf="infos.nomClient" class="text-gray-500 text-sm mt-1">
              Client : {{ infos.nomClient }}
            </p>
            <p *ngIf="infos.dateEmission" class="text-gray-400 text-xs mt-1">
              Émis le {{ infos.dateEmission | date:'dd MMMM yyyy' }}
            </p>
          </div>

          <button (click)="telecharger()" [disabled]="telechargement"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-50">
            <lucide-icon *ngIf="!telechargement" name="download" class="w-5 h-5"></lucide-icon>
            <div *ngIf="telechargement" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ telechargement ? 'Téléchargement…' : 'Télécharger le PDF' }}
          </button>

          <p *ngIf="messageTelechargement" class="text-green-600 text-sm font-medium">
            {{ messageTelechargement }}
          </p>

          <p class="text-gray-400 text-xs">
            Ce lien est à usage unique et a une durée de validité limitée.
          </p>
        </div>

        <!-- Erreur générique -->
        <div *ngIf="etat === 'erreur'" class="space-y-4">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <lucide-icon name="alert-circle" class="w-8 h-8 text-gray-400"></lucide-icon>
          </div>
          <h1 class="text-xl font-bold text-gray-900">Lien introuvable</h1>
          <p class="text-gray-500 text-sm">Ce lien de téléchargement est invalide.</p>
        </div>

      </div>
    </div>
  `
})
export class TelechargerDocumentComponent implements OnInit, OnDestroy {

  etat: 'chargement' | 'ok' | 'expire' | 'erreur' = 'chargement';
  infos?: TelechargerDocumentPublicDTO;
  telechargement = false;
  messageTelechargement = '';
  private jeton = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private facturationService: FacturationService
  ) {}

  ngOnInit(): void {
    this.jeton = this.route.snapshot.paramMap.get('jeton') ?? '';
    if (!this.jeton) { this.etat = 'erreur'; return; }

    this.facturationService.getInfosPubliques(this.jeton)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dto) => {
          this.infos = dto;
          this.etat = dto.expire ? 'expire' : 'ok';
        },
        error: (err) => {
          this.etat = err?.status === 404 || err?.status === 410 ? 'expire' : 'erreur';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  telecharger(): void {
    if (this.telechargement) return;
    this.telechargement = true;
    this.messageTelechargement = '';
    this.facturationService.telechargerPublic(this.jeton)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const nom = this.infos?.numero ?? this.infos?.nomDocument ?? 'document';
          this.facturationService.ouvrirBlob(blob, `${nom}.pdf`);
          this.telechargement = false;
          this.messageTelechargement = 'Téléchargement démarré.';
        },
        error: () => {
          this.telechargement = false;
          this.etat = 'expire';
        }
      });
  }

  labelType(t: TypeDocument): string {
    const map: Record<TypeDocument, string> = {
      FACTURE: 'Facture', DEVIS: 'Devis', AVOIR: 'Avoir', BON_LIVRAISON: 'Bon de livraison'
    };
    return map[t] ?? t;
  }
}
