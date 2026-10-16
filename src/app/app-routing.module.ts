// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from "./guards/auth.guard";
import { GuestGuard } from "./guards/guest.guard";
import { AdminGuard } from "./guards/admin.guard";

// Components
import { HomeComponent } from './components/pages/home/home.component';
import { ProductListComponent } from './components/pages/product-list/product-list.component';
import { ProductDetailComponent } from './components/pages/product-detail/product-detail.component';
import { CartComponent } from './components/pages/cart/cart.component';
import { CheckoutComponent } from './components/pages/checkout/checkout.component';
import { LoginComponent } from './components/pages/auth/login/login.component';
import { RegisterComponent } from './components/pages/auth/register/register.component';
import { ProfileComponent } from './components/pages/profile/profile.component';
import { OrdersComponent } from './components/pages/orders/orders.component';
import { OrderDetailComponent } from './components/pages/order-detail/order-detail.component';
import { WishlistComponent } from './components/pages/wishlist/wishlist.component';
import { ContactComponent } from './components/pages/contact/contact.component';
import { AboutComponent } from './components/pages/about/about.component';
import { NotFoundComponent } from './components/pages/not-found/not-found.component';
import { SuiviCommandeComponent } from './components/pages/suivi-commande/suivi-commande.component';

// Admin Components
import { AdminLayoutComponent } from "./components/admin/admin-layout/admin-layout.component";
import { AdminDashboardComponent } from "./components/admin/admin-dashboard/admin-dashboard.component";
import { AdminProduitsComponent } from "./components/admin/admin-produits/admin-produits.component";
import { AdminCommandesComponent } from "./components/admin/admin-commandes/admin-commandes.component";
import { AdminClientsComponent } from "./components/admin/admin-clients/admin-clients.component";
import { AdminMarquesComponent } from "./components/admin/admin-marques/admin-marques.component";
import { AdminStockComponent } from "./components/admin/admin-stock/admin-stock.component";
import { AdminCategoriesComponent } from "./components/admin/admin-categories/admin-categories.component";
import { ProduitFormComponent } from "./components/admin/produits/produit-form/produit-form.component";
import {AdminContactsComponent} from "./components/admin/contacts/admin-contacts/admin-contacts.component";
import { SiteSettingsComponent } from './components/admin/site-settings/site-settings.component';
import { InstallWizardComponent } from './components/pages/install-wizard/install-wizard.component';
import { AdminHeroComponent } from './components/admin/admin-hero/admin-hero.component';
import { AdminPartenairesComponent } from './components/admin/admin-partenaires/admin-partenaires.component';
import { AdminPrestationsComponent } from './components/admin/admin-prestations/admin-prestations.component';
import { AdminEquipeComponent } from './components/admin/admin-equipe/admin-equipe.component';
import { AdminRealisationsComponent } from './components/admin/admin-realisations/admin-realisations.component';
import { AdminZonesLivraisonComponent } from './components/admin/admin-zones-livraison/admin-zones-livraison.component';
import { AdminPromotionsComponent } from './components/admin/admin-promotions/admin-promotions.component';
import { AdminModelesAttributsComponent } from './components/admin/admin-modeles-attributs/admin-modeles-attributs.component';
import { AdminFacturationComponent } from './components/admin/admin-facturation/admin-facturation.component';
import { AdminFacturationFormComponent } from './components/admin/admin-facturation-form/admin-facturation-form.component';
import { AdminFacturationDetailComponent } from './components/admin/admin-facturation-detail/admin-facturation-detail.component';
import { TelechargerDocumentComponent } from './components/pages/telecharger-document/telecharger-document.component';

const routes: Routes = [
  // Installation initiale (accessible uniquement si aucun SUPER_ADMIN)
  {
    path: 'installer',
    component: InstallWizardComponent,
    data: { title: 'Installation du site' }
  },

  // Page d'accueil
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Accueil' }
  },

  // Pages de produits
  {
    path: 'produits',
    component: ProductListComponent,
    data: { title: 'Nos Produits' }
  },
  {
    path: 'produits/categorie/:slug',
    component: ProductListComponent,
    data: { title: 'Produits par Catégorie' }
  },
  {
    path: 'produits/marque/:slug',
    component: ProductListComponent,
    data: { title: 'Produits par Marque' }
  },
  {
    path: 'produits/recherche',
    component: ProductListComponent,
    data: { title: 'Résultats de recherche' }
  },
  {
    path: 'produit/:slug',
    component: ProductDetailComponent,
    data: { title: 'Détail du produit' }
  },

  // Panier et commande
  {
    path: 'panier',
    component: CartComponent,
    data: { title: 'Mon Panier' }
  },
  {
    path: 'commande',
    component: CheckoutComponent,
    data: { title: 'Finaliser ma commande' }
  },

  // Authentification (accessible uniquement aux non-connectés)
  {
    path: 'connexion',
    component: LoginComponent,
    canActivate: [GuestGuard],
    data: { title: 'Connexion' }
  },
  {
    path: 'inscription',
    component: RegisterComponent,
    canActivate: [GuestGuard],
    data: { title: 'Créer un compte' }
  },

  // Pages utilisateur (nécessitent une authentification)
  {
    path: 'profil',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { title: 'Mon Profil' }
  },
  {
    path: 'mes-commandes',
    component: OrdersComponent,
    canActivate: [AuthGuard],
    data: { title: 'Mes Commandes' }
  },
  {
    path: 'commande/:id',
    component: OrderDetailComponent,
    data: { title: 'Détail de la commande' }
  },
  {
    path: 'suivi-commande',
    component: SuiviCommandeComponent,
    data: { title: 'Suivi de commande' }
  },
  {
    path: 'wishlist',
    component: WishlistComponent,
    canActivate: [AuthGuard],
    data: { title: 'Ma Liste de Souhaits' }
  },

  // Pages institutionnelles
  {
    path: 'contact',
    component: ContactComponent,
    data: { title: 'Nous Contacter' }
  },
  {
    path: 'a-propos',
    component: AboutComponent,
    data: { title: 'À Propos de Nous' }
  },

  // ROUTES ADMIN - DÉPLACÉES AVANT LES ROUTES WILDCARD
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        data: { title: 'Dashboard Admin' }
      },
      { path: 'contacts', component: AdminContactsComponent },

      {
        path: 'produits',
        component: AdminProduitsComponent,
        data: { title: 'Gestion des Produits' }
      },
      {
        path: 'produits/nouveau',
        component: ProduitFormComponent,
        data: { title: 'Nouveau Produit' }
      },
      {
        path: 'produits/:id/edit',
        component: ProduitFormComponent,
        data: { title: 'Modifier Produit' }
      },
      {
        path: 'commandes',
        component: AdminCommandesComponent,
        data: { title: 'Gestion des Commandes' }
      },
      {
        path: 'clients',
        component: AdminClientsComponent,
        data: { title: 'Gestion des Clients' }
      },
      {
        path: 'categories',
        component: AdminCategoriesComponent,
        data: { title: 'Gestion des Catégories' }
      },
      {
        path: 'marques',
        component: AdminMarquesComponent,
        data: { title: 'Gestion des Marques' }
      },
      {
        path: 'stock',
        component: AdminStockComponent,
        data: { title: 'Gestion du Stock' }
      },
      {
        path: 'parametres-site',
        component: SiteSettingsComponent,
        data: { title: 'Paramètres du site' }
      },
      { path: 'contenu/hero', component: AdminHeroComponent, data: { title: 'Images Hero' } },
      { path: 'contenu/partenaires', component: AdminPartenairesComponent, data: { title: 'Partenaires' } },
      { path: 'contenu/prestations', component: AdminPrestationsComponent, data: { title: 'Prestations' } },
      { path: 'contenu/equipe', component: AdminEquipeComponent, data: { title: 'Équipe' } },
      { path: 'contenu/realisations', component: AdminRealisationsComponent, data: { title: 'Réalisations' } },
      { path: 'livraison/zones', component: AdminZonesLivraisonComponent, data: { title: 'Zones de livraison' } },
      { path: 'promotions', component: AdminPromotionsComponent, data: { title: 'Promotions' } },
      { path: 'modeles-attributs', component: AdminModelesAttributsComponent, data: { title: 'Modèles d\'attributs' } },
      { path: 'facturation', component: AdminFacturationComponent, data: { title: 'Facturation' } },
      { path: 'facturation/nouveau', component: AdminFacturationFormComponent, data: { title: 'Nouveau document' } },
      { path: 'facturation/:id/edit', component: AdminFacturationFormComponent, data: { title: 'Modifier le document' } },
      { path: 'facturation/:id', component: AdminFacturationDetailComponent, data: { title: 'Fiche document' } }
    ]
  },

  // Page publique téléchargement document (lien WhatsApp)
  {
    path: 'telecharger/:jeton',
    component: TelechargerDocumentComponent,
    data: { title: 'Télécharger le document' }
  },

  // Redirections et erreurs - TOUJOURS À LA FIN
  {
    path: '404',
    component: NotFoundComponent,
    data: { title: 'Page non trouvée' }
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Mettre à true pour le débogage des routes
    scrollPositionRestoration: 'top',
    preloadingStrategy: undefined // Ou PreloadAllModules pour précharger
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
