import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfigService } from '../../../services/config.service';
import { ContenuService } from '../../../services/contenu.service';
import { SeoService } from '../../../services/seo.service';
import { SiteConfig } from '../../../models/site-config.interface';
import { Partenaire, Prestation, MembreEquipe, Realisation } from '../../../models/contenu.interface';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  currentYear = new Date().getFullYear();
  imagesLoaded = false;
  currentSlides: { [key: number]: number } = {};

  config: SiteConfig;

  partenaires: Partenaire[] = [];
  prestations: Prestation[] = [];
  equipe: MembreEquipe[] = [];
  realisations: Realisation[] = [];

  constructor(
    private configService: ConfigService,
    private contenuService: ContenuService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.config = this.configService.config;
  }

  ngOnInit(): void {
    this.seoService.setDefault('À propos');
    this.contenuService.getPartenaires().subscribe({
      next: (data) => this.partenaires = data,
      error: () => {}
    });

    this.contenuService.getPrestations().subscribe({
      next: (data) => this.prestations = data,
      error: () => {}
    });

    this.contenuService.getEquipe().subscribe({
      next: (data) => this.equipe = data,
      error: () => {}
    });

    this.contenuService.getRealisations().subscribe({
      next: (data) => {
        this.realisations = data;
        data.forEach((_, index) => {
          this.currentSlides[index] = 0;
          if (isPlatformBrowser(this.platformId)) this.startSlideShow(index);
        });
        this.preloadCriticalImages();
      },
      error: () => {}
    });
  }

  startSlideShow(achievementIndex: number): void {
    setInterval(() => {
      const realisation = this.realisations[achievementIndex];
      if (realisation && realisation.images && realisation.images.length > 1) {
        this.currentSlides[achievementIndex] =
          (this.currentSlides[achievementIndex] + 1) % realisation.images.length;
      }
    }, 4000);
  }

  goToSlide(achievementIndex: number, slideIndex: number): void {
    this.currentSlides[achievementIndex] = slideIndex;
  }

  previousSlide(achievementIndex: number): void {
    const realisation = this.realisations[achievementIndex];
    if (realisation && realisation.images && realisation.images.length > 1) {
      this.currentSlides[achievementIndex] =
        this.currentSlides[achievementIndex] === 0
          ? realisation.images.length - 1
          : this.currentSlides[achievementIndex] - 1;
    }
  }

  nextSlide(achievementIndex: number): void {
    const realisation = this.realisations[achievementIndex];
    if (realisation && realisation.images && realisation.images.length > 1) {
      this.currentSlides[achievementIndex] =
        (this.currentSlides[achievementIndex] + 1) % realisation.images.length;
    }
  }

  private preloadCriticalImages(): void {
    const criticalImages: string[] = [
      '/assets/images/hero-bg-climatisation.png',
      ...this.equipe.map(m => m.urlPhoto || ''),
      ...this.partenaires.map(p => p.urlLogo || ''),
      ...this.realisations.reduce((acc, r) => acc.concat(r.images || []), [] as string[])
    ].filter(Boolean);

    criticalImages.forEach(imagePath => {
      const img = new Image();
      img.src = imagePath;
    });
  }

  onImageError(event: any): void {
    event.target.src = '/assets/images/logo.png';
  }

  onImageLoad(event: any): void {
    event.target.classList.add('loaded');
  }
}
