import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

import { PATHS, type PathDef } from "./MuscleSVG.paths";
import { getMuscleForPath } from "./MuscleSVG.utils";

const SVG_VIEWBOX = "0 0 1280 832";
const ASPECT_RATIO = 1280 / 832;

type MuscleDataItem = {
  name: string;
  score: number;
  color: string;
  isActive: boolean;
};

type MuscleSVGProps = {
  muscleData: MuscleDataItem[];
  selectedMuscle: string | null;
  onMuscleTap: (muscleName: string) => void;
  width: number;
};

function getPathFill(
  def: PathDef,
  pathIndex: number,
  dataMap: Map<string, MuscleDataItem>,
  selectedMuscle: string | null,
  _defaultState: "heatmap" | "neutral" | "top-highlight",
): string {
  if (!def.isMuscle) return def.fill;

  const muscleName = getMuscleForPath(pathIndex);
  if (!muscleName) return "#E8E8E8";

  const item = dataMap.get(muscleName);
  if (!item) return "#E8E8E8";

  if (!item.isActive) return "#E8E8E8";

  return item.color;
}

function getPathOpacity(
  def: PathDef,
  pathIndex: number,
  dataMap: Map<string, MuscleDataItem>,
  selectedMuscle: string | null,
): number {
  if (!def.isMuscle) return 1;

  const muscleName = getMuscleForPath(pathIndex);
  if (!muscleName) return 1;

  const item = dataMap.get(muscleName);
  if (!item) return 1;

  if (!item.isActive) return 1;

  if (selectedMuscle) {
    return muscleName === selectedMuscle ? 1 : 0.2;
  }

  // Heatmap: scale opacity from 0.3 to 1.0 based on score
  return 0.3 + (item.score / 100) * 0.7;
}

export function MuscleSVG({ muscleData, selectedMuscle, onMuscleTap, width }: MuscleSVGProps) {
  const height = width / ASPECT_RATIO;

  const dataMap = useMemo(() => {
    const map = new Map<string, MuscleDataItem>();
    for (const item of muscleData) {
      map.set(item.name, item);
    }
    return map;
  }, [muscleData]);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={SVG_VIEWBOX}>
        <Defs>
          <LinearGradient id="gradient_0" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#3A3A3A" stopOpacity="1" />
            <Stop offset="100%" stopColor="#3A3A3A" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="gradient_1" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#3A3A3A" stopOpacity="0" />
            <Stop offset="100%" stopColor="#3A3A3A" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {PATHS.map((def, index) => {
          if (!def.isMuscle) {
            if (def.isBackground) {
              return <Path key={def.id} d={def.d} fill="transparent" opacity={0} />;
            }
            return <Path key={def.id} d={def.d} fill={def.fill} opacity={1} />;
          }

          const muscleName = getMuscleForPath(index);
          const fill = getPathFill(def, index, dataMap, selectedMuscle, "heatmap");
          const opacity = getPathOpacity(def, index, dataMap, selectedMuscle);

          return (
            <Path
              key={def.id}
              d={def.d}
              fill={fill}
              opacity={opacity}
              onPress={() => {
                if (muscleName) onMuscleTap(muscleName);
              }}
            />
          );
        })}
      </Svg>
    </View>
  );
}
