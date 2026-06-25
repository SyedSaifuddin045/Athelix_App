# Landing Page — Athelix

## Goal
SEO-optimized landing page at `athelix.fit` to attract users/testers for the Athelix fitness tracking app. Collects waitlist signups via Clerk user creation + Google Play tester auto-add.

## Architecture

**Project:** `athelix-website/` — standalone Next.js 16 App Router project
**Hosting:** Coolify (same VPS as feedback-portal)
**Domain:** `athelix.fit` (root domain)

**API Route** `POST /api/waitlist`:
1. Validate name + email
2. Create Clerk user via Clerk Backend API
3. Add email to Google Play testing track via Google Play Developer API
4. Return success/error

**Env vars:**
- `CLERK_SECRET_KEY` — Clerk Admin API key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — service account credentials
- `GOOGLE_PLAY_PACKAGE_NAME` — `com.athelix.app`

## Visual Design

**Aesthetic:** Dark industrial luxury — #050505 bg, #FF5A36 accent, bold typography, dramatic glow effects

**Colors:**
- Background: `#050505` → `#0A0A0A` sections
- Cards: `rgba(255,255,255,0.04)` with `rgba(255,255,255,0.08)` borders
- Text: `#FFFFFF` / `rgba(255,255,255,0.45)` / `rgba(255,255,255,0.25)`
- Accent: `#FF5A36` (buttons, highlights, decorative lines)
- Success: `#22C55E`

**Typography:**
- Hero display: `Titillium Web` (Google Fonts, bold 900)
- Headings: `Barlow Condensed` (Google Fonts, semibold 600, tracking wide)
- Body: `Outfit` (Google Fonts, regular 400)

**Font sizes scale:**
- Hero title: clamp(2.5rem, 5vw, 4.5rem)
- Section headings: clamp(1.5rem, 3vw, 2.5rem)
- Body: 1rem
- Small/caption: 0.875rem

## Page Sections

### Nav
- Sticky top bar with logo (dumbbell icon + "Athelix") and "Join Waitlist" CTA button
- Becomes opaque on scroll past hero

### Hero
- Full viewport height
- Left: Headline ("Your training, elevated."), subtext, CTA button, app store badges
- Right: Phone mockup with app screenshot, subtle 3D parallax following cursor
- Decorative accent line that strokes in

### Metrics Bar
- 4 stats in a row: Active Users, Workouts Completed, Exercises Tracked, Workout Templates
- Numbers count up with elastic bounce on scroll into view
- Uses placeholder numbers (can be updated later)

### Features Grid
- 6 feature cards in 3×2 grid
- Each with lucide icon, title, short description
- Features: Workout Tracking, Progressive Overload, Personal Records, Mesocycle Planning, Muscle Balance Analytics, Bodyweight Tracking
- Cards have subtle hover lift and border glow

### Screenshots Gallery
- Phone frames with actual app screenshots from `assets/Screenshots/`
- Horizontal scroll with snap or centered grid
- Screenshots inside dark rounded phone outlines

### Waitlist Form
- Name + Email inputs with dark styling
- Submit button with subtle pulse glow
- Success state: "You're on the list! Check your email."
- Loading state, error state (duplicate email, rate limit)
- "Join 300+ early testers" social proof text

### FAQ
- 5 questions in accordion pattern
- Smooth open/close animation
- Questions about what Athelix does, pricing, platforms, data privacy, feedback

### Footer
- Logo + tagline
- Social links (if any)
- Copyright

## Animations

- **Scroll reveals:** Sections fade in + translate up with staggered delays (CSS + Intersection Observer)
- **Hero parallax:** Phone mockup tilts slightly following mouse position (JS `mousemove`)
- **Metric counters:** Numbers animate from 0 to target with elastic easing
- **Accent line draw:** Decorative `#FF5A36` lines stroke in on scroll (CSS `stroke-dashoffset`)
- **CTA pulse:** Slow glow animation on the waitlist button
- **Card hover:** Cards lift 4px with subtle border color shift

## Implementation Order

1. Scaffold Next.js project + Tailwind v4 setup + fonts + colors
2. Layout shell (nav, page sections, footer)
3. Hero section with parallax phone
4. Metrics bar with counter animation
5. Features grid
6. Screenshots gallery
7. FAQ accordion
8. Waitlist form + `/api/waitlist` route
9. Scroll animations + polish
10. Typecheck + verify
