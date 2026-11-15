import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type Source = Omit<Doc<"sources">, "_id" | "_creationTime" | "localKey"> & { id: Id<"sources"> };

// The bounty's source footage and its download status. Never the laptop path.
export const list = query({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (): Promise<Source[]> => [],
});

// Creates a pending row for each of the bounty's sourceUrls that has none yet.
export const enqueue = internalMutation({
  args: { bountyId: v.id("bounties") },
  handler: async (): Promise<null> => null,
});
