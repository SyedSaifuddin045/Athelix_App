import { mapExerciseItem, mapExerciseDetail, exerciseLookup, recordValue, groupSetsByExercise } from "../utils/mapping";

describe("mapExerciseItem", () => {
  it("maps ExerciseResponse to ExerciseItem", () => {
    const result = mapExerciseItem({
      id: "ex1",
      name: "Bench Press",
      target: "Chest",
      body_part: "Upper Body",
      equipment: "Barbell",
    } as any);
    expect(result.id).toBe("ex1");
    expect(result.name).toBe("Bench Press");
    expect(result.primaryMuscle).toBe("Chest");
  });
});

describe("mapExerciseDetail", () => {
  it("maps ExerciseDetailResponse to ExerciseDetail", () => {
    const result = mapExerciseDetail({
      name: "Bench Press",
      target: "Chest",
      body_part: "Upper Body",
      equipment: "Barbell",
      secondary_muscles: [{ muscle: "Triceps" }],
      instructions: [{ step_number: 1, instruction: "Lie down" }],
    } as any);
    expect(result.name).toBe("Bench Press");
    expect(result.primaryMuscle).toBe("Chest");
    expect(result.secondaryMuscles).toEqual(["Triceps"]);
    expect(result.instructions).toEqual(["Lie down"]);
  });
});

describe("exerciseLookup", () => {
  it("creates Map from exercise array", () => {
    const lookup = exerciseLookup([{ id: "ex1", name: "Bench" } as any, { id: "ex2", name: "Squat" } as any]);
    expect(lookup.size).toBe(2);
    expect(lookup.get("ex1")?.name).toBe("Bench");
  });

  it("returns empty Map for undefined", () => {
    expect(exerciseLookup(undefined).size).toBe(0);
  });
});

describe("recordValue", () => {
  it("formats weight records", () => {
    const result = recordValue({ id: 1, record_type: "weight", value: 100, achieved_on: "2026-05-20", exercise_name: "Bench" } as any);
    expect(result).toBe("100 kg");
  });
});

describe("groupSetsByExercise", () => {
  it("groups sets by exercise_id", () => {
    const lookup = new Map([
      ["ex1", { name: "Bench Press" } as any],
    ]);
    const sets = [
      { id: 1, exercise_id: "ex1", set_number: 1, reps: 10, weight_kg: 80, set_type: "working" },
      { id: 2, exercise_id: "ex1", set_number: 2, reps: 8, weight_kg: 85, set_type: "working" },
    ] as any;
    const groups = groupSetsByExercise(sets, lookup);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Bench Press");
    expect(groups[0].sets).toHaveLength(2);
  });
});
