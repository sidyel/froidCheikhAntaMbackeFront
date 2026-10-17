export interface TelephoneSite {
  numero: string;
  libelle?: string;
  whatsapp?: boolean;
}

export interface HoraireJour {
  jour: string;
  heureDebut?: string;
  heureFin?: string;
  ferme?: boolean;
}

export interface SiteConfig {
  // IDENTITE
  nomSite?: string;
  sloganSite?: string;
  descriptionSite?: string;
  mission?: string;
  vision?: string;
  anneesExperience?: number;
  descriptionLivraison?: string;
  logoUrl?: string;
  faviconUrl?: string;

  // CONTACT
  emailContact?: string;
  telephones?: TelephoneSite[];
  horairesOuverture?: HoraireJour[];
  adresseComplete?: string;
  adresseCourte?: string;
  ville?: string;
  pays?: string;

  // RESEAUX SOCIAUX
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;

  // APPARENCE
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  couleurAccent?: string;
  police?: string;

  // LIVRAISON
  devise?: string;
  seuilLivraisonGratuite?: number;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  siteUrl?: string;

  // SECTIONS VISIBILITE
  afficherHeroSlider?: boolean;
  afficherPartenaires?: boolean;
  afficherPrestations?: boolean;
  afficherEquipe?: boolean;
  afficherRealisations?: boolean;

  // TEXTES LEGAUX
  cgv?: string;
  mentionsLegales?: string;
  politiqueConfidentialite?: string;

  // PUBLICITE ET SUIVI
  metaPixelId?: string;
  googleAnalyticsId?: string;

  // WHATSAPP — numéro boutique (premier téléphone whatsapp=true) + templates
  telephoneWhatsappBoutique?: string;
  indicatifPaysDefaut?: string;
  whatsappMsgNouvelleCommande?: string;
  whatsappMsgConfirmee?: string;
  whatsappMsgLivree?: string;
  whatsappMsgAnnulee?: string;
}

export const DEFAULT_CONFIG: SiteConfig = {
  nomSite: 'Mon Site',
  couleurPrimaire: '#2563eb',
  couleurSecondaire: '#16a34a',
  couleurAccent: '#dc2626',
  police: 'Inter',
  devise: 'XOF',
  telephones: [],
};
