import { AppIcon } from "../../design-system/icons/AppIcon";

export type IconName = string;

export function Icon(props: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
}) {
  return <AppIcon {...props} />;
}
