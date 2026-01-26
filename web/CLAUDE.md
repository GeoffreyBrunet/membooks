# Membooks Web

Web application for Membooks built with React, TanStack Router, and TanStack Query.

## Tech Stack

- **Runtime**: Bun
- **Server**: Elysia (serves frontend and proxies API)
- **UI**: React 19
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **Styling**: Plain CSS

## Development

```bash
# Install dependencies
bun install

# Start development server (port 3001)
bun run dev

# Make sure the API is running on port 3000
cd ../api && bun run dev
```

## Project Structure

```
src/
├── main.tsx          # App entry point with router setup
├── server.ts         # Elysia server (serves frontend, proxies /api)
├── index.html        # HTML entry point
├── pages/            # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Library.tsx
│   ├── Search.tsx
│   ├── Statistics.tsx
│   ├── Profile.tsx
│   ├── Subscription.tsx
│   └── Admin.tsx
├── services/         # API services
│   ├── auth.ts
│   ├── books.ts
│   ├── subscription.ts
│   └── admin.ts
└── styles/
    └── global.css
```

## API Proxy

The web server proxies all `/api/*` requests to the main API server (default: `http://localhost:3000`).

Configure the API URL with the `API_URL` environment variable.

## Features

- User authentication (login/register)
- Book library management (local storage)
- Book search via Open Library API
- Reading statistics
- Premium subscription management (Stripe)
- Admin dashboard for user management
