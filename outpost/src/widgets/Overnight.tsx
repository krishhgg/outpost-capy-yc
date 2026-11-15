import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, padding, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

// Already formatted by the app: the widget runs in its own runtime and can't import helpers.
export type OvernightProps = {
  streak: number;  // days in the streak
  kept: boolean;   // a video was approved today, so today counts
  ready: number;   // videos waiting for review
  gained: string;  // views since the user last tapped Collect, like "+1.2K", or "" when there were none
  total: string;   // all views on live posts, or "" when there are none
  made: number;    // videos made since the user last tapped Collect
  posted: number;  // posts that went live since then
  sales: string;   // "" when there were none
  updated: string; // clock time the app last refreshed this
};

// The home-screen widget leads with the streak and what's waiting, which hold all day, then what the agents did while
// you were away, which Collect resets. Rows that would say 0 are left out. The app refreshes it whenever its numbers
// change, and the next day starts at midnight with today not kept yet.
// The app's header wood with gold numbers, so it looks like a piece of the Base on the home screen.
const Overnight = (p: OvernightProps, env: WidgetEnvironment) => {
  "widget";
  const bg = containerBackground("#3A2618", "widget");
  const fill = frame({ maxWidth: 10000, maxHeight: 10000, alignment: "topLeading" });
  const small = env.widgetFamily !== "systemMedium";
  const day = p.streak > 0 ? `Day ${p.streak}` : "No streak";
  const today = p.kept ? "Kept today" : p.streak > 0 ? "Today not kept yet" : "Approve one to start";
  const headline = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ size: 11, weight: "heavy" }), foregroundStyle("#FFF5DC")]}>OUTPOST</Text>
      <Spacer />
      <HStack spacing={4}>
        <Image systemName="flame.fill" size={26} color={p.kept ? "#FF8A2B" : "#8A6E50"} />
        <Text modifiers={[font({ size: 30, weight: "black", design: "rounded" }), foregroundStyle("#FFD23F"), lineLimit(1), minimumScaleFactor(0.5)]}>{day}</Text>
      </HStack>
      <Text modifiers={[font({ size: 12, weight: "bold" }), foregroundStyle(p.kept ? "#D6BA8C" : "#FFB066"), lineLimit(1), minimumScaleFactor(0.8)]}>{today}</Text>
      {small && p.ready > 0 ? <Text modifiers={[font({ size: 13, weight: "heavy", design: "rounded" }), foregroundStyle("#FFF5DC"), lineLimit(1), minimumScaleFactor(0.6), padding({ top: 4 })]}>{`${p.ready} to review`}</Text> : null}
      <Spacer />
      <Text modifiers={[font({ size: 10, weight: "medium" }), foregroundStyle("#A88B68")]}>{`Updated ${p.updated}`}</Text>
    </VStack>
  );
  if (small) {
    return <VStack alignment="leading" modifiers={[fill, bg, widgetURL("outpost://")]}>{headline}</VStack>;
  }
  const row = (label: string, value: string) => (
    <VStack alignment="leading" spacing={1}>
      <Text modifiers={[font({ size: 18, weight: "heavy", design: "rounded" }), foregroundStyle("#FFD23F"), lineLimit(1), minimumScaleFactor(0.6)]}>{value}</Text>
      <Text modifiers={[font({ size: 11, weight: "semibold" }), foregroundStyle("#D6BA8C")]}>{label}</Text>
    </VStack>
  );
  // At most three rows, most useful first.
  const rows: [string, string][] = [];
  if (p.ready > 0) rows.push([p.ready === 1 ? "video to review" : "videos to review", String(p.ready)]);
  if (p.gained) rows.push([p.gained === "+1" ? "view while away" : "views while away", p.gained]);
  if (p.sales) rows.push(["in sales", p.sales]);
  if (p.total) rows.push([p.total === "1" ? "view in total" : "views in total", p.total]);
  if (p.made > 0) rows.push([p.made === 1 ? "video made" : "videos made", String(p.made)]);
  if (p.posted > 0) rows.push([p.posted === 1 ? "post went live" : "posts went live", String(p.posted)]);
  return (
    <HStack alignment="top" spacing={16} modifiers={[fill, bg, widgetURL("outpost://")]}>
      {headline}
      <VStack alignment="leading" spacing={8} modifiers={[padding({ top: 2 })]}>
        {rows[0] ? row(rows[0][0], rows[0][1]) : null}
        {rows[1] ? row(rows[1][0], rows[1][1]) : null}
        {rows[2] ? row(rows[2][0], rows[2][1]) : null}
      </VStack>
    </HStack>
  );
};

export default createWidget<OvernightProps>("Overnight", Overnight, {
  streak: 0, kept: false, ready: 0, gained: "", total: "", made: 0, posted: 0, sales: "", updated: "never",
});
