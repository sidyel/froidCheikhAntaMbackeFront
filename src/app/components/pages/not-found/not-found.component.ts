import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent implements OnInit {
  countdown = 10;
  public countdownInterval: any;

  popularLinks = [
    { label: 'Accueil', route: '/', icon: 'home' },
    { label: 'Nos Produits', route: '/produits', icon: 'package' },
    { label: 'Climatiseurs', route: '/produits?categorie=climatiseurs', icon: 'snowflake' },
    { label: 'Contact', route: '/contact', icon: 'phone' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.goHome();
      }
    }, 1000);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }

  stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  onSearch(value: string) {

  }
}
