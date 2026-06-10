---
name: react-native-api-integration
description:
  Use this skill whenever you are connecting a React Native UI to a FastAPI backend.
  Triggers on: "connect API", "fetch data","integrate backend", "dynamic data", "hook for",
  "loading state", "API service", "map response", or any task that requires wiring existing
  React Native screens/components to live backend data without modifying UI.
  The UI is already approved and locked — this skill exists to preserve it while integrating data.
---

# React Native ↔ FastAPI Integration Skill

## PRIME DIRECTIVE

The UI is approved and frozen. You are a backend integration engineer, not a UI engineer.

**You may only:**
- Add API service files, hooks, types, and utilities
- Replace hardcoded static values with dynamic data in JSX
- Add loading/error state logic to existing components
- Wire existing state variables to real API responses

**You may never:**
- Touch any `StyleSheet`, `style={}`, `className`, font, color, spacing, or layout property
- Restructure JSX hierarchy or rename components
- Introduce new UI libraries or replace existing components
- Add new screens unless explicitly requested

When in doubt: **read-only on UI, write-only on data layer.**

---

## PROJECT ARCHITECTURE

Always use this layered structure:

```
src/
  api/
    client.ts          ← Axios instance + interceptors
    endpoints.ts       ← All URL constants
    <resource>.ts      ← One file per API resource (users.ts, orders.ts, etc.)
  hooks/
    use<Resource>.ts   ← One hook per resource
  types/
    api.ts             ← All TypeScript interfaces (ideally generated from FastAPI)
  screens/             ← UI only — no direct fetch() calls here
  components/          ← UI only
  store/               ← Zustand/Redux if already present
  utils/
    mappers.ts         ← Response transformation functions
```

Data flow is always: **FastAPI → api/ → hooks/ → screen/component**. Never skip a layer.

---

## STEP 0 — GENERATE TYPES FROM FASTAPI (do this first if not already done/present in the codebase)

FastAPI exposes an OpenAPI schema at `GET /openapi.json`. Use it to generate TypeScript types automatically — this eliminates entire categories of mapping errors.

```bash
# Install once
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.generated.ts
```

Then import from the generated file. Treat it as read-only; add hand-written extensions in `src/types/api.ts` if needed.

---

## API CLIENT (`src/api/client.ts`)

```ts
import axios from 'axios';
import { getAuthToken } from '../store/authStore'; // use whatever auth store already exists

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token on every request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors — never expose raw backend messages to UI
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
```

Environment variables:
- Expo: `EXPO_PUBLIC_API_URL`
- Bare RN: `API_URL` via `react-native-config`

---

## SERVICE LAYER (`src/api/<resource>.ts`)

```ts
import { api } from './client';
import type { ProfileResponse } from '../types/api.generated';

export async function getProfile(userId: string): Promise<ProfileResponse> {
  const { data } = await api.get<ProfileResponse>(`/users/${userId}/profile`);
  return data;
}

export async function updateProfile(userId: string, payload: Partial<ProfileResponse>) {
  const { data } = await api.patch<ProfileResponse>(`/users/${userId}/profile`, payload);
  return data;
}
```

Rules:
- One file per FastAPI router
- Always type the generic on `api.get<T>()` — never use `any`
- Return `data` directly, not the full Axios response

---

## HOOK LAYER (`src/hooks/use<Resource>.ts`)

```ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getProfile } from '../api/profile';
import type { ProfileResponse } from '../types/api.generated';

export function useProfile(userId: string) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      const result = await getProfile(userId);
      setData(result);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort(); // cleanup on unmount
  }, [load]);

  return { data, loading, error, reload: load };
}
```

Critical requirements for every hook:
- **AbortController** on every async call (prevents memory leaks on unmount)
- `error` is always a human-readable `string | null`, never a raw Error object
- Expose a `reload` function so screens can trigger manual refresh

---

## CONNECTING DATA TO THE SCREEN

Only replace static/hardcoded values. Never restructure JSX.

**Before:**
```tsx
<Text style={styles.name}>John Doe</Text>
<Text style={styles.email}>john@example.com</Text>
```

**After:**
```tsx
const { data: profile, loading, error } = useProfile(userId);

<Text style={styles.name}>{profile?.name ?? '—'}</Text>
<Text style={styles.email}>{profile?.email ?? '—'}</Text>
```

Null-coalescing (`?? '—'`) keeps the layout stable while data loads.
Use the **existing** loading skeleton/spinner if one exists in the screen. Only add a new one if there is none at all.

---

## RESPONSE MAPPING

When FastAPI field names differ from what the UI expects, create a mapper — never inline the transformation inside JSX.

```ts
// src/utils/mappers.ts
import type { UserResponse } from '../types/api.generated';

export interface UIUser {
  displayName: string;
  avatarUri: string;
  isVerified: boolean;
}

export function toUIUser(raw: UserResponse): UIUser {
  return {
    displayName: raw.full_name,
    avatarUri: raw.avatar_url,
    isVerified: raw.verification_status === 'verified',
  };
}
```

Apply the mapper in the service or hook, not the component.

---

## PAGINATION & LISTS

FastAPI typically returns paginated responses. Use `FlatList` (already in the UI) with cursor or offset pagination:

```ts
// Hook pattern for paginated lists
const [items, setItems] = useState<Item[]>([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

async function loadMore() {
  if (!hasMore || loading) return;
  const result = await getItems({ page });
  setItems(prev => [...prev, ...result.items]);
  setHasMore(result.has_more);
  setPage(p => p + 1);
}
```

---

## ERROR HANDLING RULES

| Scenario | Action |
|---|---|
| Network timeout | Show user-facing message; offer retry |
| 401 Unauthorized | Trigger auth refresh or redirect to login |
| 422 Validation error | Map FastAPI's `detail` array to field-level messages |
| 500 Server error | Generic error message; log to console |
| Empty response | Show empty state — use existing empty state component if present |

Never log sensitive data (tokens, personal info) to the console in production.

---

## FASTAPI-SPECIFIC NOTES

- Use `/openapi.json` to understand exact field names and response shapes before writing mappers
- FastAPI returns `422` with a `detail` array for validation errors — handle this shape specifically
- FastAPI uses `snake_case` field names by default; React Native conventions use `camelCase` — always map in `mappers.ts`
- If the FastAPI app uses dependencies for auth (`Depends(get_current_user)`), your requests must include `Authorization: Bearer <token>` — the interceptor above handles this

---

## CHECKLIST BEFORE COMMITTING

- [ ] No StyleSheet, style prop, or className was modified
- [ ] Every async call has AbortController cleanup
- [ ] All types are derived from generated OpenAPI types where possible
- [ ] Errors are human-readable strings, not raw Error objects
- [ ] snake_case ↔ camelCase mapping is in `mappers.ts`, not inline in JSX
- [ ] No direct `fetch()` or `axios` calls inside screen or component files
- [ ] Null safety applied with `?.` and `?? fallback` on all data-bound JSX values
