import { Image, type ImageStyle, type StyleProp } from "react-native";
import type { Who } from "./Agents";

// Head-and-shoulders windows (art/sprites.py), shown wherever an agent speaks so the work has a face.
const PORTRAITS: Record<Who, number> = {
  writer: require("../assets/base/portrait-writer.png"),
  director: require("../assets/base/portrait-director.png"),
  courier: require("../assets/base/portrait-courier.png"),
  merchant: require("../assets/base/portrait-merchant.png"),
};

export function Portrait({ who, style }: { who: Who; style?: StyleProp<ImageStyle> }) {
  // 42 pt is the art's own size on a 3x screen, so the pixels stay square.
  return <Image source={PORTRAITS[who]} style={[{ width: 42, height: 42 }, style]} />;
}
