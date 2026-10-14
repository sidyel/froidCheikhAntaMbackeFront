export interface ImageHero {
  id?: number;
  urlImage?: string;
  altText?: string;
  titre?: string;
  sousTitre?: string;
  lienCta?: string;
  texteCta?: string;
  ordre?: number;
  actif?: boolean;
}

export interface Partenaire {
  id?: number;
  nom: string;
  description?: string;
  urlLogo?: string;
  urlSite?: string;
  ordre?: number;
  actif?: boolean;
}

export interface Prestation {
  id?: number;
  titre: string;
  description?: string;
  urlImage?: string;
  caracteristiques?: string[];
  ordre?: number;
  actif?: boolean;
}

export interface MembreEquipe {
  id?: number;
  nom: string;
  poste?: string;
  experience?: string;
  bio?: string;
  urlPhoto?: string;
  competences?: string[];
  urlLinkedin?: string;
  emailMembre?: string;
  ordre?: number;
  actif?: boolean;
}

export interface Realisation {
  id?: number;
  titre: string;
  categorie?: string;
  localisation?: string;
  description?: string;
  clientNom?: string;
  annee?: string;
  duree?: string;
  surface?: string;
  images?: string[];
  tags?: string[];
  ordre?: number;
  actif?: boolean;
}

export interface OrdreItem {
  id: number;
  ordre: number;
}
