export type CardioActivityType =
  | "running"
  | "walking"
  | "cycling"
  | "swimming"
  | "hiking"
  | "rowing"
  | "elliptical"
  | "stair_climber"
  | "treadmill"
  | "stationary_bike";

export interface CardioActivity {
  type: CardioActivityType;
  label: string;
  icon: string;
  exerciseId: string;
  color: string;
  instructions: string[];
}

export const CARDIO_ACTIVITIES: CardioActivity[] = [
  { type: "running", label: "Run", icon: "run", exerciseId: "cardio_run", color: "#FF5A36", instructions: ["Warm up with 5 min light jog", "Maintain steady pace throughout", "Cool down with 5 min walk", "Stretch calves and quads after"] },
  { type: "walking", label: "Walk", icon: "walk", exerciseId: "cardio_walk", color: "#22C55E", instructions: ["Stand tall with shoulders back", "Swing arms naturally at your sides", "Land heel-first, roll through to toe", "Stay hydrated throughout"] },
  { type: "cycling", label: "Cycle", icon: "cycle", exerciseId: "cardio_cycle", color: "#3B82F6", instructions: ["Adjust saddle height so leg is almost fully extended at pedal bottom", "Keep core engaged and back flat", "Maintain cadence of 70-90 RPM", "Shift gears to maintain steady effort"] },
  { type: "swimming", label: "Swim", icon: "swim", exerciseId: "cardio_swim", color: "#8B5CF6", instructions: ["Start with 5 min easy warm-up laps", "Breathe rhythmically — exhale fully underwater", "Focus on long, smooth strokes", "Use flip turns to maintain momentum"] },
  { type: "hiking", label: "Hike", icon: "hike", exerciseId: "cardio_hike", color: "#F59E0B", instructions: ["Wear sturdy footwear with good grip", "Pack water and a snack", "Maintain steady pace on inclines", "Use trekking poles for steep sections"] },
  { type: "rowing", label: "Row", icon: "row", exerciseId: "cardio_row", color: "#22C55E", instructions: ["Drive with legs first, not arms", "Keep back straight, core braced", "Pull handle to lower chest, elbows in", "Slide forward before next drive"] },
  { type: "elliptical", label: "Elli", icon: "elliptical", exerciseId: "cardio_elliptical", color: "#FF5A36", instructions: ["Stand upright, don't lean on handles", "Push through heels, not toes", "Vary stride direction to target different muscles", "Adjust resistance before speed"] },
  { type: "stair_climber", label: "Stair", icon: "stairs", exerciseId: "cardio_stair", color: "#3B82F6", instructions: ["Stand tall, don't lean on rails", "Place full foot on each step", "Use gentle handrail support only for balance", "Start slow, increase step rate gradually"] },
  { type: "treadmill", label: "Tread", icon: "treadmill", exerciseId: "cardio_treadmill", color: "#8B5CF6", instructions: ["Start belt at slow walk before increasing speed", "Use safety clip at all times", "Stay centered — don't look back at belt", "Cool down at slow pace before stopping"] },
  { type: "stationary_bike", label: "Bike", icon: "stationary-bike", exerciseId: "cardio_bike", color: "#F59E0B", instructions: ["Adjust seat height to slight bend at knee", "Keep shoulders relaxed, hands light on bars", "Pedal in smooth circles, not just pushing down", "Maintain 80+ RPM for endurance work"] },
];

export function getCardioActivity(type: CardioActivityType): CardioActivity {
  const act = CARDIO_ACTIVITIES.find((a) => a.type === type);
  if (!act) throw new Error(`Unknown cardio activity: ${type}`);
  return act;
}

export function iconForActivity(type: string): string {
  const icons: Record<string, string> = {
    running: "footprints",
    walking: "person-standing",
    cycling: "bike",
    swimming: "droplets",
    hiking: "mountain",
    rowing: "sailboat",
    elliptical: "person-standing",
    stair_climber: "move-vertical",
    treadmill: "footprints",
    stationary_bike: "bike",
  };
  return icons[type] ?? "activity";
}
