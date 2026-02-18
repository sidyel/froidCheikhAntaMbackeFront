import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Components
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';
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

// Shared Components
import { LoadingSpinnerComponent } from './components/shared/loading-spinner/loading-spinner.component';
import { ModalComponent } from './components/shared/modal/modal.component';
import { PaginationComponent } from './components/shared/pagination/pagination.component';
import { FilterSidebarComponent } from './components/shared/filter-sidebar/filter-sidebar.component';
import { SearchBarComponent } from './components/shared/search-bar/search-bar.component';
import { BreadcrumbComponent } from './components/shared/breadcrumb/breadcrumb.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';
import { ImageGalleryComponent } from './components/shared/image-gallery/image-gallery.component';
import { StarRatingComponent } from './components/shared/star-rating/star-rating.component';
import { CategoryTreeComponent } from './components/shared/category-tree/category-tree.component';
import { QuantitySelectorComponent } from './components/shared/quantity-selector/quantity-selector.component';
import { ProductCardComponent } from "./components/shared/product-card/product-card.component";

// Lucide Icons - Import complet avec toutes les icônes nécessaires
import {
  LucideAngularModule,
  ShoppingCart,
  User,
  Users,
  MailOpen,
  Heart,
  Search,
  Menu,
  X,
  Star,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,      // Ajouté - manquant pour pagination
  ChevronUp,        // Ajouté - peut être utilisé
  Home,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Filter,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info,
  LogOut,
  Settings,
  Edit,
  Trash2,
  Download,
  Upload,
  Shield,
  Warehouse,
  Snowflake,
  Fan,
  Zap,
  WashingMachine,
  Microwave,
  Grid,
  List,
  // Icônes supplémentaires souvent utilisées
  Calendar,         // Pour dates
  Clock,           // Pour horaires
  DollarSign,      // Pour prix/monnaie
  Percent,         // Pour pourcentages/promotions
  Tag,             // Pour étiquettes/tags
  Star as StarFilled,  // Étoile pleine
  UserCircle,      // Avatar utilisateur
  Lock,            // Sécurité/mot de passe
  Unlock,          // Déverrouiller
  Camera,          // Pour photos produits
  Image,           // Pour images
  Video,           // Pour vidéos
  FileText,        // Pour documents
  AlertTriangle,   // Avertissements
  CheckCircle,     // Succès
  XCircle,         // Erreurs
  HelpCircle,      // Aide
  ExternalLink,    // Liens externes
  Copy,            // Copier
  Share,           // Partager
  BookmarkIcon,    // Favoris/signets
  RefreshCcw,      // Actualiser
  RotateCcw,       // Annuler
  Save,            // Sauvegarder
  Send,            // Envoyer
  MessageCircle,   // Messages/commentaires
  ThumbsUp,        // J'aime
  ThumbsDown,      // Je n'aime pas
  TrendingUp,      // Tendances/statistiques
  BarChart,        // Graphiques
  PieChart,        // Graphiques circulaires
  Activity, XIcon         // Activité/monitoring
} from 'lucide-angular';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminProduitsComponent } from './components/admin/admin-produits/admin-produits.component';
import { AdminCommandesComponent } from './components/admin/admin-commandes/admin-commandes.component';
import { AdminClientsComponent } from './components/admin/admin-clients/admin-clients.component';
import { AdminCategoriesComponent } from './components/admin/admin-categories/admin-categories.component';
import { AdminMarquesComponent } from './components/admin/admin-marques/admin-marques.component';
import { AdminStockComponent } from './components/admin/admin-stock/admin-stock.component';
import { ProduitFormComponent } from './components/admin/produits/produit-form/produit-form.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { LazyLoadDirective } from './directives/lazy-load.directive';
import { AdminContactsComponent } from './components/admin/contacts/admin-contacts/admin-contacts.component';

@NgModule({
  declarations: [
    AppComponent,

    // Layout Components
    HeaderComponent,
    FooterComponent,

    // Page Components
    HomeComponent,
    ProductListComponent,
    ProductDetailComponent,
    CartComponent,
    CheckoutComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    OrdersComponent,
    OrderDetailComponent,
    WishlistComponent,
    ContactComponent,
    AboutComponent,
    NotFoundComponent,

    // Shared Components
    ProductCardComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    PaginationComponent,
    FilterSidebarComponent,
    SearchBarComponent,
    BreadcrumbComponent,
    ToastComponent,
    ConfirmDialogComponent,
    ImageGalleryComponent,
    StarRatingComponent,
    CategoryTreeComponent,
    QuantitySelectorComponent,
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminProduitsComponent,
    AdminCommandesComponent,
    AdminClientsComponent,
    AdminCategoriesComponent,
    AdminMarquesComponent,
    AdminStockComponent,
    ProduitFormComponent,
    ImageUploadComponent,
    LazyLoadDirective,
    AdminContactsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule.pick({
      // Navigation et UI de base
      ShoppingCart,
      User,
      UserCircle,
      Heart,
      Search,
      Menu,
      X,
      Home,

      // Chevrons et flèches (essentiels pour pagination)
      ChevronDown,
      ChevronRight,
      ChevronLeft,      // FIX PRINCIPAL - était manquant
      ChevronUp,
      ArrowLeft,
      ArrowRight,

      // Étoiles et ratings
      Star,

      // Actions
      Plus,
      Minus,
      Edit,
      Trash2,
      Check,
      CheckCircle,
      XIcon,       // Alias pour éviter conflit
      XCircle,
      Save,
      Send,
      Copy,
      Share,
      RefreshCcw,
      RotateCcw,

      // E-commerce
      Package,
      Truck,
      CreditCard,
      DollarSign,
      Percent,
      Tag,
      BookmarkIcon,

      // Contact et localisation
      MapPin,
      Phone,
      Mail,

      // Interface et navigation
      Filter,
      Grid,
      List,
      Eye,
      EyeOff,
      ExternalLink,

      // Alertes et notifications
      AlertCircle,
      AlertTriangle,
      Info,
      HelpCircle,

      // Authentification et sécurité
      LogOut,
      Lock,
      Unlock,
      Shield,

      // Paramètres et configuration
      Settings,

      // Fichiers et médias
      Download,
      Upload,
      Camera,
      Image,
      Video,
      FileText,

      // Catégories produits (pour e-commerce climatisation)
      Warehouse,
      Snowflake,        // Climatisation/froid
      Fan,              // Ventilateurs
      Zap,              // Électricité/énergie
      WashingMachine,   // Électroménager
      Microwave,        // Électroménager

      // Dates et temps
      Calendar,
      Clock,

      // Social et interaction
      MessageCircle,
      ThumbsUp,
      ThumbsDown,

      // Analytics et statistiques
      TrendingUp,
      BarChart,
      PieChart,
      Activity,
      Users,
      MailOpen
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
