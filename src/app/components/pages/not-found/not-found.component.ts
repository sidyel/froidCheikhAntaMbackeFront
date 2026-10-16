import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SeoService } from '../../../services/seo.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent implements OnInit, OnDestroy {
  countdown = 10;
  public countdownInterval: any;

  popularLinks = [
    { label: 'Accueil', route: '/', icon: 'home' },
    { label: 'Nos Produits', route: '/produits', icon: 'package' },
    { label: 'Climatiseurs', route: '/produits?categorie=climatiseurs', icon: 'snowflake' },
    { label: 'Contact', route: '/contact', icon: 'phone' }
  ];

  constructor(
    private router: Router,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.seoService.setDefault('Page introuvable');
    if (isPlatformBrowser(this.platformId)) this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.goHome();
      }
    }, 1000);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    if (isPlatformBrowser(this.platformId)) window.history.back();
  }

  stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  onSearch(_value: string) {}
}
