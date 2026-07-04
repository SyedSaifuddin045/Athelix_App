// Path indices for non-muscle elements (background, separators, gradients, detail)
export const BG_PATH_IDS = new Set([0, 1, 3, 51, 71]);
export const SEPARATOR_PATH_IDS = new Set([9, 13, 15, 24, 60, 88, 110]);
export const DETAIL_PATH_IDS = new Set([61, 90, 99, 104, 106, 109, 111]);
export const GRADIENT_PATH_IDS = new Set([2, 70]);

// All muscle region path indices (E8E8E8 fill = body shapes)
export const MUSCLE_PATH_INDICES = [
  4, 5, 6, 7, 8, 10, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
  45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 62, 63, 64, 65,
  66, 67, 68, 69, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
  86, 87, 89, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 102, 103, 105,
  107, 108,
];

// Visual mapping verified against Full_Body.svg in browser
// Only paths the user identified by index — everything else renders white
export const MUSCLE_GROUP_PATH_MAP: Record<string, number[]> = {
  Chest: [52, 53,101],
  Back: [4,27,28],
  Shoulders: [74, 76, 20, 21, 41, 29,16,14],
  Biceps: [65, 66],
  Triceps: [22, 23],
  Forearms: [68, 69, 82, 94, 34, 35, 30, 37],
  Abs: [91, 87, 83, 86, 85, 84, 81, 80, 95, 96,79,77],
  Quads: [62, 55, 56, 57, 75, 78],
  Hamstrings: [7, 19, 8, 18],
  Glutes: [5, 6],
  Calves: [89, 98, 97, 59, 25, 26, 11, 12, 32, 44, 42, 43, 63, 58, 33, 31, 49, 48],
  Traps: [17, 64],
};

export function getMusclePaths(muscleGroup: string): number[] {
  return MUSCLE_GROUP_PATH_MAP[muscleGroup] ?? [];
}

export function getMuscleForPath(pathIndex: number): string | null {
  for (const [group, indices] of Object.entries(MUSCLE_GROUP_PATH_MAP)) {
    if (indices.includes(pathIndex)) return group;
  }
  return null;
}
