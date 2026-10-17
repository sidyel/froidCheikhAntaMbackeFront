import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../services/config.service';

type LegalType = 'cgv' | 'politique-confidentialite' | 'mentions-legales';

interface LegalMeta {
  title: string;
  field: 'cgv' | 'mentionsLegales' | 'politiqueConfidentialite';
  emoji: string;
}

@Component({
  selector: 'app-legal-page',
  standalone: false,
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">

        <!-- Breadcrumb -->
        <nav class="mb-8 text-sm text-gray-500">
          <a routerLink="/" class="hover:text-primary-600 transition-colors">Accueil</a>
          <span class="mx-2">/</span>
          <span class="text-gray-900 font-medium">{{ meta.title }}</span>
        </nav>

        <!-- Contenu -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12">

          <!-- Entête -->
          <div class="mb-10 pb-8 border-b border-gray-100">
            <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{{ meta.title }}</h1>
            <p class="text-sm text-gray-400">Dernière mise à jour : {{ dateMAJ }}</p>
          </div>

          <!-- Texte vide -->
          <div *ngIf="!texte" class="text-center py-16">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon name="file-text" class="w-8 h-8 text-gray-300"></lucide-icon>
            </div>
            <p class="text-gray-500 text-lg mb-2">Cette page n'a pas encore de contenu.</p>
            <p class="text-gray-400 text-sm">
              L'administrateur peut renseigner ce texte dans les paramètres du site.
            </p>
          </div>

          <!-- Texte légal -->
          <div *ngIf="texte" class="legal-content">
            <div *ngFor="let bloc of blocs">
              <h2 *ngIf="bloc.type === 'h2'" class="text-xl font-bold text-gray-800 mt-8 mb-3 first:mt-0">{{ bloc.text }}</h2>
              <h3 *ngIf="bloc.type === 'h3'" class="text-lg font-semibold text-gray-700 mt-6 mb-2">{{ bloc.text }}</h3>
              <p *ngIf="bloc.type === 'p'" class="text-gray-600 leading-relaxed mb-4">{{ bloc.text }}</p>
              <hr *ngIf="bloc.type === 'hr'" class="my-6 border-gray-100">
            </div>
          </div>

        </div>

        <!-- Navigation bas de page -->
        <div class="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <a routerLink="/cgv" [class.font-semibold]="type === 'cgv'"
             [class.text-primary-600]="type === 'cgv'"
             class="text-gray-500 hover:text-primary-600 transition-colors">
            CGV
          </a>
          <span class="text-gray-300">|</span>
          <a routerLink="/politique-confidentialite" [class.font-semibold]="type === 'politique-confidentialite'"
             [class.text-primary-600]="type === 'politique-confidentialite'"
             class="text-gray-500 hover:text-primary-600 transition-colors">
            Politique de Confidentialité
          </a>
          <span class="text-gray-300">|</span>
          <a routerLink="/mentions-legales" [class.font-semibold]="type === 'mentions-legales'"
             [class.text-primary-600]="type === 'mentions-legales'"
             class="text-gray-500 hover:text-primary-600 transition-colors">
            Mentions Légales
          </a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .legal-content { line-height: 1.8; }
  `]
})
export class LegalPageComponent implements OnInit {

  type: LegalType = 'cgv';
  texte = '';
  blocs: Array<{ type: 'h2' | 'h3' | 'p' | 'hr'; text: string }> = [];
  dateMAJ = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  readonly metas: Record<LegalType, { title: string; field: 'cgv' | 'mentionsLegales' | 'politiqueConfidentialite' }> = {
    'cgv': { title: 'Conditions Générales de Vente', field: 'cgv' },
    'politique-confidentialite': { title: 'Politique de Confidentialité', field: 'politiqueConfidentialite' },
    'mentions-legales': { title: 'Mentions Légales', field: 'mentionsLegales' }
  };

  get meta() { return this.metas[this.type]; }

  constructor(private route: ActivatedRoute, private configService: ConfigService) {}

  ngOnInit(): void {
    this.type = (this.route.snapshot.data['type'] as LegalType) || 'cgv';
    const config = this.configService.config;
    this.texte = (config[this.meta.field] as string) || '';
    this.blocs = this.parseTexte(this.texte);
  }

  private parseTexte(texte: string): Array<{ type: 'h2' | 'h3' | 'p' | 'hr'; text: string }> {
    if (!texte) return [];
    const lignes = texte.split('\n');
    const blocs: Array<{ type: 'h2' | 'h3' | 'p' | 'hr'; text: string }> = [];
    let paragraphe: string[] = [];

    const flushParagraphe = () => {
      const txt = paragraphe.join(' ').trim();
      if (txt) blocs.push({ type: 'p', text: txt });
      paragraphe = [];
    };

    for (const ligne of lignes) {
      const l = ligne.trim();
      if (l.startsWith('## ')) { flushParagraphe(); blocs.push({ type: 'h2', text: l.slice(3) }); }
      else if (l.startsWith('# ')) { flushParagraphe(); blocs.push({ type: 'h2', text: l.slice(2) }); }
      else if (l.startsWith('### ')) { flushParagraphe(); blocs.push({ type: 'h3', text: l.slice(4) }); }
      else if (l === '---') { flushParagraphe(); blocs.push({ type: 'hr', text: '' }); }
      else if (l === '') { flushParagraphe(); }
      else { paragraphe.push(l); }
    }
    flushParagraphe();
    return blocs;
  }
}
