import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { ConfigService } from './config.service';
import { Produit, Categorie } from '../models/interfaces';
import { buildProduitUrl, buildCategorieUrl, slugify } from '../utils/slug.utils';

@Injectable({ providedIn: 'root' })
export class SeoService {

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private configService: ConfigService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  private get siteUrl(): string {
    return this.configService.config.siteUrl || 'http://localhost:4000';
  }

  private get nomSite(): string {
    return this.configService.config.nomSite || 'Froid Cheikh';
  }

  private get logoUrl(): string | undefined {
    return this.configService.config.logoUrl;
  }

  private get devise(): string {
    return this.configService.config.devise || 'XOF';
  }

  /** Construit l'URL d'image OG Cloudinary (c_pad + fond blanc, ratio 1.91:1). */
  buildOgImageUrl(rawUrl: string | undefined): string | undefined {
    if (!rawUrl || !rawUrl.includes('res.cloudinary.com')) return this.logoUrl;
    const marker = '/upload/';
    const idx = rawUrl.indexOf(marker);
    if (idx === -1) return rawUrl;
    return rawUrl.slice(0, idx + marker.length)
      + 'w_1200,h_630,c_pad,b_white,f_auto,q_auto/'
      + rawUrl.slice(idx + marker.length);
  }

  setDefault(subtitle?: string): void {
    const cfg = this.configService.config;
    const title = subtitle
      ? `${subtitle} — ${this.nomSite}`
      : `${this.nomSite}`;
    const description = cfg.metaDescription || cfg.sloganSite || '';
    this.titleService.setTitle(title);
    this.updateMeta('description', description);
    this.updateMeta('keywords', cfg.metaKeywords || '');
    this.setOg({ title, description, url: this.siteUrl, image: this.buildOgImageUrl(this.logoUrl) });
    this.setCanonical(this.siteUrl);
    this.removeJsonLd();
  }

  setHome(): void {
    const cfg = this.configService.config;
    const title = this.nomSite;
    const description = cfg.metaDescription || cfg.sloganSite || '';
    this.titleService.setTitle(title);
    this.updateMeta('description', description);
    this.updateMeta('keywords', cfg.metaKeywords || '');
    this.setOg({ title, description, url: this.siteUrl + '/', image: this.buildOgImageUrl(this.logoUrl), type: 'website' });
    this.setCanonical(this.siteUrl + '/');
    this.setLocalBusinessJsonLd(cfg);
  }

  setProduit(produit: Produit): void {
    const slug = slugify(produit.nomProduit);
    const canonicalUrl = this.siteUrl + buildProduitUrl(produit.idProduit, produit.nomProduit);
    const title = `${produit.nomProduit} — ${this.nomSite}`;
    const marqueNom = produit.marque?.nomMarque;
    const prixAffiche = produit.prixPromo ?? produit.prix;
    const description = [
      produit.nomProduit,
      marqueNom,
      prixAffiche ? `${prixAffiche.toLocaleString('fr-FR')} ${this.devise}` : null,
      produit.descriptionProduit
        ? produit.descriptionProduit.slice(0, 120) + (produit.descriptionProduit.length > 120 ? '…' : '')
        : null
    ].filter(Boolean).join(' · ');

    const firstImage = produit.images?.find(i => i.principale)?.url
      || produit.images?.[0]?.url;
    const ogImage = this.buildOgImageUrl(firstImage) || this.buildOgImageUrl(this.logoUrl);
    const disponible = produit.disponibilite && (produit.stockDisponible == null || produit.stockDisponible > 0);

    this.titleService.setTitle(title);
    this.updateMeta('description', description);
    this.setOg({ title, description, url: canonicalUrl, image: ogImage, type: 'product' });
    this.updateMeta('og:price:amount', String(prixAffiche), 'property');
    this.updateMeta('product:price:amount', String(prixAffiche), 'property');
    this.updateMeta('product:price:currency', this.devise, 'property');
    this.updateMeta('twitter:card', 'summary_large_image');
    this.setCanonical(canonicalUrl);
    this.setProduitJsonLd(produit, canonicalUrl, ogImage, disponible);
  }

  setCategorie(categorie: Categorie): void {
    const canonicalUrl = this.siteUrl + buildCategorieUrl(categorie.idCategorie, categorie.nomCategorie);
    const title = `${categorie.nomCategorie} — ${this.nomSite}`;
    const description = categorie.descriptionCategorie || `Découvrez notre gamme ${categorie.nomCategorie}`;
    this.titleService.setTitle(title);
    this.updateMeta('description', description);
    this.setOg({ title, description, url: canonicalUrl, image: this.buildOgImageUrl(this.logoUrl) });
    this.setCanonical(canonicalUrl);
    this.removeJsonLd();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private setOg(params: { title: string; description: string; url: string; image?: string; type?: string }): void {
    this.updateMeta('og:title', params.title, 'property');
    this.updateMeta('og:description', params.description, 'property');
    this.updateMeta('og:url', params.url, 'property');
    this.updateMeta('og:type', params.type || 'website', 'property');
    this.updateMeta('og:locale', 'fr_FR', 'property');
    this.updateMeta('og:site_name', this.nomSite, 'property');
    if (params.image) this.updateMeta('og:image', params.image, 'property');
    this.updateMeta('twitter:card', 'summary_large_image');
    this.updateMeta('twitter:title', params.title);
    this.updateMeta('twitter:description', params.description);
    if (params.image) this.updateMeta('twitter:image', params.image);
  }

  private updateMeta(name: string, content: string, attr: 'name' | 'property' = 'name'): void {
    if (!content) return;
    const selector = `${attr}="${name}"`;
    if (this.metaService.getTag(selector)) {
      this.metaService.updateTag({ [attr]: name, content });
    } else {
      this.metaService.addTag({ [attr]: name, content });
    }
  }

  setCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setJsonLd(data: object): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ld-json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(): void {
    const existing = this.document.getElementById('ld-json');
    if (existing) existing.remove();
  }

  private setProduitJsonLd(produit: Produit, url: string, image: string | undefined, disponible: boolean): void {
    const prixAffiche = produit.prixPromo ?? produit.prix;

    const videoObjects = (produit.videos || [])
      .filter(v => v.active)
      .map(v => {
        const base: any = {
          '@type': 'VideoObject',
          name: v.titre || produit.nomProduit,
          description: v.titre || produit.descriptionProduit?.slice(0, 200) || produit.nomProduit,
          thumbnailUrl: v.urlApercu || image,
          uploadDate: v.dateCreation ? v.dateCreation.split('T')[0] : undefined
        };
        if (v.type === 'YOUTUBE' && v.videoId) {
          base.embedUrl = `https://www.youtube-nocookie.com/embed/${v.videoId}`;
          base.contentUrl = v.url;
        } else if (v.type === 'FACEBOOK') {
          base.embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v.url)}`;
        } else if (v.type === 'CLOUDINARY') {
          base.contentUrl = v.url;
        }
        return base;
      });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: produit.nomProduit,
          description: produit.descriptionProduit || undefined,
          image: image ? [image] : undefined,
          brand: produit.marque ? { '@type': 'Brand', name: produit.marque.nomMarque } : undefined,
          offers: {
            '@type': 'Offer',
            price: prixAffiche,
            priceCurrency: this.devise,
            availability: disponible
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: this.siteUrl + '/' },
            produit.categorie ? { '@type': 'ListItem', position: 2, name: produit.categorie.nomCategorie, item: this.siteUrl + buildCategorieUrl(produit.categorie.idCategorie, produit.categorie.nomCategorie) } : undefined,
            { '@type': 'ListItem', position: produit.categorie ? 3 : 2, name: produit.nomProduit, item: url }
          ].filter(Boolean)
        },
        ...videoObjects
      ]
    });
  }

  private setLocalBusinessJsonLd(cfg: any): void {
    const telephones = (cfg.telephones || []).map((t: any) => t.numero).filter(Boolean);
    const horaires = (cfg.horairesOuverture || [])
      .filter((h: any) => !h.ferme)
      .map((h: any) => {
        const jourMap: Record<string, string> = {
          lundi: 'Mo', mardi: 'Tu', mercredi: 'We', jeudi: 'Th',
          vendredi: 'Fr', samedi: 'Sa', dimanche: 'Su'
        };
        const dow = jourMap[(h.jour || '').toLowerCase()];
        if (!dow || !h.heureDebut || !h.heureFin) return null;
        return `${dow} ${h.heureDebut}-${h.heureFin}`;
      })
      .filter(Boolean);

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: cfg.raisonSociale || cfg.nomSite,
      url: this.siteUrl,
      logo: cfg.logoUrl,
      description: cfg.descriptionSite,
      address: cfg.adresseComplete ? {
        '@type': 'PostalAddress',
        streetAddress: cfg.adresseComplete,
        addressLocality: cfg.ville,
        addressCountry: cfg.pays || 'SN'
      } : undefined,
      telephone: telephones.length === 1 ? telephones[0] : telephones.length > 1 ? telephones : undefined,
      openingHours: horaires.length ? horaires : undefined,
      sameAs: [cfg.facebookUrl, cfg.instagramUrl, cfg.youtubeUrl].filter(Boolean)
    });
  }
}
