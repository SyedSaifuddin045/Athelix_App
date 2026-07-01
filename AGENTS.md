# Athelix App — AI Agent Guide

## Project Identity

- **Name:** Athelix (package: `mobile`)
- **Type:** React Native (Expo) fitness/workout tracking mobile app
- **Platforms:** iOS, Android (web via react-native-web)
- **Backend:** External Python FastAPI service at `https://api.athelix.fit`
- **Bundle ID:** `com.athelix.app`
- **Theme:** Dark mode only (`#111111` background)

## Key Architecture

```
index.ts → App.tsx → providers → AppNavigator
```

**Data flow (4 layers):**
1. **Orval-generated endpoints** (`src/api/endpoints/*.ts`) — auto-generated from OpenAPI
2. **Custom fetch client** (`src/api/client.ts`) — auth injection, retry, error normalization
3. **React Query hooks** (`src/api/queries.ts`) — composed hooks for all resources
4. **Screens** (`src/screens/`) — consume hooks, never call fetch() directly

**Provider hierarchy (inside out):**
`SafeAreaProvider` → `GestureHandlerRootView` → `QueryClientProvider` → `PostHogProvider` → `ClerkProvider` → `NavigationContainer` → `AppNavigator`

## Critical Coding Rules

1. **Never use `any` for navigation** — always type with `NativeStackNavigationProp<RootStackParamList, 'ScreenName'>`
2. **Always import `COLORS` from `../theme/colors`** — never redefine color constants locally
3. **Use named exports for all screens** — no `export default` for new code
4. **Never import from `src/data.ts`** for production code — it's legacy mock data; use API hooks
5. **All mutations go in `src/api/queries.ts` or a new `mutations.ts`** — never inline `useMutation` in screens
6. **StyleSheet rules:** All shared styles in `src/theme/styles.ts`; inline `style={}` only for dynamic values; add new style keys to themed sub-modules, not the monolithic `styles.ts`
7. **DO NOT touch `.env`** — env vars go in `.env.example` and CI secrets
8. **Orval-generated files are read-only** — modify `orval.config.ts` and regenerate

## File Organization Conventions

```
src/
  api/            — API client, endpoints (generated), queries, types
  analytics/      — PostHog integration
  auth/           — Clerk auth config
  components/     — Reusable components (ui/ for primitives)
  navigation/     — Navigator definitions
  screens/        — Screen components (one per file)
  theme/          — Colors, styles
  types/          — Shared TypeScript types
  utils/          — Pure utility functions
  test/           — Test infrastructure (mocks, setup, utils)
  __tests__/      — Test files
```

## TypeScript Conventions

- **strict: true** in tsconfig
- API model types come from `src/api/model/` (Orval-generated, read-only)
- Local types defined in `src/types/` or co-located with their module
- Navigation types in `src/types/navigation.ts`
- Event name constants in `src/analytics/events.ts` (use `as const`)

## Naming Conventions

- **Files:** `PascalCase` for components/screens, `camelCase` for utilities
- **Query hooks:** `use<Resource>Query` — e.g., `useTemplatesQuery`
- **Query keys:** via `queryKeys` factory in `src/api/queryKeys.ts`
- **Mutations:** `useCreate<Resource>`, `useUpdate<Resource>`, `useDelete<Resource>`
- **Event names:** noun-verb past tense — e.g., `USER_SIGNED_UP`, `WORKOUT_COMPLETED`

## Common Patterns

### Adding a new screen
1. Define route + params in `src/types/navigation.ts`
2. Create screen file in `src/screens/` with typed navigation prop
3. Add to `RootStackParamList` in `AppNavigator.tsx`

### Adding a new API endpoint
1. Backend adds it to FastAPI → OpenAPI spec
2. Run `npx orval` to regenerate `src/api/endpoints/` and `src/api/model/`
3. Add query hook in `src/api/queries.ts`
4. Add query key in `src/api/queryKeys.ts`

### Error handling
- Use `getApiErrorMessage(error)` for user-facing messages
- Use `getFieldError(error, 'field_name')` for form field errors
- Display errors via `ErrorCard` component for lists, inline text for forms

## Testing

- **Unit tests:** `npx jest` (Jest + testing-library/react-native)
- **Type check:** `npx tsc --noEmit`
- **E2E:** Detox (`npx detox test`)
- **MSW handlers** in `src/test/mocks/handlers.ts` — expand these when adding new API integrations
- Prefer `renderWithProviders` from `src/test/test-utils.tsx` for component tests

## Git Workflow

- Branch from `main`, use feature/fix prefixes
- Commit messages: concise, imperative mood
- Run `npx tsc --noEmit` and `npx jest` before committing
- No direct pushes to main — use PRs

<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order
1. `search_graph` — find functions, classes, routes, variables by pattern
2. `trace_path` — trace who calls a function or what it calls
3. `get_code_snippet` — read specific function/class source code
4. `query_graph` — run Cypher queries for complex patterns
5. `get_architecture` — high-level project summary

## When to fall back to grep/glob
- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples
- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->
