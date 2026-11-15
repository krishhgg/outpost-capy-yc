import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useDevice } from "./session";
import { compact, localDay } from "./You";
import { useClock } from "./Feed";
import Overnight, { type OvernightProps } from "./widgets/Overnight";

// Keeps the home-screen widget on the streak, the videos waiting, and the numbers on the "While you were away" sheet.
// The widget can't fetch, so it shows what the app last saw, with the time it saw it, plus an entry at each of the next
// few midnights that marks the new day not kept yet, with the streak as it will stand then.
export function WidgetSync() {
  const device = useDevice();
  const on = device && Platform.OS === "ios";
  const phoneDay = localDay(useClock(60_000));
  const d = useQuery(api.away.summary, on ? { deviceId: device } : "skip");
  const you = useQuery(api.you.summary, on ? { deviceId: device, phoneDay } : "skip");
  const status = useQuery(api.feed.status, on ? { deviceId: device } : "skip");
  const last = useRef("");
  useEffect(() => {
    if (!d || !you || !status) return;
    const gained = Math.max(0, d.views.to - d.views.from);
    const props: Omit<OvernightProps, "updated"> = {
      streak: you.streak,
      kept: you.todayDone,
      ready: status.studio.ready,
      gained: gained > 0 ? `+${compact(gained)}` : "",
      total: d.views.to > 0 ? compact(d.views.to) : "",
      made: d.made,
      posted: d.posted,
      sales: d.sales.count ? `$${(d.sales.netCents / 100).toFixed(2)}${d.sales.test ? " test" : ""}` : "",
    };
    const key = JSON.stringify([props, you.nextStreaks]);
    if (key === last.current) return;
    last.current = key;
    const updated = new Date(d.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const midnight = (i: number) => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      t.setDate(t.getDate() + 1 + i);
      return t;
    };
    try {
      Overnight.updateTimeline([
        { date: new Date(), props: { ...props, updated } },
        ...you.nextStreaks.map((streak, i) => ({ date: midnight(i), props: { ...props, streak, kept: false, updated } })),
      ]);
    } catch (e) {
      console.warn("widget update failed", e);
    }
  }, [d, you, status]);
  return null;
}
