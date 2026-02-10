# Membooks

Application mobile de gestion de livres avec backend API et interface web.

## Structure du projet

```
membooks/
├── api/                  # Backend Elysia.js + Drizzle ORM
│   ├── src/
│   │   ├── db/           # Schema et connexion PostgreSQL
│   │   ├── routes/       # Routes API (auth, subscription, notifications)
│   │   └── utils/        # Utilitaires (hash password, logger, rate limiter)
│   └── drizzle.config.ts
│
├── mobile/               # App React Native (Expo)
│   ├── app/              # Routes (Expo Router)
│   ├── components/       # Composants
│   ├── constants/        # Design system (colors, spacing, typography)
│   ├── contexts/         # Auth, Books, Language, Theme
│   ├── hooks/            # Hooks (notifications, OTA updates, theme)
│   ├── services/         # Services API et base locale
│   └── __tests__/        # Tests
│
└── web/                  # Interface web React
    ├── src/
    │   ├── pages/        # Pages (Library, Search, Profile, etc.)
    │   ├── services/     # Services API
    │   ├── contexts/     # Auth, Theme
    │   └── locales/      # i18n (en, fr)
    └── __tests__/        # Tests
```

## Prerequis

- [Bun](https://bun.sh) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) >= 14
- Xcode (pour iOS) ou Android Studio (pour Android)

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd membooks

# Installer les dependances de chaque sous-projet
cd api && bun install && cd ..
cd mobile && bun install && cd ..
cd web && bun install && cd ..

# Creer la base de donnees PostgreSQL
createdb membooks

# Configurer les variables d'environnement
cp api/.env.example api/.env
# Editer api/.env avec vos valeurs

# Pousser le schema vers la base de donnees
cd api && bun run db:push
```

## Configuration

### API (`api/.env`)

```env
DATABASE_URL=postgresql://user@localhost:5432/membooks
JWT_SECRET=votre-secret-jwt-securise
PORT=3000
```

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Developpement

```bash
# API (port 3000)
cd api && bun run dev

# Mobile (Expo)
cd mobile && bunx expo start

# Web (port 3001)
cd web && bun run dev
```

## Base de donnees

```bash
cd api

# Pousser les changements de schema
bun run db:push

# Ouvrir Drizzle Studio (interface graphique)
bun run db:studio
```

## API Endpoints

### Authentification

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/register` | Inscription | Non |
| POST | `/auth/login` | Connexion | Non |
| GET | `/auth/me` | Profil utilisateur | JWT |
| PUT | `/auth/me` | Modifier profil | JWT |
| DELETE | `/auth/me` | Supprimer compte | JWT |
| PUT | `/auth/password` | Changer mot de passe | JWT |
| POST | `/auth/logout` | Deconnexion | Non |

### Notifications

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/notifications/register-token` | Enregistrer un push token | JWT |
| DELETE | `/notifications/token` | Supprimer un push token | JWT |

### Swagger

Documentation interactive disponible sur `/swagger` quand l'API tourne.

## Stack technique

**Backend**
- [Elysia.js](https://elysiajs.com/) - Framework web pour Bun
- [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Base de donnees
- [Stripe](https://stripe.com/) - Paiements
- Argon2id - Hash des mots de passe
- JWT - Authentification

**Mobile**
- [Expo](https://expo.dev/) SDK 54
- [React Native](https://reactnative.dev/) 0.81
- [Expo Router](https://docs.expo.dev/router/introduction/) 6.0
- Expo Notifications - Push notifications
- expo-sqlite - Base locale
- TypeScript

**Web**
- [React](https://react.dev/) 19
- [TanStack Router](https://tanstack.com/router) - Routing
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Tailwind CSS](https://tailwindcss.com/) v4
- i18next - Internationalisation
