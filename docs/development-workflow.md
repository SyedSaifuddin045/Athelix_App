# Athelix App — Development Workflow

## Prerequisites

- Node.js 22+
- npm
- Expo CLI (`npx expo`)
- iOS: Xcode 16+ (macOS only)
- Android: Android Studio + SDK 36
- EAS CLI for builds: `npm install -g eas-cli`
- Detox for E2E: `brew install applesimutils` (iOS)

## Environment Setup

1. Copy `.env.example` to `.env` and fill in credentials:
```bash
cp .env.example .env
```

Required env vars:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_POSTHOG_API_KEY`
- `EXPO_PUBLIC_API_BASE_URL` (default: `http://localhost:8000`)

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run web            # Run on web browser
npm run typecheck      # TypeScript type checking (tsc --noEmit)
npm run build:android  # EAS production build for Android
npm run submit:android # Submit to Google Play Store

# Testing
npx jest --ci          # Run unit tests
npx jest --watch       # Run tests in watch mode

# Linting
npx eslint .           # Check code style
npx eslint . --fix     # Auto-fix issues
npx prettier --check . # Check formatting
npx prettier --write . # Format all files

# E2E (iOS)
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug

# E2E (Android)
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

## API Client Regeneration

When the backend API changes:

1. Ensure the backend is running at `http://localhost:8000`
2. Run `npx orval` to regenerate:
   - `src/api/endpoints/` — endpoint functions
   - `src/api/model/` — TypeScript model interfaces
3. If hooks need updating, edit `src/api/queries.ts`
4. If query keys need updating, edit `src/api/queryKeys.ts`
5. If response mapping needs updating, edit `src/utils/mapping.ts`
6. Run `npx tsc --noEmit` to verify types

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/`)

**ci.yml** — Runs on push/PR to main:
1. `npm ci`
2. `npx tsc --noEmit` (type checking)
3. `npx jest --ci` (unit tests)

**e2e-android.yml** — Android E2E on emulator
**e2e-ios.yml** — iOS E2E on macOS runner

### EAS Builds

- **Development:** `eas build --profile development`
- **Preview:** `eas build --profile preview`
- **Production:** `eas build --profile production`

## Code Review Checklist

Before merging a PR:

- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest --ci` passes
- [ ] `npx eslint .` passes (no warnings)
- [ ] No `navigation: any` introduced
- [ ] No duplicate color constants
- [ ] All new screens use named exports
- [ ] All new API integrations have query hooks + keys + mocks
- [ ] Analytics events use `Events` constant
- [ ] Error states handled (loading, error, empty)
- [ ] No direct fetch() in screens

## Feature Development Flow

1. **Branch:** `feature/<short-description>`
2. **Types first:** Define/update route params in `navigation.ts` and API types via Orval
3. **Data layer:** Add query hook in `queries.ts`, key in `queryKeys.ts`, mock in `handlers.ts`
4. **Mapping:** Add/update mapper in `mapping.ts` if API shapes differ from UI needs
5. **Screen:** Build screen consuming the hook, using UI primitives
6. **Navigation:** Register in `AppNavigator.tsx`
7. **Tests:** Add unit tests for new logic, update MSW handlers
8. **PR:** Create PR, verify CI passes

## Architecture Decisions

### Why Orval?
- Contract-driven development — types auto-generated from OpenAPI spec
- Eliminates manual type mapping errors
- Single source of truth for API contracts

### Why custom fetch over Axios?
- Lighter dependency footprint
- Full control over auth interceptor and error normalization
- Matches Expo's philosophy of minimal native dependencies

### Why no Redux/Zustand?
- React Query handles all server state
- No global client state required yet
- Additional state management is over-engineering until needed
- Active workout state is a candidate for Zustand if persistence needed

### Why dark-only theme?
- Simplifies design system
- Avoids testing/maintenance burden of dual themes
- Fitness apps typically use dark UIs for gym usability
