import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type Summary = {
  pendingCents: number;
  approvedCents: number;
  perVideo: {
    videoId: Id<"videos">;
    bountyId: Id<"bounties">;
    brand: string;
    url: string | null;
    views: number;
    estCents: number;
    status: Doc<"submissions">["status"] | null;
  }[];
  tasteScore: number;
  tasteTrend: number;
  settledCount: number;
};

export const summary = query({
  args: { deviceId: v.string() },
  handler: async (): Promise<Summary> => ({
    pendingCents: 0, approvedCents: 0, perVideo: [], tasteScore: 0, tasteTrend: 0, settledCount: 0,
  }),
});
