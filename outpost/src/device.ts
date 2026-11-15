import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY = "outpost.device";
const FIXED = process.env.EXPO_PUBLIC_DEVICE_ID;

// A random 64-character secret that names this phone's user. It never leaves the device except to Convex.
// A build can pin it with EXPO_PUBLIC_DEVICE_ID, so every install of that build is the same user.
export async function deviceId(): Promise<string> {
  if (FIXED) return FIXED;
  const have = await SecureStore.getItemAsync(KEY);
  if (have) return have;
  const id = (Crypto.randomUUID() + Crypto.randomUUID()).replace(/-/g, "");
  await SecureStore.setItemAsync(KEY, id);
  return id;
}
