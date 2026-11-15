import { useSyncExternalStore } from "react";

// The Away card hands its loot to the Base's header counters, the way a game's collect button sends resources into
// the resource bar. While the card is open, the counters hold back what it is about to give. Collect flies the loot
// in, and each counter climbs as its icons land.
export type Pending = { views: number; cents: number };
const NONE: Pending = { views: 0, cents: 0 };
let pending = NONE;
const subs = new Set<() => void>();
export function setPending(p: Pending) {
  pending = p;
  subs.forEach(f => f());
}
export const getPending = () => pending;
export const clearPending = () => setPending(NONE);
export function usePending() {
  return useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb); }; }, () => pending);
}

// Whether the Away card is up, or may still come up: true from launch until its first check finds nothing to show,
// and again whenever it opens. The Base holds its own moments until the card is out of the way.
let awayUp = true;
const awaySubs = new Set<() => void>();
export function setAwayUp(v: boolean) {
  if (v === awayUp) return;
  awayUp = v;
  awaySubs.forEach(f => f());
}
export function useAwayUp() {
  return useSyncExternalStore(cb => { awaySubs.add(cb); return () => { awaySubs.delete(cb); }; }, () => awayUp);
}

// Where things sit on screen. Header counters register their icon by testID, so loot knows where to land.
type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };
export type Point = { x: number; y: number };
export const targets = new Map<string, Measurable>();
export function centerOf(el: Measurable | null | undefined): Promise<Point | null> {
  if (!el) return Promise.resolve(null);
  return new Promise(done => el.measureInWindow((x, y, w, h) => done(w > 0 && h > 0 ? { x: x + w / 2, y: y + h / 2 } : null)));
}
