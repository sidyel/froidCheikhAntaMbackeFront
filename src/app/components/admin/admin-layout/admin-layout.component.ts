// src/app/components/admin/layout/admin-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserInfo } from '../../../models/interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Header Admin -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">Administration</h1>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-700" *ngIf="currentUser$ | async as user">
                {{ user.prenom }} {{ user.nom }}
              </div>
              <button
                (click)="retourSite()"
                class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Retour au site
              </button>
              <button
                (click)="logout()"
                class="text-gray-500 hover:text-gray-700">
                <lucide-icon name="log-out" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white shadow-sm h-screen sticky top-16">
          <nav class="mt-5 px-2">
            <div class="space-y-1">
              <a routerLink="/admin/dashboard"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="bar-chart" class="mr-3 h-5 w-5"></lucide-icon>
                Dashboard
              </a>

              <a routerLink="/admin/produits"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="package" class="mr-3 h-5 w-5"></lucide-icon>
                Produits
              </a>

              <a routerLink="/admin/categories"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="grid" class="mr-3 h-5 w-5"></lucide-icon>
                Catégories
              </a>

              <a routerLink="/admin/marques"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="tag" class="mr-3 h-5 w-5"></lucide-icon>
                Marques
              </a>

              <a routerLink="/admin/commandes"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="truck" class="mr-3 h-5 w-5"></lucide-icon>
                Commandes
              </a>

              <a routerLink="/admin/clients"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="users" class="mr-3 h-5 w-5"></lucide-icon>
                Clients
              </a>

              <a routerLink="/admin/stock"
                 routerLinkActive="bg-primary-100 text-primary-700"
                 class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <lucide-icon name="warehouse" class="mr-3 h-5 w-5"></lucide-icon>
                Stock
              </a>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  currentUser$: Observable<UserInfo | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  retourSite(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout();
  }
}
