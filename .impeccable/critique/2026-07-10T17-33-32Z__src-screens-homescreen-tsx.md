---
target: src/screens/HomeScreen.tsx
total_score: 29
p0_count: 0
p1_count: 1
p2_count: 3
timestamp: 2026-07-10T17-33-32Z
slug: src-screens-homescreen-tsx
---
## Heuristic Scores
Total: 29/40 (Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton solid; "Updated X ago" opacity 0.4 near-invisible |
| 2 | Match Between System and Real World | 3 | "Volume" ambiguous (sets? weight?); "Hey, {name}" great |
| 3 | User Control and Freedom | 3 | Good dismiss/pull-to-refresh; no cancel on Start Workout |
| 4 | Consistency and Standards | 3 | Two press animation systems (Animated vs Reanimated) |
| 5 | Error Prevention | 2 | Start Workout has no loading/disabled state; double-tap risk |
| 6 | Recognition Rather Than Recall | 3 | Info tooltips good; Stats row icons alone need label scanning |
| 7 | Flexibility and Efficiency of Use | 2 | Single-path flow, no quick actions or power-user accelerators |
| 8 | Aesthetic and Minimalist Design | 4 | Dark theme sharp, coral restrained, skeleton well-crafted |
| 9 | Error Recovery | 3 | ErrorCard clear with retry; no recovery guidance beyond retry |
| 10 | Help and Documentation | 3 | Inline tooltips explain jargon; no contextual help for actions |

## Priority Issues
- [P1] Start Workout no loading/disabled state — double-tap risk
- [P2] Templates info tooltip clips off-screen on narrow devices
- [P2] "Updated X ago" text nearly invisible (opacity 0.4)
- [P2] Dual animation systems (Animated vs Reanimated)
- [P3] No empty state for weekly activity

## Anti-Patterns
- No AI slop detected
- Dark theme purposeful, coral restrained
- Skeleton loading custom and well-shaped

## Persona Flags
- Casey: Primary action mid-screen, not thumb zone
- Jordan: "Mesocycle" jargon, "Volume" label ambiguous
- Riley: Dismissed error has no re-trigger, stale "Updated X ago"
