import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMutation } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import { api } from "../convex/_generated/api";
import { deviceId } from "./device";
import { DEEP } from "./pixel";

// The island splash stays up until this phone's user is found, so launch goes from the splash straight to the Base.
SplashScreen.preventAutoHideAsync().catch(() => {});

const Ctx = createContext<{ device: string | null; error: string | null }>({ device: null, error: null });

// Finds or makes this phone's user once, then shares the device id with every tab.
export function Session({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ensure = useMutation(api.feed.ensureUser);
  useEffect(() => {
    (async () => {
      const id = await deviceId();
      await ensure({ deviceId: id, tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Los_Angeles" });
      setDevice(id);
    })().catch(e => setError(typeof e?.data === "string" ? e.data : String(e?.message ?? e)));
    // On a slow network, show the status line below rather than hold the splash.
    const t = setTimeout(SplashScreen.hide, 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { if (device || error) SplashScreen.hide(); }, [device, error]);
  return <Ctx.Provider value={{ device, error }}>{children}</Ctx.Provider>;
}

// This phone's device id, or null until the user is found or made.
export const useDevice = () => useContext(Ctx).device;

// Renders the screen once the device is known, a short status line until then.
export function WithDevice({ children }: { children: (device: string) => ReactNode }) {
  const { device, error } = useContext(Ctx);
  if (device) return <>{children(device)}</>;
  return (
    <View style={s.screen}>
      <Text style={s.center}>{error ?? "Opening the outpost…"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DEEP },
  center: { color: "#fff", textAlign: "center", marginTop: 320, fontSize: 16, paddingHorizontal: 30 },
});
