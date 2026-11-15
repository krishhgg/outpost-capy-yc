import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY = "outpost.device";

// A random 64-character secret that names this phone's user. It never leaves the device except to Convex.
export async function deviceId(): Promise<string> {
  const have = await SecureStore.getItemAsync(KEY);
  if (have) return have;
  const id = (Crypto.randomUUID() + Crypto.randomUUID()).replace(/-/g, "");
  await SecureStore.setItemAsync(KEY, id);
  return id;
}
