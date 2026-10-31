export type TypeDocument = 'FACTURE' | 'DEVIS' | 'AVOIR' | 'BON_LIVRAISON';
export type StatutDocument = 'BROUILLON' | 'EMIS';
export type StatutPaiementDocument = 'NON_PAYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE';
export type ModeReglement = 'ESPECES' | 'WAVE' | 'ORANGE_MONEY' | 'VIREMENT' | 'AUTRE';

export interface ClientFacturation {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ninea?: string;
  rccm?: string;
}

export interface LigneDocumentDTO {
  id?: number;
  ordre: number;
  designation: string;
  produitId?: number;
  quantite: number;
  prixUnitaireHT: number;
  tauxTva: number;
  remisePourcent: number;
  montantHT?: number;
  montantTva?: number;
  montantTTC?: number;
}

export interface ReglementDocumentDTO {
  id: number;
  dateReglement: string;
  montant: number;
  mode: ModeReglement;
  reference?: string;
}

export interface DocumentFacturationDTO {
  id: number;
  typeDocument: TypeDocument;
  statut: StatutDocument;
  expire?: boolean;
  numero?: string;
  dateCreation: string;
  dateEmission?: string;
  dateValidite?: string;
  clientNom?: string;
  clientPrenom?: string;
  clientTelephone?: string;
  clientEmail?: string;
  clientAdresse?: string;
  clientNinea?: string;
  clientRccm?: string;
  clientSiteId?: number;
  clientFacturationId?: number;
  commandeId?: number;
  numeroCommande?: string;
  documentOrigineId?: number;
  numeroDocumentOrigine?: string;
  livreurNom?: string;
  livreurTelephone?: string;
  remiseTotalePourcent: number;
  tauxTvaDefaut?: number;
  prixAfficheTTC?: boolean;
  montantHT?: number;
  montantTva?: number;
  montantTTC?: number;
  montantEnLettres?: string;
  hasPdf?: boolean;
  statutPaiement?: StatutPaiementDocument;
  montantRegle?: number;
  montantRestant?: number;
  lignes: LigneDocumentDTO[];
  reglements?: ReglementDocumentDTO[];
  creePar?: string;
  modifiePar?: string;
}

export interface DocumentFacturationListDTO {
  id: number;
  typeDocument: TypeDocument;
  statut: StatutDocument;
  expire?: boolean;
  numero?: string;
  dateCreation: string;
  dateEmission?: string;
  clientNom?: string;
  montantTTC?: number;
  statutPaiement?: StatutPaiementDocument;
}

export interface CreerDocumentRequest {
  type: TypeDocument;
  clientFacturationId?: number;
  nomClient?: string;
  prenomClient?: string;
  telephoneClient?: string;
  emailClient?: string;
  adresseClient?: string;
  nineaClient?: string;
  rccmClient?: string;
  commandeId?: number;
  dateValidite?: string;
  livreurNom?: string;
  livreurTelephone?: string;
  remiseTotale?: number;
  notes?: string;
  lignes: LigneDocumentDTO[];
}

export interface AjouterReglementRequest {
  dateReglement: string;
  montant: number;
  mode: ModeReglement;
  reference?: string;
}

export interface WhatsAppJetonResponse {
  jeton: string;
  urlTelechargement: string;
  dateExpiration: string;
}

export interface TelechargerDocumentPublicDTO {
  nomDocument: string;
  type: TypeDocument;
  numero?: string;
  dateEmission?: string;
  nomClient?: string;
  expire: boolean;
}

export interface PagedDocuments {
  content: DocumentFacturationListDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
