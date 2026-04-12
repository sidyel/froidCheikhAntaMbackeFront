import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageUrlService {
  private readonly placeholderImage = 'assets/images/placeholder.jpg';

  getCategoryImageUrl(imageCategorie: string | null | undefined): string {
    if (!imageCategorie) return this.placeholderImage;
    if (imageCategorie.startsWith('http')) return imageCategorie; // URL Cloudinary
    return this.placeholderImage; // Plus de construction d'URL locale
  }

  getBrandLogoUrl(logo: string | null | undefined): string {
    if (!logo) return this.placeholderImage;
    if (logo.startsWith('http')) return logo;
    return this.placeholderImage;
  }

  getProductImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return this.placeholderImage;
    if (imagePath.startsWith('http')) return imagePath;
    return this.placeholderImage;
  }

  getFileUrl(filePath: string | null | undefined): string {
    if (!filePath) return this.placeholderImage;
    if (filePath.startsWith('http')) return filePath;
    return this.placeholderImage;
  }

  getPlaceholderImage(): string {
    return this.placeholderImage;
  }
}
/*
@Injectable({
  providedIn: 'root'
})
export class ImageUrlService {
  private readonly baseUrl = environment.apiUrl?.replace('/api', '') || 'http://localhost:8080';
  private readonly placeholderImage = 'assets/images/placeholder.jpg';

  constructor() {
    console.log('🔧 ImageUrlService initialisé avec baseUrl:', this.baseUrl);
  }


  getCategoryImageUrl(imageCategorie: string | null | undefined): string {
    if (!imageCategorie) {
      return this.placeholderImage;
    }

    // Si c'est déjà une URL complète
    if (imageCategorie.startsWith('http://') || imageCategorie.startsWith('https://')) {
      return imageCategorie;
    }

    // Si le chemin contient déjà "categories/", ne pas le rajouter
    let fullUrl: string;
    if (imageCategorie.startsWith('categories/')) {
      fullUrl = `${this.baseUrl}/uploads/${imageCategorie}`;
    } else {
      fullUrl = `${this.baseUrl}/uploads/categories/${imageCategorie}`;
    }

    console.log('🖼️ URL catégorie construite:', fullUrl, 'depuis:', imageCategorie);
    return fullUrl;
  }

  getBrandLogoUrl(logo: string | null | undefined): string {
    if (!logo) {
      return this.placeholderImage;
    }

    // Si c'est déjà une URL complète
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }

    // Si le chemin contient déjà "marques/logos/", ne pas le rajouter
    let fullUrl: string;
    if (logo.startsWith('marques/logos/')) {
      fullUrl = `${this.baseUrl}/uploads/${logo}`;
    } else {
      fullUrl = `${this.baseUrl}/uploads/marques/logos/${logo}`;
    }

    console.log('🏷️ URL logo marque construite:', fullUrl, 'depuis:', logo);
    return fullUrl;
  }


  getProductImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return this.placeholderImage;
    }

    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Construire l'URL pour les produits
    const fullUrl = `${this.baseUrl}/uploads/produits/${imagePath}`;
    console.log('📦 URL produit construite:', fullUrl);
    return fullUrl;
  }


  getFileUrl(filePath: string | null | undefined): string {
    if (!filePath) {
      return this.placeholderImage;
    }

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    const fullUrl = `${this.baseUrl}/uploads/${filePath}`;
    console.log('📁 URL fichier construite:', fullUrl);
    return fullUrl;
  }


  async checkImageExists(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        mode: 'cors'
      });
      const exists = response.ok;
      console.log('✅ Image accessible:', exists, 'pour:', imageUrl);
      return exists;
    } catch (error) {
      console.error('❌ Erreur test image:', error, 'pour:', imageUrl);
      return false;
    }
  }


  getPlaceholderImage(): string {
    return this.placeholderImage;
  }
}*/
