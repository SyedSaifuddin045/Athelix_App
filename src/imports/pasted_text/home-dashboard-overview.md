### 1. Screen Overview

**Screen:** Home / Dashboard
**Feature Context:** Aggregated athlete overview with quick access to training, recovery insights, and progress signals
**Priority:** MVP

A premium, data-driven dashboard inspired by Ultrahuman’s visual language: dark UI, soft gradients, glowing highlights, and high-density information presented in structured cards. Focus is on **clarity + hierarchy**, not decoration.

---

### 2. Layout Structure

**Header:**

* Transparent / blended header (merges into gradient background)
* Left: Profile avatar
* Center: Greeting + user name
* Right: Minimal icon (settings or notifications)

**Main Content (Scrollable):**

1. **Hero Metric Card (Primary Focus)**

   * Large central metric (e.g., “Workout Readiness” or “Weekly Consistency”)
   * Circular or semi-circular progress visualization (inspired by Ultrahuman ring)
   * Supporting metrics (e.g., streak, last workout, volume)

2. **Weekly Activity Graph Card**

   * Bar chart or line chart
   * Shows workouts or volume trend (7-day view)
   * Highlight current day

3. **Recent Workout Card**

   * Workout name
   * Key stats (duration, volume, exercises)
   * Subtle CTA → view session

4. **Personal Records (Horizontal Scroll)**

   * Minimal cards with exercise + PR value
   * Glowing accent highlight

5. **Quick Actions Grid**

   * Start Workout
   * Templates
   * Explore Exercises
   * History

**Bottom Section:**

* Bottom navigation (5 tabs): Home, Explore, Train, Progress, Profile

**Floating / Sticky Elements:**

* Floating CTA (Start Workout) with soft glow
* Sticky bottom nav

---

### 3. Key Components

* Gradient background (dark → green/teal accent glow)
* Glassmorphism-style cards (subtle blur + border)
* Circular metric visualization (hero element)
* Bar/line charts (thin, minimal gridlines)
* Horizontal scroll cards (PRs)
* Icon-based quick action tiles
* Floating action button (rounded, glowing)
* Typography:

  * Large bold numbers (hero stats)
  * Medium labels
  * Low-contrast secondary text

---

### 4. Key Interactions

* Tap hero card → deeper analytics (future-ready but not required in MVP)
* Tap “Start Workout” → start flow (priority interaction)
* Swipe PR list horizontally
* Tap quick actions → navigate to modules
* Tap recent workout → session detail

Behavior:

* Smooth transitions (no heavy animations)
* Immediate data rendering (fast perceived performance)
* Visual feedback on tap (subtle scale or glow)

---

### 5. States

**Empty:**

* No data → simplified hero with CTA “Start your first workout”

**Loading:**

* Skeleton loaders with shimmer (matching card shapes)

**Error:**

* Inline retry card with minimal disruption

**Active Usage:**

* Dynamic data
* Highlighted current metrics
* Subtle glow on key numbers

---

### 6. Final Figma AI Prompt

"Mobile fitness app dashboard screen, dark premium UI with deep black background and subtle green teal gradient glow, transparent blended header with avatar greeting and minimal icon, large hero card with circular progress ring showing workout readiness score in center with bold number and supporting stats like streak and last workout, below a clean weekly activity chart with minimal gridlines and highlighted current day, structured cards including recent workout summary with stats and action hint, horizontal scroll personal records cards with glowing accents, grid layout quick action buttons for start workout templates explore and history, floating glowing start workout button bottom right, bottom navigation bar with five tabs home explore train progress profile, modern futuristic fitness UI inspired by Ultrahuman style but unique, glassmorphism cards soft shadows high contrast typography clean spacing mobile-first layout realistic data high usability minimal clutter"
