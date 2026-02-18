import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-quantity-selector',
  template: `
    <div class="flex items-center" [class]="containerClasses">

      <!-- Decrease Button -->
      <button
        type="button"
        (click)="decrease()"
        [disabled]="isDecreaseDisabled()"
        [class]="getButtonClasses('decrease')"
        class="flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-l-md">
        <lucide-icon name="minus" class="w-4 h-4"></lucide-icon>
      </button>

      <!-- Quantity Input -->
      <input
        type="number"
        [value]="quantity"
        [min]="min"
        [max]="max"
        [disabled]="disabled"
        [readonly]="readonly"
        (input)="onInputChange($event)"
        (blur)="onInputBlur($event)"
        (keydown.enter)="onInputBlur($event)"
        class="w-16 text-center border-t border-b border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm font-medium bg-white disabled:bg-gray-50 disabled:text-gray-500"
        [class.border-red-300]="hasError"
        [class.focus:ring-red-500]="hasError">

      <!-- Increase Button -->
      <button
        type="button"
        (click)="increase()"
        [disabled]="isIncreaseDisabled()"
        [class]="getButtonClasses('increase')"
        class="flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-r-md">
        <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
      </button>
    </div>

    <!-- Error Message -->
    <p *ngIf="errorMessage" class="text-red-500 text-xs mt-1">
      {{ errorMessage }}
    </p>

    <!-- Stock Info -->
    <p *ngIf="showStockInfo && maxStock" class="text-gray-500 text-xs mt-1">
      {{ maxStock }} disponible{{ maxStock > 1 ? 's' : '' }}
    </p>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantitySelectorComponent),
      multi: true
    }
  ]
})
export class QuantitySelectorComponent implements ControlValueAccessor {
  @Input() min = 1;
  @Input() max = 99;
  @Input() step = 1;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() maxStock?: number;
  @Input() showStockInfo = false;
  @Input() containerClasses = '';

  @Output() quantityChange = new EventEmitter<number>();
  @Output() stockExceeded = new EventEmitter<{requested: number, available: number}>();

  quantity = 1;
  errorMessage = '';
  hasError = false;

  // ControlValueAccessor
  private onChange = (value: number) => {};
  private onTouched = () => {};

  writeValue(value: number): void {
    if (value !== undefined && value !== null) {
      this.quantity = this.validateQuantity(value);
    }
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  decrease(): void {
    if (!this.isDecreaseDisabled()) {
      const newQuantity = Math.max(this.min, this.quantity - this.step);
      this.updateQuantity(newQuantity);
    }
  }

  increase(): void {
    if (!this.isIncreaseDisabled()) {
      const newQuantity = Math.min(this.getMaxLimit(), this.quantity + this.step);
      this.updateQuantity(newQuantity);
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);

    if (!isNaN(value)) {
      this.updateQuantity(value, false); // Don't validate immediately on input
    }
  }

  onInputBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);

    if (isNaN(value) || value === 0) {
      this.updateQuantity(this.min);
    } else {
      this.updateQuantity(this.validateQuantity(value));
    }

    this.onTouched();
  }

  private updateQuantity(newQuantity: number, validate = true): void {
    const validatedQuantity = validate ? this.validateQuantity(newQuantity) : newQuantity;

    if (this.quantity !== validatedQuantity) {
      this.quantity = validatedQuantity;
      this.onChange(this.quantity);
      this.quantityChange.emit(this.quantity);

      // Check stock limits
      if (this.maxStock && validatedQuantity > this.maxStock) {
        this.stockExceeded.emit({
          requested: validatedQuantity,
          available: this.maxStock
        });
      }
    }

    this.validateInput();
  }

  private validateQuantity(value: number): number {
    const maxLimit = this.getMaxLimit();
    return Math.max(this.min, Math.min(maxLimit, value));
  }

  private validateInput(): void {
    this.errorMessage = '';
    this.hasError = false;

    if (this.quantity < this.min) {
      this.errorMessage = `La quantité minimum est ${this.min}`;
      this.hasError = true;
    } else if (this.quantity > this.max) {
      this.errorMessage = `La quantité maximum est ${this.max}`;
      this.hasError = true;
    } else if (this.maxStock && this.quantity > this.maxStock) {
      this.errorMessage = `Seulement ${this.maxStock} disponible${this.maxStock > 1 ? 's' : ''}`;
      this.hasError = true;
    }
  }

  private getMaxLimit(): number {
    if (this.maxStock) {
      return Math.min(this.max, this.maxStock);
    }
    return this.max;
  }

  isDecreaseDisabled(): boolean {
    return this.disabled || this.readonly || this.quantity <= this.min;
  }

  isIncreaseDisabled(): boolean {
    return this.disabled || this.readonly || this.quantity >= this.getMaxLimit();
  }

  getButtonClasses(type: 'increase' | 'decrease'): string {
    const baseClasses = 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white';

    let sizeClasses = '';
    switch (this.size) {
      case 'sm':
        sizeClasses = 'w-8 h-8';
        break;
      case 'md':
        sizeClasses = 'w-10 h-10';
        break;
      case 'lg':
        sizeClasses = 'w-12 h-12';
        break;
    }

    // Border adjustments for proper connection with input
    const borderClasses = type === 'decrease'
      ? 'border-r-0'
      : 'border-l-0';

    return `${baseClasses} ${sizeClasses} ${borderClasses}`;
  }

  // Public methods
  getValue(): number {
    return this.quantity;
  }

  setValue(value: number): void {
    this.updateQuantity(value);
  }

  reset(): void {
    this.updateQuantity(this.min);
  }

  isValid(): boolean {
    return !this.hasError && this.quantity >= this.min && this.quantity <= this.getMaxLimit();
  }

  getValidationError(): string {
    return this.errorMessage;
  }
}
