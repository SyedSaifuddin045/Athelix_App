---
name: Athelix
description: Structured workout tracking for lifters who treat training like a discipline
colors:
  primary: "#FF5A36"
  root: "#050505"
  screen: "#0A0A0A"
  surface: "#0D0D0D"
  surface-light: "#141414"
  card: "rgba(255,255,255,0.04)"
  card-soft: "rgba(255,255,255,0.06)"
  card-elevated: "rgba(255,255,255,0.07)"
  text: "#FFFFFF"
  muted: "rgba(255,255,255,0.45)"
  faint: "rgba(255,255,255,0.25)"
  border: "rgba(255,255,255,0.08)"
  border-light: "rgba(255,255,255,0.12)"
  green: "#22C55E"
  green-dark: "rgba(34,197,94,0.12)"
  red: "#EF4444"
  red-dark: "rgba(239,68,68,0.12)"
  gold: "#FBBF24"
  orange: "#F59E0B"
  purple: "#8B5CF6"
  purple-dark: "rgba(139,92,246,0.12)"
  blue: "#3B82F6"
  blue-dark: "rgba(59,130,246,0.12)"
  tabBar: "rgba(5,5,5,0.96)"
typography:
  display:
    fontFamily: "System, -apple-system, Inter, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 64
  headline:
    fontFamily: "System, -apple-system, Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 34
  title:
    fontFamily: "System, -apple-system, Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 22
  body:
    fontFamily: "System, -apple-system, Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 18
  label:
    fontFamily: "System, -apple-system, Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 14
    letterSpacing: "0.4px"
rounded:
  button: "18px"
  card: "24px"
  card-small: "16px"
  input: "14px"
  chip: "999px"
  icon-wrap: "14px"
  avatar: "999px"
  sheet: "28px"
  modal: "20px"
  stepper: "8px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  xl2: "14px"
  xl3: "16px"
  xl4: "20px"
  xl5: "24px"
  xl6: "28px"
  xl7: "32px"
  xl8: "40px"
  xl9: "48px"
  xl10: "56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.button}"
    padding: "16px 24px"
    height: "56px"
  button-primary-pressed:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.button}"
    padding: "16px 24px"
  button-subtle:
    backgroundColor: "{colors.card-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    padding: "16px 24px"
    height: "56px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-elevated:
    backgroundColor: "{colors.card-elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "16px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.input}"
    padding: "14px 16px"
  chip:
    backgroundColor: "{colors.card-soft}"
    textColor: "{colors.muted}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
---

# Design System: Athelix

## 1. Overview

**Creative North Star: "The Iron Log"**

Athelix treats the interface like a precision instrument — raw, functional, stripped to essentials. The dark palette isn't aesthetic decoration; it's practical for gym environments where overhead fluorescents glare off bright screens. Every element earns its place like equipment in a well-organized weight room: nothing decorative, everything functional. The visual language draws from the confidence of a training log that's seen real progress — precise data, clear hierarchy, no hesitation.

The system rejects the generic fitness app aesthetic: no motivational quotes, no social feeds, no lifestyle photography. It also rejects clinical interfaces that feel like medical dashboards. Athelix lives in the space between — empowering data for healthy people training hard, not diagnostic readouts for patients. The coral accent cuts through the dark like a chalk mark on a barbell: functional, visible, never decorative.

**Key Characteristics:**
- Dark-first for gym environments (reduced glare, focus on content)
- High-contrast data for mid-workout readability
- Translucent layering over shadows for depth
- Single accent color (coral) for primary actions only
- System typography for platform-native feel
- Scale-press feedback on interactive elements

## 2. Colors

The palette is built for dark gym environments: near-black backgrounds with translucent white layers creating hierarchy, coral accent for primary actions, and semantic status colors for training feedback.

### Primary
- **Signal Coral** (#FF5A36): Primary action color — start workout, save, confirm. Used on CTAs, active states, and progress indicators. Rarity is the point: ≤10% of any screen surface.

### Neutral
- **Void Black** (#050505): Root background. The deepest layer, visible only at screen edges and behind system UI.
- **Gym Floor** (#0A0A0A): Screen background. The primary canvas where content lives.
- **Mat Black** (#0D0D0D): Surface background. Cards and containers rest here.
- **Rubber Surface** (#141414): Elevated surfaces. Hover states and raised elements.
- **Shadow Card** (rgba(255,255,255,0.04)): Default card background. Barely-there white tint.
- **Shadow Card Soft** (rgba(255,255,255,0.06)): Subtle cards and secondary surfaces.
- **Shadow Card Elevated** (rgba(255,255,255,0.07)): Elevated cards and active states.
- **Text White** (#FFFFFF): Primary text. Headings, body, labels.
- **Text Muted** (rgba(255,255,255,0.45)): Secondary text. Captions, timestamps, helpers.
- **Text Faint** (rgba(255,255,255,0.25)): Disabled text, placeholders.
- **Border Subtle** (rgba(255,255,255,0.08)): Default borders, dividers.
- **Border Light** (rgba(255,255,255,0.12)): Hover borders, focus rings.

### Semantic Status
- **Green** (#22C55E): Success, on-track, completed. Background: rgba(34,197,94,0.12).
- **Red** (#EF4444): Error, warning, under-target. Background: rgba(239,68,68,0.12).
- **Gold** (#FBBF24): Caution, attention needed.
- **Orange** (#F59E0B): Warning, moderate attention.
- **Purple** (#8B5CF6): Info, neutral highlight. Background: rgba(139,92,246,0.12).
- **Blue** (#3B82F6): Info, links, secondary actions. Background: rgba(59,130,246,0.12).

### Named Rules
**The Coral Restraint Rule.** Signal coral appears on primary actions and active states only. Never for decoration, never for large surfaces, never for secondary elements. Its rarity creates hierarchy; overuse destroys it.

**The Translucent Layer Rule.** Depth comes from stacking translucent white layers, not from shadows. Cards, inputs, and containers use rgba(255,255,255,0.04–0.07) to create separation. Shadows appear only as state feedback (press, elevation).

## 3. Typography

**System Font:** System (-apple-system on iOS, system on Android, Inter/system-ui on web)

**Character:** The type system is invisible by design. System fonts carry the platform-native feel — SF Pro on iOS, Roboto on Android — so the interface feels like a natural extension of the device, not a third-party overlay. Weight and size do the hierarchical work; no decorative font choices.

### Hierarchy
- **Display** (800 weight, 56px/64): Hero metrics — big numbers that anchor progress screens. Used sparingly for key performance indicators.
- **Headline** (700 weight, 28px/34): Screen titles and section headers. The primary structural type.
- **Title** (600 weight, 17px/22): Card titles, list item headings. Dense but readable.
- **Body** (400 weight, 13px/18): Primary text — descriptions, instructions, data values. Max line length 65–75ch for prose.
- **Label** (500 weight, 11px/14, +0.4px tracking): Tags, badges, metadata, timestamps. Small but legible.

### Named Rules
**The Metric Scale Rule.** Large numbers (progress values, percentages, personal records) use the display/headline weights at scale. They are the visual anchors of their screens — confident, unmissable, data-forward.

**The No-Display-Font Rule.** System fonts only. No custom typefaces for headings, no decorative fonts for labels. The interface disappears into the task; the typography never calls attention to itself.

## 4. Elevation

The system uses ambient, diffuse shadows to separate layers. Depth is structural, not decorative — cards float above the background, elevated surfaces lift above cards, and modals rise above everything. Shadows are subtle and diffuse, never sharp or dramatic.

### Shadow Vocabulary
- **Card Rest** (`shadowColor: #000, shadowOffset: {0,4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4`): Default card state. Separates cards from the screen background.
- **Card Elevated** (`shadowColor: #000, shadowOffset: {0,4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4`): Active or important cards. Same shadow, elevated surface color.
- **Button Press** (`shadowColor: accent, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6`): Primary button glow on press. Coral shadow creates tactile feedback.

### Named Rules
**The Ambient Depth Rule.** Shadows are diffuse and ambient, never sharp. They create gentle separation between layers, not dramatic lifting. The shadow under a card should feel like soft ambient light, not a spotlight.

**The State-Only Shadow Rule.** Shadows appear at rest for structural separation (cards, modals) and intensify for state feedback (press, hover). Shadows never appear purely for decoration.

## 5. Components

### Buttons
- **Shape:** Gently curved pill (18px radius)
- **Primary:** Signal coral background (#FF5A36), black text (#000000), 56px height, 24px horizontal padding. Scale-press animation (0.97 spring). Coral glow shadow on press.
- **Subtle/Secondary:** Translucent card-soft background (rgba(255,255,255,0.06)), white text, same shape. 1px border for definition.
- **States:** Default → Press (scale 0.97 + shadow) → Disabled (0.5 opacity) → Loading (ActivityIndicator).

### Cards
- **Shape:** Generous rounded (24px radius)
- **Background:** Surface color (#0D0D0D) at rest, elevated color (rgba(255,255,255,0.07)) when raised.
- **Border:** 1px border-subtle (rgba(255,255,255,0.08)). Accent borders (green, red, purple, blue) for status indication.
- **Internal Padding:** 16px vertical and horizontal.
- **States:** Default → Elevated (shadow + lighter bg) → Accent (colored left border or tinted background).

### Inputs
- **Style:** Translucent card background (rgba(255,255,255,0.04)), white text, 14px radius.
- **Focus:** Border shifts to coral (#FF5A36), subtle glow.
- **Error:** Border shifts to red (#EF4444), error message below in red.
- **Disabled:** 0.5 opacity, faint text color.

### Chips / Tags
- **Style:** Translucent card-soft background, muted text, pill shape (999px radius).
- **State:** Selected state uses accent background with black text. Unselected uses card-soft with muted text.

### Navigation
- **Tab Bar:** Translucent dark background (rgba(5,5,5,0.96)), 56px height. Active tab uses coral icon, inactive uses muted text. System-native feel.
- **Stack Navigation:** Standard push transitions. Large titles collapsing to inline on scroll (iOS).

### Signature Component: Metric Block
Large-format data display for progress screens. Display/headline weight numbers (40–56px) with muted labels below. Used for personal records, workout stats, and progress indicators. The visual anchor of data-heavy screens.

## 6. Do's and Don'ts

### Do:
- **Do** use the coral accent sparingly — primary actions and active states only, ≤10% of screen surface.
- **Do** use translucent layering (rgba white tints) for depth instead of heavy shadows.
- **Do** keep system fonts for all text — the interface should feel native to each platform.
- **Do** use skeleton states for loading, not spinners in the middle of content.
- **Do** ensure touch targets are 44×44pt minimum (iOS) / 48×48dp minimum (Android) for sweaty fingers.
- **Do** test contrast under bright gym lighting — high-contrast data is non-negotiable.
- **Do** use scale-press feedback on all interactive elements for tactile confidence.
- **Do** keep one task per screen — focused interfaces beat feature-packed dashboards.

### Don't:
- **Don't** use generic fitness app aesthetics: motivational quotes, social feeds, lifestyle photography, "great job!" cheerleading. Athelix is a tool, not a content platform.
- **Don't** use clinical/medical aesthetics: diagnostic dashboards, white-coat vibes, rehab app patterns. The data should feel empowering, not diagnostic.
- **Don't** use gradient text, glassmorphism as default, or decorative motion that doesn't convey state.
- **Don't** use display fonts for UI labels, buttons, or data — system fonts only.
- **Don't** stack FABs or use modals as first thought — exhaust inline alternatives first.
- **Don't** reinvent standard affordances for flavor — use platform-native controls (iOS switches, Android Material components).
- **Don't** use border-left greater than 1px as a colored accent stripe — use full borders or background tints.
- **Don't** ship with missing component states — every interactive element needs default, hover, focus, active, disabled, loading, error.
