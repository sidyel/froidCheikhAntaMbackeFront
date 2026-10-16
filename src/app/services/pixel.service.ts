import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConsentService } from './consent.service';
import { ConfigService } from './config.service';

declare let fbq: (...args: unknown[]) => void;
declare let gtag: (...args: unknown[]) => void;

@Injectable({ providedIn: 'root' })
export class PixelService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly consentService = inject(ConsentService);
  private readonly configService = inject(ConfigService);

  /** Clés commandeId déjà trackées (anti-doublon Purchase). */
  private readonly trackedPurchases = new Set<string>();

  /** Initialise les scripts publicitaires si consentement = accepted. */
  init(): void {
    if (!this.isBrowser) return;
    if (this.consentService.state !== 'accepted') return;
    this.loadPixels();
  }

  trackPageView(): void {
    if (!this.isBrowser || this.consentService.state !== 'accepted') return;
    this.fbq('track', 'PageView');
    this.ga('event', 'page_view');
  }

  trackViewContent(params: { contentId: string; contentName: string; value: number }): void {
    if (!this.isBrowser || this.consentService.state !== 'accepted') return;
    this.fbq('track', 'ViewContent', {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: 'product',
      value: params.value,
      currency: 'XOF',
    });
    this.ga('event', 'view_item', { items: [{ item_id: params.contentId, item_name: params.contentName, price: params.value }] });
  }

  trackAddToCart(params: { contentId: string; contentName: string; value: number; quantity: number }): void {
    if (!this.isBrowser || this.consentService.state !== 'accepted') return;
    this.fbq('track', 'AddToCart', {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: 'product',
      value: params.value,
      currency: 'XOF',
    });
    this.ga('event', 'add_to_cart', { items: [{ item_id: params.contentId, item_name: params.contentName, price: params.value, quantity: params.quantity }] });
  }

  trackInitiateCheckout(params: { value: number; numItems: number }): void {
    if (!this.isBrowser || this.consentService.state !== 'accepted') return;
    this.fbq('track', 'InitiateCheckout', { value: params.value, currency: 'XOF', num_items: params.numItems });
    this.ga('event', 'begin_checkout', { value: params.value, currency: 'XOF' });
  }

  /** Anti-doublon : n'envoie qu'une fois par commandeId (même si la page confirmation est rechargée). */
  trackPurchase(params: { commandeId: string | number; value: number; eventId?: string }): void {
    if (!this.isBrowser || this.consentService.state !== 'accepted') return;

    const key = String(params.commandeId);
    const storageKey = `pix_purchase_${key}`;

    const alreadySent = this.trackedPurchases.has(key) || this.readBool(storageKey);
    if (alreadySent) return;

    this.trackedPurchases.add(key);
    try { localStorage.setItem(storageKey, '1'); } catch {}

    this.fbq('track', 'Purchase', { value: params.value, currency: 'XOF' }, params.eventId ? { eventID: `purchase-${key}` } : undefined);
    this.ga('event', 'purchase', { transaction_id: key, value: params.value, currency: 'XOF' });
  }

  // ── Chargement dynamique des scripts ──────────────────────────────────────

  private loadPixels(): void {
    const config = this.configService.config;

    if (config.metaPixelId) {
      this.loadMetaPixel(config.metaPixelId);
    }
    if (config.googleAnalyticsId) {
      this.loadGoogleTag(config.googleAnalyticsId);
    }
  }

  private loadMetaPixel(pixelId: string): void {
    if ((window as unknown as { _fbpLoaded?: boolean })._fbpLoaded) return;
    (window as unknown as { _fbpLoaded?: boolean })._fbpLoaded = true;

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${pixelId}');
      fbq('track','PageView');
    `;
    document.head.appendChild(script);
  }

  private loadGoogleTag(tagId: string): void {
    if ((window as unknown as { _gtagLoaded?: boolean })._gtagLoaded) return;
    (window as unknown as { _gtagLoaded?: boolean })._gtagLoaded = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(s);

    const inline = document.createElement('script');
    inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${tagId}');`;
    document.head.appendChild(inline);
  }

  // ── Wrappers sécurisés ────────────────────────────────────────────────────

  private fbq(...args: unknown[]): void {
    try {
      if (typeof fbq !== 'undefined') fbq(...args);
    } catch {}
  }

  private ga(...args: unknown[]): void {
    try {
      if (typeof gtag !== 'undefined') gtag(...args);
    } catch {}
  }

  private readBool(key: string): boolean {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  }
}
