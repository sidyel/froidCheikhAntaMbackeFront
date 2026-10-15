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
  LIVREE = 'LIVREE',
  ANNULEE = 'ANNULEE'
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

/** Statut de paiement de la commande (indépendant du cycle de livraison). */
export enum StatutPaiementCommande {
  NON_PAYEE = 'NON_PAYEE',
  PAYEE = 'PAYEE',
  REMBOURSEE = 'REMBOURSEE'
}

/** @deprecated Utilisé uniquement pour la ligne Paiement (entité séparée). */
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
export interface ImageProduit {
  idImage: number;
  url: string;
  publicId?: string;
  texteAlternatif?: string;
  ordre: number;
  principale: boolean;
}

export interface ModeleAttribut {
  idModele: number;
  nomAttribut: string;
  description?: string;
  typeValeur: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  valeursAutorisees?: string;  // JSON array ex: '["R32","R410A"]'
  unite?: string;
  obligatoire: boolean;
  ordre: number;
  categorieIds?: number[];
}

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
  modeleFabricant?: string;
  ean?: string;
  listeImages: string[];          // rétrocompat public — utiliser images[] dans l'admin
  images?: ImageProduit[];        // admin — vide avant migration
  videosOptionnelles?: string[];
  disponibilite: boolean;
  dateAjout: string;
  categorie?: Categorie;
  marque?: Marque;
  attributs?: AttributProduit[];
  scoreCompletude?: number;
  prixPromo?: number;
  pourcentageReduction?: number;
  dateFinPromo?: string;
  nomPromotion?: string;
}

export interface AttributProduit {
  idAttribut?: number;
  nomAttribut: string;
  valeurAttribut: string;
  modeleAttributId?: number;
  unite?: string;
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
export interface HistoriqueStatutCommande {
  id: number;
  ancienStatut?: StatutCommande;
  nouveauStatut: StatutCommande;
  dateChangement: string;
  auteur?: string;
  commentaire?: string;
}

export interface Commande {
  idCommande: number;
  numeroCommande: string;
  dateCommande: string;
  statutCommande: StatutCommande;
  statutPaiement?: StatutPaiementCommande;
  montantTotal: number;
  fraisLivraison: number;
  numeroSuivi?: string;
  commentaire?: string;
  modeLivraison?: ModeLivraison;
  zoneId?: number;
  zoneNom?: string;
  zonePrixApplique?: number;
  zoneModeApplique?: string;
  supplementExpressApplique?: number;
  supplementGabaritApplique?: number;
  livraisonGratuiteAppliquee?: boolean;
  dateModification: string;
  clientId?: number;
  emailInvite?: string;
  nomInvite?: string;
  prenomInvite?: string;
  telephoneInvite?: string;
  adresseLivraison?: AdresseLivraison;
  lignesCommande: LigneCommande[];
  paiement?: Paiement;
  historiqueStatuts?: HistoriqueStatutCommande[];
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
  prixUnitaireOrigine?: number;
  promotionId?: number;
  promotionNom?: string;
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

// Zones de livraison
export interface ZoneLivraisonPublic {
  id: number;
  villeLabel: string;
  quartierLabel: string;
  prixStandard: number;
  prixExpress?: number;
  expressDisponible: boolean;
  delaiEstime: string;
  eligibleLivraisonGratuite: boolean;
  ordre: number;
}

export interface ZoneLivraisonAdmin {
  id: number;
  ville: string;
  villeLabel: string;
  quartier: string;
  quartierLabel: string;
  prixStandard: number;
  prixExpress?: number;
  expressDisponible: boolean;
  delaiEstime: string;
  actif: boolean;
  eligibleLivraisonGratuite: boolean;
  ordre: number;
}

export interface ZoneLivraisonCreate {
  ville: string;
  villeLabel: string;
  quartier: string;
  quartierLabel: string;
  prixStandard: number;
  prixExpress?: number;
  expressDisponible: boolean;
  delaiEstime: string;
  actif: boolean;
  eligibleLivraisonGratuite: boolean;
  ordre: number;
}

export interface EstimationLigne {
  produitId: number;
  quantite: number;
}

export interface EstimationLivraisonRequest {
  zoneId: number | null;
  modeLivraison: string;
  lignes: EstimationLigne[];
}

export interface EstimationLivraisonResponse {
  montantArticles: number;
  fraisZone: number;
  supplementExpress: number;
  supplementGabarit: number;
  fraisLivraisonTotal: number;
  montantTotal: number;
  livraisonGratuite: boolean;
  delaiEstime: string;
  modeLivraisonLabel: string;
}

export interface CsvLigne {
  numeroLigne: number;
  ville: string;
  villeLabel: string;
  quartier: string;
  quartierLabel: string;
  prixStandard: number;
  prixExpress?: number;
  delaiEstime: string;
  expressDisponible: boolean;
  eligibleLivraisonGratuite: boolean;
}

export interface CsvErreur {
  numeroLigne: number;
  contenu: string;
  motif: string;
}

export interface CsvPreviewResponse {
  lignesACreer: CsvLigne[];
  lignesAModifier: CsvLigne[];
  lignesEnErreur: CsvErreur[];
  totalTraitees: number;
  token: string;
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
  enPromotion?: boolean;
}

// Promotions
export type TypePromotion = 'POURCENTAGE' | 'MONTANT_FIXE';
export type CiblePromotion = 'TOUS' | 'PRODUITS' | 'CATEGORIES' | 'MARQUES';

export interface PromotionRequest {
  nom: string;
  typePromotion: TypePromotion;
  valeur: number;
  dateDebut: string;
  dateFin?: string;
  actif?: boolean;
  priorite?: number;
  cible: CiblePromotion;
  produitIds?: number[];
  categorieIds?: number[];
  marqueIds?: number[];
}

export interface PromotionResponse {
  idPromotion: number;
  nom: string;
  typePromotion: TypePromotion;
  valeur: number;
  dateDebut: string;
  dateFin?: string;
  actif: boolean;
  priorite: number;
  cible: CiblePromotion;
  produitIds: number[];
  categorieIds: number[];
  marqueIds: number[];
  dateCreation: string;
  dateModification?: string;
  statut: 'ACTIVE' | 'PROGRAMMEE' | 'EXPIREE' | 'INACTIVE';
}

export interface PromotionApercuProduit {
  idProduit: number;
  nomProduit: string;
  prixOrigine: number;
  prixApresPromo: number;
  pourcentageReduction?: number;
  prixPlancher: boolean;
}

export interface PromotionApercuPage {
  produits: PromotionApercuProduit[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
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
