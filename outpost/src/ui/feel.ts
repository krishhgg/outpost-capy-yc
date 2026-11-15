import * as Haptics from "expo-haptics";
import { click, tick } from "../click";

// How a press feels: the shared click plus a haptic, so every primitive answers a tap the same way the village does.
//   tap      click + selection tick (chips in a row, toggles, links)
//   press    click + light impact (buttons, cards)
//   commit   click + medium impact (one-tap edits that queue work, Take)
//   success  tick + success notification (something landed: a toast, a tier-up)
//   none     silent
export type Feel = "tap" | "press" | "commit" | "success" | "none";

export function feel(kind: Feel) {
  if (kind === "none") return;
  if (kind === "success") {
    tick();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return;
  }
  click();
  if (kind === "tap") Haptics.selectionAsync().catch(() => {});
  else Haptics.impactAsync(kind === "commit" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
