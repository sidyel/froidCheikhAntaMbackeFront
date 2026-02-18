import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import {ImageLoadingService} from "../services/image-loading.service";

@Directive({
  selector: 'img[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: string = '';
  @Input() fallbackSrc: string = '/assets/images/placeholder.jpg';

  private observer: IntersectionObserver | null = null;

  constructor(
    private elementRef: ElementRef<HTMLImageElement>,
    private imageLoadingService: ImageLoadingService
  ) {}

  ngOnInit(): void {
    const img = this.elementRef.nativeElement;

    // Ajouter des classes pour le styling
    img.classList.add('lazy-loading');

    // Configurer l'image
    if (this.appLazyLoad) {
      img.dataset['src'] = this.appLazyLoad;
      img.src = ''; // Vider le src initial
    }

    // Créer l'intersection observer
    this.createObserver();
  }

  private createObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage();
              this.observer?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      );

      this.observer.observe(this.elementRef.nativeElement);
    } else {
      // Fallback pour les navigateurs qui ne supportent pas IntersectionObserver
      this.loadImage();
    }
  }

  private loadImage(): void {
    const img = this.elementRef.nativeElement;
    const src = img.dataset['src'] || this.appLazyLoad;

    if (src) {
      // Ajouter un placeholder de chargement
      img.classList.add('loading');

      img.onload = () => {
        img.classList.remove('loading', 'lazy-loading');
        img.classList.add('loaded');
      };

      img.onerror = () => {
        img.src = this.fallbackSrc;
        img.classList.remove('loading', 'lazy-loading');
        img.classList.add('loaded', 'error');
        console.warn(`Failed to load image: ${src}`);
      };

      img.src = src;
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
