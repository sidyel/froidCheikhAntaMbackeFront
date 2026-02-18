import { Component, Input, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css']
})
export class ImageGalleryComponent implements OnInit, OnDestroy {
  @Input() images: string[] = [];
  @Input() alt: string = 'Image';
  @Input() showThumbnails = true;
  @Input() showNavigation = true;
  @Input() allowZoom = true;
  @Input() autoPlay = false;
  @Input() autoPlayDelay = 5000;
  @Input() showFullscreenButton = true;

  @ViewChild('mainImage') mainImageRef!: ElementRef<HTMLImageElement>;

  currentIndex = 0;
  isZoomed = false;
  isFullscreen = false;
  isLoading = true;
  showImageViewer = false;

  // Variables pour le zoom
  zoomLevel = 1;
  zoomX = 0;
  zoomY = 0;
  isDragging = false;
  lastPanPoint = { x: 0, y: 0 };

  // Variables pour l'autoplay
  private autoPlayInterval: any;

  // Variables pour les swipes sur mobile
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;

  constructor() {}

  ngOnInit(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.showImageViewer || this.isFullscreen) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.previousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.nextImage();
          break;
        case 'Escape':
          event.preventDefault();
          if (this.isFullscreen) {
            this.exitFullscreen();
          } else if (this.showImageViewer) {
            this.closeImageViewer();
          }
          break;
        case '+':
        case '=':
          if (this.allowZoom) {
            event.preventDefault();
            this.zoomIn();
          }
          break;
        case '-':
          if (this.allowZoom) {
            event.preventDefault();
            this.zoomOut();
          }
          break;
        case '0':
          if (this.allowZoom) {
            event.preventDefault();
            this.resetZoom();
          }
          break;
      }
    }
  }

  get currentImage(): string {
    return this.images[this.currentIndex] || '/assets/images/placeholder.jpg';
  }

  get hasMultipleImages(): boolean {
    return this.images.length > 1;
  }

  onImgError(event: Event) {
    // Vérifie que target est bien une image
    if (event.target instanceof HTMLImageElement) {
      event.target.src = '/assets/images/placeholder.jpg';
    }
  }


  get canGoNext(): boolean {
    return this.currentIndex < this.images.length - 1;
  }

  get canGoPrevious(): boolean {
    return this.currentIndex > 0;
  }

  onImageLoad(): void {
    this.isLoading = false;
  }

  onImageError(event: any): void {
    event.target.src = '/assets/images/placeholder.jpg';
    this.isLoading = false;
  }

  selectImage(index: number): void {
    if (index >= 0 && index < this.images.length && index !== this.currentIndex) {
      this.currentIndex = index;
      this.isLoading = true;
      this.resetZoom();
      this.resetAutoPlay();
    }
  }

  nextImage(): void {
    if (this.canGoNext) {
      this.selectImage(this.currentIndex + 1);
    } else if (this.images.length > 1) {
      this.selectImage(0); // Loop back to first image
    }
  }

  previousImage(): void {
    if (this.canGoPrevious) {
      this.selectImage(this.currentIndex - 1);
    } else if (this.images.length > 1) {
      this.selectImage(this.images.length - 1); // Loop to last image
    }
  }

  // Zoom functionality
  zoomIn(): void {
    if (this.allowZoom && this.zoomLevel < 3) {
      this.zoomLevel = Math.min(this.zoomLevel + 0.5, 3);
      this.isZoomed = this.zoomLevel > 1;
    }
  }

  zoomOut(): void {
    if (this.allowZoom && this.zoomLevel > 1) {
      this.zoomLevel = Math.max(this.zoomLevel - 0.5, 1);
      this.isZoomed = this.zoomLevel > 1;
      if (this.zoomLevel === 1) {
        this.zoomX = 0;
        this.zoomY = 0;
      }
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.zoomX = 0;
    this.zoomY = 0;
    this.isZoomed = false;
  }

  onImageClick(event: MouseEvent): void {
    if (this.allowZoom && !this.isDragging) {
      if (this.isZoomed) {
        this.resetZoom();
      } else {
        // Zoom in at click position
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        this.zoomLevel = 2;
        this.zoomX = (0.5 - x) * 100;
        this.zoomY = (0.5 - y) * 100;
        this.isZoomed = true;
      }
    }
  }

  onDoubleClick(): void {
    if (this.allowZoom) {
      if (this.isZoomed) {
        this.resetZoom();
      } else {
        this.zoomLevel = 2.5;
        this.isZoomed = true;
      }
    }
  }

  // Pan functionality for zoomed images
  onMouseDown(event: MouseEvent): void {
    if (this.isZoomed && event.button === 0) {
      this.isDragging = true;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.isZoomed) {
      const deltaX = event.clientX - this.lastPanPoint.x;
      const deltaY = event.clientY - this.lastPanPoint.y;

      this.zoomX += deltaX / 2;
      this.zoomY += deltaY / 2;

      // Constrain pan within image bounds
      const maxPan = (this.zoomLevel - 1) * 50;
      this.zoomX = Math.max(-maxPan, Math.min(maxPan, this.zoomX));
      this.zoomY = Math.max(-maxPan, Math.min(maxPan, this.zoomY));

      this.lastPanPoint = { x: event.clientX, y: event.clientY };
    }
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      // Small delay to prevent click event after drag
      setTimeout(() => {
        this.isDragging = false;
      }, 100);
    }
  }

  // Touch events for mobile
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.isSwiping = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isSwiping || event.touches.length !== 1) return;

    if (this.isZoomed) {
      // Handle pan for zoomed image
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isSwiping) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Check if it's a horizontal swipe and not zoomed
    if (!this.isZoomed && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.previousImage();
      } else {
        this.nextImage();
      }
    }

    this.isSwiping = false;
  }

  // Fullscreen functionality
  openFullscreen(): void {
    this.isFullscreen = true;
    this.showImageViewer = true;
    document.body.style.overflow = 'hidden';
  }

  exitFullscreen(): void {
    this.isFullscreen = false;
    this.showImageViewer = false;
    document.body.style.overflow = 'auto';
    this.resetZoom();
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
    this.isFullscreen = false;
    document.body.style.overflow = 'auto';
    this.resetZoom();
  }

  // AutoPlay functionality
  startAutoPlay(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.autoPlayInterval = setInterval(() => {
        this.nextImage();
      }, this.autoPlayDelay);
    }
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetAutoPlay(): void {
    this.stopAutoPlay();
    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  toggleAutoPlay(): void {
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay) {
      this.startAutoPlay();
    } else {
      this.stopAutoPlay();
    }
  }

  getImageTransform(): string {
    if (this.isZoomed) {
      return `scale(${this.zoomLevel}) translate(${this.zoomX}px, ${this.zoomY}px)`;
    }
    return 'scale(1) translate(0px, 0px)';
  }

  protected readonly Math = Math;
}
