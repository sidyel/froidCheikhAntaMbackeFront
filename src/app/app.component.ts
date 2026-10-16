import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, map, mergeMap } from 'rxjs/operators';
import { Title, Meta } from '@angular/platform-browser';
import { ConfigService } from './services/config.service';
import { PixelService } from './services/pixel.service';
import { ConsentService } from './services/consent.service';

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

      <!-- Bannière consentement cookies -->
      <app-cookie-banner></app-cookie-banner>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private metaService: Meta,
    private configService: ConfigService,
    private pixelService: PixelService,
    private consentService: ConsentService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.setPageTitle();
    this.setupMetaTags();
    if (isPlatformBrowser(this.platformId)) {
      this.pixelService.init();
      this.consentService.state$.subscribe(state => {
        if (state === 'accepted') this.pixelService.init();
      });
    }
    this.setupPageViewTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPageViewTracking(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.pixelService.trackPageView());
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
        const nomSite = this.configService.config.nomSite || 'Mon Site';
        const title = data['title'] || `${nomSite} - Climatisation et Électroménager`;
        this.titleService.setTitle(title);
      });
  }

  private setupMetaTags(): void {
    const c = this.configService.config;
    const nomSite = c.nomSite || 'Mon Site';
    const description = c.metaDescription || c.sloganSite || '';
    const keywords = c.metaKeywords || '';
    this.metaService.addTags([
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: nomSite },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:title', content: `${nomSite} - Climatisation et Électroménager` },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: nomSite },
      { name: 'twitter:description', content: description }
    ]);
  }
}
