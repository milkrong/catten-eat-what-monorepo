## Catten Eat What Monorepo

A monorepo containing:

- catten-eat-what-service: Bun + Hono API service (Supabase, Redis, Qdrant)
- eat-what-app: React Native app built with Expo Router

### Requirements

- Bun 1.2+ (root uses workspaces)
- Node 20+ (for Expo tooling)
- Xcode and Android SDK for native builds (optional)

### Project Structure

```
catten-eat-what-monorepo/
├─ catten-eat-what-service/   # API service (Bun + Hono)
├─ eat-what-app/              # Expo app (React Native)
├─ scripts/
│  └─ dev-all.sh              # Run service and app together
└─ package.json               # Bun workspaces, root scripts
```

### Install

Run once at the repo root:

```bash
bun install
```

### Quick Start (run both apps)

```bash
# from repo root
bun run dev    # alias: bun run dev:all
```

This runs:

- Service: bun run --cwd catten-eat-what-service dev
- App: bun run --cwd eat-what-app start (expo start)

To stop, press Ctrl+C once; the supervisor will clean up child processes.

### Run individually

- Service (API):

```bash
cd catten-eat-what-service
bun run dev            # hot-reload
# or
bun run build && bun run start:prod
```

- App (Expo):

```bash
cd eat-what-app
bun run start          # expo start
```

### Environment Variables

- Service (`catten-eat-what-service/.env.local`):

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
CLERK_SECRET_KEY=
REDIS_URL=
```

- App (`eat-what-app/.env.development`):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_DEV_MODE=true
```

Adjust URLs to match your local API host/port.

### Scripts (root)

- bun run dev or bun run dev:all: run API and App together
- bun run test: run workspace tests (delegates to package scripts)
- bun run build: run workspace builds

### Package Scripts

- Service:
  - dev, start, build, start:prod, test, test:coverage
- App:
  - start (Expo), android, ios, web, test, lint

### Testing

- Service (Vitest):

```bash
cd catten-eat-what-service
bun run test
```

- App (Jest):

```bash
cd eat-what-app
bun run test
```

### Expo SDK and Doctor

The app targets Expo SDK 53.

```bash
cd eat-what-app
npx expo install --check
npx expo-doctor
```

### Database & Types (Service)

- Migrations live in `catten-eat-what-service/db/migrations/`.
- Generate Supabase types when needed:

```bash
cd catten-eat-what-service
SUPABASE_PROJECT_ID=... bun run update-types
```

### Troubleshooting

- If Expo reports version mismatches: `npx expo install --fix` inside `eat-what-app`.
- If ports are busy, stop running instances or change ports before `bun run dev`.

### License

MIT
