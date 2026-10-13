export interface TelephoneSite {
  numero: string;
  libelle?: string;
  whatsapp?: boolean;
}

export interface SiteConfig {
  // IDENTITE
  nomSite?: string;
  sloganSite?: string;
  descriptionSite?: string;
  logoUrl?: string;
  faviconUrl?: string;

  // CONTACT
  emailContact?: string;
  telephones?: TelephoneSite[];
  adresseComplete?: string;
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
