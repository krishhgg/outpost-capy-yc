import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { setAudioModeAsync } from "expo-audio";
import { Jersey10_400Regular } from "@expo-google-fonts/jersey-10";
import { Jersey15_400Regular } from "@expo-google-fonts/jersey-15";
import { Session } from "../session";
import { Away } from "../Away";
import { WidgetSync } from "../WidgetSync";
import { DEEP } from "../pixel";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

// iOS mutes the default audio session when the ring switch is off, so without this the clicks, chimes and the Away
// card's collect would be silent on a phone set to silent until a video started playing. Mixing leaves the user's
// own music playing under them.
setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" }).catch(() => {});

// A link straight to /hood still loads the tabs underneath, so Done has somewhere to go back to.
export const unstable_settings = { anchor: "(tabs)" };

// The tabs, with the under-the-hood page full screen on top, and the away screen over whichever tab is showing.
export default function Layout() {
  // The pixel font is bundled with the app, so this resolves on the first frame or two. A font that fails to load
  // falls back to the system font rather than holding the app on a blank screen.
  const [loaded, error] = useFonts({ Jersey10_400Regular, Jersey15_400Regular });
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: DEEP }}>
      <ConvexProvider client={convex}>
        <StatusBar style="light" />
        <Session>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: DEEP } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="hood" options={{ presentation: "fullScreenModal" }} />
          </Stack>
          <Away />
          <WidgetSync />
        </Session>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
