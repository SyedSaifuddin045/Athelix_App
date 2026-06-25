# Feedback Board — Design Spec

**Date:** 2026-06-12
**Status:** Draft

## Overview

A Canny-style feedback board for the Athelix fitness app. Users can submit feature requests (public, upvotable), bug reports (private), and app reviews (private). The board is a standalone Next.js web portal that talks to the existing FastAPI backend.

---

## Architecture

```
User's browser
    │
    ▼
Next.js Feedback Portal (feedback.athelix.fit)
    │  Clerk auth (same Clerk app)
    │  @tanstack/react-query
    │  Tailwind CSS dark theme
    │  lucide-react icons
    │
    ▼
FastAPI Backend (api.athelix.fit)
    │  Clerk JWKS token verification
    │  SQLAlchemy + PostgreSQL
    │  New /feedback endpoints
```

**Three layers:**
1. **PostgreSQL** — Existing database, new tables in `app_schema` schema
2. **FastAPI** — New models, schemas, endpoints, and admin dependency
3. **Next.js** — Standalone web app with Clerk auth and React Query

---

## Backend Changes (FastAPI — `/Users/saif/Programming/Athlix`)

### Models (`app/models/feedback.py`)

```python
class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("app_schema.users.id", ondelete="CASCADE"))
    type: Mapped[str]              # "feature_request" | "bug_report" | "review"
    title: Mapped[str | None]      # required for feature requests
    description: Mapped[str]
    category: Mapped[str | None]   # "workout" | "exercises" | "analytics" | "ui" | "other"
    status: Mapped[str]            # "under_review" | "planned" | "in_progress" | "completed" | "declined"
    admin_notes: Mapped[str | None]
    is_public: Mapped[bool]
    upvotes_count: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

    user = relationship("User")
    votes = relationship("FeedbackVote", back_populates="feedback", cascade="all, delete-orphan")
    comments = relationship("FeedbackComment", back_populates="feedback", cascade="all, delete-orphan")


class FeedbackVote(Base):
    __tablename__ = "feedback_votes"
    __table_args__ = (UniqueConstraint("feedback_id", "user_id", name="uq_feedback_vote"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    feedback_id: Mapped[int] = mapped_column(ForeignKey("app_schema.feedbacks.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("app_schema.users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime]

    feedback = relationship("Feedback", back_populates="votes")


class FeedbackComment(Base):
    __tablename__ = "feedback_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    feedback_id: Mapped[int] = mapped_column(ForeignKey("app_schema.feedbacks.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("app_schema.users.id", ondelete="CASCADE"))
    content: Mapped[str]
    created_at: Mapped[datetime]

    feedback = relationship("Feedback", back_populates="comments")
    user = relationship("User")
```

### Schemas (`app/schemas/feedback.py`)

- `FeedbackType` enum: `feature_request`, `bug_report`, `review`
- `FeedbackStatus` enum: `under_review`, `planned`, `in_progress`, `completed`, `declined`
- `FeedbackCreate` — type, title?, description, category?
- `FeedbackUpdate` — title?, description?, category?
- `FeedbackAdminUpdate` — status?, admin_notes?
- `FeedbackCommentCreate` — content
- `FeedbackResponse` — all fields + `has_upvoted: bool | None` + `comment_count: int` + embedded user info
- `FeedbackCommentResponse` — id, content, created_at, user info
- `FeedbackListResponse` — list of `FeedbackResponse` + total count

### Endpoints (`app/api/v1/endpoints/feedback.py`)

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/feedback` | Auth | List (query: type, status, category, sort, page, limit) |
| POST | `/feedback` | Auth | Create new feedback |
| GET | `/feedback/{id}` | Auth | Detail with user's vote state + comment count |
| PATCH | `/feedback/{id}` | Owner | Update (title, description, category only) |
| DELETE | `/feedback/{id}` | Owner | Soft/hard delete |
| POST | `/feedback/{id}/upvote` | Auth | Toggle upvote (returns `{ upvoted: bool, upvotes_count: int }`) |
| GET | `/feedback/{id}/comments` | Auth | List comments |
| POST | `/feedback/{id}/comments` | Auth | Add comment |
| PATCH | `/feedback/{id}/admin` | Admin | Update status, admin_notes |

### Admin Dependency

Config-based: `ADMIN_CLERK_IDS` env var (comma-separated). New `get_admin_user` FastAPI dependency:

```python
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.clerk_id not in settings.admin_clerk_ids:
        raise HTTPException(status_code=403)
    return current_user
```

### Configuration Changes

- Add `admin_clerk_ids: list[str]` to `Settings` in `app/core/config.py`
- Add "Feedback" tag to `OPENAPI_TAGS` in `app/main.py`
- Add `api_router.include_router(feedback.router, ...)` in `router.py`
- Add feedback portal domain to `cors_allowed_origins`

### Migration

Generate an Alembic revision for the three new tables (`feedbacks`, `feedback_votes`, `feedback_comments`).

---

## Frontend (Next.js — new app)

Location: `/Users/saif/Programming/Athelix_App/feedback-portal/` — alongside the existing React Native app in the same repo.

### Directory Structure

```
feedback-portal/
├── app/
│   ├── layout.tsx              # Root layout with ClerkProvider + QueryClientProvider
│   ├── page.tsx                # Landing page
│   ├── login/
│   │   └── [[...sign-in]]/page.tsx  # Clerk sign-in page
│   ├── sign-up/
│   │   └── [[...sign-up]]/page.tsx  # Clerk sign-up page
│   ├── feature-requests/
│   │   └── page.tsx            # Public feature request board
│   ├── bugs/
│   │   └── page.tsx            # User's bug submissions
│   ├── reviews/
│   │   └── page.tsx            # User's reviews
│   ├── feedback/
│   │   └── [id]/
│   │       └── page.tsx        # Detail view
│   ├── submit/
│   │   └── page.tsx            # Submit new feedback
│   └── admin/
│       └── page.tsx            # Admin dashboard
├── components/
│   ├── FeedbackCard.tsx
│   ├── VoteButton.tsx
│   ├── StatusBadge.tsx
│   ├── FeedbackTypeBadge.tsx
│   ├── FeedbackForm.tsx
│   ├── CommentSection.tsx
│   ├── AdminPanel.tsx
│   ├── UserAvatar.tsx
│   ├── EmptyState.tsx
│   ├── SortDropdown.tsx
│   └── Navbar.tsx
├── api/
│   ├── client.ts               # Fetch wrapper with Clerk Bearer token injection
│   └── feedback.ts             # API functions (mirrors endpoints)
├── hooks/
│   └── useFeedback.ts          # React Query hooks
├── lib/
│   ├── theme.ts                # Colors/spacing constants matching mobile app
│   └── utils.ts
├── middleware.ts               # Clerk auth middleware
├── tailwind.config.ts          # Dark theme config
├── package.json
└── tsconfig.json
```

### Theme

Match the mobile app's dark mode:
- Background: `#111111`
- Screen: `#0A0A0A`
- Card: `rgba(255,255,255,0.04)`
- Text: `#FFFFFF`
- Accent: `#FF5A36`
- Green: `#22C55E` (completed)
- Blue: `#3B82F6` (planned)
- Red: `#EF4444` (declined)
- Gray: `rgba(255,255,255,0.45)` (under_review)

### Auth Flow

1. `middleware.ts` wraps all routes with Clerk `authMiddleware`
2. Unauthenticated users redirected to `/sign-in`
3. Authenticated users get `useAuth().getToken()` to retrieve Clerk JWT
4. API client injects `Authorization: Bearer <token>` into every request
5. FastAPI validates via existing Clerk JWKS verification

### Data Fetching

`@tanstack/react-query` with custom fetch client:

```typescript
const apiFetch = async (url: string, options?: RequestInit) => {
  const { getToken } = useAuth();
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(await res.json());
  return res.json();
};
```

Query keys follow the mobile pattern: `["feedback", { type, status, sort }]`, `["feedback", id]`, etc.

---

## UX Flow

### Submitting feedback
1. User clicks "Submit Feedback" on any page
2. Selects type (feature request / bug / review)
3. Form adapts — feature requests require title + description + category; bugs/reviews need description + optional category
4. Submits → POST `/feedback` → redirects to detail page

### Browsing feature requests
1. User visits `/feature-requests`
2. Sees list of public feature requests with vote counts, status badges
3. Can sort by newest / most upvoted / status
4. Can filter by category
5. Clicks one to view detail + comments

### Voting
1. On detail page or list, user clicks upvote arrow
2. POST `/feedback/{id}/upvote` toggles state
3. Counter animates up/down
4. Can only vote once per item

### Comments
1. On detail page, user scrolls to comment section
2. Sees existing comments with user avatars + timestamps
3. Types a comment → POST `/feedback/{id}/comments`
4. Comment appears instantly (optimistic update)

### Admin flow
1. User with admin Clerk ID sees an "Admin" link in nav
2. `/admin` shows all feedback in a dashboard view
3. Click any item → AdminPanel slides in for status change + internal notes
4. Changes reflected immediately on the public detail page

---

## Files to Create / Modify

### Backend (`/Users/saif/Programming/Athlix`)

**New files:**
- `app/models/feedback.py` — Feedback, FeedbackVote, FeedbackComment
- `app/schemas/feedback.py` — All Pydantic schemas
- `app/api/v1/endpoints/feedback.py` — All endpoints

**Modified files:**
- `app/models/__init__.py` — Add feedback import
- `app/api/v1/router.py` — Add feedback router
- `app/main.py` — Add "Feedback" to OPENAPI_TAGS
- `app/core/config.py` — Add `admin_clerk_ids`
- `requirements.txt` / `pyproject.toml` — No new deps needed

**Generated:**
- Alembic migration for new tables

### Frontend (new Next.js app)

**All files under `feedback-portal/` — see directory structure above**

---

## Scope Boundaries

### In scope
- Backend: feedback CRUD, voting, commenting, admin management
- Frontend: all pages listed above, dark theme matching the mobile app
- Auth: Clerk SSO via same Clerk app instance

### Out of scope
- No push notifications, no email digests
- No public roadmap / changelog page
- No attachment uploads (screenshots can go in description as text)
- No comment editing or deletion (users can delete their own feedback though)
- No moderation queue (auto-public for feature requests)
