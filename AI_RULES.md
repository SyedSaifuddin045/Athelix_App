# AI_RULES.md — Strict Coding Rules for AI Contributions

These rules are binding. Violations must be flagged and reverted.

## IMMUTABLE RULES

### 1. No Any for Navigation

```ts
// ❌ NEVER
function MyScreen({ navigation, route }: { navigation: any; route?: any }) {

// ✅ ALWAYS
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ScreenName">;
  route: RouteProp<RootStackParamList, "ScreenName">;
};
function MyScreen({ navigation, route }: Props) {
```

### 2. No Local Color Constants

```ts
// ❌ NEVER
const COLORS = { teal: "#FF5A36", ... };

// ✅ ALWAYS
import { COLORS } from "../theme/colors";
```

### 3. No Default Exports for Screens

```ts
// ❌ NEVER
export default function HomeScreen() {

// ✅ ALWAYS
export function HomeScreen() {
```

### 4. No Direct fetch() in Screens

```ts
// ❌ NEVER
const res = await fetch("/api/...");

// ✅ ALWAYS
const { data } = useTemplatesQuery(enabled);
```

### 5. No Imports from data.ts in Production Code

The file `src/data.ts` contains legacy mock data only. Do not import from it in screen/component code. If you need types from it, extract them to `src/types/` and migrate screen code to API-backed data.

### 6. Orval-Generated Files Are Read-Only

Files in `src/api/endpoints/` and `src/api/model/` are auto-generated. Do not edit them. Change `orval.config.ts` or the backend OpenAPI spec, then regenerate.

### 7. Mutations Belong in queries.ts or mutations.ts

```ts
// ❌ NEVER in screens
const mutation = useMutation({ ... });

// ✅ ALWAYS in queries.ts (or new src/api/mutations.ts)
export function useCreateTemplate() {
  return useMutation({
    mutationFn: (data: WorkoutTemplateCreate) => createWorkoutTemplateWorkoutTemplatesPost(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}
```

### 8. Query Keys Must Use the Factory

```ts
// ❌ NEVER
queryKey: ["templates"]

// ✅ ALWAYS
queryKey: queryKeys.templates
```

### 9. TypeScript strict must remain enabled

Never disable `strict: true` in `tsconfig.json`.

### 10. Analytics Events Must Use the Events Constant

```ts
// ❌ NEVER
capture("workout started", { ... });

// ✅ ALWAYS
import { Events } from "../analytics/events";
capture(Events.WORKOUT_STARTED, { ... });
```

## ENFORCEMENT

Run these before every commit:
```bash
npx tsc --noEmit    # Type checking
npx eslint .        # Linting (uses .eslintrc.js)
npx jest --ci       # Unit tests
```

## VIOLATIONS

If you encounter code that violates these rules:
1. Fix it immediately if the file is already being changed for another reason
2. File an issue if it's in a file not being actively worked on
3. Do NOT introduce new violations even in "temporary" or "quick fix" code
