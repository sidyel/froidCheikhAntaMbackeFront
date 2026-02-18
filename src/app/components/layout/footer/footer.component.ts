import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NewsletterService } from '../../../services/newsletter.service';
import { ToastService } from '../../../services/toast.service';

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

  // Company Information
  companyInfo = environment.companyInfo;
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

  categoryLinks: CategoryLink[] = [
    { label: 'Climatiseurs', route: '/produits/categorie/1', categoryId: 1 },
    { label: 'Réfrigérateurs', route: '/produits/categorie/2', categoryId: 2 },
    { label: 'Chambres Froides', route: '/produits/categorie/3', categoryId: 3 },
    { label: 'Ventilateurs', route: '/produits/categorie/4', categoryId: 4 },
    { label: 'Électroménager', route: '/produits/categorie/5', categoryId: 5 }
  ];

  // Social Media Links
  socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/froidcheikh',
      icon: 'facebook',
      ariaLabel: 'Suivez-nous sur Facebook'
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/${this.formatPhoneForWhatsApp(environment.companyInfo.phones[0])}`,
      icon: 'message-circle',
      ariaLabel: 'Contactez-nous sur WhatsApp'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/froidcheikh',
      icon: 'camera',
      ariaLabel: 'Suivez-nous sur Instagram'
    }
  ];

  // Payment Methods
  paymentMethods = [
    { name: 'WAVE', color: 'bg-orange-500' },
    { name: 'Orange Money', color: 'bg-orange-600' },
    { name: 'Virement', color: 'bg-blue-600' },
    { name: 'Espèces', color: 'bg-green-600' }
  ];

  // Business Hours
  businessHours = [
    { day: 'Lun - Ven', hours: '8h00 - 18h00' },
    { day: 'Samedi', hours: '8h00 - 17h00' },
    { day: 'Dimanche', hours: 'Fermé' }
  ];

  constructor(
    private router: Router,
    private newsletterService: NewsletterService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Initialisation si nécessaire
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

  /**
   * Navigation vers une route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.scrollToTop();
  }
}
