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
}

export const CARDIO_ACTIVITIES: CardioActivity[] = [
  { type: "running", label: "Run", icon: "run", exerciseId: "cardio_run", color: "#FF5A36" },
  { type: "walking", label: "Walk", icon: "walk", exerciseId: "cardio_walk", color: "#22C55E" },
  { type: "cycling", label: "Cycle", icon: "cycle", exerciseId: "cardio_cycle", color: "#3B82F6" },
  { type: "swimming", label: "Swim", icon: "swim", exerciseId: "cardio_swim", color: "#8B5CF6" },
  { type: "hiking", label: "Hike", icon: "hike", exerciseId: "cardio_hike", color: "#F59E0B" },
  { type: "rowing", label: "Row", icon: "row", exerciseId: "cardio_row", color: "#22C55E" },
  { type: "elliptical", label: "Elli", icon: "elliptical", exerciseId: "cardio_elliptical", color: "#FF5A36" },
  { type: "stair_climber", label: "Stair", icon: "stairs", exerciseId: "cardio_stair", color: "#3B82F6" },
  { type: "treadmill", label: "Tread", icon: "treadmill", exerciseId: "cardio_treadmill", color: "#8B5CF6" },
  { type: "stationary_bike", label: "Bike", icon: "stationary-bike", exerciseId: "cardio_bike", color: "#F59E0B" },
];

export function getCardioActivity(type: CardioActivityType): CardioActivity {
  const act = CARDIO_ACTIVITIES.find((a) => a.type === type);
  if (!act) throw new Error(`Unknown cardio activity: ${type}`);
  return act;
}

export function iconForActivity(type: string): string {
  const icons: Record<string, string> = {
    running: "🏃", walking: "🚶", cycling: "🚴", swimming: "🏊",
    hiking: "🥾", rowing: "🚣", elliptical: "🏋", stair_climber: "🪜",
    treadmill: "🏃", stationary_bike: "🚲",
  };
  return icons[type] ?? "🏃";
}
