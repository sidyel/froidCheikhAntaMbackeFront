import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, map, mergeMap } from 'rxjs/operators';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Header -->
      <app-header></app-header>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <app-footer></app-footer>

      <!-- Toast Notifications -->
      <app-toast></app-toast>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.setPageTitle();
    this.setupMetaTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setPageTitle(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap(route => route.data),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        const title = data['title'] || 'Froid Cheikh Anta Mbacké - Climatisation et Électroménager';
        this.titleService.setTitle(title);
      });
  }

  private setupMetaTags(): void {
    // Meta tags de base pour le SEO
    this.metaService.addTags([
      { name: 'description', content: 'Froid Cheikh Anta Mbacké - Spécialiste en climatisation, réfrigération et électroménager au Sénégal. Plus de 15 ans d\'expérience.' },
      { name: 'keywords', content: 'climatiseur, frigo, réfrigérateur, chambre froide, électroménager, Dakar, Sénégal, climatisation' },
      { name: 'author', content: 'Froid Cheikh Anta Mbacké' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:title', content: 'Froid Cheikh Anta Mbacké - Climatisation et Électroménager' },
      { property: 'og:description', content: 'Spécialiste en climatisation, réfrigération et électroménager au Sénégal' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Froid Cheikh Anta Mbacké' },
      { name: 'twitter:description', content: 'Spécialiste en climatisation et électroménager' }
    ]);
  }
}
