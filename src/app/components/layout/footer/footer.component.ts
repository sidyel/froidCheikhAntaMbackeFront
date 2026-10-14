import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfigService } from '../../../services/config.service';
import { SiteConfig } from '../../../models/site-config.interface';
import { NewsletterService } from '../../../services/newsletter.service';
import { ToastService } from '../../../services/toast.service';
import { ApiService } from '../../../services/api.service';

interface SocialLink {
  name: string;
  url: string;
  icon: string;
  ariaLabel: string;
}

interface QuickLink {
  label: string;
  route: string;
  icon?: string;
}

interface CategoryLink {
  label: string;
  route: string;
  categoryId: number;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  config: SiteConfig;
  currentYear = new Date().getFullYear();

  // Newsletter Form
  newsletterEmail = '';
  isNewsletterLoading = false;
  newsletterSubmitted = false;

  // Navigation Links
  quickLinks: QuickLink[] = [
    { label: 'Accueil', route: '/', icon: 'home' },
    { label: 'Nos Produits', route: '/produits', icon: 'package' },
    { label: 'À Propos', route: '/a-propos', icon: 'info' },
    { label: 'Contact', route: '/contact', icon: 'mail' }
  ];

  categoryLinks: CategoryLink[] = [];

  get socialLinks(): SocialLink[] {
    const links: SocialLink[] = [];
    if (this.config.facebookUrl) {
      links.push({ name: 'Facebook', url: this.config.facebookUrl, icon: 'external-link', ariaLabel: 'Suivez-nous sur Facebook' });
    }
    const whatsappTel = this.config.telephones?.find(t => t.whatsapp);
    if (whatsappTel) {
      links.push({ name: 'WhatsApp', url: `https://wa.me/${this.formatPhoneForWhatsApp(whatsappTel.numero)}`, icon: 'message-circle', ariaLabel: 'Contactez-nous sur WhatsApp' });
    }
    if (this.config.instagramUrl) {
      links.push({ name: 'Instagram', url: this.config.instagramUrl, icon: 'camera', ariaLabel: 'Suivez-nous sur Instagram' });
    }
    if (this.config.twitterUrl) {
      links.push({ name: 'Twitter/X', url: this.config.twitterUrl, icon: 'external-link', ariaLabel: 'Suivez-nous sur X' });
    }
    if (this.config.youtubeUrl) {
      links.push({ name: 'YouTube', url: this.config.youtubeUrl, icon: 'video', ariaLabel: 'Notre chaîne YouTube' });
    }
    return links;
  }

  // Payment Methods
  paymentMethods = [
    { name: 'WAVE', color: 'bg-orange-500', logo: 'assets/images/wave.png' },
    { name: 'Orange Money', color: 'bg-orange-600', logo: 'assets/images/om.png' },
    { name: 'Espèces', color: 'bg-green-600', logo: 'assets/images/espece.jpg' }
  ];

  get businessHours(): { day: string; hours: string }[] {
    const horaires = this.config.horairesOuverture;
    if (horaires && horaires.length > 0) {
      return horaires.map(h => ({
        day: h.jour,
        hours: h.ferme ? 'Fermé' : `${h.heureDebut} - ${h.heureFin}`
      }));
    }
    return [
      { day: 'Lun - Ven', hours: '8h00 - 18h00' },
      { day: 'Samedi', hours: '8h00 - 17h00' },
      { day: 'Dimanche', hours: 'Fermé' }
    ];
  }

  constructor(
    private router: Router,
    private configService: ConfigService,
    private newsletterService: NewsletterService,
    private toastService: ToastService,
    private apiService: ApiService
  ) {
    this.config = this.configService.config;
  }

  ngOnInit(): void {
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => {
          this.categoryLinks = cats.slice(0, 5).map(c => ({
            label: c.nomCategorie,
            route: `/produits/categorie/${c.idCategorie}`,
            categoryId: c.idCategorie
          }));
        },
        error: () => {}
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gère la soumission du formulaire newsletter
   */
  onNewsletterSubmit(): void {
    if (!this.newsletterEmail || !this.isValidEmail(this.newsletterEmail)) {
      this.toastService.showError('Veuillez entrer une adresse email valide');
      return;
    }

    this.isNewsletterLoading = true;

    this.newsletterService.subscribe(this.newsletterEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isNewsletterLoading = false;
          this.newsletterSubmitted = true;
          this.toastService.showSuccess(
            'Merci pour votre inscription ! Vous recevrez bientôt nos offres.'
          );
          this.newsletterEmail = '';

          // Réinitialiser l'état après 3 secondes
          setTimeout(() => {
            this.newsletterSubmitted = false;
          }, 3000);
        },
        error: (error) => {
          this.isNewsletterLoading = false;
          const errorMessage = error?.error?.message ||
            'Une erreur est survenue. Veuillez réessayer plus tard.';
          this.toastService.showError(errorMessage);
        }
      });
  }

  /**
   * Valide le format d'email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formate le numéro de téléphone pour WhatsApp
   */
  public formatPhoneForWhatsApp(phone: string): string {
    // Retire les espaces et ajoute l'indicatif Sénégal (+221)
    return '221' + phone.replace(/\s/g, '');
  }

  /**
   * Gère le clic sur un lien téléphone
   */
  onPhoneClick(phone: string): void {
    // Analytics tracking si nécessaire
    console.log('Phone clicked:', phone);
  }

  /**
   * Gère le clic sur un lien email
   */
  onEmailClick(): void {
    // Analytics tracking si nécessaire
    console.log('Email clicked');
  }

  /**
   * Gère le clic sur un réseau social
   */
  onSocialClick(socialName: string): void {
    // Analytics tracking si nécessaire
    console.log('Social clicked:', socialName);
  }

  /**
   * Scroll vers le haut de la page
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  onPaymentLogoError(event: any, method: any): void {
    // Remplace l'image par le nom texte si image absente
    const img = event.target;
    img.style.display = 'none';
    const parent = img.parentElement;
    parent.style.width = 'auto';
    parent.style.padding = '4px 8px';
    parent.textContent = method.name;
    parent.style.fontSize = '0.7rem';
    parent.style.fontWeight = '600';
    parent.style.color = '#fff';
    parent.classList.add(method.color);
  }

  /**
   * Navigation vers une route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.scrollToTop();
  }
}
