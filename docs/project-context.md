# Athelix App — Project Context

## What is Athelix?

Athelix is a fitness/workout tracking mobile application. Users can:
- Create and manage workout templates
- Log live workout sessions with sets, reps, weight, and RPE
- Track personal records and exercise progress (e1RM trends)
- Create and follow mesocycles (training blocks)
- Monitor muscle balance across training
- Log body weight history
- View analytics and progress over time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native 0.81.5 via Expo SDK 54 |
| **Language** | TypeScript 5.9 (strict mode) |
| **Navigation** | React Navigation 7 (native stack + bottom tabs) |
| **Server state** | TanStack React Query v5 |
| **Auth** | Clerk (@clerk/expo) with OAuth + email/password |
| **Analytics** | PostHog (posthog-react-native) |
| **API codegen** | Orval v8 (from FastAPI OpenAPI spec) |
| **Animations** | react-native-reanimated v4 |
| **Gestures** | react-native-gesture-handler v2 |
| **Testing** | Jest + testing-library/react-native + MSW + Detox |

## Backend

The backend is a **Python FastAPI** service hosted at `https://api.athelix.fit`. This repo contains no backend code — only the generated API client.

**API Client Generation:**
```bash
npx orval  # reads http://localhost:8000/openapi.json
```

Generated to:
- `src/api/endpoints/` — per-resource endpoint functions
- `src/api/model/` — ~75 TypeScript model interfaces

## Domain Model

```
User (1) ──< UserProfile (0..1)
  │
  ├──< BodyWeightLog (*)
  ├──< WorkoutSession (*) ──< ExerciseSet (*)
  ├──< WorkoutTemplate (*) ──< WorkoutTemplateExercise (*)
  ├──< Mesocycle (*)
  ├──< PersonalRecord (*)
  └──< Exercise (via sets, templates, progress)
```

### Key Entities

- **Exercise**: Predefined exercises with name, target muscle, equipment, instructions
- **WorkoutTemplate**: Reusable workout structure with ordered exercises and target sets/reps/RPE
- **WorkoutSession**: A logged workout with sets, duration, mood, perceived exertion
- **ExerciseSet**: Individual set within a session (weight, reps, RPE, completed status)
- **Mesocycle**: Training block with name, goal, weeks, and associated sessions
- **PersonalRecord**: Achievement tracking (weight, volume, e1RM records)
- **BodyWeightLog**: Daily weight tracking

## Auth Flow

1. Clerk handles OAuth (Google, Facebook, Apple) and email/password auth
2. JWT tokens are cached via `expo-secure-store` (via Clerk's token-cache)
3. Custom `apiFetch` interceptor attaches Bearer token to all non-public requests
4. Token auto-refresh every 10 minutes; 401 triggers immediate refresh + retry
5. Public paths (health, meta/app-config, auth webhooks) skip auth

## State Management

- **Server state**: TanStack React Query (caching, dedup, background refetch)
- **Client state**: React `useState` in screens (local UI state only)
- **No global client state store** (no Redux, Zustand, or Context beyond providers)
- **Active workout state**: Managed via `useState` in `ActiveWorkoutScreen` — not persisted across app restarts

## Current Screens (22)

| Tab | Screen | Purpose |
|-----|--------|---------|
| Auth | Splash | App loading, auth check |
| Auth | Login | Email/password + OAuth sign in |
| Auth | Register | Create account |
| Auth | ProfileSetup | Initial profile form |
| Home | HomeScreen | Dashboard with overview stats |
| Explore | ExploreScreen | Exercise library with search/filter |
| Train | TrainHubScreen | Training dashboard |
| Train | TemplateListScreen | Workout templates CRUD |
| Train | TemplateBuilderScreen | Drag-and-drop template editor |
| Train | StartWorkoutScreen | Template/mesocycle selection |
| Train | ActiveWorkoutScreen | Live workout tracking |
| Train | WorkoutHistoryScreen | Past sessions list |
| Train | SessionDetailScreen | Session review |
| Train | MesocycleListScreen | Training blocks CRUD |
| Train | MesocycleDetailScreen | Block analytics |
| Progress | ProgressHubScreen | Analytics hub |
| Progress | PersonalRecordsScreen | PR list with search |
| Progress | ExerciseProgressScreen | e1RM/volume trends |
| Progress | MuscleBalanceScreen | Muscle group balance |
| Progress | BodyweightHistoryScreen | Weight chart + logs |
| Profile | ProfileScreen | User profile + stats |
| Profile | SettingsScreen | Account settings |

## Color System

Single dark theme in `src/theme/colors.ts`:
- Root: `#111111`
- Text: `#ffffff`
- Accent: `#FF5A36` (coral/orange — labeled "teal" in code, legacy)
- Muted: `rgba(255,255,255,0.42)`
- Card: `rgba(255,255,255,0.04)`
- Utility colors: green, gold, orange, red, purple, blue

## Key Design Decisions

- **Dark-only UI**: No light mode support planned
- **Portrait only**: App locked to portrait orientation
- **Orval codegen over manual clients**: Contract-driven API integration
- **Fetch over Axios**: Custom fetch interceptor instead of Axios
- **No client-side caching layer beyond React Query**: Online-first, no offline queue
