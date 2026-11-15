# Demo runbook

How to run Outpost live for the YC Consumer Mobile Hackathon demo on Sunday, November 15, 2026. It assumes the Convex functions are deployed, the server variables are set, and the demo user's Zernio accounts are linked. Setup for each part is in [outpost/README.md](../README.md).

The demo needs three things running: the Convex deployment (cloud, always on), the studio worker on the laptop, and the Release build on the phone.

## The night before

1. **Check the demo user.**

   ```sh
   cd outpost
   npx convex run admin:users
   ```

   Note the user id, the mode, the pace and whether the queue is paused.

2. **Set the posting mode.** `public` posts to YouTube and Instagram for real. `private` posts YouTube as private and skips Instagram. `dryRun` posts nothing.

   ```sh
   npx convex run admin:setMode '{"userId": "<id>", "mode": "public"}'
   ```

3. **Fill the Feed.** Leave the studio running so the user has the full buffer of 10 videos queued, in progress or ready.

4. **Set up the Away card.** Tap Collect on the phone, then leave the app closed. The card opens at launch only when more than 20 minutes have passed since the last Collect and something happened since then (videos made, posts live, views or sales).

5. **Put the widget on the home screen.** It shows the streak, the videos waiting, and what happened since the last Collect.

## On the laptop

Do these in order, about 30 minutes before the demo.

1. **Plug in the laptop and keep it awake.** Keep the lid open and run `caffeinate -dimsu` in a spare terminal. If the laptop sleeps, the studio stops sending heartbeats. After 25 seconds the app shows the studio offline and the agents doze.

2. **Open Compound Beta and leave it open.** The worker drives Compound's CLI from the app bundle and renders into a Compound project. If Compound quits, the worker exits.

3. **Start the studio worker in a loop.**

   ```sh
   cd outpost
   while true; do node studio/worker.mjs; sleep 3; done
   ```

   Wait for `studio ready`. The loop matters. The worker exits when Compound or the voice server dies or hangs, and the loop brings it back in 3 seconds. A job it dropped goes back to the queue within about 3 minutes.

4. **Check the studio from the phone.** On the Base, the windows glow, the Studio plate does not say "Asleep", and an agent you tap does not say "Asleep. Open the studio laptop to wake us up." The Feed's header line does not say "Studio offline".

You don't need `npx convex dev` running for the demo. The functions are already deployed.

## On the phone

1. **Install the Release build.**

   ```sh
   cd outpost
   npx expo run:ios --configuration Release --device
   ```

   A Release build bundles the JavaScript, so it doesn't need Metro. A development build would need the laptop's Metro server on stage.

2. **Connect to a network you trust.** The app needs Convex. The planning notes name a phone hotspot as the fallback for venue Wi-Fi.

3. **Turn the volume up.** The app plays its sounds with the ring switch off, but not muted by volume.

4. **Mirror the screen.** The planning notes use QuickTime over USB to show the phone on the projector.

## Demo flow

A short version of the flow.

1. **Open the app.** The "While you were away" card counts out what the agents did. Tap **Collect**. The views and sales fly into the header counters.
2. **The Base.** Tap an agent to hear what it is doing. Tap **REVIEW** to open the Feed.
3. **Post one.** Swipe right. "+1 APPROVED" pops. If it is the first approval today, the streak banner takes the screen. The post tray shows each platform go from Posting to Live. Tap Live to open the post.
4. **Remake one.** Swipe left, pick **Hook too slow**. "Remaking it" shows. A few cards later the remade video comes back tagged "Remade · shorter hook".
5. **The Scout.** After every 3 swipes a Scout card shows a paid Whop product. **MAKE IT** queues a video about it.
6. **The raid.** Back on the Base, tap **RAID**, then **Start** on "Open a shop". The raid card ticks off Product, Checkout and Sale alerts. Tap **Test checkout** and pay with Whop's sandbox test card. When the browser closes, the First sale star lights, the banner plays, and the Shop rises.
7. **Under the hood.** Tap the gear. Every call from that run is listed live with the service that made it: Claude, Kokoro, Compound, Convex, Zernio, Whop and Supermemory. The taste notes and what Supermemory learned are at the bottom.
8. **You.** The streak, the milestone path, and the live videos with their views.

## What not to tap before the demo

On the demo phone and the demo user, these taps use up a moment that only happens once, or post for real. Leave them for the stage.

| Don't | Why |
|---|---|
| Swipe right or tap POST, in `public` mode | It posts to YouTube and Instagram publicly. It can't be undone from the app |
| Approve any video on demo day before the demo | Only the day's first approval brings up the streak banner. The day follows the phone's time zone |
| Approve several videos in the hour before | Each platform posts a burst of 2, then one more every 20 minutes. Extra approvals push the stage post into a later slot, and its pill shows a time instead of Live |
| Open the app in the last 20 minutes | If the Away card opens, Collect is the only way to close it, and Collect resets what the next card counts. If it opens by mistake, force-quit the app instead |
| Tap RAID and Start | A user has one shop raid. Starting it early means the setup steps won't play on stage |
| Tap Test checkout and pay | The first sale lights its star, plays the banner and raises the Shop once |
| Tap MAKE IT or SKIP on the Scout card | Each find shows once. When finds run low, the next search can wait up to 6 hours |
| Run `admin:wipeVideos` or `admin:requeueReady` | Both delete the videos the Feed is holding for the demo |

Remakes are safe before the demo, but each reason becomes a taste note in Supermemory and shows on Under the hood.

## If something goes wrong

| Problem | What to do |
|---|---|
| "Studio offline" in the Feed, agents asleep | Check the worker terminal and that Compound Beta is open. The loop restarts the worker in 3 seconds |
| Feed is empty and the studio is online | Videos may have failed twice. Run `npx convex run admin:requeueFailed` |
| A post fails or posting misbehaves | Switch the user to `dryRun` with `admin:setMode`. Swipes still count for the streak |
| Posts should wait | `npx convex run admin:setPaused '{"userId": "<id>", "paused": true}'`. Resume with `false` |
| A raid step shows an error | Tap **Try again** on the raid card. "Waiting on the Whop key" means `WHOP_API_KEY` is not set on Convex |
| A sandbox payment doesn't show | Stay on the Base. It keeps Convex polling Whop every 4 seconds while it is on screen |
| The Away card doesn't open | It needs news since the last Collect and more than 20 minutes since that Collect. Background the app for 20 minutes or relaunch |
