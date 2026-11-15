# The app

The app is an Expo Router app in `outpost/src/`. Routes are files under `src/app/`. Screens and shared pieces sit next to it in `src/`. The app only talks to Convex. The functions it calls are listed in [backend.md](backend.md).

## Routes

| Route | File | Screen | Component |
|---|---|---|---|
| `/` | `src/app/(tabs)/index.tsx` | Base (the app opens here) | `src/Base.tsx` |
| `/feed` | `src/app/(tabs)/feed.tsx` | Feed | `src/Feed.tsx` |
| `/you` | `src/app/(tabs)/you.tsx` | You | `src/You.tsx` |
| `/hood` | `src/app/hood.tsx` | Under the hood, full-screen modal | `src/Hood.tsx` |

`src/app/_layout.tsx` is the root. It loads the Jersey pixel fonts, creates the Convex client from `EXPO_PUBLIC_CONVEX_URL`, sets the audio session to play with the ring switch off, and wraps everything in `Session`. The Away card (`src/Away.tsx`) and the widget sync (`src/WidgetSync.tsx`) mount here too, so they work over any tab.

`src/app/(tabs)/_layout.tsx` sets the tab order: Feed, Base, You. The Feed tab carries a badge with the number of ready videos. The tab bar is drawn by `src/TabBar.tsx`.

## Startup

1. `src/session.tsx` holds the splash screen.
2. `src/device.ts` reads or makes the device id in the keychain, unless the build pins one with `EXPO_PUBLIC_DEVICE_ID`.
3. `feed.ensureUser` finds or creates the user. This also fills the video queue and may start a Scout search.
4. The splash hides. If Convex is slow, it hides after 4 seconds and the screen says "Opening the outpost…". If the user cap is hit, it shows "Outpost is full right now."

## Base (`/`)

The Base is a pixel-art village (`assets/base/`, drawn by the scripts in `outpost/art/`). Each building stands for a part of the business.

### Header

Three counters, each a button:

| Counter | Shows | Tap goes to |
|---|---|---|
| Flame | The streak. Lit once today is kept | You |
| Eye | Total views on live posts | You |
| Coin | Real earnings. With only test sales, the raid's test total with a "test" tag | The raid card, or the raid picker if no raid exists |

The gear at the right opens `/hood`.

### Buildings and plates

Each building has a wooden plate with its name and what it is doing. Tapping a building or its plate goes somewhere.

| Building | Plate says | Tap goes to |
|---|---|---|
| Scout | "Writing a script", or "Idle" | Feed |
| Studio | The current step with four pips (Writing, Voicing, Rendering, Uploading), "Making a video", "Asleep" or "Idle" | Feed |
| Post | Views, or the posting mode: "Dry run", "Private test" or "Live" | You |
| Vault | Earnings, or the test total | Raid card or raid picker |
| Shop | Sales count and the raid's three stars. Rises out of the ground at the first sale | |

Bubbles over the roofs show what is ready to collect: the Studio's bubble shows the ready count and opens the Feed. The Scout's "New" bubble opens the Feed with the Scout's find next. A bubble bumps with a tick when its number changes.

The village also moves (`src/Ambient.tsx`). The campfire and lanterns flicker, the surf laps, boats bob, and cloud shadows drift. The Studio's chimney smokes while it makes a video. Windows glow while the studio laptop is online and go dark when it sleeps.

### Agents

Four agents walk the village (`src/Agents.tsx`). Tap one and it says what it is doing for 4.5 seconds. If its sentence points somewhere, tapping the bubble goes there.

| Agent | Works at | Says, for example | Bubble goes to |
|---|---|---|---|
| Writer | Scout | "I found a product to sell. Tap to see it." or "Writing your next script." | The Scout's find in the Feed |
| Director | Studio | "3 videos ready for you to review." or "Rendering the video." | Feed |
| Courier | Post | "Posting your video to YouTube and Instagram." or "Dry run. I skip the upload, so nothing posts." | You |
| Merchant | Shop | "No shop yet. Tap to open one on Whop." or "Shop is open. 2 sales so far." | Raid card or raid picker |

While an agent works, a small tag over its head names the job. With nothing to do, agents wait by the campfire. When the studio is offline they go home and doze, and each one says "Asleep. Open the studio laptop to wake us up."

Once per app session, after the Away card is gone, the agent with news speaks up by itself: a Scout find first, then videos to review, then views, then sales.

### Actions

Two big buttons under the village:

- **REVIEW n** opens the Feed. Its second line says what a swipe does today: keep or reach a streak, "Dry run · nothing posts", "Swipe right to post privately" or "Swipe right to post".
- **RAID** ("Open a shop on Whop") opens the raid picker. It goes away once a raid exists.

### Raid picker

A sheet with one raid to start, **Open a shop**, which sells a $9 Notion template through Whop. It shows the three stars and a Start button. Five more raids are shown as locked: Double down, Whop affiliate, Content Rewards, Dropshipping and Whop Bounties. None of them can start.

### Raid card

Once a raid exists, a card at the bottom of the Base shows it. It is titled "Opening a shop" during setup and "Your shop" once live.

- **Stars.** Halfway, First sale and Goal. A star that lights while you watch plays a sound and a haptic, and the card names it. A star that lit while you were elsewhere pops when you come back.
- **Progress bar.** Net money toward the $25 goal, after Whop's fees, with a notch at halfway.
- **Setup steps.** Product, Checkout and Sale alerts, until all three are done. A step in error shows **Try again**.
- **Share link** shares the checkout URL.
- **Test checkout** (or **Open store** outside sandbox) opens the checkout in an in-app browser. A sale made there waits until the browser closes before its star, chime and banner play.

The first sale also shows a "First sale · $9.00 · the Shop is open" banner and raises the Shop building.

While the Base is on screen and the raid is live, it calls `raids.watch` every 4 minutes so Convex keeps polling Whop.

## Feed (`/feed`)

The Feed is a deck of the studio's videos. Swipe each one to post it or send it back.

### Header strip

- Two counters: the streak and the videos ready.
- A mode tag: "Dry run · nothing posts", "Private test" or "Posting live".
- One line under them. It says "Studio offline · the laptop is asleep" when the worker's last heartbeat is more than 25 seconds old. If today isn't kept, it says what one post does, for example "Post 1 video to keep your 4-day streak" or "Post 1 video to reach a 7-day streak". Otherwise it names the studio's steps ("Studio · voicing, rendering"), the queue ("Studio · 3 queued") or "Studio · resting".

### The deck

- The top card plays its video in a gold frame, uncropped. The next two are preloaded and peek out behind it.
- A card remade from a reason has a "Remade · shorter hook" style tag. A video made from a Scout find has a "Scout pick · $9 Whop app" style tag.
- Segments along the top mark this session's swipes, gold for posted and orange for sent back. The current one fills as the video plays.
- The first card of a session leans right once with the POST stamp showing, so the gesture is clear. Any touch cancels it.
- Dragging past the throw point ticks once and pops the stamp before you let go.

### Swipes

| Action | What happens |
|---|---|
| Swipe right or tap **POST** | `feed.swipe` with `right`. "+1 APPROVED" pops with a sound. Posts are scheduled for YouTube and Instagram per the posting mode |
| Swipe left or tap **REMAKE** | Opens the reason sheet |

The reason sheet shows the outgoing hook on a card stamped REMAKE, then six reasons:

| Reason | What the studio does |
|---|---|
| Hook too slow | Rewrites the hook |
| Boring visuals | Same script, new palette |
| Voice | Same script, next voice |
| Too long | Cuts about a third of the words |
| Wrong topic | New video on another topic |
| Say more | Opens a text box. The studio applies your note |

Picking a reason shows "Remaking it · Hook too slow" with "It comes back in a few cards". The remake is queued ahead of fresh videos and lands just after the third card waiting. The reason also becomes a taste note in Supermemory.

**Just skip it** sends the video back with no reason. No remake is made.

If Convex rejects a swipe, the card comes back so the swipe can be made again.

### Scout cards

After every 3 swiped videos, if the Scout has a find, a Scout card comes up (`src/Scout.tsx`). It shows a paid product from the Whop marketplace: the search term, the listing's image, title, headline, price, members and rating.

- **MAKE IT** (or swipe right) queues a video on the problem the product solves.
- **SKIP** (or swipe left) drops it.

The Base's Scout bubble opens the Feed with `?find=<time>`, which brings the Scout card up next.

### Post tray

When the newest approved video changes state (approved, posting, live), a tray drops over the header for about 8 seconds. It has one pill per platform: Live (tap to open the post), Posting, a time for a held post, Dry run, Skipped or Failed. A pill that turns live while you watch pops with a tick. On the Feed's first load the tray only shows for a post still going out.

### Streak banner

The first approval of the day keeps the streak. While the Feed is open, that brings up the streak banner (`src/Payoff.tsx`): "DAY n", "Streak kept. Day n+1 starts tomorrow.", and the milestone path. On a milestone day (3, 7, 14 or 30), the banner says "n-DAY STREAK", turns gold rays behind it, rains pixel bits, and pops the milestone on the path with a chime.

### All caught up

With no cards left, the Feed shows "ALL CAUGHT UP": the streak if today is kept, the counts approved and sent back today, the milestone path, what the studio is doing, **See the Scout's find** if there is one, and **Back to Base**. If the studio is offline it says "The studio is offline. Open the laptop to make more." instead.

## You (`/you`)

The You tab (`src/You.tsx`) shows the streak and what the posts did. It reads `you.summary`.

- **Header.** Total views, and a line: "Today counts. Come back tomorrow.", "Approve one video today to keep it going." or "Approve a video to start a streak."
- **Streak card.** The streak number with a flame, a "Done today" or "Approve 1 today" chip, and this week's days (kept days show a flame, frozen days show ice, today pulses until kept).
- **Milestones.** A path through 3, 7, 14 and 30 days with "n more days to a 7-day streak".
- **Freezes.** How many are left. Each covers one missed day. A new user has 2.
- **See month.** A grid of the weeks before this one, starting at the first kept week. Hidden until there is one.
- **Totals.** In a dry run: Approved and Made, with sent back and skipped below. Otherwise: Approved, Videos live and Views, with posts, made, sent back, skipped and approvals that went out in a dry run.
- **Live now.** The top 3 live videos by views, each with a pill per platform that opens the post. "Show all" lists up to 8. A platform that hasn't counted any views yet says so once above the list. With nothing live it says why, and offers **Open the Feed** outside a dry run.

## Under the hood (`/hood`)

Opened from the gear on the Base header. It is a live log of every outside call for this user (`src/Hood.tsx`, query `hood.calls`).

- **Services.** Claude, Kokoro, Compound, Convex, Zernio, Whop and Supermemory, each with its role, the agent behind it, and its last call. A row flashes gold when the service makes a new call. Services with a missing key say "Waiting on its key".
- **Live calls.** The newest 5 calls, with "Show all" for up to 60. New rows slide in.
- **Taste notes.** The reasons you gave, each marked "In Supermemory", "Not in Supermemory yet" or "Supermemory refused it".
- **What Supermemory learned.** The learned lines, and a graph (`src/TasteGraph.tsx`) linking each note to the memories Supermemory made from it.

**Done** closes the screen.

## Away card

`src/Away.tsx` shows "While you were away" over whichever tab is open. It checks at launch and when the app returns after more than 20 minutes in the background. It opens only if something happened since the last Collect, and at launch only if that Collect was more than 20 minutes ago.

The card lists, one line at a time with a tick:

- videos made and posted (the Director),
- sales and their amount, labeled "Test sales" for sandbox payments (the Merchant),
- views gained (the Courier). When views are the only news they get the whole card.

Tap anywhere to show every line at once. **Collect** is the only way to close it. Collect plays a chime, flies coin and eye icons into the Base's header counters, and calls `away.collect` so the next card starts from here. If videos are ready, the button reads "Collect and review n" and goes to the Feed.

## Home-screen widget

`src/widgets/Overnight.tsx` is an iOS widget named "Outpost" in small and medium sizes, set up by the `expo-widgets` plugin in `app.json`. It shows the streak, whether today is kept, the videos waiting, total views, and the views gained, videos made, posts and sales since the last Collect. Rows that would say 0 are left out.

The widget can't fetch, so `src/WidgetSync.tsx` pushes a new timeline whenever the numbers change. The timeline has an entry for now and one for each of the next few midnights, each showing today not kept yet and the streak as it will stand that day.

## Shared pieces

| File | What it is |
|---|---|
| `src/pixel.tsx` | Colors, fonts, the bevelled `Block`, `PixelButton`, `Outlined` text, `WoodHeader` and the sea background |
| `src/Hud.tsx` | Header `Counter`, roof `Bubble` and the icon set |
| `src/Payoff.tsx` | Swipe feedback: the APPROVED pop, toasts and the streak banner |
| `src/Portrait.tsx` | Agent portraits for speech bubbles and cards |
| `src/collect.ts` | Shared state between the Away card and the Base header counters |
| `src/click.ts` | The click and tick sounds |
| `src/session.tsx` | Device id and user setup, `useDevice()`, `WithDevice` |
