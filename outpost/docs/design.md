# Design system

The shared UI primitives in `src/ui/`. They make a new screen look like the pixel-art village instead of a bolted-on
form: Jersey type, a dark purple ink outline instead of black, flat bevels instead of shadows and rounded corners, and
a click plus a haptic on every press. `src/pixel.tsx` stays the source of the core look (`Block`, `Outlined`,
`WoodHeader`, `Plaque`, `Sea`); `src/ui/` builds on it and never replaces it.

Import everything from one place:

```tsx
import { Button, Card, Chip, ChipRow, NumberTicker, VerdictBadge, money } from "../ui";
```

See every primitive in every state in the gallery: `outpost://ui-gallery` on a device (`xcrun simctl openurl booted
outpost://ui-gallery` on a simulator), or `outpost://ui-gallery?only=chips` for one section. Sections:
`buttons`, `chips`, `badges`, `numbers`, `progress`, `tiers`, `cards`, `empty`, `toast`, `demo`. Every
primitive and gallery item has a `testID`.

## Tokens (`src/ui/tokens.ts`)

**Color.** `INK` `#24152B` outlines everything. `PARCH` is the card face (`base` `#F6E4BE`, `top`, `bottom`,
`ink` `#34221A` for text, `soft` `#7A5C46` for secondary text). `WOOD` is headers and plaques. `DEEP` `#2B78C4` is
the water behind every screen. `COLOR` adds:

| Token | Hex | Use |
|---|---|---|
| `gold` | `#FFC83A` | Primary buttons, selected chips, money, Tastemaker |
| `green` / `greenPale` / `greenDeep` | `#5BC44A` / `#A6EC7C` / `#2F8A2C` | Go, done, Hit, delta up |
| `red` / `redPale` / `redDeep` | `#C25B4E` / `#F0B2A8` / `#8A3A32` | Miss, denied, failed, delta down. Muted on purpose |
| `slate` | `#46567A` | Solid, submitted, Settler |
| `teal` | `#2EB8A6` | Clip mode, Curator |
| `orange` / `orangePale` / `orangeDeep` | `#F07A2A` / `#FFB070` / `#B04A10` | Original mode, remakes, pending chips, links on parchment |
| `violet` / `violetPale` | `#C9A8FF` / `#E8DCFF` | Forecasts and test-only figures |
| `sign` | `#FFD65C` | Sub lines on wood, links on water |
| `foam` | `#F5E6C8` | Small print on water (always with a hard ink text shadow) |

**Type.** Two faces: `FONT.bold` (Jersey 10) for titles, buttons, numbers and tags; `FONT.semi` (Jersey 15) for
everything else. Sizes in `TYPE`: `hero` 64, `title` 34, `heading` 22, `body` 16, `label` 15, `tiny` 13, `tag` 11.
Nothing a person must read goes under 13 pt on a phone; 11 pt is only for a short all-caps tag inside a tile (the
month's three letters in the streak calendar). Body text runs 15 to 17.
`Outlined` draws 1.22x its `size`, so `<Outlined size={22}>` matches a 27 pt plain `Text`. White outlined type goes
on the water, wood and colored blocks; ink type goes on parchment.

**Space.** `SPACE`: `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 24. Screens pad 12 at the sides, cards pad 14, cards
stack 14 apart and sections 28 apart.

**Lines.** `LINE.panel` 3 pt for cards and buttons, `LINE.tag` 2 pt for badges, chips and pills. Nothing is rounded.

**Feel** (`feel(kind)` in `src/ui/feel.ts`): `tap` (click + selection tick), `press` (click + light impact),
`commit` (click + medium impact, for actions that queue work), `success` (tick + success notification), `none`.
Every pressable primitive takes a `feel` prop.

**Helpers.** `money(cents)` gives `$1.20` or `$3`; `thousands(n)` gives `12,480`.

## Components

### Button

```tsx
<Button label="Take" bevel="green" feel="commit" onPress={take} loading={taking} loadingLabel="Taking" testID="bounty-take" />
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label`, `onPress` | `string`, `() => void` | | |
| `variant` | `"primary" \| "secondary"` | `"primary"` | Gold with outlined type, or parchment with ink type |
| `bevel` | `Bevel` | | Any `pixel.tsx` bevel: `gold`, `green`, `orange`, `teal`, `slate`, `parch`. Wins over `variant` |
| `size` | `"lg" \| "md" \| "sm"` | `"lg"` | Type 26 / 20 / 16 |
| `icon` | `IconName` | | Any icon from `Hud.tsx`'s `ICON` |
| `disabled` | `boolean` | | Faded and flat |
| `loading`, `loadingLabel` | `boolean`, `string` | | Sunk, dots, not pressable |
| `feel` | `Feel` | `"press"` | |

Do: one primary per card or screen; green for go/take/collect, orange for remakes. Don't: put two gold buttons side by
side, or use a Button for a status (that's a Badge).

### Chip, ChipRow

```tsx
<ChipRow>
  <Chip label="Punchier hook" pending={sent === "hook"} pendingLabel="Remaking" onPress={() => send("hook")} testID="edit-hook" />
  <Chip label="Shorter" onPress={() => send("long")} testID="edit-long" />
  <Chip label="New look" onPress={() => send("visuals")} testID="edit-visuals" />
</ChipRow>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label`, `onPress` | | | |
| `selected` | `boolean` | | Gold, sunk, check icon |
| `pending`, `pendingLabel` | `boolean`, `string` | | Orange, sunk, dots; not pressable |
| `disabled` | `boolean` | | |
| `icon` | `IconName` | | |
| `size` | `"lg" \| "md"` | `"lg"` | lg is 52 pt tall (the Feed's edit chips); md for filter rows |
| `feel` | `Feel` | `"commit"` | Use `"tap"` for filters |

Do: keep chip labels to two words and let them read on the dark video (parchment on black reads well). Don't: use a
Chip as the screen's main action; that's a Button.

### Badge, ModeBadge, VerdictBadge, HonestyLabel

Badges are flat (fill + 2 pt ink outline), never beveled, so nobody tries to press them.

```tsx
<Badge label="Submitted" tone="slate" />
<ModeBadge mode={bounty.mode} />                         // CLIP (teal) or ORIGINAL (orange)
<VerdictBadge verdict={verdictFor(views / baseline)} ratio={views / baseline} reason={likelyReason} />
<HonestyLabel kind="estimated" />                         // ESTIMATED, beside the number it qualifies
```

- `Badge`: `label`, `tone` (`gold`, `green`, `red`, `slate`, `teal`, `orange`, `violet`, `parch`, `ink`), `icon`,
  `size` (`md` / `sm`), `dashed`.
- `VerdictBadge`: `verdict` (`hit` / `solid` / `miss`), `ratio` (shown as `2.1x`), `reason` (soft text after a
  miss), `size`. Hit is green with a gold star that pops in; Solid is slate; Miss is muted red.
  `verdictFor(ratio)` applies the COORDINATOR thresholds: `>= 1.5` Hit (`HIT_AT`), `< 0.8` Miss (`MISS_UNDER`).
  If the server already computes the verdict, pass it straight in.
- `HonestyLabel`: `kind` (`forecast`, `estimated`, `seeded`, `provisional`), `detail` (`true` for the standard
  line, or your own string), `on` (`card` / `water`, so the line stays readable). Dashed outline = not final.
  Prefer the tag alone: the line under it is one more sentence on the card.

Do: label every forecast, estimate, seeded row and provisional score, right next to the number. Don't: write "(est.)"
in plain text, or color a Miss bright red.

### NumberTicker

```tsx
<NumberTicker value={summary?.pendingCents} format={money} size={26} />          // on the water: outlined white
<NumberTicker value={score} size={56} outlined={false} sound />                  // on parchment: ink
```

`value` (number or `undefined` while loading, which shows dots), `format` (default `thousands`), `size` (default 34),
`color`, `outlined` (default `true`), `delta` (flash `+4` / `-2`, default `true`), `sound` (the HUD tick, default
`false`), `duration` (default 650 ms). Whole numbers only: counts, cents, points.

It counts from the shown value to the new one, pops once, and flashes the change beside its top right corner in green
(up) or muted red (down). The first value after loading doesn't animate. Do: leave about 40 pt free to its right for
the flash. Don't: turn `sound` on for more than the one number the user is watching.

### ProgressPill, ProgressSteps, ProgressBar, Segments

```tsx
<ProgressPill label="Downloading footage" state="working" />
<ProgressPill label="Making 2 of 5" state="working" done={1} total={5} />
<ProgressPill label="Ready" state="done" />
<ProgressSteps steps={["Footage", "Making 2 of 5", "Ready"]} current={1} />
<ProgressBar value={0.4} color={COLOR.green} />
```

- `ProgressPill`: `label`, `state` (`waiting`, `working`, `done`, `failed`), `done` + `total` for a block per item.
- `ProgressSteps`: `steps` (labels), `current` (index; `steps.length` means all done), `failed`. Put the live
  detail in the current step's label.
- `ProgressBar`: `value` 0..1, `color`, `height`. `Segments`: `done`, `total`.

Do: show background work on the card it belongs to and keep everything else pressable. Don't: block a screen with a
spinner while the studio works.

### TierBadge, TierProgress, TIERS

Taste tiers, renamed from the brief so they don't collide with the village's own Scout (the Whop find) and Director
(the agent who remakes videos):

| Tier | Score | Color | Icon |
|---|---|---|---|
| Settler | 0-39 | slate | house |
| Curator | 40-59 | teal | magnifier |
| Showrunner | 60-79 | orange | play |
| Tastemaker | 80-100 | gold | star |

```tsx
<TierBadge score={score} />
<Card><TierProgress score={summary?.tasteScore} calibrating={settled < 5 ? { scored: settled, needed: 5 } : undefined} /></Card>
```

`TierProgress`: `score` (`undefined` shows skeletons), `calibrating` (`{ scored, needed }` adds a PROVISIONAL label
and "3 of 5 posts scored"). It shows the tier, the score with a ticker, a bar to the next tier and "6 to
Showrunner". `tierFor(score)` and `nextTier(score)` give the tier objects (`key`, `name`, `min`, `bevel`, `icon`,
`color`). Use them rather than hard-coding names.

### Card, CardRow, SectionHeader

```tsx
<SectionHeader title="Bounties" sub="Real Whop bounties you can take" action={{ label: "See all", onPress }} />
<Card title="NOTION" sub="Whop bounty" testID="bounty-notion">...</Card>
<Card title="LIVE NOW">
  <CardRow first image={PLAT.instagram.mark} title={post.title} sub="Instagram · 2 days" right={<VerdictBadge verdict="hit" ratio={2.4} size="sm" />} />
</Card>
<Card loading />
```

- `Card`: `title` + `sub` (a wood plaque across the top edge), `bevel` (default `parch`), `onPress` (the whole
  card sinks like a button), `loading` (skeleton lines), `feel`, `testID`, `style`. No outer margin: lay cards in a
  column with `gap: 14` inside a screen padded 12 at the sides.
- `CardRow`: `title`, `sub`, `icon` or `image`, `right`, `first` (no rule above), `onPress`.
- `SectionHeader`: `title`, `sub`, `action` (`{ label, onPress, testID }`). Goes on the water, between cards.

Do: give a card's own buttons their own `onPress` and leave `Card.onPress` off. Don't: nest a Card in a Card.

### EmptyState

```tsx
<EmptyState who="courier" title="No bounties yet" body="The courier checks Whop every 15 minutes."
  action={{ label: "Check now", onPress: refresh }} />
<EmptyState who="writer" title="Loading bounties" loading />
```

`title`, `body`, `who` (a village agent's portrait: `writer`, `director`, `courier`, `merchant`) or `icon`,
`action` (one green button), `loading` (dots, no action). Do: say what's happening and what comes next. Don't: leave a
list blank or show "No data".

### Toast, useToast

```tsx
const toast = useToast();
toast.show({ title: "5 clips ready for Notion", body: "Swipe them while the bounty has budget", who: "director",
  action: { label: "Swipe", onPress: () => router.navigate("/feed") } });
return <View style={{ flex: 1 }}>{/* screen */}{toast.node}</View>;
```

Options: `title`, `body`, `who` or `icon`, `action` (`{ label, onPress }`, the whole toast is the tap target),
`duration` (default 4000 ms), `testID` (default `toast`). It drops from under the status bar with the success
tick and haptic, and slides away. A new toast replaces the one showing. `<Toast inline ... />` draws it in place with
no motion, for docs and the gallery. Render `toast.node` last in the screen's root view so it sits on top.

### DemoNote

```tsx
<DemoNote />                 // on the water
<DemoNote on="card" />       // inside a parchment card
```

The v1 disclosure: a gold DEMO tag and "Posts go to Outpost's demo accounts". `text` overrides the line. Put it once
per screen that posts or shows posts (Feed, You, Bounties), near the bottom, never over the video. Default `testID`
is `demo-note`.

### Dots, Skeleton

`Dots` (`color`, `size`) is the pixel "working" mark used by the primitives above. `Skeleton` (`width`, `height`,
`delay`) is a breathing parchment bar for sketching a loading layout.

## Rules of thumb

Copy (from Charlie's review: no text-heavy boxes, no stacked text, nothing too small on a phone):

- A card gets one headline and at most one short supporting line. Say it with a number, an icon or a badge before a
  sentence. An explanation goes behind a tap ("How it's scored") or out of the app, not under the number.
- One honesty label per card. A badge, a caption, a `DemoNote` and a footnote saying the same "demo" or
  "estimated" is three too many. `DemoNote` goes once per screen, never on every card.
- Don't nest a card in a card. Inside a `Card`, separate parts with whitespace or a 2 pt parchment rule, not a
  second bordered box.
- Check every screen at 390 pt wide: titles hold to two lines, rows to one.


- Bevels mean "press me". Buttons, chips and cards with `onPress` are beveled or edged; badges, pills and labels are
  flat.
- Every number is real or labeled. Pending money is `ESTIMATED`, a predicted rating is `FORECAST`, hand-entered
  bounties are `SEEDED`, a score before enough posts settle is `PROVISIONAL`.
- Loading and empty states are designed: `Card loading`, `TierProgress` with no score, `NumberTicker` with no value,
  `EmptyState`.
- Every press clicks and buzzes through `feel`. Don't call `expo-haptics` directly from new screens.
- Keep `testID`s on everything a device test might tap or check.
