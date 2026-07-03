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

// Placeholder — map muscle group name (as returned by API) to SVG path indices
// Initial estimate based on path coordinate analysis.
// 🎯 VISUALLY VERIFY: open assets/images/Full_Body.svg in browser and adjust.
export const MUSCLE_GROUP_PATH_MAP: Record<string, number[]> = {
  Chest: [4, 86, 87, 101, 53, 66, 77],
  Back: [14, 27, 67, 68, 69, 16],
  Shoulders: [52, 64, 76, 17, 20, 41, 22],
  Biceps: [65, 79, 83, 91, 21, 29],
  Triceps: [80, 84, 85, 95, 23, 28, 38],
  Forearms: [74, 81, 102, 107, 108, 5, 6, 30, 37, 46, 47],
  Abs: [34, 35, 39, 45, 50, 82, 94, 96, 100, 103, 105],
  Quads: [58, 59, 63, 11, 12, 25, 26],
  Hamstrings: [72, 73, 31, 32, 33],
  Glutes: [7, 8, 18, 19, 36, 40, 55, 56, 57, 62, 75, 78, 92, 93],
  Calves: [89, 97, 98, 42, 43, 44, 48, 49],
  Traps: [10, 54],
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
