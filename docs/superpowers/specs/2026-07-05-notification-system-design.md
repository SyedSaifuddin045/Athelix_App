# Push Notification System — Design Spec

> **Status:** Approved  
> **Date:** 2026-07-05  
> **Approach:** Clean Provider Pattern (recommended)

## Goal

Implement a production-ready, provider-agnostic push notification system for Athelix. Android via FCM now, iOS via APNs later with zero business-logic changes.

## Architecture

```
Mobile App → POST /devices/register → FastAPI → NotificationService → FCMProvider → FCM → Android
                                                                      └── APNsProvider (stub)
```

**Key rule:** Business logic never calls Firebase directly. It calls `notification_service.send_to_user(user_id, title, body, data)` — provider selection, token lookup, and error handling live in the notification module.

## Backend: Module Structure

```
app/notifications/
├── __init__.py
├── models.py              ← Device + NotificationHistory SQLAlchemy models
├── schemas.py             ← Pydantic request/response schemas
├── repository.py          ← DB access layer
├── service.py             ← NotificationService orchestrator
├── router.py              ← API endpoints
├── exceptions.py          ← Custom exceptions
└── providers/
    ├── __init__.py
    ├── base.py            ← Abstract NotificationProvider + ProviderResult
    ├── fcm.py             ← FCMProvider (firebase-admin SDK)
    └── apns.py            ← Stub — NotImplementedError
```

## Backend: Database Tables

### Device

| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK → users.id | CASCADE on delete |
| platform | str | "android" or "ios" |
| push_token | text | FCM or APNs token |
| device_name | str? | |
| app_version | str? | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| last_seen | timestamptz | Updated on register |

One user may own multiple devices. Tokens NOT stored on User table.

### NotificationHistory

| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK → users.id | |
| title | str? | |
| body | str? | |
| data | JSON? | Deep link payload |
| provider | str | "fcm" or "apns" |
| status | str | "sent" or "failed" |
| provider_response | text? | Raw FCM message ID |
| error | text? | Error message |
| created_at | timestamptz | |
| sent_at | timestamptz? | |

## Backend: Provider Interface

```python
@dataclass
class ProviderResult:
    success: bool
    provider_response: str | None = None
    error: str | None = None

class NotificationProvider(ABC):
    @abstractmethod
    async def send(
        self, token: str, title: str, body: str, data: dict | None = None
    ) -> ProviderResult:
        ...
```

### FCMProvider

- Initializes `firebase-admin` with service account credentials
- Sends via `messaging.send(Message(...))`
- Catches `UnregisteredError` → returns `ProviderResult(success=False, error="NotRegistered")`
- All other exceptions caught and logged, returned as error string

### APNsProvider

- Stub: raises `NotImplementedError("APNs not yet implemented")`
- Ready for implementation when iOS support needed

## Backend: NotificationService

```python
class NotificationService:
    def __init__(self, repository: NotificationRepository, providers: dict[str, NotificationProvider]):
        ...

    async def send_to_user(
        self, user_id: int, title: str, body: str, data: dict | None = None
    ) -> SendResult:
        # 1. Get user's active devices from repository
        # 2. For each device, select provider by platform
        # 3. Call provider.send()
        # 4. Log to NotificationHistory
        # 5. If NotRegistered/InvalidToken → delete device
        # 6. Return SendResult(total, sent, failed)
```

- Async — ready for background workers (Celery/Arq/Dramatiq) later
- No blocking HTTP requests
- No devices → silent no-op

## Backend: API Endpoints

All authenticated via `get_current_user` dependency.

| Method | Path | Description |
|---|---|---|
| POST | /devices/register | Register/update device token |
| POST | /devices/unregister | Remove device token |
| GET | /devices | List user's devices |

### POST /devices/register

```
Request:
{
  "platform": "android",
  "push_token": "fcm-token-...",
  "device_name": "Pixel 9 Pro",
  "app_version": "1.0.1"
}

Response 201:
{
  "id": 42,
  "platform": "android",
  "push_token": "fcm-token-...",
  "device_name": "Pixel 9 Pro",
  "last_seen": "2026-07-05T12:00:00Z"
}
```

- Upsert: same user + same token → update `last_seen`, `device_name`, `app_version`
- Same user + same platform + different token → update token
- Different user + same token → new device (don't steal tokens)

## Backend: Configuration

Add to `Settings` in `app/core/config.py`:

- `fcm_project_id: str`
- `fcm_client_email: str`
- `fcm_private_key: str`

OR single `fcm_service_account_json: dict` (simpler — store entire SA JSON).

Add `firebase-admin` to `pyproject.toml` dependencies.

## Backend: Router Registration

In `app/main.py`, init `FCMProvider` and `NotificationService` as app state on startup.
In `app/api/v1/router.py`, include `notifications.router` with `[Depends(get_current_user)]`.

## Mobile: Token Registration

Replace `src/utils/notifications.ts` with `src/hooks/useNotificationRegistration.ts`:

1. Request permission (Android channel setup — already exists)
2. Get raw FCM token via `getDevicePushTokenAsync()` (not `getExpoPushTokenAsync()`)
3. POST /devices/register with platform + token
4. Listen for token refresh events
5. Call on mount, clean up on unmount

## Mobile: Deep Link Handling

Centralized `useNotificationTapHandler` hook:

```typescript
function handleNotificationTap(data: Record<string, any>) {
  switch (data.screen) {
    case "chat":       navigate("Chat", { chatId: data.chatId });
    case "session":    navigate("SessionDetail", { id: data.sessionId });
    // Extensible — add cases here
  }
}
```

- Foreground: `setNotificationHandler` (already configured) + inline tap
- Background/killed: `addNotificationResponseReceivedListener`

## Mobile: Files

### New
- `src/hooks/useNotificationRegistration.ts`
- `src/hooks/useNotificationTapHandler.ts`

### Modified
- `App.tsx` — call `useNotificationRegistration()`
- `src/utils/notifications.ts` — refactor to raw FCM token

## Error Handling

| Scenario | Behavior |
|---|---|
| Invalid/expired token | Delete device, log history as failed |
| No registered devices | Silent no-op (SendResult.total=0) |
| Provider init failure | Skip platform, log + Sentry |
| FCM rate limit | Caught by SlowAPI (120 req/min), FCM has own limits |
| Network timeout | Provider returns error, logged, retry-ready |

## FCM Credentials

- `google-services.json` at `~/Downloads/google-services.json` — verified, now matches `com.athelix.app`
- Service account JSON at `~/Downloads/athelix-6c1e9-17e754150505.json` — contains private_key, client_email, project_id
- Both stored externally; backend reads from env vars or mounted secrets (per Coolify config)

## Open Questions (Resolved)

- **Expo push vs raw FCM:** Raw FCM via `getDevicePushTokenAsync()` — approved
- **Approach:** Clean Provider Pattern — approved
- **Package name mismatch:** Resolved — user re-created Firebase Android app with `com.athelix.app`

## Implementation Order

1. Backend: models + migration
2. Backend: provider interface + FCMProvider
3. Backend: repository + service
4. Backend: schemas + router + config
5. Backend: wire into main.py + router.py
6. Mobile: useNotificationRegistration hook
7. Mobile: notification tap handler + deep linking
8. Mobile: wire into App.tsx
9. Verify end-to-end
