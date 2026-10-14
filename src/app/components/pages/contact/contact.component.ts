import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from "../../../services/contact.service";
import { ConfigService } from '../../../services/config.service';
import { SiteConfig } from '../../../models/site-config.interface';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  errorMessage = '';

  config: SiteConfig;

  get socialMedia() {
    const links = [];
    if (this.config.facebookUrl) links.push({ name: 'Facebook', url: this.config.facebookUrl, icon: 'external-link', ariaLabel: 'Facebook' });
    const whatsapp = this.config.telephones?.find(t => t.whatsapp);
    if (whatsapp) links.push({ name: 'WhatsApp', url: `https://wa.me/${whatsapp.numero.replace(/\D/g, '')}`, icon: 'message-circle', ariaLabel: 'WhatsApp' });
    if (this.config.instagramUrl) links.push({ name: 'Instagram', url: this.config.instagramUrl, icon: 'camera', ariaLabel: 'Instagram' });
    return links;
  }

  subjects = [
    'Demande d\'information sur un produit',
    'Demande de devis',
    'Installation et maintenance',
    'Service après-vente',
    'Réclamation',
    'Autre'
  ];

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private configService: ConfigService
  ) {
    this.config = this.configService.config;
    this.contactForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^(\+221)?[0-9]{8,9}$/)]],
      sujet: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {}

  get formControls() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      this.contactService.envoyerMessage(this.contactForm.value).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.contactForm.reset();

          setTimeout(() => {
            this.submitSuccess = false;
          }, 5000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'envoi du message';
          console.error('Erreur:', error);
        }
      });
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['pattern']) {
        return 'Format de téléphone invalide';
      }
    }
    return '';
  }

  /**
   * Formate le numéro de téléphone pour WhatsApp
   */
  formatPhoneForWhatsApp(phone: string): string {
    // Retire les espaces et le + puis ajoute l'indicatif
    return phone.replace(/[\s+]/g, '');
  }

  /**
   * Gère le clic sur un réseau social
   */
  onSocialClick(socialName: string): void {
    // Analytics tracking si nécessaire
    console.log('Social clicked:', socialName);
  }
}
