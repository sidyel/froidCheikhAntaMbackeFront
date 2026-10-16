import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ConsentService } from '../../../services/consent.service';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
})
export class CookieBannerComponent implements OnInit, OnDestroy {
  visible = false;
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private consentService: ConsentService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.consentService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => { this.visible = state === null; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  accept(): void {
    this.consentService.accept();
    this.visible = false;
  }

  refuse(): void {
    this.consentService.refuse();
    this.visible = false;
  }
}
