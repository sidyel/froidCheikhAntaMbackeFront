import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from "../../../services/contact.service";

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

  contactInfo = {
    address: 'Ouest Foire Cité Aelmas, derrière station Shell Dakar, Sénégal',
    phones: ['+221 77 335 20 00', '+221 76 888 04 42', '33 820 16 33'],
    email: 'froidcheikhantambacke.dione65@gmail.com',
    hours: {
      weekdays: 'Lundi - Vendredi: 8h00 - 18h00',
      saturday: 'Samedi: 8h00 - 13h00',
      sunday: 'Dimanche: Fermé'
    },
    socialMedia: [
      {
        name: 'Facebook',
        url: 'https://facebook.com/froidcheikh',
        icon: 'facebook',
        ariaLabel: 'Suivez-nous sur Facebook'
      },
      {
        name: 'WhatsApp',
        url: `https://wa.me/${this.formatPhoneForWhatsApp('+221 77 335 20 00')}`,
        icon: 'message-circle',
        ariaLabel: 'Contactez-nous sur WhatsApp'
      },
      {
        name: 'Instagram',
        url: 'https://instagram.com/froidcheikh',
        icon: 'camera',
        ariaLabel: 'Suivez-nous sur Instagram'
      }
    ]
  };

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
    private contactService: ContactService
  ) {
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
