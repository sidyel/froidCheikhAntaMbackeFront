import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductFilters, Categorie, Marque, LabelEnergie } from '../../../models/interfaces';

@Component({
  selector: 'app-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() isVisible = false;
  @Input() categories: Categorie[] = [];
  @Input() marques: Marque[] = [];
  @Input() currentFilters: ProductFilters = {};
  @Input() priceRange = { min: 0, max: 5000000 }; // Prix en FCFA
  @Input() isLoading = false;

  @Output() filtersChanged = new EventEmitter<ProductFilters>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  filterForm: FormGroup;
  expandedSections: Set<string> = new Set(['price', 'categories']);

  // Options pour les labels énergétiques
  labelEnergieOptions = [
    { value: LabelEnergie.A_PLUS_PLUS_PLUS, label: 'A+++' },
    { value: LabelEnergie.A_PLUS_PLUS, label: 'A++' },
    { value: LabelEnergie.A_PLUS, label: 'A+' },
    { value: LabelEnergie.A, label: 'A' },
    { value: LabelEnergie.B, label: 'B' },
    { value: LabelEnergie.C, label: 'C' },
    { value: LabelEnergie.D, label: 'D' }
  ];

  // Options pour les fourchettes de prix prédéfinies
  priceRanges = [
    { label: 'Moins de 100 000 FCFA', min: 0, max: 100000 },
    { label: '100 000 - 300 000 FCFA', min: 100000, max: 300000 },
    { label: '300 000 - 500 000 FCFA', min: 300000, max: 500000 },
    { label: '500 000 - 1 000 000 FCFA', min: 500000, max: 1000000 },
    { label: 'Plus de 1 000 000 FCFA', min: 1000000, max: null }
  ];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      nom: [''],
      prixMin: [null],
      prixMax: [null],
      categorieId: [null],
      marqueId: [null],
      labelEnergie: [null],
      disponibilite: [true]
    });
  }

  ngOnInit(): void {
    // Initialiser le formulaire avec les filtres actuels
    this.updateFormFromFilters();

    // Écouter les changements du formulaire avec debounce
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(values => {
      this.emitFilters(values);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateFormFromFilters(): void {
    this.filterForm.patchValue({
      nom: this.currentFilters.nom || '',
      prixMin: this.currentFilters.prixMin || null,
      prixMax: this.currentFilters.prixMax || null,
      categorieId: this.currentFilters.categorieId || null,
      marqueId: this.currentFilters.marqueId || null,
      labelEnergie: this.currentFilters.labelEnergie || null,
      disponibilite: this.currentFilters.disponibilite !== false
    });
  }

  emitFilters(formValues: any): void {
    const filters: ProductFilters = {};

    if (formValues.nom?.trim()) {
      filters.nom = formValues.nom.trim();
    }
    if (formValues.prixMin !== null && formValues.prixMin !== '') {
      filters.prixMin = Number(formValues.prixMin);
    }
    if (formValues.prixMax !== null && formValues.prixMax !== '') {
      filters.prixMax = Number(formValues.prixMax);
    }
    if (formValues.categorieId) {
      filters.categorieId = Number(formValues.categorieId);
    }
    if (formValues.marqueId) {
      filters.marqueId = Number(formValues.marqueId);
    }
    if (formValues.labelEnergie) {
      filters.labelEnergie = formValues.labelEnergie;
    }
    if (formValues.disponibilite === false) {
      filters.disponibilite = false;
    }

    this.filtersChanged.emit(filters);
  }

  onPriceRangeSelect(range: any): void {
    this.filterForm.patchValue({
      prixMin: range.min,
      prixMax: range.max
    });
  }

  onClearFilters(): void {
    this.filterForm.reset({
      nom: '',
      prixMin: null,
      prixMax: null,
      categorieId: null,
      marqueId: null,
      labelEnergie: null,
      disponibilite: true
    });
    this.clearFilters.emit();
  }

  toggleSection(sectionName: string): void {
    if (this.expandedSections.has(sectionName)) {
      this.expandedSections.delete(sectionName);
    } else {
      this.expandedSections.add(sectionName);
    }
  }

  isSectionExpanded(sectionName: string): boolean {
    return this.expandedSections.has(sectionName);
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Formater les prix pour l'affichage
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  // Obtenir le nombre de filtres actifs
  get activeFiltersCount(): number {
    let count = 0;
    const values = this.filterForm.value;

    if (values.nom?.trim()) count++;
    if (values.prixMin !== null && values.prixMin !== '') count++;
    if (values.prixMax !== null && values.prixMax !== '') count++;
    if (values.categorieId) count++;
    if (values.marqueId) count++;
    if (values.labelEnergie) count++;
    if (values.disponibilite === false) count++;

    return count;
  }
}
