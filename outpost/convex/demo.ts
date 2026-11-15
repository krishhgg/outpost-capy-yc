import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// Gives the user the demo Instagram and YouTube connections from the DEMO_CONNECTIONS env var. Runs on every
// ensureUser, so it must be idempotent.
export async function attachDemoAccounts(ctx: MutationCtx, userId: Id<"users">) {}
