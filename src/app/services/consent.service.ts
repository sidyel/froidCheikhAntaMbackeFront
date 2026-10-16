import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type ConsentState = 'accepted' | 'refused' | null;

const STORAGE_KEY = 'cookie_consent';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _state$ = new BehaviorSubject<ConsentState>(this.readFromStorage());

  readonly state$ = this._state$.asObservable();

  get state(): ConsentState {
    return this._state$.value;
  }

  accept(): void {
    this.set('accepted');
  }

  refuse(): void {
    this.set('refused');
  }

  reset(): void {
    this.set(null);
  }

  private set(value: ConsentState): void {
    this._state$.next(value);
    if (this.isBrowser) {
      try {
        if (value === null) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, value);
      } catch {}
    }
  }

  private readFromStorage(): ConsentState {
    if (!this.isBrowser) return null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return (v === 'accepted' || v === 'refused') ? v : null;
    } catch {
      return null;
    }
  }
}
