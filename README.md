# Membooks

Application mobile de gestion de livres avec backend API.

## Structure du projet

```
membooks/
├── api/                  # Backend Elysia.js + Drizzle ORM
│   ├── src/
│   │   ├── db/           # Schéma et connexion PostgreSQL
│   │   ├── routes/       # Routes API (auth, etc.)
│   │   └── utils/        # Utilitaires (hash password)
│   └── drizzle.config.ts
│
├── mobile/               # App React Native (Expo)
│   ├── app/              # Routes (Expo Router)
│   ├── components/       # Composants réutilisables
│   ├── services/         # Services API
│   └── types/            # Types TypeScript
│
└── scripts/              # Scripts de développement
```

## Prérequis

- [Bun](https://bun.sh) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) >= 14
- Xcode (pour iOS) ou Android Studio (pour Android)

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd membooks

# Installer toutes les dépendances
bun install:all

# Créer la base de données PostgreSQL
createdb membooks

# Configurer les variables d'environnement
cp api/.env.example api/.env
# Éditer api/.env avec vos valeurs

# Pousser le schéma vers la base de données
bun db:push
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

## Développement

```bash
# Lancer API + Mobile en parallèle
bun dev

# Ou séparément :
bun dev:api      # API uniquement (port 3000)
bun dev:mobile   # Expo uniquement
```

## Base de données

```bash
# Pousser les changements de schéma
bun db:push

# Ouvrir Drizzle Studio (interface graphique)
bun db:studio
```

## API Endpoints

### Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/register` | Inscription | Non |
| POST | `/auth/login` | Connexion | Non |
| GET | `/auth/me` | Profil utilisateur | JWT |
| PUT | `/auth/me` | Modifier profil | JWT |

### Exemples

**Inscription**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"user","password":"password123"}'
```

**Connexion**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Profil (avec token)**
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <token>"
```

## Schéma utilisateur

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| email | string | Email (unique) |
| username | string | Pseudo (unique) |
| password | string | Mot de passe (Argon2id) |
| language | string | Langue (défaut: "en") |
| is_premium | boolean | Compte premium |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de modification |

## Stack technique

**Backend**
- [Elysia.js](https://elysiajs.com/) - Framework web pour Bun
- [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Base de données
- Argon2id - Hash des mots de passe
- JWT - Authentification

**Mobile**
- [Expo](https://expo.dev/) SDK 54
- [React Native](https://reactnative.dev/) 0.81
- [Expo Router](https://docs.expo.dev/router/introduction/) 6.0
- TypeScript
