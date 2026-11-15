/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as away from "../away.js";
import type * as crons from "../crons.js";
import type * as feed from "../feed.js";
import type * as hood from "../hood.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as memory from "../memory.js";
import type * as pace from "../pace.js";
import type * as post from "../post.js";
import type * as raids from "../raids.js";
import type * as scout from "../scout.js";
import type * as studio from "../studio.js";
import type * as views from "../views.js";
import type * as whop from "../whop.js";
import type * as you from "../you.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  away: typeof away;
  crons: typeof crons;
  feed: typeof feed;
  hood: typeof hood;
  http: typeof http;
  lib: typeof lib;
  memory: typeof memory;
  pace: typeof pace;
  post: typeof post;
  raids: typeof raids;
  scout: typeof scout;
  studio: typeof studio;
  views: typeof views;
  whop: typeof whop;
  you: typeof you;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
