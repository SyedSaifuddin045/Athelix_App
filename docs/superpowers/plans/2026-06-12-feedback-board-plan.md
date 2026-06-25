# Feedback Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Canny-style feedback board with a Next.js web portal and new FastAPI endpoints.

**Architecture:** FastAPI backend (new models/schemas/endpoints) + standalone Next.js app with Clerk auth + React Query. Feature requests are public/upvotable; bug reports and reviews are private per-user.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Alembic, Next.js 14 App Router, Clerk, Tailwind CSS, @tanstack/react-query, lucide-react

---

### Task 1: Backend Models

**Files:**
- Create: `app/models/feedback.py`
- Modify: `app/models/__init__.py`

**Details:** Three SQLAlchemy models: `Feedback`, `FeedbackVote` (unique on feedback_id + user_id), `FeedbackComment`. All in `app_schema` schema. Follow existing model patterns from `user.py`.

- [ ] **Create `app/models/feedback.py`**

```python
from datetime import datetime

from sqlalchemy import ForeignKey, UniqueConstraint, Text, Integer, TIMESTAMP, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.users.id", ondelete="CASCADE")
    )
    type: Mapped[str]  # feature_request, bug_report, review
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str]  # under_review, planned, in_progress, completed, declined
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    upvotes_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))

    user = relationship("User")
    votes = relationship("FeedbackVote", back_populates="feedback", cascade="all, delete-orphan")
    comments = relationship("FeedbackComment", back_populates="feedback", cascade="all, delete-orphan")


class FeedbackVote(Base):
    __tablename__ = "feedback_votes"

    __table_args__ = (
        UniqueConstraint("feedback_id", "user_id", name="uq_feedback_vote"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    feedback_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.feedbacks.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))

    feedback = relationship("Feedback", back_populates="votes")


class FeedbackComment(Base):
    __tablename__ = "feedback_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    feedback_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.feedbacks.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_schema.users.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))

    feedback = relationship("Feedback", back_populates="comments")
    user = relationship("User")
```

- [ ] **Update `app/models/__init__.py`** — add `from .feedback import *`

---

### Task 2: Backend Schemas

**Files:**
- Create: `app/schemas/feedback.py`

**Details:** Pydantic v2 schemas following existing patterns from `user_schema.py`.

- [ ] **Create `app/schemas/feedback.py`**

```python
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

from .base_schema import BaseSchema


class FeedbackType(str, Enum):
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    REVIEW = "review"


class FeedbackStatus(str, Enum):
    UNDER_REVIEW = "under_review"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DECLINED = "declined"


class FeedbackCreate(BaseSchema):
    type: FeedbackType
    title: str | None = None
    description: str
    category: str | None = None


class FeedbackUpdate(BaseSchema):
    title: str | None = None
    description: str | None = None
    category: str | None = None


class FeedbackAdminUpdate(BaseSchema):
    status: FeedbackStatus | None = None
    admin_notes: str | None = None


class FeedbackCommentCreate(BaseSchema):
    content: str


class FeedbackUserBrief(BaseSchema):
    id: int
    username: str
    first_name: str | None = None
    last_name: str | None = None


class FeedbackResponse(BaseSchema):
    id: int
    type: FeedbackType
    title: str | None
    description: str
    category: str | None
    status: FeedbackStatus
    admin_notes: str | None
    is_public: bool
    upvotes_count: int
    has_upvoted: bool | None = None
    comment_count: int = 0
    user: FeedbackUserBrief
    created_at: datetime
    updated_at: datetime


class FeedbackListResponse(BaseSchema):
    items: list[FeedbackResponse]
    total: int


class FeedbackCommentResponse(BaseSchema):
    id: int
    feedback_id: int
    content: str
    user: FeedbackUserBrief
    created_at: datetime
```

---

### Task 3: Backend Endpoints

**Files:**
- Create: `app/api/v1/endpoints/feedback.py`

**Details:** All feedback CRUD, voting, commenting, admin endpoints. Follow patterns from existing endpoints (users.py).

- [ ] **Create `app/api/v1/endpoints/feedback.py`**

Endpoints:
- `GET /feedback` — List with filtering (type, status, category), sorting (newest, top), pagination (limit, offset). Returns `FeedbackListResponse`. For each item, sets `has_upvoted` by checking if current user has a vote.
- `POST /feedback` — Create feedback. Sets `is_public` based on type (true for feature_request, false otherwise). Sets initial status to `under_review`. Sets `upvotes_count=0`.
- `GET /feedback/{id}` — Detail. Returns `FeedbackResponse` with `has_upvoted` and `comment_count`.
- `PATCH /feedback/{id}` — Update own feedback. Verify `feedback.user_id == current_user.id`. Only title, description, category can be updated.
- `DELETE /feedback/{id}` — Delete own feedback.
- `POST /feedback/{id}/upvote` — Toggle upvote. If vote exists, delete it and decrement count. If not, create it and increment. Returns `{"upvoted": bool, "upvotes_count": int}`.
- `GET /feedback/{id}/comments` — List comments. Returns `list[FeedbackCommentResponse]`.
- `POST /feedback/{id}/comments` — Add comment. Returns `FeedbackCommentResponse`.
- `PATCH /feedback/{id}/admin` — Admin-only. Update `status` and/or `admin_notes`.

Helper: `get_admin_user` dependency that checks `current_user.clerk_id in settings.admin_clerk_ids`.

---

### Task 4: Backend Config + Router Updates

**Files:**
- Modify: `app/core/config.py`
- Modify: `app/api/v1/router.py`
- Modify: `app/main.py`
- Modify: `.env.example`

- [ ] **Update `app/core/config.py`** — Add `admin_clerk_ids: list[str] = Field(default_factory=list, alias="ADMIN_CLERK_IDS")`
- [ ] **Update `app/api/v1/router.py`** — Import feedback router, add `api_router.include_router(feedback.router, dependencies=[Depends(get_current_user)])` after the other protected routers
- [ ] **Update `app/main.py`** — Add `{"name": "Feedback", "description": "User feedback, feature requests, bug reports, and reviews."}` to OPENAPI_TAGS
- [ ] **Update `.env.example`** — Add `ADMIN_CLERK_IDS=`

---

### Task 5: Alembic Migration

**Files:**
- Create: New migration file in `alembic/versions/`

- [ ] **Generate migration** — Run `alembic revision --autogenerate -m "Add feedback tables"` or write manually
- [ ] **Verify migration** — Run `alembic upgrade head`

---

### Task 6: Frontend Scaffolding

**Files:**
- Create: `feedback-portal/` directory with all Next.js scaffolding files

- [ ] **Initialize Next.js project** — `npx create-next-app@latest feedback-portal --typescript --tailwind --eslint --app --src-dir`
- [ ] **Install deps** — `@clerk/nextjs`, `@tanstack/react-query`, `lucide-react`
- [ ] **Set up Clerk** — Add `.env.local` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, wrap layout with `<ClerkProvider>`
- [ ] **Set up React Query** — Create `src/lib/query-client.ts`, wrap layout
- [ ] **Configure Tailwind** — Dark theme matching mobile app colors in `tailwind.config.ts`
- [ ] **Create `middleware.ts`** — Clerk auth middleware protecting all routes
- [ ] **Create sign-in/sign-up pages** — Clerk `[[...sign-in]]` and `[[...sign-up]]` catch-all routes

---

### Task 7: Frontend API Layer + Hooks

**Files:**
- Create: `feedback-portal/src/api/client.ts`
- Create: `feedback-portal/src/api/feedback.ts`
- Create: `feedback-portal/src/hooks/useFeedback.ts`
- Create: `feedback-portal/src/types/feedback.ts`

- [ ] **Create `src/api/client.ts`** — Fetch wrapper that gets Clerk token and injects Bearer auth
- [ ] **Create `src/types/feedback.ts`** — TypeScript types mirroring the backend schemas (FeedbackType, FeedbackStatus, FeedbackResponse, etc.)
- [ ] **Create `src/api/feedback.ts`** — API functions for all endpoints (listFeedback, getFeedback, createFeedback, updateFeedback, deleteFeedback, toggleUpvote, listComments, addComment, adminUpdate)
- [ ] **Create `src/hooks/useFeedback.ts`** — React Query hooks (useFeedbackList, useFeedbackDetail, useCreateFeedback, useToggleUpvote, useAddComment, useAdminUpdate)

---

### Task 8: Frontend Components

**Files:**
- Create: All component files in `feedback-portal/src/components/`

Components (each in own file):
- `Navbar.tsx` — Top nav with logo, nav links, user avatar from Clerk
- `FeedbackCard.tsx` — List item with type badge, title, description preview, status badge, category, vote count, comment count
- `VoteButton.tsx` — Upvote toggle with animated count, shows filled/unfilled state
- `StatusBadge.tsx` — Color-coded status pill
- `FeedbackTypeBadge.tsx` — Type indicator icon + label
- `FeedbackForm.tsx` — Dynamic form that changes fields based on selected type
- `CommentSection.tsx` — Comment list + input with submit
- `AdminPanel.tsx` — Status dropdown + admin notes textarea (gated on user being admin)
- `EmptyState.tsx` — Empty state illustration + CTA
- `SortDropdown.tsx` — Sort by newest/top/status

---

### Task 9: Frontend Pages

**Files:**
- Create: All page files in `feedback-portal/src/app/`

Pages:
- `page.tsx` — Landing (hero, stats, browse public feature requests)
- `feature-requests/page.tsx` — Public board with sort/filter + list of FeedbackCards
- `bugs/page.tsx` — Current user's bug submissions
- `reviews/page.tsx` — Current user's reviews
- `feedback/[id]/page.tsx` — Detail view with description, status, vote button, comments
- `submit/page.tsx` — FeedbackForm with type selector
- `admin/page.tsx` — Admin dashboard with all feedback + inline AdminPanel
- `layout.tsx` — Root layout with ClerkProvider, QueryClientProvider, Navbar
- `page.tsx` — Landing/redirect

---
