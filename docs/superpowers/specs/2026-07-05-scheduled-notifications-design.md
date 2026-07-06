# Scheduled Personalized Push Notifications — Design Spec

**Goal:** Deliver meaningful, personalized push notifications to users at appropriate times, using cron-style scheduling, user timezone awareness, and content generation.

**Architecture:** APScheduler (AsyncIOScheduler) inside the existing uvicorn process polls every 30 minutes. Job functions query eligible users via new `user_notification_settings` table, generate personalized content, and send via existing `NotificationService.send_to_user()`.

**Opt-in model:** All notification types default OFF. Users must explicitly enable via settings endpoint. Users with no settings record are skipped entirely.

---

## Notification Types

| Type | Trigger | Content Pattern | Per-User |
|---|---|---|---|
| Morning Motivation | User's `preferred_send_hour` in their timezone | Goal-based motivational message | `{name}` + `{goal}` + workout tip |
| Inactivity Nudge | No workout session started in > N hours (default 72) | Gentle re-engagement with last workout name | `{name}` + `{last_workout}` + `{days_since}` |
| Milestone | First of month, checks workout count | Achievement at 10/25/50/100/250/500/1000 | `{name}` + `{count}` + `{milestone}` |

---

## Data Model

### New: `user_notification_settings`

Stored in `app_schema.user_notification_settings`.

```python
id: int PK
user_id: int FK → users.id (unique)

# Toggles (opt-in, default False)
morning_motivation_enabled: bool = False
inactivity_nudge_enabled: bool = False
milestone_enabled: bool = False

# Schedule
timezone: str = "UTC"                    # IANA timezone
preferred_send_hour: int = 8             # 0-23 local time for morning motivation
inactivity_threshold_hours: int = 72     # hours before inactivity nudge

# Detection (populated by mobile or computed)
detected_timezone: str | None = None
typical_workout_hour: int | None = None
typical_workout_days: list[int] | None = None  # JSON, 0=Mon..6=Sun

# Milestone tracking
last_milestone_workout_count: int = 0   # highest milestone sent so far

created_at, updated_at: datetime
```

### Modified: `workout_sessions`

No schema changes. Use existing `started_at` + `is_completed` for activity checks.

---

## Scheduler Architecture

```
AsyncIOScheduler (in-process, persistent job store in PostgreSQL)
│
├── check_morning_motivations()  — every 30 min
│   └── Query: user_notification_settings WHERE morning_motivation_enabled AND timezone's hour == preferred_send_hour
│   └── Content: personalized goal-based message
│   └── Send: NotificationService.send_to_user()
│
├── check_inactivity_nudges()    — every 30 min  
│   └── Query: settings WHERE inactivity_nudge_enabled AND last session > threshold ago
│   └── Content: "{name}, it's been {days} days since your {last_workout}. Ready to get back?"
│   └── Send: NotificationService.send_to_user()
│
└── check_milestones()           — every 30 min
    └── Query: settings WHERE milestone_enabled AND workout count >= next milestone > last_milestone_workout_count
    └── Content: "{name} just hit {milestone} workouts! 🎉"
    └── Send: NotificationService.send_to_user()
    └── Update: last_milestone_workout_count
```

**APScheduler job store:** SQLAlchemyJobStore targeting PostgreSQL. Jobs survive restarts. Only one worker fires jobs (no duplication) because APScheduler uses `pg_try_advisory_lock` internally when configured correctly.

**Cooldown:** Each notification type checks `notification_history` to avoid duplicate sends within the last 24 hours for the same user+type.

---

## Content Generation

### Morning Motivation (by goal)

```python
MOTIVATION_TEMPLATES = {
    "strength": [
        "{name}, time to add plates! Today's focus: progressive overload.",
        "Strength gains don't happen by accident. Let's lift, {name}!",
    ],
    "hypertrophy": [
        "{name}, muscle grows in the kitchen and the gym. Let's get that pump!",
        "Volume + consistency = results. You've got this, {name}!",
    ],
    "weight_loss": [
        "{name}, every workout burns calories. Stay consistent!",
        "Fat loss is a marathon, not a sprint. Keep showing up, {name}!",
    ],
    "endurance": [
        "{name}, your cardio capacity builds one session at a time. Let's go!",
        "Endurance is built on days you don't feel like it. Today's one of those, {name}!",
    ],
    "maintenance": [
        "Stay sharp, {name}! Maintenance is still progress.",
        "Consistency > intensity. Keep the habit alive, {name}!",
    ],
}
```

### Inactivity Nudge

Template: `"Hey {name}, it's been {days} days since your {last_workout_name}. Even a quick session keeps the streak alive!"`

### Milestone

Template: `"🎉 {name} just completed {count} workouts! That's {milestone_label}. Incredible consistency!"`

Milestone labels: 10 = "double digits", 25 = "a quarter century", 50 = "half a hundred", 100 = "triple digits", 250 = "a quarter grand", 500 = "five hundred!", 1000 = "legendary"

---

## New API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /notifications/settings | JWT | Get current user's notification settings |
| PUT | /notifications/settings | JWT | Update notification settings |
| POST | /notifications/settings/detect | JWT | Submit detected timezone from mobile device |

## Files to Create/Modify

### Backend
- Create: `app/notifications/models.py` — add UserNotificationSettings model (or new file?)
- Create: `app/notifications/scheduler.py` — APScheduler setup + job functions + content generation
- Modify: `app/notifications/schemas.py` — add settings schemas + detect request
- Modify: `app/notifications/repository.py` — add settings CRUD
- Modify: `app/notifications/router.py` — add settings endpoints
- Modify: `app/notifications/__init__.py` — export scheduler, update router exports
- Modify: `app/main.py` — init APScheduler on startup, shutdown on exit
- Modify: `pyproject.toml` — add `apscheduler`
- Migration: new migration for `user_notification_settings` table

## Non-Goals
- No mobile notification settings screen (Phase 2)
- No APNs provider work
- No change to existing device registration flow
- No email/SMS notifications
- No analytics on notification delivery
