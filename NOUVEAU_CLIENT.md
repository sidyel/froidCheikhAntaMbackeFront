# Déployer ce projet pour un nouveau client

Ce projet est conçu pour être entièrement configurable depuis l'administration sans modifier le code.

---

## 1. Variables d'environnement à définir (backend)

Copier `.env.example` → `.env` et renseigner **toutes** les valeurs.

| Variable | Description |
|---|---|
| `DATABASE_URL` | JDBC URL Neon (avec `sslmode=require`) |
| `DATABASE_USERNAME` | Nom d'utilisateur Neon |
| `DATABASE_PASSWORD` | Mot de passe Neon |
| `JWT_SECRET` | Clé secrète ≥ 64 caractères aléatoires |
| `CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary |
| `CLOUDINARY_API_KEY` | API key Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary |
| `ALLOWED_ORIGINS` | URL(s) du front (virgules si plusieurs) |
| `INSTALL_TOKEN` | Jeton à usage unique pour l'installation |

---

## 2. Première installation

1. Démarrer le backend avec toutes les variables ci-dessus.
2. Ouvrir le frontend à `/installer`.
3. Renseigner le `INSTALL_TOKEN`, créer le compte SUPER_ADMIN, configurer les couleurs et le contact.
4. Une fois l'installation terminée, **supprimer ou vider `INSTALL_TOKEN`** dans les variables d'environnement pour désactiver l'endpoint.

---

## 3. Personnalisation depuis l'administration

Connectez-vous, allez dans **Administration → Paramètres site** :

- **Identité** : nom, slogan, logo, favicon
- **Contact** : emails, téléphones (avec flag WhatsApp), adresse
- **Réseaux sociaux** : Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok
- **Apparence** : couleurs primaire / secondaire / accent (format `#RRGGBB`), police
- **Textes légaux** : mentions légales, CGV, politique de confidentialité (Markdown)
- **Facturation** : raison sociale, NINEA, RCCM, forme juridique
- **Livraison** : devise, seuil de livraison gratuite
- **SEO** : balise `<title>`, meta description, mots-clés

Toutes ces valeurs sont chargées au démarrage du frontend via `GET /api/config` et mises en cache côté serveur.

---

## 4. Ce qui reste spécifique au code

Les éléments suivants nécessitent encore une modification du code :

- **Tarifs de livraison par zone** (actuellement 2 500 / 5 000 FCFA) — dans `CommandeService.java`
- **Photos et logos** uploadés manuellement via l'interface admin Cloudinary ou depuis l'interface produits

---

## 5. Régénérer les clés

Avant chaque nouveau déploiement :
- Régénérer le **JWT_SECRET** (chaîne aléatoire ≥ 64 caractères)
- Régénérer les clés **Cloudinary**
- Régénérer le mot de passe **Neon**
- Définir un nouveau **INSTALL_TOKEN** unique
