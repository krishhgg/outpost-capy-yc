import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("studio sweep", { minutes: 1 }, internal.studio.sweep, {});
crons.interval("read views", { minutes: 20 }, internal.views.sync, {});
export default crons;
