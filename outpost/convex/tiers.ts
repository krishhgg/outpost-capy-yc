import type { Doc } from "./_generated/dataModel";

// Taste tiers and the bounties each one opens. src/ui/Tier.tsx gives them colors and icons; bounties.ts uses them to
// gate Take. Whop pays users directly, so a tier only changes which bounties you can take, never what one pays.
export const TIER_STEPS = [
  { key: "settler", name: "Settler", min: 0, ratePer1kCents: 0 },
  { key: "curator", name: "Curator", min: 40, ratePer1kCents: 200 },
  { key: "showrunner", name: "Showrunner", min: 60, ratePer1kCents: 400 },
  { key: "tastemaker", name: "Tastemaker", min: 80, ratePer1kCents: 600 },
] as const;
export type TierStep = (typeof TIER_STEPS)[number];

export function tierAt(score: number): TierStep {
  return [...TIER_STEPS].reverse().find(t => score >= t.min) ?? TIER_STEPS[0];
}

// The tier a bounty needs, by what it pays per 1K views: $2 Curator, $4 Showrunner, $6 Tastemaker. A bounty paid per
// approved post stays open to everyone.
export function bountyTier(b: Pick<Doc<"bounties">, "rewardKind" | "ratePer1kCents">): TierStep {
  if (b.rewardKind !== "per_view") return TIER_STEPS[0];
  const rate = b.ratePer1kCents ?? 0;
  return [...TIER_STEPS].reverse().find(t => rate >= t.ratePer1kCents) ?? TIER_STEPS[0];
}
