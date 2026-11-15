import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("studio sweep", { minutes: 1 }, internal.studio.sweep, {});
crons.interval("read views", { minutes: 20 }, internal.views.sync, {});
crons.interval("sync bounties", { minutes: 15 }, internal.bounties.sync, {});
crons.interval("poll submissions", { minutes: 10 }, internal.submit.poll, {});
crons.interval("agent tick", { minutes: 5 }, internal.agent.tick, {});
export default crons;
