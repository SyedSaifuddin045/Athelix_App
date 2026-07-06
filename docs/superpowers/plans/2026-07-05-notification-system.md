# Push Notification System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement provider-agnostic push notification system for Android (FCM now, iOS later).

**Architecture:** Backend `app/notifications/` module with abstract `NotificationProvider` → `FCMProvider` + `APNsProvider` stub. `NotificationService` orchestrates device lookup, provider dispatch, history logging, and invalid token cleanup. Mobile uses raw FCM tokens via `getDevicePushTokenAsync()`.

**Tech Stack:** FastAPI + SQLAlchemy + firebase-admin (backend), React Native + Expo + expo-notifications (mobile)

---

## File Structure

### Backend (`/Users/saif/Programming/Athlix/`)

**New files:**
- `app/notifications/__init__.py`
- `app/notifications/models.py`
- `app/notifications/schemas.py`
- `app/notifications/repository.py`
- `app/notifications/service.py`
- `app/notifications/router.py`
- `app/notifications/exceptions.py`
- `app/notifications/providers/__init__.py`
- `app/notifications/providers/base.py`
- `app/notifications/providers/fcm.py`
- `app/notifications/providers/apns.py`

**Modified files:**
- `app/core/config.py` — add FCM env vars
- `app/main.py` — init FCMProvider, register router
- `app/api/v1/router.py` — include notifications router
- `pyproject.toml` — add firebase-admin
- `.env.example` — add FCM vars

**Migration:**
- `alembic/versions/` — new auto-generated migration

### Mobile (`/Users/saif/Programming/Athelix_App/`)

**New files:**
- `src/hooks/useNotificationRegistration.ts`
- `src/hooks/useNotificationTapHandler.ts`

**Modified files:**
- `App.tsx` — call useNotificationRegistration
- `src/utils/notifications.ts` — refactor to getDevicePushTokenAsync

---

### Task 1: Backend — Add firebase-admin dependency + FCM config

**Files:**
- Modify: `/Users/saif/Programming/Athlix/pyproject.toml`
- Modify: `/Users/saif/Programming/Athlix/app/core/config.py`
- Modify: `/Users/saif/Programming/Athlix/.env.example`

- [ ] **Step 1: Add firebase-admin to pyproject.toml**

Edit line after `"slowapi>=0.1.10",`:

```toml
    "firebase-admin>=6.6.0",
```

- [ ] **Step 2: Add FCM settings to config.py**

Add after `play_optin_url: str | None = Field(None, alias="PLAY_OPTIN_URL")`:

```python
    fcm_project_id: str = Field("", alias="FCM_PROJECT_ID")
    fcm_client_email: str = Field("", alias="FCM_CLIENT_EMAIL")
    fcm_private_key: str = Field("", alias="FCM_PRIVATE_KEY")
```

- [ ] **Step 3: Add vars to .env.example**

```bash
# Firebase Cloud Messaging
FCM_PROJECT_ID=athelix-6c1e9
FCM_CLIENT_EMAIL=firebase-adminsdk-fbsvc@athelix-6c1e9.iam.gserviceaccount.com
FCM_PRIVATE_KEY="""-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"""
```

- [ ] **Step 4: Install dependency and verify**

```bash
cd /Users/saif/Programming/Athlix
uv sync
```

- [ ] **Step 5: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add pyproject.toml uv.lock app/core/config.py .env.example
git commit -m "feat: add firebase-admin dep and FCM config vars"
```

---

### Task 2: Backend — Create notification directory + init files + exceptions

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/__init__.py`
- Create: `/Users/saif/Programming/Athlix/app/notifications/exceptions.py`
- Create: `/Users/saif/Programming/Athlix/app/notifications/providers/__init__.py`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p /Users/saif/Programming/Athlix/app/notifications/providers
```

- [ ] **Step 2: Create app/notifications/__init__.py**

```python
"""Push notification module.

Provides provider-agnostic notification delivery via NotificationService.
"""
```

- [ ] **Step 3: Create app/notifications/exceptions.py**

```python
class NotificationError(Exception):
    """Base exception for notification errors."""
    ...


class ProviderNotAvailable(NotificationError):
    """Raised when no provider is configured for a platform."""
    ...


class InvalidToken(NotificationError):
    """Raised when a push token is invalid or unregistered."""
    ...
```

- [ ] **Step 4: Create app/notifications/providers/__init__.py**

```python
from .base import NotificationProvider, ProviderResult
from .fcm import FCMProvider
from .apns import APNsProvider

__all__ = ["NotificationProvider", "ProviderResult", "FCMProvider", "APNsProvider"]
```

- [ ] **Step 5: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/
git commit -m "feat: add notification module skeleton and exceptions"
```

---

### Task 3: Backend — Create notification models (Device + NotificationHistory)

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/models.py`

- [ ] **Step 1: Write the models**

```python
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform: Mapped[str] = mapped_column(String(16), nullable=False)  # "android" or "ios"
    push_token: Mapped[str] = mapped_column(Text, nullable=False)
    device_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    app_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


class NotificationHistory(Base):
    __tablename__ = "notification_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    provider: Mapped[str] = mapped_column(String(16), nullable=False)  # "fcm" or "apns"
    status: Mapped[str] = mapped_column(String(16), nullable=False)  # "sent" or "failed"
    provider_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 2: Import models in app/models/__init__.py**

Add at end of `/Users/saif/Programming/Athlix/app/models/__init__.py`:

```python
from app.notifications.models import Device, NotificationHistory
```

- [ ] **Step 3: Generate Alembic migration**

```bash
cd /Users/saif/Programming/Athlix
alembic revision --autogenerate -m "add device and notification_history tables"
```

- [ ] **Step 4: Review and run migration**

```bash
cd /Users/saif/Programming/Athlix
alembic upgrade head
```

Expected: `INFO  [alembic.runtime.migration] Running migration <id>_add_device_and_notification_history_tables`

- [ ] **Step 5: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/models.py app/models/__init__.py alembic/versions/
git commit -m "feat: add Device and NotificationHistory models + migration"
```

---

### Task 4: Backend — Create notification schemas

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/schemas.py`

- [ ] **Step 1: Write the schemas**

```python
from datetime import datetime
from app.schemas.base_schema import BaseSchema


class DeviceRegisterRequest(BaseSchema):
    platform: str  # "android" or "ios"
    push_token: str
    device_name: str | None = None
    app_version: str | None = None


class DeviceUnregisterRequest(BaseSchema):
    push_token: str


class DeviceResponse(BaseSchema):
    id: int
    platform: str
    push_token: str
    device_name: str | None
    app_version: str | None
    last_seen: datetime | None
    created_at: datetime
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/schemas.py
git commit -m "feat: add notification schemas"
```

---

### Task 5: Backend — Create provider interface + FCMProvider + APNs stub

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/providers/base.py`
- Create: `/Users/saif/Programming/Athlix/app/notifications/providers/fcm.py`
- Create: `/Users/saif/Programming/Athlix/app/notifications/providers/apns.py`

- [ ] **Step 1: Write base.py**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProviderResult:
    success: bool
    provider_response: str | None = None
    error: str | None = None


class NotificationProvider(ABC):
    """Abstract interface for push notification providers."""

    @abstractmethod
    async def send(
        self,
        token: str,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> ProviderResult:
        """Send a push notification to the given device token."""
        ...
```

- [ ] **Step 2: Write fcm.py**

```python
import json
import logging

from firebase_admin import credentials, initialize_app, messaging

from app.notifications.exceptions import ProviderNotAvailable
from .base import NotificationProvider, ProviderResult

logger = logging.getLogger(__name__)


class FCMProvider(NotificationProvider):
    """Send push notifications via Firebase Cloud Messaging HTTP v1 API."""

    def __init__(self, service_account_info: dict):
        try:
            cred = credentials.Certificate(service_account_info)
            self._app = initialize_app(credential=cred)
            logger.info("FCM initialized (project=%s)", service_account_info.get("project_id"))
        except Exception as exc:
            logger.critical("FCM initialization failed: %s", exc)
            raise ProviderNotAvailable(f"FCM init failed: {exc}") from exc

    async def send(
        self,
        token: str,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> ProviderResult:
        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
                token=token,
            )
            response = messaging.send(message)
            return ProviderResult(success=True, provider_response=response)
        except messaging.UnregisteredError as exc:
            logger.warning("FCM token unregistered: %s", exc)
            return ProviderResult(success=False, error="NotRegistered")
        except messaging.InvalidArgumentError as exc:
            logger.warning("FCM invalid token: %s", exc)
            return ProviderResult(success=False, error="InvalidToken")
        except Exception as exc:
            logger.error("FCM send failed: %s", exc)
            return ProviderResult(success=False, error=str(exc))
```

- [ ] **Step 3: Write apns.py**

```python
"""APNs provider — placeholder for future iOS implementation.

To implement:
1. Add APNs key (p8 file) or certificate to env vars
2. Use h2 (HTTP/2) to call api.push.apple.com
3. Handle token expiry, feedback service
"""

from .base import NotificationProvider, ProviderResult


class APNsProvider(NotificationProvider):
    """Placeholder for Apple Push Notification service."""

    async def send(
        self,
        token: str,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> ProviderResult:
        raise NotImplementedError("APNs not yet implemented")
```

- [ ] **Step 4: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/providers/
git commit -m "feat: add NotificationProvider interface, FCM impl, APNs stub"
```

---

### Task 6: Backend — Create NotificationRepository

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/repository.py`

- [ ] **Step 1: Write the repository**

```python
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.notifications.models import Device, NotificationHistory
from app.notifications.schemas import DeviceRegisterRequest


class NotificationRepository:
    """Data access layer for devices and notification history."""

    def __init__(self, db: Session):
        self._db = db

    # -- Devices --

    def get_device_by_token(self, user_id: int, push_token: str) -> Device | None:
        return self._db.execute(
            select(Device).where(
                Device.user_id == user_id,
                Device.push_token == push_token,
            )
        ).scalar_one_or_none()

    def get_active_devices(self, user_id: int) -> list[Device]:
        return list(
            self._db.execute(
                select(Device).where(Device.user_id == user_id)
            ).scalars().all()
        )

    def upsert_device(self, user_id: int, req: DeviceRegisterRequest) -> Device:
        """Register or update device token. Upsert by (user_id, push_token)."""
        now = datetime.now(timezone.utc)
        device = self.get_device_by_token(user_id, req.push_token)

        if device:
            device.platform = req.platform
            device.device_name = req.device_name or device.device_name
            device.app_version = req.app_version or device.app_version
            device.last_seen = now
            device.updated_at = now
        else:
            device = Device(
                user_id=user_id,
                platform=req.platform,
                push_token=req.push_token,
                device_name=req.device_name,
                app_version=req.app_version,
                created_at=now,
                updated_at=now,
                last_seen=now,
            )
            self._db.add(device)

        self._db.commit()
        self._db.refresh(device)
        return device

    def delete_device(self, device_id: int) -> None:
        device = self._db.get(Device, device_id)
        if device:
            self._db.delete(device)
            self._db.commit()

    def delete_device_by_token(self, user_id: int, push_token: str) -> bool:
        device = self.get_device_by_token(user_id, push_token)
        if device:
            self._db.delete(device)
            self._db.commit()
            return True
        return False

    # -- Notification History --

    def save_history(
        self,
        user_id: int,
        title: str | None,
        body: str | None,
        data: dict | None,
        provider: str,
        status: str,
        provider_response: str | None = None,
        error: str | None = None,
    ) -> NotificationHistory:
        now = datetime.now(timezone.utc)
        record = NotificationHistory(
            user_id=user_id,
            title=title,
            body=body,
            data=data,
            provider=provider,
            status=status,
            provider_response=provider_response,
            error=error,
            created_at=now,
            sent_at=now if status == "sent" else None,
        )
        self._db.add(record)
        self._db.commit()
        self._db.refresh(record)
        return record
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/repository.py
git commit -m "feat: add NotificationRepository"
```

---

### Task 7: Backend — Create NotificationService

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/service.py`

- [ ] **Step 1: Write the service**

```python
import logging
from dataclasses import dataclass

from app.notifications.repository import NotificationRepository
from app.notifications.providers.base import NotificationProvider

logger = logging.getLogger(__name__)


@dataclass
class SendResult:
    total: int = 0
    sent: int = 0
    failed: int = 0


class NotificationService:
    """Orchestrates push notification delivery across providers.

    Usage:
        result = await notification_service.send_to_user(
            user_id=42,
            title="New Message",
            body="You have a new message",
            data={"screen": "chat", "chatId": "123"},
        )
    """

    def __init__(
        self,
        repository: NotificationRepository,
        providers: dict[str, NotificationProvider],
    ):
        self._repository = repository
        self._providers = providers

    async def send_to_user(
        self,
        user_id: int,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> SendResult:
        """Send notification to all active devices for a user.

        - Finds user's devices
        - Selects provider by platform
        - Sends via provider
        - Logs to notification_history
        - Deletes invalid/unregistered tokens
        """
        devices = self._repository.get_active_devices(user_id)
        if not devices:
            logger.info("No devices found for user %d", user_id)
            return SendResult()

        results: list[bool] = []

        for device in devices:
            provider = self._providers.get(device.platform)
            if provider is None:
                logger.warning("No provider for platform: %s", device.platform)
                continue

            result = await provider.send(
                token=device.push_token,
                title=title,
                body=body,
                data=data,
            )

            # Log to history
            self._repository.save_history(
                user_id=user_id,
                title=title,
                body=body,
                data=data,
                provider=device.platform,
                status="sent" if result.success else "failed",
                provider_response=result.provider_response,
                error=result.error,
            )

            # Delete invalid tokens
            if not result.success and result.error in {"NotRegistered", "InvalidToken"}:
                logger.info("Removing %s device %d for user %d", result.error, device.id, user_id)
                self._repository.delete_device(device.id)

            results.append(result.success)

        return SendResult(
            total=len(devices),
            sent=sum(1 for r in results if r),
            failed=sum(1 for r in results if not r),
        )
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/service.py
git commit -m "feat: add NotificationService orchestrator"
```

---

### Task 8: Backend — Create notification router

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/router.py`

- [ ] **Step 1: Write the router**

```python
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.notifications.repository import NotificationRepository
from app.notifications.schemas import (
    DeviceRegisterRequest,
    DeviceUnregisterRequest,
    DeviceResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/devices", tags=["Notifications"])


def _get_repo(db: Session = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)


@router.post("/register", response_model=DeviceResponse, status_code=201)
async def register_device(
    payload: DeviceRegisterRequest,
    repo: NotificationRepository = Depends(_get_repo),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    """Register or update a device push token for the current user."""
    device = repo.upsert_device(current_user.id, payload)
    logger.info("Device registered: user=%d platform=%s", current_user.id, payload.platform)
    return DeviceResponse.model_validate(device)


@router.post("/unregister", status_code=204)
async def unregister_device(
    payload: DeviceUnregisterRequest,
    repo: NotificationRepository = Depends(_get_repo),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a device push token."""
    deleted = repo.delete_device_by_token(current_user.id, payload.push_token)
    if deleted:
        logger.info("Device unregistered: user=%d", current_user.id)
    return None


@router.get("", response_model=list[DeviceResponse])
async def list_devices(
    repo: NotificationRepository = Depends(_get_repo),
    current_user: User = Depends(get_current_user),
) -> list[DeviceResponse]:
    """List all registered devices for the current user."""
    devices = repo.get_active_devices(current_user.id)
    return [DeviceResponse.model_validate(d) for d in devices]
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/router.py
git commit -m "feat: add notification API endpoints"
```

---

### Task 9: Backend — Wire FCMProvider + NotificationService + router into app

**Files:**
- Modify: `/Users/saif/Programming/Athlix/app/main.py`
- Modify: `/Users/saif/Programming/Athlix/app/api/v1/router.py`

- [ ] **Step 1: Initialize FCMProvider and NotificationService on startup in main.py**

Add imports at top of `/Users/saif/Programming/Athlix/app/main.py`:

```python
import json
from app.notifications.providers import FCMProvider
from app.notifications.service import NotificationService
from app.notifications.repository import NotificationRepository as NotifRepo
```

Add after `app.add_middleware(SlowAPIMiddleware)`:

```python
# -- Notification Service Initialization --
if settings.fcm_project_id and settings.fcm_private_key:
    try:
        service_account_info = {
            "type": "service_account",
            "project_id": settings.fcm_project_id,
            "private_key": settings.fcm_private_key,
            "client_email": settings.fcm_client_email,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        fcm_provider = FCMProvider(service_account_info)
        notification_service = NotificationService.__new__(NotificationService)
        notification_service._providers = {"android": fcm_provider}
        # Add to app state so endpoints can access it
        app.state.notification_service = notification_service
        logger = logging.getLogger(__name__)
        logger.info("Notification service initialized with FCM")
    except Exception as exc:
        logger = logging.getLogger(__name__)
        logger.warning("FCM not available: %s. Notifications disabled.", exc)
        app.state.notification_service = None
else:
    app.state.notification_service = None
```

- [ ] **Step 2: Include notifications router in app/api/v1/router.py**

Add import:

```python
from app.notifications import router as notifications_router
```

Add before `api_router.include_router(waitlist.router)`:

```python
api_router.include_router(
    notifications_router.router,
    dependencies=[Depends(get_current_user)],
)
```

- [ ] **Step 3: Verify imports don't break**

```bash
cd /Users/saif/Programming/Athlix
python -c "from app.main import app; print('OK')"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/main.py app/api/v1/router.py
git commit -m "feat: wire FCM provider, notification service, and router into app"
```

---

### Task 10: Backend — Add notification module __init__.py for router import

**Files:**
- Modify: `/Users/saif/Programming/Athlix/app/notifications/__init__.py`

- [ ] **Step 1: Update the package init with router export**

```python
"""Push notification module.

Provides provider-agnostic notification delivery via NotificationService.
"""

from .router import router
from .service import NotificationService

__all__ = ["router", "NotificationService"]
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix
git add app/notifications/__init__.py
git commit -m "chore: export router from notification package"
```

---

### Task 11: Mobile — Refactor notifications.ts to use getDevicePushTokenAsync

**Files:**
- Modify: `/Users/saif/Programming/Athelix_App/src/utils/notifications.ts`

- [ ] **Step 1: Rewrite notifications.ts**

```typescript
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Request OS notification permission. Shows system dialog on first call. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF5A36",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;
    if (existingStatus === "denied") return false;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status === "granted";
  } catch {
    return false;
  }
}

/** Get the raw platform push token (FCM on Android, APNs on iOS).
 *  Uses getDevicePushTokenAsync() for direct FCM/APNs tokens
 *  instead of Expo push tokens. */
export async function getDevicePushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

/** Register for push notifications: request permission + fetch raw device token. */
export async function registerForPushNotifications(): Promise<{
  granted: boolean;
  token: string | null;
}> {
  const granted = await requestNotificationPermission();
  if (!granted) return { granted: false, token: null };
  const token = await getDevicePushToken();
  return { granted: true, token };
}
```

- [ ] **Step 2: Run type check**

```bash
cd /Users/saif/Programming/Athelix_App
npx tsc --noEmit
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/saif/Programming/Athelix_App
npx jest --passWithNoTests
```

- [ ] **Step 4: Commit**

```bash
cd /Users/saif/Programming/Athelix_App
git add src/utils/notifications.ts
git commit -m "feat: switch to getDevicePushTokenAsync for raw FCM tokens"
```

---

### Task 12: Mobile — Create useNotificationRegistration hook

**Files:**
- Create: `/Users/saif/Programming/Athelix_App/src/hooks/useNotificationRegistration.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerForPushNotifications } from "../utils/notifications";
import { apiFetch } from "../api/client";

async function registerDeviceToken(token: string): Promise<void> {
  try {
    await apiFetch("/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: Platform.OS, // "android" or "ios"
        push_token: token,
        device_name: Platform.OS === "android" ? "Android" : "iOS",
        app_version: undefined, // Could read from Constants.expoConfig?.version
      }),
    });
  } catch {
    // Silently fail — token will be re-registered on next app launch
  }
}

async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await apiFetch("/devices/unregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ push_token: token }),
    });
  } catch {
    // Best-effort
  }
}

/**
 * Registers push notification permission + device token on mount.
 * Handles token refresh events from expo-notifications.
 */
export function useNotificationRegistration(): void {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { granted, token } = await registerForPushNotifications();
      if (!granted || !token || !mounted) return;

      tokenRef.current = token;
      await registerDeviceToken(token);
    }

    init();

    // Listen for token refresh (e.g., on app update)
    const sub = Notifications.addPushTokenListener(async (tokenData) => {
      const newToken = tokenData.data;
      if (newToken && newToken !== tokenRef.current) {
        if (tokenRef.current) {
          await unregisterDeviceToken(tokenRef.current);
        }
        tokenRef.current = newToken;
        await registerDeviceToken(newToken);
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
}
```

- [ ] **Step 2: Run type check**

```bash
cd /Users/saif/Programming/Athelix_App
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/saif/Programming/Athelix_App
git add src/hooks/useNotificationRegistration.ts
git commit -m "feat: add useNotificationRegistration hook for FCM token lifecycle"
```

---

### Task 13: Mobile — Create useNotificationTapHandler for deep linking

**Files:**
- Create: `/Users/saif/Programming/Athelix_App/src/hooks/useNotificationTapHandler.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Centralized notification tap handler.
 * Add new screen routes here as the app grows.
 */
function handleNavigation(
  data: Record<string, unknown>,
  navigation: NavigationProp,
): void {
  const screen = data.screen as string | undefined;
  if (!screen) return;

  switch (screen) {
    case "session": {
      const sessionId = data.sessionId as string | undefined;
      if (sessionId) navigation.navigate("SessionDetail", { id: sessionId });
      break;
    }
    case "template": {
      const templateId = data.templateId as string | undefined;
      if (templateId) navigation.navigate("TemplateBuilder", { id: templateId });
      break;
    }
    case "workout": {
      const templateId = data.templateId as string | undefined;
      if (templateId) navigation.navigate("StartWorkout", { id: templateId });
      break;
    }
    case "mesocycle": {
      const mesocycleId = data.mesocycleId as string | undefined;
      if (mesocycleId) navigation.navigate("MesocycleDetail", { id: mesocycleId });
      break;
    }
    default:
      // Unknown screen — just open the app to its default state
      break;
  }
}

/**
 * Listens for notification taps (foreground, background, killed state)
 * and navigates to the appropriate screen based on deep link data.
 */
export function useNotificationTapHandler(): void {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // Handle tap while app is in foreground
    const foregroundSub = Notifications.addNotificationReceivedListener((event) => {
      // Optionally show in-app UI for foreground notifications
      const data = event.request.content.data as Record<string, unknown>;
      if (data?.screen) {
        handleNavigation(data, navigation);
      }
    });

    // Handle tap from background/killed state
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNavigation(data, navigation);
      },
    );

    // Check if app was opened from a notification (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNavigation(data, navigation);
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [navigation]);
}
```

- [ ] **Step 2: Run type check**

```bash
cd /Users/saif/Programming/Athelix_App
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/saif/Programming/Athelix_App
git add src/hooks/useNotificationTapHandler.ts
git commit -m "feat: add useNotificationTapHandler for deep link navigation"
```

---

### Task 14: Mobile — Wire hooks into App.tsx

**Files:**
- Modify: `/Users/saif/Programming/Athelix_App/App.tsx`

- [ ] **Step 1: Add imports and hooks to App.tsx**

Add import after line 17 (`import { configureNotificationHandler } from "./src/utils/notifications";`):

```typescript
import { useNotificationRegistration } from "./src/hooks/useNotificationRegistration";
```

Inside `function App()` before the return statement, add:

```typescript
useNotificationRegistration();
```

- [ ] **Step 2: Wire tap handler in AppContent.tsx**

Read `/Users/saif/Programming/Athelix_App/src/navigation/AppContent.tsx` first, then add:

```typescript
import { useNotificationTapHandler } from "../hooks/useNotificationTapHandler";
```

Inside the component body:

```typescript
useNotificationTapHandler();
```

- [ ] **Step 3: Run type check + tests**

```bash
cd /Users/saif/Programming/Athelix_App
npx tsc --noEmit
npx jest --passWithNoTests
```

- [ ] **Step 4: Commit**

```bash
cd /Users/saif/Programming/Athelix_App
git add App.tsx src/navigation/AppContent.tsx
git commit -m "feat: wire notification hooks into app entry"
```

---

### Task 15: Verify end-to-end

- [ ] **Step 1: Start backend and verify FCM initialization**

```bash
cd /Users/saif/Programming/Athlix
uv run python app/main.py
```

Check logs for: `FCM initialized (project=athelix-6c1e9)`

- [ ] **Step 2: Test register endpoint**

```bash
# Get a Clerk test token first, then:
curl -X POST http://localhost:8050/devices/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"platform": "android", "push_token": "test-token-123", "device_name": "Test Pixel"}'
```

Expected: `201 Created` with device JSON

- [ ] **Step 3: Test list devices**

```bash
curl http://localhost:8050/devices \
  -H "Authorization: Bearer <token>"
```

Expected: `200 OK` with array of devices

- [ ] **Step 4: Test unregister**

```bash
curl -X POST http://localhost:8050/devices/unregister \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"push_token": "test-token-123"}'
```

Expected: `204 No Content`

- [ ] **Step 5: Commit all remaining work**

```bash
cd /Users/saif/Programming/Athlix
git add -A
git commit -m "feat: complete push notification system"

cd /Users/saif/Programming/Athelix_App
git add -A
git commit -m "feat: complete push notification mobile integration"
```
