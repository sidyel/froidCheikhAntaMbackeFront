// Enums
export enum LabelEnergie {
  A_PLUS_PLUS_PLUS = 'A_PLUS_PLUS_PLUS',
  A_PLUS_PLUS = 'A_PLUS_PLUS',
  A_PLUS = 'A_PLUS',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G'
}

export enum Genre {
  HOMME = 'HOMME',
  FEMME = 'FEMME',
  AUTRE = 'AUTRE'
}

export enum TypeAdresse {
  DOMICILE = 'DOMICILE',
  BUREAU = 'BUREAU',
  AUTRE = 'AUTRE'
}

export enum StatutCommande {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  PAYEE = 'PAYEE',
  EN_PREPARATION = 'EN_PREPARATION',
  EXPEDIE = 'EXPEDIE',
  LIVREE = 'LIVREE',
  ANNULEE = 'ANNULEE',
  REMBOURSEE = 'REMBOURSEE'
}

export enum ModeLivraison {
  LIVRAISON_DOMICILE = 'LIVRAISON_DOMICILE',
  RETRAIT_MAGASIN = 'RETRAIT_MAGASIN',
  LIVRAISON_EXPRESS = 'LIVRAISON_EXPRESS'
}

export enum MethodePaiement {
  WAVE = 'WAVE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  VIREMENT_BANCAIRE = 'VIREMENT_BANCAIRE',
  ESPECES = 'ESPECES',
  CARTE_BANCAIRE = 'CARTE_BANCAIRE'
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRME = 'CONFIRME',
  ECHOUE = 'ECHOUE',
  ANNULE = 'ANNULE',
  REMBOURSE = 'REMBOURSE'
}

// Interfaces de base
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  errors?: any;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Produits
export interface Produit {
  idProduit: number;
  nomProduit: string;
  descriptionProduit?: string;
  prix: number;
  stockDisponible: number;
  refProduit?: string;
  codeProduit?: string;
  garantie?: string;
  labelEnergie?: LabelEnergie;
  puissanceBTU?: number;
  consommationWatt?: number;
  dimensions?: string;
  poids?: number;
  ficheTechniquePDF?: string;
  listeImages: string[];
  videosOptionnelles?: string[];
  disponibilite: boolean;
  dateAjout: string;
  categorie?: Categorie;
  marque?: Marque;
  attributs?: AttributProduit[];
}

export interface AttributProduit {
  idAttribut: number;
  nomAttribut: string;
  valeurAttribut: string;
}

export interface Categorie {
  idCategorie: number;
  nomCategorie: string;
  descriptionCategorie?: string;
  imageCategorie?: string;
  parentId?: number;
  nomParent?: string;
  sousCategories?: Categorie[];
  nombreProduits?: number;
}

export interface Marque {
  idMarque: number;
  nomMarque: string;
  logo?: string;
  description?: string;
  nombreProduits?: number;
}

// Clients et Authentification
export interface Client {
  idClient: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  genre?: Genre;
  actif: boolean;
  dateCreation: string;
  adresses?: Adresse[];
  wishlist?: number[];
}

export interface Adresse {
  idAdresse?: number;
  ligne1: string;
  ligne2?: string;
  ville: string;
  codePostal?: string;
  pays?: string;
  telephone?: string;
  typeAdresse?: TypeAdresse;
  adressePrincipale?: boolean;
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: UserInfo;
}

export interface UserInfo {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

// Commandes
export interface Commande {
  idCommande: number;
  numeroCommande: string;
  dateCommande: string;
  statutCommande: StatutCommande;
  montantTotal: number;
  fraisLivraison: number;
  numeroSuivi?: string;
  commentaire?: string;
  modeLivraison?: ModeLivraison;
  dateModification: string;
  clientId?: number;
  emailInvite?: string;
  nomInvite?: string;
  prenomInvite?: string;
  telephoneInvite?: string;
  adresseLivraison?: AdresseLivraison;
  lignesCommande: LigneCommande[];
  paiement?: Paiement;
}

export interface LigneCommande {
  idLigneCommande?: number;
  produitId: number;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  nomProduitCommande?: string;
  refProduitCommande?: string;
  produit?: Produit; // Pour l'affichage
}

export interface AdresseLivraison {
  nom: string;
  prenom: string;
  ligne1: string;
  ligne2?: string;
  ville: string;
  codePostal?: string;
  telephone: string;
}

export interface Paiement {
  idPaiement?: number;
  methodePaiement: MethodePaiement;
  statutPaiement: StatutPaiement;
  montant: number;
  datePaiement?: string;
  referencePaiement?: string;
  referenceExterne?: string;
}

// Panier (stockage local)
export interface CartItem {
  produit: Produit;
  quantite: number;
  sousTotal: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Filtres
export interface ProductFilters {
  nom?: string;
  prixMin?: number;
  prixMax?: number;
  categorieId?: number;
  marqueId?: number;
  labelEnergie?: LabelEnergie;
  disponibilite?: boolean;
}

export interface SearchParams {
  q?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters?: ProductFilters;
}

// Autres interfaces utiles
export interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
  children?: MenuItem[];
  action?: () => void;
}

export interface Breadcrumb {
  label: string;
  route?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalConfig {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

// Configuration de l'application
export interface AppConfig {
  apiUrl: string;
  uploadUrl: string;
  companyInfo: {
    name: string;
    phones: string[];
    address: string;
    ninea: string;
    email?: string;
  };
  pagination: {
    defaultPageSize: number;
    pageSizeOptions: number[];
  };
  cart: {
    maxQuantity: number;
    persistInLocalStorage: boolean;
  };


}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  message: string;
  email: string;
}
