import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css']
})
export class StarRatingComponent implements OnInit, OnChanges {
  @Input() rating = 0; // Note actuelle (0-5)
  @Input() maxRating = 5; // Nombre maximum d'étoiles
  @Input() readonly = false; // Mode lecture seule
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showValue = false; // Afficher la valeur numérique
  @Input() showCount = false; // Afficher le nombre d'avis
  @Input() count = 0; // Nombre d'avis
  @Input() allowHalfStars = true; // Autoriser les demi-étoiles
  @Input() color = '#fbbf24'; // Couleur des étoiles remplies
  @Input() emptyColor = '#e5e7eb'; // Couleur des étoiles vides
  @Input() hoverColor = '#f59e0b'; // Couleur au survol
  @Input() animated = true; // Animations
  @Input() disabled = false; // Désactivé

  @Output() ratingChange = new EventEmitter<number>();
  @Output() ratingSelected = new EventEmitter<number>();

  stars: StarState[] = [];
  hoveredRating = 0;
  isHovering = false;
  currentRating = 0;

  ngOnInit(): void {
    this.initializeStars();
    this.currentRating = this.rating;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rating'] || changes['maxRating'] || changes['allowHalfStars']) {
      this.initializeStars();
      this.currentRating = this.rating;
    }
  }

  private initializeStars(): void {
    this.stars = [];
    for (let i = 1; i <= this.maxRating; i++) {
      this.stars.push({
        index: i,
        filled: this.getStarFillState(i, this.rating)
      });
    }
  }

  private getStarFillState(starIndex: number, rating: number): 'empty' | 'half' | 'full' {
    if (rating >= starIndex) {
      return 'full';
    } else if (this.allowHalfStars && rating >= starIndex - 0.5) {
      return 'half';
    } else {
      return 'empty';
    }
  }

  trackByStar(index: number, star: any): number {
    return star.index;
  }

  onStarClick(starIndex: number, event?: MouseEvent): void {
    if (this.readonly || this.disabled) return;

    let newRating = starIndex;

    // Si on permet les demi-étoiles et qu'on a un event de clic
    if (this.allowHalfStars && event) {
      const starElement = event.currentTarget as HTMLElement;
      const rect = starElement.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const starWidth = rect.width;

      // Si on clique sur la première moitié de l'étoile
      if (clickX < starWidth / 2) {
        newRating = starIndex - 0.5;
      }
    }

    // Si on clique sur l'étoile déjà sélectionnée, on peut la désélectionner
    if (this.currentRating === newRating) {
      newRating = 0;
    }

    this.currentRating = newRating;
    this.rating = newRating;
    this.updateStars(newRating);

    this.ratingChange.emit(newRating);
    this.ratingSelected.emit(newRating);
  }

  onStarHover(starIndex: number, event?: MouseEvent): void {
    if (this.readonly || this.disabled) return;

    this.isHovering = true;
    let hoverRating = starIndex;

    // Gestion des demi-étoiles au survol
    if (this.allowHalfStars && event) {
      const starElement = event.currentTarget as HTMLElement;
      const rect = starElement.getBoundingClientRect();
      const hoverX = event.clientX - rect.left;
      const starWidth = rect.width;

      if (hoverX < starWidth / 2) {
        hoverRating = starIndex - 0.5;
      }
    }

    this.hoveredRating = hoverRating;
    this.updateStarsForHover(hoverRating);
  }

  onStarLeave(): void {
    if (this.readonly || this.disabled) return;

    this.isHovering = false;
    this.hoveredRating = 0;
    this.updateStars(this.currentRating);
  }

  onContainerLeave(): void {
    this.onStarLeave();
  }

  private updateStars(rating: number): void {
    this.stars.forEach(star => {
      star.filled = this.getStarFillState(star.index, rating);
    });
  }

  private updateStarsForHover(rating: number): void {
    this.stars.forEach(star => {
      star.filled = this.getStarFillState(star.index, rating);
    });
  }

  getStarClass(): string {
    const classes = ['star'];

    classes.push(`star-${this.size}`);

    if (!this.readonly && !this.disabled) {
      classes.push('star-interactive');
    }

    if (this.disabled) {
      classes.push('star-disabled');
    }

    if (this.animated) {
      classes.push('star-animated');
    }

    return classes.join(' ');
  }

  getContainerClass(): string {
    const classes = ['star-rating'];

    if (!this.readonly && !this.disabled) {
      classes.push('star-rating-interactive');
    }

    return classes.join(' ');
  }

  getRatingText(): string {
    if (this.showValue && this.showCount) {
      return `${this.rating.toFixed(1)} (${this.count} avis)`;
    } else if (this.showValue) {
      return this.rating.toFixed(1);
    } else if (this.showCount) {
      return `${this.count} avis`;
    }
    return '';
  }

  getAriaLabel(): string {
    return `Note: ${this.rating} sur ${this.maxRating} étoiles`;
  }

  // Méthodes publiques pour contrôler le composant
  setRating(rating: number): void {
    this.rating = Math.max(0, Math.min(rating, this.maxRating));
    this.currentRating = this.rating;
    this.updateStars(this.rating);
  }

  reset(): void {
    this.setRating(0);
    this.ratingChange.emit(0);
  }

  // Calcul des pourcentages pour l'affichage des étoiles partielles
  getStarPercentage(star: StarState): number {
    const rating = this.isHovering ? this.hoveredRating : this.currentRating;

    if (rating >= star.index) {
      return 100;
    } else if (rating >= star.index - 0.5) {
      return 50;
    } else {
      return 0;
    }
  }
}

interface StarState {
  index: number;
  filled: 'empty' | 'half' | 'full';
}
import { Injectable } from '@angular/core';

export interface RatingData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

@Injectable({
  providedIn: 'root'
})
export class StarRatingService {

  constructor() {}

  // Calculer la note moyenne à partir d'un tableau de notes
  calculateAverageRating(ratings: number[]): number {
    if (ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10; // Arrondi à 1 décimale
  }

  // Obtenir la distribution des notes (nombre de chaque note)
  getRatingDistribution(ratings: number[]): { [key: number]: number } {
    const distribution: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratings.forEach(rating => {
      const roundedRating = Math.round(rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating]++;
      }
    });

    return distribution;
  }

  // Obtenir un résumé complet des ratings
  getRatingSummary(ratings: number[]): RatingData {
    return {
      averageRating: this.calculateAverageRating(ratings),
      totalReviews: ratings.length,
      ratingDistribution: this.getRatingDistribution(ratings)
    };
  }

  // Convertir une note en pourcentage (pour les barres de progression)
  getRatingPercentage(rating: number, maxRating: number = 5): number {
    return Math.round((rating / maxRating) * 100);
  }

  // Obtenir un texte descriptif pour une note
  getRatingDescription(rating: number): string {
    if (rating === 0) return 'Aucune évaluation';
    if (rating < 1.5) return 'Très insatisfaisant';
    if (rating < 2.5) return 'Insatisfaisant';
    if (rating < 3.5) return 'Correct';
    if (rating < 4.5) return 'Bien';
    return 'Excellent';
  }

  // Valider qu'une note est dans la plage autorisée
  validateRating(rating: number, minRating: number = 0, maxRating: number = 5): boolean {
    return rating >= minRating && rating <= maxRating;
  }

  // Formater l'affichage d'une note
  formatRating(rating: number, showDecimals: boolean = true): string {
    if (showDecimals) {
      return rating.toFixed(1);
    }
    return Math.round(rating).toString();
  }
}

// Méthode pour le trackBy dans le template

