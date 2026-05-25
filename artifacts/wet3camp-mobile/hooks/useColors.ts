import { useColorScheme } from "react-native";
import colors from "@/constants/colors";

export function useColors() {
  const palette = "dark" in colors ? (colors as any).dark : (colors as any).light;
  return { ...palette, radius: colors.radius };
}
