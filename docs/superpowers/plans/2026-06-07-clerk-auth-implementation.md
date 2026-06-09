# Clerk Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace custom JWT auth with Clerk on the Expo mobile app and FastAPI backend.

**Architecture:** Clerk SDK on mobile handles sign-in/sign-up/session management. Backend verifies Clerk-issued JWTs via JWKS and syncs users via webhooks. Existing user model gains `clerk_id`; custom auth endpoints are removed.

**Tech Stack:** `@clerk/expo`, FastAPI, SQLAlchemy, Python `PyJWT` + `cryptography` (for Clerk RS256 JWT verification)

---

## File Structure

### Backend (`Athlix/`)

| File | Action |
|------|--------|
| `.env` | Modify — add `CLERK_SECRET_KEY` |
| `app/core/config.py` | Modify — add `clerk_secret_key`, `clerk_jwks_url` |
| `app/core/security.py` | Modify — add `verify_clerk_token()` using JWKS + RS256 |
| `app/api/deps.py` | Modify — replace custom JWT verification with Clerk JWT |
| `app/api/v1/endpoints/auth.py` | Modify — remove register/login/refresh, add webhook |
| `app/api/v1/router.py` | Modify — adjust auth protection |
| `app/models/user.py` | Modify — add `clerk_id`, nullable `password_hash` |
| `app/schemas/auth.py` | Modify — remove old schemas, add webhook schemas |
| `alembic/versions/` | Create — migration for `clerk_id` + nullable password_hash |
| `app/core/clerk.py` | Create — Clerk JWT verification + webhook verification |

### Mobile (`Athelix_App/mobile/`)

| File | Action |
|------|--------|
| `package.json` | Modify — add `@clerk/expo` |
| `.env` | Modify — add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `App.tsx` | Modify — replace `AuthProvider` with `ClerkProvider` |
| `src/auth/AuthProvider.tsx` | Delete |
| `src/api/tokenStore.ts` | Delete |
| `src/api/client.ts` | Modify — remove manual token refresh; use Clerk token via global ref |
| `src/navigation/AppNavigator.tsx` | Modify — add `AuthGate` with Clerk `useAuth()` |
| `src/screens/LoginScreen.tsx` | Modify — rewrite with `useSignIn()` |
| `src/screens/RegisterScreen.tsx` | Modify — rewrite with `useSignUp()` |
| `src/screens/SplashScreen.tsx` | Modify — update to use Clerk's `isLoaded` |

---

### Task 1: Backend — Clerk config + security module

**Files:**
- Modify: `Athlix/.env`
- Modify: `Athlix/app/core/config.py`
- Create: `Athlix/app/core/clerk.py`

- [ ] **Step 1: Add Clerk env vars to `.env`**

Append to `Athlix/.env`:
```
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_JWKS_URL=https://api.clerk.com/v1/jwks
```

- [ ] **Step 2: Add Clerk config fields to `config.py`**

Add to `app/core/config.py` Settings class:
```python
clerk_secret_key: str = Field(..., alias="CLERK_SECRET_KEY")
clerk_jwks_url: str = Field(
    "https://api.clerk.com/v1/jwks", alias="CLERK_JWKS_URL"
)
```

- [ ] **Step 3: Create `app/core/clerk.py` — Clerk JWT verification**

```python
import json
import time
import urllib.request
from datetime import UTC, datetime

import jwt
from jwt import PyJWKClient

from app.core.config import settings

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            settings.clerk_jwks_url,
            cache_keys=True,
            max_cached_keys=5,
        )
    return _jwks_client


def verify_clerk_token(token: str) -> dict:
    jwks_client = _get_jwks_client()
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        options={"verify_exp": True},
    )

    return payload


def verify_clerk_webhook(payload: bytes, svix_signature: str) -> dict:
    import hashlib
    import hmac

    parts = {}
    for part in svix_signature.split(","):
        kv = part.split("=", 1)
        if len(kv) == 2:
            parts[kv[0].strip()] = kv[1].strip()

    expected_sig = parts.get("v1", "")
    secret = settings.clerk_secret_key.encode("utf-8")
    to_sign = f"{parts.get('ts', '')}.{payload.decode('utf-8')}".encode("utf-8")
    computed = hmac.new(secret, to_sign, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed, expected_sig):
        raise ValueError("Invalid webhook signature")

    return json.loads(payload)
```

- [ ] **Step 4: Add dependencies to `pyproject.toml`**

Add to dependencies in `Athlix/pyproject.toml`:
```
"PyJWT>=2.9.0",
"cryptography>=42.0.0",
```

### Task 2: Backend — User model + migration

**Files:**
- Modify: `Athlix/app/models/user.py`
- Create: `Athlix/alembic/versions/xxxx_add_clerk_id.py`

- [ ] **Step 1: Update `User` model**

In `app/models/user.py`, add `clerk_id` and make `password_hash` nullable:
```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    clerk_id: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    username: Mapped[str] = mapped_column(Text, unique=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)  # made nullable

    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
```

- [ ] **Step 2: Create Alembic migration**

Run:
```bash
cd Athlix
alembic revision --autogenerate -m "add clerk_id to users, make password_hash nullable"
```

Or create a manual migration file to:
1. Add `clerk_id` column (Text, nullable, unique)
2. Change `password_hash` to nullable

```python
# Migration content
from alembic import op
import sqlalchemy as sa

revision = "xxxx_add_clerk_id"
down_revision = "previous_revision"

def upgrade():
    op.add_column("users", sa.Column("clerk_id", sa.Text(), nullable=True))
    op.create_unique_constraint("uq_users_clerk_id", "users", ["clerk_id"])
    op.alter_column("users", "password_hash", existing_type=sa.Text(), nullable=True)

def downgrade():
    op.alter_column("users", "password_hash", existing_type=sa.Text(), nullable=False)
    op.drop_constraint("uq_users_clerk_id", "users", type_="unique")
    op.drop_column("users", "clerk_id")
```

### Task 3: Backend — Auth endpoints + deps

**Files:**
- Modify: `Athlix/app/api/deps.py`
- Modify: `Athlix/app/api/v1/endpoints/auth.py`
- Modify: `Athlix/app/schemas/auth.py`

- [ ] **Step 1: Update `deps.py` to verify Clerk tokens**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clerk import verify_clerk_token
from app.core.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise auth_error

    try:
        payload = verify_clerk_token(credentials.credentials)
        clerk_id = payload.get("sub")
    except Exception as exc:
        raise auth_error from exc

    if not clerk_id:
        raise auth_error

    user = db.execute(
        select(User).where(User.clerk_id == clerk_id)
    ).scalar_one_or_none()

    if user is None:
        email = payload.get("email", "")
        username = payload.get("username") or email.split("@")[0]
        now = datetime.now(UTC)
        user = User(
            clerk_id=clerk_id,
            username=username,
            email=email,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
```

Add import at top:
```python
from datetime import datetime, timezone
UTC = timezone.utc
```

- [ ] **Step 2: Update `auth.py` — remove register/login/refresh, add webhook**

```python
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.clerk import verify_clerk_webhook
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import ClerkWebhookEvent
from app.schemas.user_schema import UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    svix_signature = request.headers.get("svix-signature") or request.headers.get("webhook-signature", "")
    if not svix_signature:
        raise HTTPException(status_code=400, detail="Missing webhook signature")

    payload = await request.body()

    try:
        event = verify_clerk_webhook(payload, svix_signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    event_type = event.get("type", "")
    data = event.get("data", {})

    if event_type == "user.created":
        clerk_id = data.get("id")
        email = ""
        email_addresses = data.get("email_addresses", [])
        if email_addresses:
            email = email_addresses[0].get("email_address", "")
        username = data.get("username") or email.split("@")[0]

        existing = db.execute(
            select(User).where(User.clerk_id == clerk_id)
        ).scalar_one_or_none()
        if not existing:
            now = datetime.now(timezone.utc)
            user = User(
                clerk_id=clerk_id,
                username=username,
                email=email,
                created_at=now,
                updated_at=now,
            )
            db.add(user)
            db.commit()

    elif event_type == "user.updated":
        clerk_id = data.get("id")
        user = db.execute(
            select(User).where(User.clerk_id == clerk_id)
        ).scalar_one_or_none()
        if user:
            email_addresses = data.get("email_addresses", [])
            if email_addresses:
                user.email = email_addresses[0].get("email_address", user.email)
            user.username = data.get("username", user.username)
            user.updated_at = datetime.now(timezone.utc)
            db.commit()

    elif event_type == "user.deleted":
        clerk_id = data.get("id")
        user = db.execute(
            select(User).where(User.clerk_id == clerk_id)
        ).scalar_one_or_none()
        if user:
            db.delete(user)
            db.commit()

    return {"ok": True}
```

- [ ] **Step 3: Update `schemas/auth.py`**

```python
from datetime import datetime

from pydantic import BaseModel


class ClerkWebhookEvent(BaseModel):
    type: str
    data: dict
    object: str | None = None
    timestamp: int | None = None
```

Remove old `RegisterRequest`, `LoginRequest`, `RefreshTokenRequest`, `AuthResponse` schemas.

- [ ] **Step 4: Update `router.py`**

No changes needed — the auth router already has no `get_current_user` dependency, and `/me` protects itself via `Depends(get_current_user)`. Confirm the webhook endpoint is accessible without auth.

- [ ] **Step 5: Install Python dependencies**

```bash
cd /Users/saif/Programming/Athlix
pip install PyJWT cryptography
```

### Task 4: Mobile — Install Clerk, add env vars, update root layout

**Files:**
- Modify: `Athelix_App/mobile/package.json`
- Modify: `Athelix_App/mobile/.env`
- Modify: `Athelix_App/mobile/App.tsx`
- Delete: `Athelix_App/mobile/src/auth/AuthProvider.tsx`
- Delete: `Athelix_App/mobile/src/api/tokenStore.ts`

- [ ] **Step 1: Install `@clerk/expo`**

```bash
cd /Users/saif/Programming/Athelix_App/mobile
npx expo install @clerk/expo
```

Wait, actually with the project using custom React Navigation rather than Expo Router, we need to think about whether `@clerk/expo` works. Let me check.

Actually, `@clerk/expo` does work without Expo Router. The `ClerkProvider` just needs to wrap the app, and hooks like `useAuth()`, `useSignIn()`, `useSignUp()` work in any React Native component.

- [ ] **Step 2: Add Clerk key to `.env`**

Append to `Athelix_App/mobile/.env`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

- [ ] **Step 3: Update `App.tsx` — add ClerkProvider**

```tsx
import { ClerkProvider, tokenCache } from "@clerk/expo";

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env");
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <PostHogProvider
            apiKey={apiKey}
            options={options}
            autocapture={{
              captureScreens: false,
              captureTouches: true,
            }}
          >
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
              <AppContent />
            </ClerkProvider>
          </PostHogProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
```

Remove `AuthProvider` import and usage.

- [ ] **Step 4: Delete `AuthProvider.tsx` and `tokenStore.ts`**

```bash
rm /Users/saif/Programming/Athelix_App/mobile/src/auth/AuthProvider.tsx
rm /Users/saif/Programming/Athelix_App/mobile/src/api/tokenStore.ts
```

### Task 5: Mobile — Update API client for Clerk tokens

**Files:**
- Modify: `Athelix_App/mobile/src/api/client.ts`
- Modify: `Athelix_App/mobile/src/screens/SplashScreen.tsx`

- [ ] **Step 1: Update `client.ts` — remove custom token management, use Clerk token**

```typescript
import { getApiBaseUrl, toApiUrl } from "./config";

export type FieldError = {
  field?: string;
  message: string;
  scope?: string;
  type?: string;
};

export class ApiError extends Error {
  status?: number;
  info?: unknown;
  fieldErrors: FieldError[];

  constructor(message: string, status?: number, info?: unknown, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.info = info;
    this.fieldErrors = fieldErrors;
  }
}

type RetryInit = RequestInit & { __didRetry?: boolean };

const globalScope = globalThis as typeof globalThis & { __athelixOriginalFetch?: typeof globalThis.fetch };
const originalFetch = globalScope.__athelixOriginalFetch ?? globalThis.fetch.bind(globalThis);
globalScope.__athelixOriginalFetch = originalFetch;
let installed = false;

let clerkSessionToken: string | null = null;

export function updateClerkToken(token: string | null) {
  clerkSessionToken = token;
}

function isPublicPath(url: string) {
  const path = url.replace(getApiBaseUrl(), "");
  return (
    path.startsWith("/meta/app-config") ||
    path.startsWith("/health") ||
    path === "/" ||
    path.startsWith("/auth/webhook") ||
    path.startsWith("/db-")
  );
}

async function parseErrorBody(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractFieldErrorMessages(detail: unknown): string[] {
  if (!Array.isArray(detail)) return [];
  return detail
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const loc = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
      const msg = typeof item.msg === "string" ? item.msg : "";
      return loc ? `${loc}: ${msg}` : msg;
    })
    .filter(Boolean);
}

function normalizeError(body: unknown, status: number) {
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const fieldErrors = Array.isArray(payload.field_errors)
    ? payload.field_errors
        .filter((item): item is FieldError => !!item && typeof item === "object" && "message" in item)
        .map((item) => ({
          ...item,
          message: String((item as FieldError).message),
        }))
    : [];
  const validationMessages = fieldErrors.length
    ? fieldErrors.map((item) => (item.field ? `${item.field}: ${item.message}` : item.message))
    : extractFieldErrorMessages(payload.detail);
  const message =
    validationMessages.length > 0
      ? validationMessages.join("; ")
      : typeof payload.message === "string"
        ? payload.message
        : typeof payload.detail === "string"
          ? payload.detail
          : status === 401
            ? "Your session has expired."
            : "Something went wrong.";
  return new ApiError(message, status, body, fieldErrors);
}

function mergeHeaders(input?: HeadersInit) {
  const headers = new Headers(input);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return headers;
}

export async function apiFetch(input: RequestInfo | URL, init?: RetryInit): Promise<Response> {
  const url = toApiUrl(input);
  const urlString = typeof url === "string" ? url : url.toString();
  const headers = mergeHeaders(init?.headers);

  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!isPublicPath(urlString) && clerkSessionToken) {
    headers.set("Authorization", `Bearer ${clerkSessionToken}`);
  }

  const response = await originalFetch(url, { ...init, headers });

  if (response.status === 401 && !init?.__didRetry && !isPublicPath(urlString)) {
    // Clerk handles token refresh — caller should get a fresh token via updateClerkToken()
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw normalizeError(body, response.status);
  }

  return response;
}

export async function apiMutator<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(url, options);
  const body = [204, 205, 304].includes(response.status) ? null : await response.text();
  const data = body ? JSON.parse(body) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
}

export function installApiFetchInterceptor() {
  if (installed) return;
  installed = true;
  globalThis.fetch = apiFetch as typeof globalThis.fetch;
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function getFieldError(error: unknown, field: string) {
  if (!(error instanceof ApiError)) return undefined;
  return error.fieldErrors.find((item) => item.field === field)?.message;
}
```

- [ ] **Step 2: Update `SplashScreen.tsx` — use Clerk `useAuth()`**

Replace existing import and usage with Clerk:

```typescript
import { useAuth } from "@clerk/expo";

function SplashScreen({ navigation }: { navigation: any }) {
  const { isLoaded, isSignedIn } = useAuth();
  const appConfig = useAppConfigQuery();
  const progress = appConfig.isPending || !isLoaded ? 65 : 100;
  const status =
    appConfig.isPending
      ? "Fetching app config..."
      : !isLoaded
        ? "Restoring session..."
        : isSignedIn
          ? "Ready!"
          : "Sign in to continue";

  useEffect(() => {
    if (appConfig.isPending || !isLoaded) return;
    const timer = setTimeout(() => {
      navigation.replace(isSignedIn ? "MainTabs" : "Login");
    }, 450);
    return () => clearTimeout(timer);
  }, [appConfig.isPending, isLoaded, isSignedIn, navigation]);
  // ...rest stays the same
}
```

Remove the `useAuth` import from `../auth/AuthProvider`.

### Task 6: Mobile — Update navigation with AuthGate

**Files:**
- Modify: `Athelix_App/mobile/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Add AuthGate wrapper**

```tsx
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/expo";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../types/navigation";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import ExerciseDetailScreen from "../screens/ExerciseDetailScreen";
import TemplateListScreen from "../screens/TemplateListScreen";
import { TemplateBuilderScreen } from "../screens/TemplateBuilderScreen";
import { StartWorkoutScreen } from "../screens/StartWorkoutScreen";
import { ActiveWorkoutScreen } from "../screens/ActiveWorkoutScreen";
import { WorkoutHistoryScreen } from "../screens/WorkoutHistoryScreen";
import { SessionDetailScreen } from "../screens/SessionDetailScreen";
import { MesocycleListScreen } from "../screens/MesocycleListScreen";
import { MesocycleDetailScreen } from "../screens/MesocycleDetailScreen";
import { PersonalRecordsScreen } from "../screens/PersonalRecordsScreen";
import { ExerciseProgressScreen } from "../screens/ExerciseProgressScreen";
import { MuscleBalanceScreen } from "../screens/MuscleBalanceScreen";
import { BodyweightHistoryScreen } from "../screens/BodyweightHistoryScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { updateClerkToken } from "../api/client";

const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      getToken().then((token) => updateClerkToken(token));
    } else {
      updateClerkToken(null);
    }
  }, [isSignedIn, getToken]);

  // Refresh token periodically
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(async () => {
      const token = await getToken();
      updateClerkToken(token);
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  if (!isLoaded) return null;
  return <>{children}</>;
}

export function AppNavigator() {
  return (
    <AuthGate>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        <RootStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <RootStack.Screen name="TemplateList" component={TemplateListScreen} />
        <RootStack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
        <RootStack.Screen name="StartWorkout" component={StartWorkoutScreen} />
        <RootStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <RootStack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
        <RootStack.Screen name="SessionDetail" component={SessionDetailScreen} />
        <RootStack.Screen name="MesocycleList" component={MesocycleListScreen} />
        <RootStack.Screen name="MesocycleDetail" component={MesocycleDetailScreen} />
        <RootStack.Screen name="PersonalRecords" component={PersonalRecordsScreen} />
        <RootStack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
        <RootStack.Screen name="MuscleBalance" component={MuscleBalanceScreen} />
        <RootStack.Screen name="BodyweightHistory" component={BodyweightHistoryScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
      </RootStack.Navigator>
    </AuthGate>
  );
}
```

### Task 7: Mobile — Rewrite LoginScreen with Clerk useSignIn

**Files:**
- Modify: `Athelix_App/mobile/src/screens/LoginScreen.tsx`

- [ ] **Step 1: Rewrite LoginScreen**

```tsx
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSignIn } from "@clerk/expo";
import { useAuth } from "@clerk/expo";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";

function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLoading(false);
        navigation.replace("MainTabs");
      } else if (result.status === "needs_second_factor") {
        // Handle MFA if needed
        setLoading(false);
        setError("Additional verification required.");
      } else {
        setLoading(false);
        setError("Sign in could not be completed.");
      }
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  if (!isLoaded) return null;

  if (isSignedIn) {
    navigation.replace("MainTabs");
    return null;
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.authTop}>
        <View style={styles.authLogo}>
          <Text style={styles.splashEmoji}>💪</Text>
        </View>
        <Text style={styles.authTitle}>Welcome back</Text>
        <Text style={styles.authSubtitle}>Sign in to continue your journey</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
        </View>
        <Pressable>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          disabled={loading || !isLoaded}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
      </View>

      <Text style={styles.authBottomText}>
        Don't have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.navigate("Register")}>
          Sign Up
        </Text>
      </Text>
    </Screen>
  );
}

export default LoginScreen;
```

### Task 8: Mobile — Rewrite RegisterScreen with Clerk useSignUp

**Files:**
- Modify: `Athelix_App/mobile/src/screens/RegisterScreen.tsx`

- [ ] **Step 1: Rewrite RegisterScreen**

```tsx
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSignUp } from "@clerk/expo";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton, RoundButton } from "../components/ui/Button";

function RegisterScreen({ navigation }: { navigation: any }) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const checks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Number", ok: /[0-9]/.test(form.password) },
  ];

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Start sign-up with Clerk
      await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
        username: form.username.trim(),
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLoading(false);
        navigation.replace("ProfileSetup");
      } else {
        setLoading(false);
        setError("Verification could not be completed.");
      }
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  if (!isLoaded) return null;

  if (pendingVerification) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <View style={[styles.headerRow, { paddingTop: 10 }]}>
          <View style={styles.headerLeft}>
            <RoundButton onPress={() => { setPendingVerification(false); setCode(""); }}>
              <Feather name="arrow-left" size={16} color={COLORS.text} />
            </RoundButton>
            <View>
              <Text style={styles.headerTitle}>Verify Email</Text>
              <Text style={styles.headerSubtitle}>Check your inbox for a code</Text>
            </View>
          </View>
        </View>

        <View style={styles.formStack}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Verification code"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="number-pad"
          />
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <PrimaryButton
            label={loading ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            disabled={loading || !code}
            icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="check" size={16} color="#000000" />}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={[styles.headerRow, { paddingTop: 10 }]}>
        <View style={styles.headerLeft}>
          <RoundButton onPress={() => navigation.replace("Login")}>
            <Feather name="arrow-left" size={16} color={COLORS.text} />
          </RoundButton>
          <View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start your fitness journey</Text>
          </View>
        </View>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={form.username}
            onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
            placeholder="jordan_lifts"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={form.password}
              onChangeText={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
          {form.password.length > 0 ? (
            <View style={styles.passwordChecks}>
              {checks.map((check) => (
                <View key={check.label} style={styles.passwordCheck}>
                  <View style={[styles.checkBubble, check.ok ? { backgroundColor: COLORS.teal } : null]}>
                    {check.ok ? <Feather name="check" size={8} color="#000000" /> : null}
                  </View>
                  <Text style={[styles.passwordCheckText, check.ok ? { color: COLORS.teal } : null]}>{check.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={styles.legalText}>
          By creating an account, you agree to our <Text style={styles.linkTextInline}>Terms of Service</Text> and{" "}
          <Text style={styles.linkTextInline}>Privacy Policy</Text>.
        </Text>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
      </View>

      <Text style={styles.authBottomText}>
        Already have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.replace("Login")}>
          Sign In
        </Text>
      </Text>
    </Screen>
  );
}

export default RegisterScreen;
```

### Task 9: Mobile — Clean up unused auth references

**Files:**
- Check: All files that import from `../auth/AuthProvider` or `../api/tokenStore`

- [ ] **Step 1: Search for remaining references**

Search for `from "../auth/AuthProvider"`, `from "../api/tokenStore"`, `useAuth` from AuthProvider across all files.

Replace any `useAuth()` from AuthProvider with Clerk's `useAuth()` from `@clerk/expo`.

Key files to check:
- `src/screens/SplashScreen.tsx` (already handled in Task 5)
- `src/screens/LoginScreen.tsx` (already handled in Task 7)
- `src/screens/RegisterScreen.tsx` (already handled in Task 8)
- `src/api/queries.ts` — if it uses auth
- Any profile/settings screens that reference current user

Check if `src/screens/ProfileSetupScreen.tsx` uses auth, and update it to use `useUser()` from Clerk.
Check if `src/screens/SettingsScreen.tsx` uses auth for sign-out, and update to use `useClerk().signOut()`.
