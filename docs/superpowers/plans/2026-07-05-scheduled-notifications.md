# Scheduled Personalized Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver personalized push notifications (morning motivation, inactivity nudges, milestones) via 30-min cron polling with timezone-aware scheduling.

**Architecture:** APScheduler (AsyncIOScheduler) in-process. SQLAlchemyJobStore backed by PostgreSQL. Three job functions poll every 30 minutes, query eligible users from `user_notification_settings`, generate personalized content, send via existing `NotificationService.send_to_user()`.

**Tech Stack:** APScheduler + SQLAlchemy + PostgreSQL (backend). Existing NotificationService.

---

## File Structure

### New files:
- `app/notifications/scheduler.py` — APScheduler setup + 3 job functions + content templates

### Modified files:
- `app/notifications/models.py` — add `UserNotificationSettings` model
- `app/notifications/schemas.py` — add settings schemas
- `app/notifications/repository.py` — add settings CRUD methods
- `app/notifications/router.py` — add settings endpoints
- `app/notifications/service.py` — add `NotificationService.send_raw()` helper (no device lookup, direct send)
- `app/main.py` — init APScheduler on startup, graceful shutdown
- `pyproject.toml` — add `apscheduler>=3.11.0`
- `app/models/__init__.py` — import notification models

### Migration:
- `alembic/versions/` — auto-generated migration for `user_notification_settings`

---

### Task 1: Backend — Add apscheduler dep + UserNotificationSettings model + migration

**Files:**
- Modify: `/Users/saif/Programming/Athlix/pyproject.toml`
- Modify: `/Users/saif/Programming/Athlix/app/notifications/models.py`
- Modify: `/Users/saif/Programming/Athlix/app/models/__init__.py`
- Create: `/Users/saif/Programming/Athlix/alembic/versions/` (auto-generated migration)

- [ ] **Step 1: Add apscheduler to pyproject.toml**

Edit line after `"firebase-admin>=6.6.0",`:
```toml
    "apscheduler>=3.11.0",
```

Then:
```bash
cd /Users/saif/Programming/Athlix && uv sync 2>&1 | tail -5
```

- [ ] **Step 2: Add UserNotificationSettings model to app/notifications/models.py**

Append at end of `/Users/saif/Programming/Athlix/app/notifications/models.py`:

```python
class UserNotificationSettings(Base):
    __tablename__ = "user_notification_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    # Toggles
    morning_motivation_enabled: Mapped[bool] = mapped_column(default=False)
    inactivity_nudge_enabled: Mapped[bool] = mapped_column(default=False)
    milestone_enabled: Mapped[bool] = mapped_column(default=False)
    # Schedule
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    preferred_send_hour: Mapped[int] = mapped_column(default=8)  # 0-23
    inactivity_threshold_hours: Mapped[int] = mapped_column(default=72)
    # Detection
    detected_timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    typical_workout_hour: Mapped[int | None] = mapped_column(nullable=True)
    typical_workout_days: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Milestone tracking
    last_milestone_workout_count: Mapped[int] = mapped_column(default=0)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User")
```

- [ ] **Step 3: Ensure model is imported for Alembic autogenerate**

File `/Users/saif/Programming/Athlix/app/models/__init__.py` already imports from `app.notifications.models`. The new model will be auto-discovered via `alembic/env.py` which has `import app.notifications.models`.

- [ ] **Step 4: Generate migration + apply**

```bash
cd /Users/saif/Programming/Athlix && alembic revision --autogenerate -m "add user_notification_settings table" 2>&1
cd /Users/saif/Programming/Athlix && alembic upgrade head 2>&1
```

- [ ] **Step 5: Commit**

```bash
cd /Users/saif/Programming/Athlix && git add pyproject.toml uv.lock app/notifications/models.py alembic/versions/ && git commit -m "feat: add apscheduler dep and UserNotificationSettings model + migration"
```

---

### Task 2: Backend — Add notification settings schemas

**Files:**
- Modify: `/Users/saif/Programming/Athlix/app/notifications/schemas.py`

- [ ] **Step 1: Add settings schemas**

Append at end of `/Users/saif/Programming/Athlix/app/notifications/schemas.py`:

```python
class NotificationSettingsResponse(BaseSchema):
    morning_motivation_enabled: bool
    inactivity_nudge_enabled: bool
    milestone_enabled: bool
    timezone: str
    preferred_send_hour: int
    inactivity_threshold_hours: int
    detected_timezone: str | None = None
    typical_workout_hour: int | None = None
    typical_workout_days: list[int] | None = None
    last_milestone_workout_count: int
    created_at: datetime
    updated_at: datetime


class NotificationSettingsUpdate(BaseSchema):
    morning_motivation_enabled: bool | None = None
    inactivity_nudge_enabled: bool | None = None
    milestone_enabled: bool | None = None
    timezone: str | None = None
    preferred_send_hour: int | None = None
    inactivity_threshold_hours: int | None = None


class NotificationSettingsDetectRequest(BaseSchema):
    timezone: str  # IANA timezone string from device
    typical_workout_hour: int | None = None
    typical_workout_days: list[int] | None = None
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix && git add app/notifications/schemas.py && git commit -m "feat: add notification settings schemas"
```

---

### Task 3: Backend — Add settings CRUD to repository

**Files:**
- Modify: `/Users/saif/Programming/Athlix/app/notifications/repository.py`

- [ ] **Step 1: Add settings methods**

Append at end of `/Users/saif/Programming/Athlix/app/notifications/repository.py` (before file end):

```python
    # -- Notification Settings --

    def get_settings(self, user_id: int) -> UserNotificationSettings | None:
        return self._db.execute(
            select(UserNotificationSettings).where(
                UserNotificationSettings.user_id == user_id
            )
        ).scalar_one_or_none()

    def upsert_settings(
        self,
        user_id: int,
        updates: dict,
    ) -> UserNotificationSettings:
        settings = self.get_settings(user_id)
        now = datetime.now(timezone.utc)

        if settings:
            for key, value in updates.items():
                if value is not None:
                    setattr(settings, key, value)
            settings.updated_at = now
        else:
            settings = UserNotificationSettings(
                user_id=user_id,
                **{k: v for k, v in updates.items() if v is not None},
                created_at=now,
                updated_at=now,
            )
            self._db.add(settings)

        self._db.commit()
        self._db.refresh(settings)
        return settings

    def get_eligible_for_motivation(self, current_hour: int) -> list[tuple[int, str, str | None]]:
        """Return (user_id, timezone, primary_goal) for users whose preferred hour matches."""
        from sqlalchemy.orm import joinedload
        from app.models.user import User
        from app.models.user import UserProfile

        rows = self._db.execute(
            select(UserNotificationSettings, UserProfile.primary_goal)
            .join(User, UserNotificationSettings.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
            .where(
                UserNotificationSettings.morning_motivation_enabled == True,
                UserNotificationSettings.preferred_send_hour == current_hour,
            )
        ).all()

        return [
            (r[0].user_id, r[0].timezone, r[1])
            for r in rows
        ]

    def get_eligible_for_inactivity_nudge(
        self, threshold_hours: int
    ) -> list[tuple[int, str, str | None, int]]:
        """Return (user_id, timezone, last_workout_name, days_since)."""
        from app.models.workout import WorkoutSession

        cutoff = datetime.now(timezone.utc) - timedelta(hours=threshold_hours)
        subq = (
            select(
                WorkoutSession.user_id,
                WorkoutSession.name,
                WorkoutSession.started_at,
            )
            .where(WorkoutSession.is_completed == True)
            .order_by(WorkoutSession.user_id, WorkoutSession.started_at.desc())
            .distinct(WorkoutSession.user_id)
            .subquery()
        )

        rows = self._db.execute(
            select(UserNotificationSettings, subq.c.name, subq.c.started_at)
            .outerjoin(
                subq,
                UserNotificationSettings.user_id == subq.c.user_id,
            )
            .where(
                UserNotificationSettings.inactivity_nudge_enabled == True,
                (
                    (subq.c.started_at == None)
                    | (subq.c.started_at < cutoff)
                ),
            )
        ).all()

        results = []
        for r in rows:
            last_name = r[1]
            last_date = r[2]
            days_since = (
                (datetime.now(timezone.utc) - last_date).days
                if last_date
                else 999
            )
            results.append((r[0].user_id, r[0].timezone, last_name, days_since))

        return results

    def get_eligible_for_milestone(self) -> list[tuple[int, str, int]]:
        """Return (user_id, timezone, workout_count)."""
        from sqlalchemy import func as f
        from app.models.workout import WorkoutSession

        workout_counts = (
            select(
                WorkoutSession.user_id,
                f.count(WorkoutSession.id).label("cnt"),
            )
            .where(WorkoutSession.is_completed == True)
            .group_by(WorkoutSession.user_id)
            .subquery()
        )

        MILESTONES = [10, 25, 50, 100, 250, 500, 1000]

        rows = self._db.execute(
            select(UserNotificationSettings, workout_counts.c.cnt)
            .join(
                workout_counts,
                UserNotificationSettings.user_id == workout_counts.c.user_id,
            )
            .where(
                UserNotificationSettings.milestone_enabled == True,
            )
        ).all()

        results = []
        for r in rows:
            count = r[1]
            last_sent = r[0].last_milestone_workout_count
            for m in MILESTONES:
                if count >= m > last_sent:
                    results.append((r[0].user_id, r[0].timezone, count))
                    break

        return results

    def update_milestone_sent(self, user_id: int, count: int) -> None:
        settings = self.get_settings(user_id)
        if settings:
            settings.last_milestone_workout_count = count
            settings.updated_at = datetime.now(timezone.utc)
            self._db.commit()
```

Also need to add the imports at the top:
```python
from datetime import datetime, timezone, timedelta
from app.notifications.models import Device, NotificationHistory, UserNotificationSettings
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix && git add app/notifications/repository.py && git commit -m "feat: add notification settings CRUD + eligibility queries to repository"
```

---

### Task 4: Backend — Create scheduler module with content generation + job functions

**Files:**
- Create: `/Users/saif/Programming/Athlix/app/notifications/scheduler.py`

- [ ] **Step 1: Write the scheduler module**

```python
"""APScheduler-based notification scheduler.

Runs three job functions every 30 minutes:
- check_morning_motivations
- check_inactivity_nudges
- check_milestones

Uses SQLAlchemyJobStore for persistent job storage in PostgreSQL.
"""

import logging
import random
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.triggers.interval import IntervalTrigger

from app.core.database import SessionLocal
from app.notifications.repository import NotificationRepository
from app.notifications.service import NotificationService

logger = logging.getLogger(__name__)

# ── Content Templates ──────────────────────────────────────────────

MOTIVATION_TEMPLATES: dict[str, list[str]] = {
    "strength": [
        "{name}, time to add plates! Today's focus: progressive overload.",
        "Strength gains don't happen by accident. Let's lift, {name}!",
        "Every rep adds a pound. Keep pushing, {name}!",
    ],
    "hypertrophy": [
        "{name}, muscle grows in the kitchen and the gym. Let's get that pump!",
        "Volume + consistency = results. You've got this, {name}!",
        "Time to tear some muscle fibers, {name}. Growth happens outside your comfort zone.",
    ],
    "weight_loss": [
        "{name}, every workout burns calories. Stay consistent!",
        "Fat loss is a marathon, not a sprint. Keep showing up, {name}!",
        "One workout won't change your body — but 100 will. Keep stacking, {name}!",
    ],
    "endurance": [
        "{name}, your cardio capacity builds one session at a time. Let's go!",
        "Endurance is built on days you don't feel like it. Today's one of those, {name}!",
        "Your heart thanks you for every session. Keep it pumping, {name}!",
    ],
    "maintenance": [
        "Stay sharp, {name}! Maintenance is still progress.",
        "Consistency > intensity. Keep the habit alive, {name}!",
        "You're already winning by showing up, {name}. Don't stop now.",
    ],
}

FALLBACK_MOTIVATION = [
    "Ready to crush today's workout, {name}? Let's go!",
    "Your future self will thank you for today's workout, {name}!",
    "Consistency compounds. Keep showing up, {name}!",
]

MILESTONE_LABELS: dict[int, str] = {
    10: "double digits",
    25: "a quarter century",
    50: "half a hundred",
    100: "triple digits",
    250: "a quarter grand",
    500: "five hundred!",
    1000: "legendary",
}


def _get_name(user_id: int) -> str:
    """Fetch user's first name or username for personalization."""
    from app.models.user import User
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if user:
            return user.first_name or user.username or "Athlete"
        return "Athlete"
    finally:
        db.close()


def _check_recently_sent(user_id: int, notif_type: str, hours: int = 24) -> bool:
    """Check if this notification type was sent to user within last N hours."""
    from sqlalchemy import select, and_
    from app.notifications.models import NotificationHistory
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None)
        # Approximate by checking if any notification with matching title pattern exists
        result = db.execute(
            select(NotificationHistory.id)
            .where(
                and_(
                    NotificationHistory.user_id == user_id,
                    NotificationHistory.title.like(f"%{notif_type}%"),
                    NotificationHistory.created_at >= cutoff,
                )
            )
            .limit(1)
        ).first()
        return result is not None
    finally:
        db.close()


# ── Job Functions ──────────────────────────────────────────────────

async def check_morning_motivations(notification_service: NotificationService | None):
    """Send morning motivation to users whose preferred hour matches current UTC hour
    in their local timezone."""
    if notification_service is None:
        logger.warning("Notification service not available, skipping morning motivation")
        return

    db = SessionLocal()
    try:
        repo = NotificationRepository(db)

        # Check all timezones — we query all eligible and check if current UTC hour
        # maps to their preferred_send_hour in their timezone
        import pytz

        settings_list = repo.get_settings_all_enabled("morning_motivation")
        utc_now = datetime.now(pytz.UTC)

        for settings in settings_list:
            try:
                tz = pytz.timezone(settings.timezone)
                local_hour = utc_now.astimezone(tz).hour
            except Exception:
                local_hour = utc_now.hour  # fallback to UTC

            if local_hour != settings.preferred_send_hour:
                continue

            if _check_recently_sent(settings.user_id, "morning_motivation"):
                continue

            name = _get_name(settings.user_id)
            templates = MOTIVATION_TEMPLATES.get(
                getattr(settings, "_primary_goal", None) or "",
                FALLBACK_MOTIVATION,
            )
            message = random.choice(templates).format(name=name)

            await notification_service.send_to_user(
                user_id=settings.user_id,
                title="☀️ Morning Motivation",
                body=message,
                data={"screen": "home"},
            )
            logger.info("Morning motivation sent to user %d", settings.user_id)

    except Exception as exc:
        logger.error("Morning motivation check failed: %s", exc)
    finally:
        db.close()


async def check_inactivity_nudges(notification_service: NotificationService | None):
    """Send inactivity nudges to users who haven't worked out past their threshold."""
    if notification_service is None:
        return

    db = SessionLocal()
    try:
        repo = NotificationRepository(db)
        eligible = repo.get_eligible_for_inactivity_nudge(threshold_hours=72)

        for user_id, tz_name, last_workout_name, days_since in eligible:
            if _check_recently_sent(user_id, "inactivity"):
                continue

            name = _get_name(user_id)
            if last_workout_name:
                body = (
                    f"Hey {name}, it's been {days_since} days since "
                    f"your {last_workout_name}. "
                    "Even a quick session keeps the streak alive!"
                )
            else:
                body = (
                    f"Hey {name}, it's been a while since your last workout. "
                    "Ready to get back at it?"
                )

            await notification_service.send_to_user(
                user_id=user_id,
                title="🏋️ Don't Lose Your Streak",
                body=body,
                data={"screen": "home"},
            )
            logger.info("Inactivity nudge sent to user %d", user_id)

    except Exception as exc:
        logger.error("Inactivity nudge check failed: %s", exc)
    finally:
        db.close()


async def check_milestones(notification_service: NotificationService | None):
    """Send milestone celebrations to users who hit new workout count thresholds."""
    if notification_service is None:
        return

    db = SessionLocal()
    try:
        repo = NotificationRepository(db)
        eligible = repo.get_eligible_for_milestone()

        for user_id, tz_name, count in eligible:
            if _check_recently_sent(user_id, "milestone", hours=48):
                continue

            name = _get_name(user_id)
            milestone_label = MILESTONE_LABELS.get(count, f"{count} workouts")
            body = (
                f"🎉 {name} just completed {count} workouts! "
                f"That's {milestone_label}. Incredible consistency!"
            )

            await notification_service.send_to_user(
                user_id=user_id,
                title="🏆 Milestone Unlocked",
                body=body,
                data={"screen": "progress"},
            )

            # Update milestone tracking
            repo.update_milestone_sent(user_id, count)
            logger.info("Milestone (%d) sent to user %d", count, user_id)

    except Exception as exc:
        logger.error("Milestone check failed: %s", exc)
    finally:
        db.close()


# ── Scheduler Setup ────────────────────────────────────────────────

def create_scheduler(database_url: str) -> AsyncIOScheduler:
    """Create and configure the APScheduler instance.

    Uses SQLAlchemyJobStore backed by PostgreSQL for persistent job storage.
    """
    jobstore = SQLAlchemyJobStore(url=database_url)
    scheduler = AsyncIOScheduler(
        jobstores={"default": jobstore},
        timezone="UTC",
        job_defaults={
            "coalesce": True,       # Combine missed runs into one
            "max_instances": 1,     # Don't overlap runs
            "misfire_grace_time": 600,  # 10 min grace
        },
    )
    return scheduler


def register_jobs(scheduler: AsyncIOScheduler, notification_service: NotificationService | None):
    """Register the three notification job functions."""
    from functools import partial

    scheduler.add_job(
        partial(check_morning_motivations, notification_service),
        trigger=IntervalTrigger(minutes=30),
        id="check_morning_motivations",
        name="Check and send morning motivation notifications",
        replace_existing=True,
    )

    scheduler.add_job(
        partial(check_inactivity_nudges, notification_service),
        trigger=IntervalTrigger(minutes=30),
        id="check_inactivity_nudges",
        name="Check and send inactivity nudge notifications",
        replace_existing=True,
    )

    scheduler.add_job(
        partial(check_milestones, notification_service),
        trigger=IntervalTrigger(minutes=30),
        id="check_milestones",
        name="Check and send milestone celebration notifications",
        replace_existing=True,
    )

    logger.info("Registered 3 notification scheduler jobs (30-min interval)")
```

- [ ] **Step 2: Commit**

```bash
cd /Users/saif/Programming/Athlix && git add app/notifications/scheduler.py && git commit -m "feat: add notification scheduler with 3 job functions + content templates"
```

---

### Task 5: Backend — Add settings endpoints

**Files:**
- Modify: `/Users/saif/Programming/Athlix/app/notifications/router.py`
- Note: Need to add `get_settings_all_enabled` to repository first

- [ ] **Step 1: Add get_settings_all_enabled to repository**

Add to `/Users/saif/Programming/Athlix/app/notifications/repository.py`:

```python
    def get_settings_all_enabled(self, notif_type: str) -> list[UserNotificationSettings]:
        """Get all settings records with a specific notification type enabled.
        
        notif_type: 'morning_motivation', 'inactivity_nudge', or 'milestone'
        """
        column_map = {
            "morning_motivation": UserNotificationSettings.morning_motivation_enabled,
            "inactivity_nudge": UserNotificationSettings.inactivity_nudge_enabled,
            "milestone": UserNotificationSettings.milestone_enabled,
        }
        col = column_map.get(notif_type)
        if col is None:
            return []
        return list(
            self._db.execute(
                select(UserNotificationSettings).where(col == True)
            ).scalars().all()
        )
```

- [ ] **Step 2: Add settings endpoints to router.py**

Add imports at top:
```python
from app.notifications.schemas import (
    DeviceRegisterRequest,
    DeviceUnregisterRequest,
    DeviceResponse,
    NotificationSettingsResponse,
    NotificationSettingsUpdate,
    NotificationSettingsDetectRequest,
)
```

Add settings endpoints after existing device endpoints, before the `_get_repo` function (or after router definition):

```python
@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    repo: NotificationRepository = Depends(_get_repo),
    current_user: User = Depends(get_current_user),
) -> NotificationSettingsResponse:
    """Get current user's notification settings."""
    settings = repo.get_settings(current_user.id)
    if settings is None:
        # Return defaults
        return NotificationSettingsResponse(
            morning_motivation_enabled=False,
            inactivity_nudge_enabled=False,
            milestone_enabled=False,
            timezone="UTC",
            preferred_send_hour=8,
            inactivity_threshold_hours=72,
            last_milestone_workout_count=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
    return NotificationSettingsResponse.model_validate(settings)


@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    payload: NotificationSettingsUpdate,
    repo: NotificationRepository = Depends(_get_repo),
    current_user: User = Depends(get_current_user),
) -> NotificationSettingsResponse:
    """Update notification settings."""
    updates = payload.model_dump(exclude_none=True)
    settings = repo.upsert_settings(current_user.id, updates)
    return NotificationSettingsResponse.model_validate(settings)


@router.post("/settings/detect", response_model=NotificationSettingsResponse)
async def detect_notification_settings(
    payload: NotificationSettingsDetectRequest,
    repo: NotificationRepository = Depends(_get_repo),
    current_user: User = Depends(get_current_user),
) -> NotificationSettingsResponse:
    """Submit detected timezone/workout patterns from mobile device."""
    updates = payload.model_dump()
    settings = repo.upsert_settings(current_user.id, updates)
    return NotificationSettingsResponse.model_validate(settings)
```

Add the `datetime` import at top of router.py:
```python
from datetime import datetime, timezone
```

- [ ] **Step 3: Commit**

```bash
cd /Users/saif/Programming/Athlix && git add app/notifications/repository.py app/notifications/router.py && git commit -m "feat: add notification settings API endpoints + eligibility queries"
```

---

### Task 6: Backend — Wire APScheduler into main.py + fix NotificationService init

**Files:**
- Modify: `/Users/saif/Programming/Athlix/app/main.py`

- [ ] **Step 1: Fix NotificationService initialization and add scheduler**

Replace the notification service init block in `/Users/saif/Programming/Athlix/app/main.py` (the block after `app.add_middleware(SlowAPIMiddleware)`) with:

```python
# -- Notification Service Initialization --
notification_service: NotificationService | None = None
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
        notification_service = NotificationService(
            repository=NotifRepo(SessionLocal()),
            providers={"android": fcm_provider},
        )
        app.state.notification_service = notification_service
        logger.info("Notification service initialized with FCM")
    except Exception as exc:
        logger.warning("FCM not available: %s. Notifications disabled.", exc)
        app.state.notification_service = None
else:
    app.state.notification_service = None
```

Add scheduler-related imports at top:
```python
from app.notifications.scheduler import create_scheduler, register_jobs
```

Add after `app.state.limiter = limiter` and `app.add_middleware(SlowAPIMiddleware)` block (after the notification service init):

```python
# -- APScheduler Setup --
scheduler = create_scheduler(settings.database_url)
```

Replace the existing `@app.on_event("startup")` with:

```python
@app.on_event("startup")
async def startup():
    # Warm exercise cache
    try:
        db = SessionLocal()
        ExerciseCache.load(db)
    except Exception:
        pass
    finally:
        db.close()

    # Start notification scheduler
    if notification_service is not None:
        register_jobs(scheduler, notification_service)
        scheduler.start()
        logger.info("Notification scheduler started")
    else:
        logger.warning("Notification scheduler not started (no FCM)")
```

Add shutdown handler:

```python
@app.on_event("shutdown")
async def shutdown():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Notification scheduler shut down")
```

- [ ] **Step 2: Verify imports**

```bash
cd /Users/saif/Programming/Athlix && uv run python -c "from app.main import app; print('OK')" 2>&1
```

- [ ] **Step 3: Commit**

```bash
cd /Users/saif/Programming/Athlix && git add app/main.py && git commit -m "feat: wire APScheduler into app lifecycle + fix NotificationService init"
```

---

### Task 7: Verify end-to-end

- [ ] **Step 1: Check all imports**

```bash
cd /Users/saif/Programming/Athlix && uv run python -c "
from app.main import app
from app.notifications.scheduler import create_scheduler, register_jobs, check_morning_motivations, check_inactivity_nudges, check_milestones
from app.notifications.models import UserNotificationSettings
from app.notifications.schemas import NotificationSettingsResponse, NotificationSettingsUpdate, NotificationSettingsDetectRequest
print('All imports OK')
" 2>&1
```

- [ ] **Step 2: Verify alembic migration**

```bash
cd /Users/saif/Programming/Athlix && uv run alembic current 2>&1
```

Should show head with the new migration.

- [ ] **Step 3: Verify routes registered**

```bash
cd /Users/saif/Programming/Athlix && uv run python -c "
from app.main import app
routes = [(r.path, r.methods) for r in app.routes if 'setting' in r.path.lower() or 'detect' in r.path.lower()]
print('Settings routes:', routes)
" 2>&1
```

Should show:
```
Settings routes: [('/devices/settings', {'GET'}), ('/devices/settings', {'PUT'}), ('/devices/settings/detect', {'POST'})]
```

- [ ] **Step 4: Commit any remaining**

```bash
cd /Users/saif/Programming/Athlix && git add -A && git commit -m "chore: finalize scheduled notification system"
```
