import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { DEFAULT_CONFIG, SiteConfig } from '../models/site-config.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {

  private config$ = new BehaviorSubject<SiteConfig>(DEFAULT_CONFIG);

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /** Appelé par APP_INITIALIZER — bloque le démarrage jusqu'à résolution. */
  loadConfig(): Promise<void> {
    return lastValueFrom(
      this.http.get<SiteConfig>(`${environment.apiUrl}/config`).pipe(
        timeout(5000),
        catchError(() => of(DEFAULT_CONFIG)),
        tap(config => {
          this.config$.next(config);
          this.applyCssVars(config);
        })
      )
    ).then(() => undefined);
  }

  get config(): SiteConfig {
    return this.config$.value;
  }

  get config$Observable() {
    return this.config$.asObservable();
  }

  // ---- CSS vars ----

  private applyCssVars(config: SiteConfig): void {
    const root = this.document.documentElement;
    if (config.couleurPrimaire) {
      this.applyShades(root, 'primary', config.couleurPrimaire);
    }
    if (config.couleurSecondaire) {
      this.applyShades(root, 'secondary', config.couleurSecondaire);
    }
    if (config.couleurAccent) {
      this.applyShades(root, 'accent', config.couleurAccent);
    }
    if (config.police) {
      root.style.setProperty('--font-sans', `'${config.police}', ui-sans-serif, system-ui`);
    }
  }

  /** Génère les shades 50–900 autour d'une couleur de base (shade 600). */
  private applyShades(root: HTMLElement, name: string, hex: string): void {
    const base = this.hexToRgb(hex);
    if (!base) return;

    // 600 = la couleur de base
    const shades: Record<number, [number, number, number]> = {
      50:  this.mix(base, [255, 255, 255], 0.95),
      100: this.mix(base, [255, 255, 255], 0.88),
      200: this.mix(base, [255, 255, 255], 0.76),
      300: this.mix(base, [255, 255, 255], 0.60),
      400: this.mix(base, [255, 255, 255], 0.38),
      500: this.mix(base, [255, 255, 255], 0.14),
      600: base,
      700: this.mix(base, [0, 0, 0], 0.12),
      800: this.mix(base, [0, 0, 0], 0.24),
      900: this.mix(base, [0, 0, 0], 0.36),
    };

    for (const [shade, rgb] of Object.entries(shades)) {
      root.style.setProperty(
        `--color-${name}-${shade}`,
        `${rgb[0]} ${rgb[1]} ${rgb[2]}`
      );
    }
  }

  private hexToRgb(hex: string): [number, number, number] | null {
    const cleaned = hex.replace('#', '');
    if (cleaned.length !== 6) return null;
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ];
  }

  /** Mélange couleur A avec couleur B selon un ratio (0 = tout A, 1 = tout B). */
  private mix(
    a: [number, number, number],
    b: [number, number, number],
    ratio: number
  ): [number, number, number] {
    return [
      Math.round(a[0] + (b[0] - a[0]) * ratio),
      Math.round(a[1] + (b[1] - a[1]) * ratio),
      Math.round(a[2] + (b[2] - a[2]) * ratio),
    ];
  }
}
