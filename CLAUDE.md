# CLAUDE.md — Frontend froidCheikhAntaMbackeFront

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Angular 17+ |
| Styles | Tailwind CSS (via `tailwind.config.js`) + `styles.css` global |
| Icons | Lucide Angular |
| HTTP | `HttpClient` (intercepteur JWT dans `auth.interceptor.ts`) |
| Routing | `app-routing.module.ts` avec guards (`auth.guard`, `admin.guard`, `guest.guard`) |
| State | Services RxJS (`BehaviorSubject`) — pas de store centralisé (NgRx/Signals) |
| Build | Angular CLI (`ng build`) |

Dépôt backend associé : `../froidCheikhAntaMbacke`

---

## Règles de travail

1. **Branche par fonctionnalité** — toujours créer `feature/<nom>` depuis `main` (branche principale). Ne jamais travailler directement sur `main`.
2. **Analyse → Conception → Validation → Code** — ne modifier aucun fichier avant que l'utilisateur ait validé la conception proposée.
3. **Un commit par étape logique** — message clair, se terminer par :
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
4. **Ne jamais fusionner ni pousser** sans accord explicite de l'utilisateur.
5. **Aucun secret ni donnée métier en dur** — toutes les URLs API sont dans `environment.ts`. Les infos boutique viennent de `ConfigService` (API backend), jamais codées en dur dans les composants.
6. **Vérifier `ng build --configuration=production`** après chaque étape importante avant de commiter.
7. **`node_modules/`, `dist/`, `.angular/` sont dans `.gitignore`** — ne jamais les commiter.
8. **Accès au DOM via `DOCUMENT`** (`@Inject(DOCUMENT)`) — jamais `window` ou `document` directement, pour rester compatible SSR futur.

---

## Architecture — ConfigService

Fichier : `src/app/services/config.service.ts`

Chargé au démarrage via `APP_INITIALIZER` dans `AppModule`. Appelle `GET /api/config`, timeout **5 secondes**, repli sur `DEFAULT_SITE_CONFIG` si l'API ne répond pas (la base Neon peut être en veille).

**Ce que fait ConfigService :**
1. Remplit un `BehaviorSubject<SiteConfigPublic>` → observable `config$` consommé par les composants.
2. Met à jour `<title>` et la balise `<meta name="description">` via `Title` et `Meta` d'Angular.
3. **Génère les nuances CSS 50–900** à partir de la couleur hexadécimale de base (niveau 600) et les injecte comme variables CSS sur `:root` :
   ```css
   --color-primary-50: R G B;
   --color-primary-600: R G B;
   /* ... etc. */
   ```
4. Applique la police via `--font-sans`.

**Valeurs par défaut** (`DEFAULT_SITE_CONFIG` dans `src/app/models/site-config.interface.ts`) :
- couleurPrimaire : `#2563eb` (bleu Tailwind 600)
- couleurSecondaire : `#16a34a` (vert Tailwind 600)
- Données Froid Cheikh — pour que rien ne change visuellement si l'API est lente ou indisponible.

### Variables CSS Tailwind

`tailwind.config.js` utilise la syntaxe `rgb(var(--color-primary-N) / <alpha-value>)` pour toutes les nuances primary/secondary. Les classes Tailwind `bg-primary-600`, `text-primary-500`, etc. sont donc **dynamiques** — elles changent quand ConfigService injecte de nouvelles valeurs CSS.

Les valeurs par défaut sont définies dans le bloc `:root` de `src/styles.css` (pas besoin de JavaScript pour l'affichage initial).

---

## Interfaces TypeScript clés

| Fichier | Contenu |
|---|---|
| `src/app/models/interfaces.ts` | Toutes les interfaces métier (Produit, Categorie, Marque, Commande, Client…) |
| `src/app/models/site-config.interface.ts` | `SiteConfigPublic`, `SiteConfigAdmin`, `TelephoneSite`, `DEFAULT_SITE_CONFIG` |

---

## Services principaux

| Service | Rôle |
|---|---|
| `ConfigService` | Config site chargée au démarrage depuis l'API |
| `ApiService` | Tous les appels REST produits/catégories/commandes/auth |
| `AdminService` | Appels REST admin (CRUD produits, clients, commandes) |
| `AuthService` | Login, logout, JWT, `currentUser$`, `isAuthenticated$` |
| `CartService` | Panier local (localStorage) |
| `FileService` (backend) | Upload Cloudinary — pas de service Angular dédié, les uploads passent par `ApiService` |

---

## Composants importants

| Composant | Route | Notes |
|---|---|---|
| `HeaderComponent` | (layout) | Utilise `ConfigService` pour téléphone, adresse, logo |
| `FooterComponent` | (layout) | Utilise `ConfigService` pour réseaux sociaux, horaires, companyInfo |
| `ContactComponent` | `/contact` | Utilise `ConfigService` pour coordonnées |
| `AboutComponent` | `/a-propos` | Données riches (équipe, partenaires, réalisations) codées en dur — seul le nom/slogan/contact vient de `ConfigService` |
| `ProduitFormComponent` | `/admin/produits/nouveau`, `/admin/produits/:id` | Upload images vers backend → Cloudinary |
| `SiteSettingsComponent` | `/admin/parametres-site` | 8 onglets, SUPER_ADMIN uniquement |
| `InstallWizardComponent` | `/installer` | 3 étapes, s'affiche si `config.installed === false` |

---

## Feuille de route des modules restants

1. **Module zones de livraison** — remplacer la table de ~30 quartiers/prix codée en dur dans `checkout.component.ts` par des données venant d'une API dédiée. Voir point connu #1.
2. **Enrichissement fiches produits** — afficher les nouveaux champs `ean`, `modeleFabricant`, `attributs` dynamiques dans le formulaire produit et la page détail.
3. **Page mentions légales / CGV** — afficher `mentionsLegales` et `cgv` de `ParametresSite` (markdown → HTML sanitisé, jamais de `innerHTML` brut).
4. **Module facturation** — génération/téléchargement de factures PDF côté admin.
5. **Système de notifications** — email de confirmation commande (templates côté backend).
6. **Revues produits** — feature désactivée dans `environment.ts` (`productReviews: false`).

---

## Points connus à corriger

### #1 — Incohérence des frais de livraison ⚠️
**Symptôme** : `checkout.component.ts` affiche des prix de livraison par quartier (0 à 9 000 FCFA), mais le backend (`CommandeService`) recalcule les frais selon le **mode de livraison** (0 / 2 500 / 5 000 FCFA) en ignorant la zone choisie. Le total en base est différent du total affiché.
**Solution** : module zones de livraison backend + endpoint dédié consommé par le checkout. Ne pas corriger isolément d'un seul côté.

### #2 — `environment.ts` modifié mais non commité
`src/environments/environment.ts` avait des modifications locales (bascule `production: true` + API localhost) non commitées au départ de ce projet. Ce fichier est sur la branche `feature/site-configurable` dans son état corrigé. À revoir avant merge.

### #3 — `AboutComponent` : données riches en dur
Partenaires, équipe, réalisations et services sont codés en dur dans `about.component.ts`. À terme, les migrer vers des entités backend ou un CMS léger. Pour l'instant c'est volontaire (hors scope).

### #4 — Pas de gestion d'erreur sur le parsing `horairesJson`
`FooterComponent` parse `config.horairesJson` (JSON string) pour afficher les horaires. Toujours entourer d'un `try/catch` avec fallback sur les horaires par défaut.
