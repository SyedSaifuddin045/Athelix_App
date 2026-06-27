# Athelix Codebase

> React Native (Expo) fitness/workout tracking app. iOS + Android. Dark mode only.

## Stack

| Layer | Tech |
|-------|------|
| Framework | React Native (Expo SDK 52) |
| Language | TypeScript (strict) |
| Navigation | `@react-navigation/native-stack` |
| API | Orval-generated from OpenAPI → fetch-based client |
| Server State | TanStack React Query v5 |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Analytics | PostHog |
| Errors | Sentry |
| Testing | Jest + testing-library/react-native + MSW |
| Animations | react-native-reanimated |
| Icons | expo-vector-icons / Ionicons |

## Project Map

```
athelix-app/
├── App.tsx                    # Root: providers → navigator
├── app.config.ts              # Expo config + Sentry plugin
├── orval.config.ts            # API client generation
├── tsconfig.json              # Strict TS config
├── babel.config.js            # expo/internal/babel-preset
├── jest.config.js             # Jest config w/ module aliases
├── index.ts                   # Entry: registerRootComponent(App)
├── .env.example               # Required env vars
│
└── src/
    ├── api/
    │   ├── client.ts          # Fetch wrapper (auth, retry, errors)
    │   ├── queries.ts         # All React Query hooks + mutations
    │   ├── queryKeys.ts       # Query key factory
    │   ├── types.ts           # Shared API types
    │   ├── endpoints/         # Orval-generated (read-only)
    │   └── model/             # Orval-generated TS types
    │
    ├── analytics/
    │   └── events.ts          # PostHog event names
    │
    ├── auth/
    │   └── clerk.ts           # Clerk provider config
    │
    ├── components/
    │   ├── ui/                # Primitives (Button, ErrorCard, etc.)
    │   ├── template/          # Template-related components
    │   └── ...                # Domain-specific components
    │
    ├── navigation/
    │   └── AppNavigator.tsx   # Stack navigator definition
    │
    ├── screens/               # One file per screen
    │   ├── HomeScreen.tsx
    │   ├── ActiveWorkoutScreen.tsx
    │   ├── HistoryScreen.tsx
    │   ├── HistoryDetailScreen.tsx
    │   ├── StatsScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── TemplateListScreen.tsx
    │   ├── TemplateDetailScreen.tsx
    │   ├── ExerciseScreen.tsx
    │   ├── SignInScreen.tsx
    │   └── SignUpScreen.tsx
    │
    ├── theme/
    │   ├── colors.ts          # Color palette
    │   ├── styles.ts          # Shared style objects
    │   └── typography.ts      # Font definitions
    │
    ├── types/
    │   ├── navigation.ts      # RootStackParamList + route types
    │   └── sets.ts            # Set-related types
    │
    ├── utils/
    │   ├── helpers.ts         # shadow(), getMuscleStatus(), toNumberId()
    │   ├── validation.ts      # numberOrNull(), rpeError(), parseRestSeconds()
    │   └── timedTokenCache.ts # SecureStore wrapper w/ 5s timeout
    │
    ├── test/
    │   ├── mocks/
    │   │   └── handlers.ts    # MSW handlers for API mocks
    │   ├── setup.ts           # Jest setup (MSW, mock modules)
    │   └── test-utils.tsx     # renderWithProviders() helper
    │
    └── __tests__/             # Co-located test files
        ├── screens/
        ├── components/
        ├── client.test.ts
        ├── queries.test.tsx
        ├── helpers.test.ts
        ├── validation.test.ts
        ├── display.test.ts
        ├── format.test.ts
        └── mapping.test.ts
```

## Data Flow (4 Layers)

```
OpenAPI Spec → Orval → Endpoints (fetch calls)
                         ↓
                    client.ts (auth + retry)
                         ↓
               React Query Hooks (queries.ts)
                         ↓
                    Screens (UI)
```

### 1. Orval Endpoints (`src/api/endpoints/`)
- Auto-generated from FastAPI backend
- Read-only — never edit directly
- Regenerate: `npx orval`

### 2. Custom Client (`src/api/client.ts`)
- Wraps `fetch` with:
  - Auth header injection (Clerk session token)
  - 3 retries on 5xx
  - Error normalization → `ApiError`
- Exports `getApiErrorMessage()` and `getFieldError()` helpers

### 3. React Query Hooks (`src/api/queries.ts`)
All server state managed here. Patterns:

**Queries:**
```ts
useTemplatesQuery(filters?)     // GET /templates
useTemplateQuery(id)            // GET /templates/{id}
useWorkoutsQuery(filters?)      // GET /workouts
useWorkoutQuery(id)             // GET /workouts/{id}
useExercisesQuery(filters?)     // GET /exercises
useMuscleGroupsQuery()          // GET /muscle-groups
useProfileQuery()               // GET /profile
useStatsQuery(timeframe?)       // GET /stats
```

**Mutations:**
```ts
useCreateTemplate()             // POST /templates
useUpdateTemplate()             // PATCH /templates/{id}
useDeleteTemplate()             // DELETE /templates/{id}
useCreateWorkout()              // POST /workouts
useStartWorkout()               // POST /workouts/{id}/start
useCompleteWorkout()            // POST /workouts/{id}/complete
useLogSet()                     // POST /workouts/{workout_id}/sets
useDeleteSet()                  // DELETE /sets/{id}
```

### 4. Query Keys (`src/api/queryKeys.ts`)
Factory pattern for cache management:
```ts
queryKeys.templates.all          // → ['templates']
queryKeys.templates.detail(id)   // → ['templates', id]
queryKeys.workouts.all           // → ['workouts']
queryKeys.workouts.detail(id)    // → ['workouts', id]
```

## Navigation

### Routes (`src/types/navigation.ts`)

```ts
type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  ActiveWorkout: { workoutId: number };
  History: undefined;
  HistoryDetail: { workoutId: number };
  Stats: undefined;
  Profile: undefined;
  Templates: undefined;
  TemplateDetail: { templateId: number };
  Exercise: { exerciseId: number };
};
```

### Screen Hierarchy

```
AppNavigator (NativeStackNavigator)
├── Signed Out
│   ├── SignIn
│   └── SignUp
└── Signed In
    ├── Home (default)
    ├── ActiveWorkout
    ├── History
    │   └── HistoryDetail (push)
    ├── Stats
    ├── Profile
    ├── TemplateList
    │   └── TemplateDetail (push)
    │       └── ActiveWorkout (push)
    └── Exercise (modal push)
```

### Provider Wrapping Order

```
SafeAreaProvider
  └── GestureHandlerRootView
      └── QueryClientProvider
          └── PostHogProvider
              └── ClerkProvider
                  └── NavigationContainer
                      └── AppNavigator
```

All wrapped in `src/App.tsx` → exported as default from `index.ts`.

## Screens

### HomeScreen
- Dashboard with quick actions
- "Start Workout" → modal to pick template or quick start
- "Active Workout" banner if workout in progress
- Recent workouts summary

### ActiveWorkoutScreen
- Core workout tracking interface
- Displays current exercise, set logging (weight, reps, RPE)
- Rest timer between sets
- Complete/cancel workout actions
- Route param: `workoutId`

### HistoryScreen
- Paginated list of past workouts
- Pull-to-refresh
- Tap → `HistoryDetail`
- Filters: date range, exercise type

### HistoryDetailScreen
- Single completed workout view
- Sets per exercise with recorded weights/reps/RPE
- Delete workout action
- Route param: `workoutId`

### StatsScreen
- Aggregate training statistics
- Volume over time, PRs, muscle group breakdown
- Timeframe selector (week/month/year)

### ProfileScreen
- User settings
- Account info (from Clerk)
- App preferences, sign out

### TemplateListScreen
- Browse workout templates
- Search/filter by name, muscle group
- Create new template → navigates to exercise picker
- Tap → `TemplateDetail`

### TemplateDetailScreen
- View/edit a single template
- Exercise list with sets/reps schema
- "Start Workout" button → `ActiveWorkout`
- Route param: `templateId`

### ExerciseScreen
- Exercise details, instructions, form
- Route param: `exerciseId`

### SignInScreen / SignUpScreen
- Clerk auth flow
- Email/password sign in and sign up
- Redirect to Home on success

## Theme

### Colors (`src/theme/colors.ts`)
```ts
export const COLORS = {
  background: '#111111',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  primary: '#4A90D9',      // Blue accent
  green: '#34C759',
  teal: '#5AC8FA',
  orange: '#FF9500',
  red: '#FF3B30',
  border: '#38383A',
};
```

### Typography (`src/theme/typography.ts`)
- Uses system fonts (San Francisco on iOS, Roboto on Android)
- Weight scale: 400 (regular), 600 (semibold), 700 (bold)
- Size scale: 12 (caption), 14 (body), 16 (subheader), 20 (header), 28 (title)

### Shared Styles (`src/theme/styles.ts`)
- Screen-level: `container` (flex 1, dark background), `safeArea`
- Cards: `card`, `cardTitle`, `cardValue`
- Forms: `input`, `label`, `row`
- Buttons: `button`, `buttonText`, `buttonSecondary`
- Lists: `separator`, `emptyState`
- **Rule:** New shared styles go in themed sub-modules, not `styles.ts`

## Components

### UI Primitives (`src/components/ui/`)
- **Button** — primary/secondary variants, loading state, disabled
- **ErrorCard** — full-width error banner with retry action, used for list errors
- **EmptyState** — icon + message for empty lists
- **LoadingSpinner** — centered activity indicator
- **Input** — styled text input with label and error text
- **Card** — surface-colored container with rounded corners
- **Badge** — small label (used for muscle group tags)

### Domain Components (`src/components/`)
- `SetRow` — weight/reps/RPE input row for active workout
- `ExerciseListItem` — exercise card in templates/lists
- `TemplatesFilter` — filter bar for template list
- `StatsCard` — stat display in StatsScreen
- `MuscleGroupBadge` — colored badge per muscle group

## API Architecture

### Client (`src/api/client.ts`)
```ts
// Auth: Clerk session token injected as Bearer header
// Retry: up to 3 attempts on 5xx, exponential backoff
// Errors normalized to { code, message, fieldErrors? }

export function getApiErrorMessage(error: unknown): string;
export function getFieldError(error: unknown, field: string): string | null;
```

### Error Handling Pattern
```ts
// List errors → ErrorCard
// Form errors → inline text below Input
const error = getApiErrorMessage(someError);
const fieldErr = getFieldError(someError, 'email');
```

### API Base
- Production: `https://api.athelix.fit`
- Configurable via `EXPO_PUBLIC_API_BASE_URL` in `.env`

## Auth Flow

```
SignIn/SignUp screens → Clerk Auth → session token
                                         ↓
                              client.ts injects Bearer token
                                         ↓
                              All API calls authenticated
```

- **ClerkProvider** wraps navigation
- Session persisted via `expo-secure-store` (token cache)
- Sign out clears secure store + invalidates all queries

## Analytics (PostHog)

Events defined in `src/analytics/events.ts` as `const` assertions:
```ts
export const EVENTS = {
  USER_SIGNED_UP: 'user_signed_up',
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_COMPLETED: 'workout_completed',
  SET_LOGGED: 'set_logged',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_USED: 'template_used',
} as const;
```

Tracked via `usePostHog()` hook from `posthog-react-native`.

## Testing

### Setup
- Jest config in `jest.config.js` with module aliases
- MSW for API mocking (`src/test/mocks/handlers.ts`)
- `renderWithProviders()` wraps components with all providers
- `src/test/setup.ts` — polyfills, mock modules, MSW listen

### Running Tests
```bash
npx jest                    # Unit + integration
npx jest --watch            # Watch mode
npx tsc --noEmit            # Type check
npx detox test              # E2E (Detox)
```

### Handler Pattern
```ts
// src/test/mocks/handlers.ts
export const handlers = [
  http.get('*/templates', () => {
    return HttpResponse.json([...mockTemplates]);
  }),
  http.post('*/workouts', () => {
    return HttpResponse.json({ id: 1, ...mockWorkout }, { status: 201 });
  }),
];
```

## Key Conventions

- **Named exports** for all screens (no `export default`)
- **No `any`** in navigation — always type with `NativeStackNavigationProp`
- **`COLORS`** imported from theme only — never hardcoded
- **Mutations** in `queries.ts` — never inline `useMutation`
- **No imports** from `src/data.ts` — legacy mock data
- **`.env` is untouchable** — add vars to `.env.example` + CI secrets
- **Orval files are read-only** — regenerate, don't edit

## Environment Variables (`.env.example`)

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
EXPO_PUBLIC_API_BASE_URL=https://api.athelix.fit
EXPO_PUBLIC_POSTHOG_ENABLED=true
EXPO_PUBLIC_SENTRY_DSN=
```

## Adding Patterns

### New Screen
1. Add route + params to `src/types/navigation.ts`
2. Create screen file in `src/screens/` with typed nav prop
3. Register in `AppNavigator.tsx`

### New API Endpoint
1. Backend adds to FastAPI → OpenAPI spec
2. `npx orval` → regenerates `src/api/endpoints/` and `src/api/model/`
3. Add query key to `src/api/queryKeys.ts`
4. Add hook to `src/api/queries.ts`
5. Add MSW handler to `src/test/mocks/handlers.ts`

### UI Component
- Primitives go in `src/components/ui/`
- Domain components in `src/components/`
- Style: `StyleSheet.create` at bottom of file
- Dynamic values use inline `style={}`
