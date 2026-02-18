import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageLoadingService {
  private imageCache = new Map<string, boolean>();
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.intersectionObserver?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Charger les images 50px avant qu'elles soient visibles
          threshold: 0.1
        }
      );
    }
  }

  // Précharger les images critiques
  preloadImages(imagePaths: string[]): Promise<void[]> {
    const promises = imagePaths.map(path => this.preloadSingleImage(path));
    return Promise.all(promises);
  }

  private preloadSingleImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, true);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };
      img.src = src;
    });
  }

  // Observer une image pour le lazy loading
  observeImage(img: HTMLImageElement): void {
    if (this.intersectionObserver && !img.src) {
      this.intersectionObserver.observe(img);
    }
  }

  // Charger une image immédiatement
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset['src'] || img.src;
    if (src && !img.src) {
      img.onload = () => {
        img.classList.add('loaded');
        this.imageCache.set(src, true);
      };
      img.onerror = () => {
        img.src = '/assets/images/placeholder.jpg'; // Image de fallback
        img.classList.add('loaded');
      };
      img.src = src;
    }
  }

  // Vérifier si une image est déjà en cache
  isImageCached(src: string): boolean {
    return this.imageCache.has(src);
  }

  // Nettoyer l'observer
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
