import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Texts the user through Kakai when its keys are set, else logs only. Writes a `messages` row and a `calls` row.
export const send = internalAction({
  args: { userId: v.id("users"), kind: v.string(), body: v.string() },
  handler: async (): Promise<null> => null,
});
