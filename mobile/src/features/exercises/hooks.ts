import React from "react";
import { useInfiniteQuery, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getExerciseDetail, getExerciseFilters, listExercises, type ExerciseSearchParams } from "./api";
import { queryKeys } from "../../lib/api/queryKeys";
import type { ExerciseDetail, ExerciseListResponse, ExerciseSummary } from "./schemas";

const PAGE_SIZE = 50;

export function useExerciseFiltersQuery() {
  return useQuery({
    queryKey: queryKeys.exercises.filters,
    queryFn: getExerciseFilters,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useExercisesInfiniteQuery(filters: ExerciseSearchParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.exercises.list({ ...filters, limit: PAGE_SIZE }),
    queryFn: ({ pageParam }) =>
      listExercises({
        ...filters,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useExercisesQuery(filters: ExerciseSearchParams) {
  return useQuery({
    queryKey: queryKeys.exercises.list({ ...filters, limit: PAGE_SIZE, offset: 0 }),
    queryFn: () =>
      listExercises({
        ...filters,
        limit: PAGE_SIZE,
        offset: 0,
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExerciseDetailQuery(exerciseId: string | undefined) {
  return useQuery({
    queryKey: exerciseId ? queryKeys.exercises.detail(exerciseId) : ["exercises", "detail", "missing"],
    queryFn: () => getExerciseDetail(exerciseId!),
    enabled: Boolean(exerciseId),
    staleTime: 30 * 60 * 1000,
  });
}

export function useExerciseLookupQueries(exerciseIds: string[]) {
  const queryClient = useQueryClient();
  const uniqueIds = React.useMemo(
    () => Array.from(new Set(exerciseIds.filter(Boolean))),
    [exerciseIds],
  );

  const getCachedExerciseSummary = React.useCallback(
    (exerciseId: string): ExerciseSummary | undefined => {
      const cachedQueries = queryClient.getQueriesData<{
        pages: ExerciseListResponse[];
      }>({
        queryKey: ["exercises", "list"],
      });

      for (const [, data] of cachedQueries) {
        const foundExercise = data?.pages
          ?.flatMap((page) => page.items)
          .find((item) => item.id === exerciseId);

        if (foundExercise) {
          return foundExercise;
        }
      }

      return undefined;
    },
    [queryClient],
  );

  const results = useQueries({
    queries: uniqueIds.map((exerciseId) => ({
      queryKey: queryKeys.exercises.detail(exerciseId),
      queryFn: () => getExerciseDetail(exerciseId),
      placeholderData: () => {
        const cachedSummary = getCachedExerciseSummary(exerciseId);
        if (!cachedSummary) {
          return undefined;
        }

        return {
          ...cachedSummary,
          instructions: [],
          secondary_muscles: [],
        } satisfies ExerciseDetail;
      },
      staleTime: 30 * 60 * 1000,
    })),
  });

  const map = React.useMemo(() => {
    return uniqueIds.reduce<Record<string, ExerciseDetail | undefined>>((acc, exerciseId, index) => {
      acc[exerciseId] = results[index]?.data;
      return acc;
    }, {});
  }, [results, uniqueIds]);

  return {
    map,
    isLoading: results.some((result) => result.isLoading),
    isFetching: results.some((result) => result.isFetching),
  };
}
