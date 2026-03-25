import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { createExerciseSet, deleteExerciseSet, updateExerciseSet, updateWorkoutSession } from "./api";

const WORKOUT_QUEUE_STORAGE_KEY = "workouts.queue.v1";

const createQueuedSetSchema = z.object({
  id: z.string(),
  type: z.literal("createSet"),
  sessionId: z.number(),
  tempKey: z.string(),
  payload: z.object({
    exercise_id: z.string(),
    set_number: z.number(),
    set_type: z.string(),
    reps: z.number().nullable().optional(),
    weight_kg: z.number().nullable().optional(),
    duration_sec: z.number().nullable().optional(),
    distance_m: z.number().nullable().optional(),
    rpe: z.number().nullable().optional(),
    is_pr: z.boolean().optional(),
    notes: z.string().nullable().optional(),
    logged_at: z.string().nullable().optional(),
  }),
});

const updateQueuedSetSchema = z.object({
  id: z.string(),
  type: z.literal("updateSet"),
  sessionId: z.number(),
  setId: z.number(),
  payload: z.record(z.string(), z.any()),
});

const deleteQueuedSetSchema = z.object({
  id: z.string(),
  type: z.literal("deleteSet"),
  sessionId: z.number(),
  setId: z.number(),
  tempKey: z.string().optional(),
});

const finishQueuedSessionSchema = z.object({
  id: z.string(),
  type: z.literal("finishSession"),
  sessionId: z.number(),
  payload: z.record(z.string(), z.any()),
});

const queuedWorkoutActionSchema = z.discriminatedUnion("type", [
  createQueuedSetSchema,
  updateQueuedSetSchema,
  deleteQueuedSetSchema,
  finishQueuedSessionSchema,
]);

export type QueuedWorkoutAction = z.infer<typeof queuedWorkoutActionSchema>;
type EnqueueWorkoutAction =
  | (Omit<z.infer<typeof createQueuedSetSchema>, "id"> & { id?: string })
  | (Omit<z.infer<typeof updateQueuedSetSchema>, "id"> & { id?: string })
  | (Omit<z.infer<typeof deleteQueuedSetSchema>, "id"> & { id?: string })
  | (Omit<z.infer<typeof finishQueuedSessionSchema>, "id"> & { id?: string });

let replayPromise: Promise<number> | null = null;

function generateQueueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readQueue(): Promise<QueuedWorkoutAction[]> {
  const raw = await AsyncStorage.getItem(WORKOUT_QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return queuedWorkoutActionSchema.array().parse(JSON.parse(raw));
  } catch {
    await AsyncStorage.removeItem(WORKOUT_QUEUE_STORAGE_KEY);
    return [];
  }
}

async function writeQueue(queue: QueuedWorkoutAction[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUT_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

export async function listQueuedWorkoutActions(): Promise<QueuedWorkoutAction[]> {
  return readQueue();
}

export async function listQueuedWorkoutActionsForSession(
  sessionId: number,
): Promise<QueuedWorkoutAction[]> {
  const queue = await readQueue();
  return queue.filter((action) => action.sessionId === sessionId);
}

export async function enqueueWorkoutAction(
  action: EnqueueWorkoutAction,
): Promise<QueuedWorkoutAction> {
  const queue = await readQueue();
  const nextAction = queuedWorkoutActionSchema.parse({
    ...action,
    id: action.id ?? generateQueueId(),
  });
  queue.push(nextAction);
  await writeQueue(queue);
  return nextAction;
}

export async function removeQueuedWorkoutActionById(id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((action) => action.id !== id));
}

export async function replaceQueuedCreateSetAction(
  sessionId: number,
  tempKey: string,
  payload: z.infer<typeof createQueuedSetSchema.shape.payload>,
): Promise<QueuedWorkoutAction | null> {
  const queue = await readQueue();
  let updatedAction: QueuedWorkoutAction | null = null;

  const nextQueue = queue.map((action) => {
    if (
      action.type === "createSet" &&
      action.sessionId === sessionId &&
      action.tempKey === tempKey
    ) {
      updatedAction = queuedWorkoutActionSchema.parse({
        ...action,
        payload,
      });
      return updatedAction;
    }

    return action;
  });

  if (!updatedAction) {
    return null;
  }

  await writeQueue(nextQueue);
  return updatedAction;
}

export async function removeQueuedWorkoutActionByTempKey(
  sessionId: number,
  tempKey: string,
): Promise<void> {
  const queue = await readQueue();
  await writeQueue(
    queue.filter((action) => {
      if (action.sessionId !== sessionId) {
        return true;
      }

      return !("tempKey" in action) || action.tempKey !== tempKey;
    }),
  );
}

export async function clearQueuedWorkoutActions(): Promise<void> {
  await AsyncStorage.removeItem(WORKOUT_QUEUE_STORAGE_KEY);
}

export async function replayQueuedWorkoutActions(
  queryClient: QueryClient,
): Promise<number> {
  if (replayPromise) {
    return replayPromise;
  }

  replayPromise = (async () => {
    const queue = await readQueue();
    if (queue.length === 0) {
      return 0;
    }

    const remaining: QueuedWorkoutAction[] = [];
    const touchedSessionIds = new Set<number>();
    let processed = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const action = queue[index];

      try {
        if (action.type === "createSet") {
          await createExerciseSet(action.sessionId, action.payload);
        } else if (action.type === "updateSet") {
          await updateExerciseSet(action.sessionId, action.setId, action.payload);
        } else if (action.type === "deleteSet") {
          await deleteExerciseSet(action.sessionId, action.setId);
        } else {
          await updateWorkoutSession(action.sessionId, action.payload);
        }

        touchedSessionIds.add(action.sessionId);
        processed += 1;
      } catch (error) {
        if (isApiError(error) && (error.isNetworkError || error.statusCode === 401)) {
          remaining.push(action, ...queue.slice(index + 1));
          break;
        }
      }
    }

    await writeQueue(remaining);

    for (const sessionId of touchedSessionIds) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.detail(sessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
    }

    if (touchedSessionIds.size > 0) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
    }

    return processed;
  })();

  try {
    return await replayPromise;
  } finally {
    replayPromise = null;
  }
}
