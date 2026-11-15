# Outpost UX playbook

This file turns six research reports into rules for Outpost's screens. The reports sit next to this file:

- `01-short-video-feeds.md`: TikTok, Reels, Shorts, Spotlight, Douyin, Kuaishou
- `02-swipe-and-feedback.md`: Tinder, Hinge, Bumble, CMB, Netflix thumbs, "tell us why" flows
- `03-daily-return.md`: Duolingo, Snapchat, BeReal, Wordle, Candle, Finch, Locket, Spotify, return triggers without push
- `04-game-mechanics-and-feel.md`: Clash of Clans, Clash Royale, idle games, Monopoly Go, game feel, isometric art
- `05-real-outcome-rewards.md`: creator analytics, Robinhood, Shopify, Strava, reward research, legal lines
- `06-ai-feeds-and-taste.md`: Sora, Meta Vibes, Midjourney, Suno, Lensa, taste training

Each rule names its evidence and the report number it came from. Evidence tags: [primary] company docs, filings or regulators, [academic], [journalism], [3p] analytics firms, [company-reported], [opinion]. "Judgment" marks a call with no direct data behind it. Full links are in the reports.

## What the research changes

1. **The feed is a short daily drop of your own videos that you judge. It is not an endless scroll.** AI video feeds built for watching lost their users. Sora's day-30 retention was under 8% [3p], users spent about 13 minutes a day on it against about 90 on TikTok [3p], and OpenAI shut the app down six months after launch [journalism]. The people who stayed came back to make and steer videos. About 70% of Sora return visits involved creating [company-reported], and 52% of returning Vibes users mainly prompted while 30% mainly scrolled [journalism]. In Outpost every swipe posts a video or trains the agents, which is the part of AI feeds that kept people. (06)
2. **Every swipe has to change the next video, and the user has to see it change.** 39.3% of people who used YouTube's feed controls felt nothing changed [3p, Mozilla]. Google cut look-alike recommendations by 60.8% after a dislike when it trained on dislikes, and by 22.7% when the dislike was only an input [academic]. (01, 02)
3. **Results arrive at set times, and those times are the reason to open the app.** There is no push, so the app has to teach a schedule: new videos at 8 AM, new results at 6 PM. Batching notifications three times a day beat both normal delivery and none at all on mood and stress (n=237) [academic, Fitz 2019]. Coffee Meets Bagel's one match at noon had 70% of users checking daily [company-reported]. (02, 03, 05)
4. **Open on the base, already moving, and make coming back the reward.** People judge a screen's visual appeal in 50 ms [academic]. Showing the work raises the value of the result: in restaurant field tests, letting diners see the cooks raised rated quality 22.2% [academic]. The away screen lists what the agents did before it shows the numbers. (04)
5. **Celebrate real outcomes only, sized to the outcome.** Feedback that grew with success raised enjoyment, and uniform big effects lowered players' sense of competence (n=1,699) [academic, Kao 2024]. Massachusetts banned Robinhood's confetti tied to trade frequency and its scratch-off reveal [primary]. (04, 05)

## How the best apps did it, and the Outpost version

| App | What they do | Evidence | Outpost version | Report |
|---|---|---|---|---|
| TikTok | A video plays on first open with no account. One skippable interest picker. Account asked only when you act | The old account-first flow took about 1.5 min to the first video [opinion] | First video plays before any sign-up. Whop and social accounts are asked at the first right swipe | 01 |
| Douyin player team | Preload 3 to 5 videos, pre-draw the next frame, start on finger lift, never show a black frame | Leave rate rises past 200 ms to first frame [primary] | The whole day's drop downloads before you open. Our spike measured 80 ms from swipe to first frame | 01 |
| TikTok, Reels, Shorts | Hold the left or right edge for 2x, "2x" pill, release to stop. Shorts adds swipe down to lock | Shorts called it "top-requested" (June 2026) [primary]. 88% of users read speed-watching as low interest [academic] | Same gesture. Outpost reads a 2x hold as "this part drags" and tells the video agent to tighten that section | 01 |
| YouTube "Not interested" | 3 to 4 taps behind a menu | A one-click button got 2.2x more feedback with no drop in watching. 44% of users didn't know the menu option existed [3p, academic] | Reject is one swipe. Reasons are one tap | 01, 02 |
| YouTube controls (Mozilla audit, n=22,722) | "Don't recommend channel" vs "Not interested" | Prevented 43% vs 11% of unwanted look-alikes [3p] | Reason chips read as orders to the agents ("Hook too slow"), never "Not for me" | 02 |
| Netflix | Switched 5 stars to thumbs | 200% more ratings [company-reported] | Binary swipe. No stars, no scales | 02 |
| Pew survey panel | Open text vs multiple choice | 18% skipped open text vs 1 to 2% for choices [primary] | Chips first, typing optional | 02 |
| Voice survey experiment | Answer by voice vs text | 47% answered by voice vs 99% by text [academic] | Voice sits behind "Say more" and shows an editable transcript | 02 |
| Tinder | Capped right swipes in 2015 | Matches per right swipe +25%, messages per match +25% [company-reported] | 3 post slots a day. Extra approvals go to a bench | 02 |
| Hinge | Like one photo or prompt, with a comment | Likes with a comment were 2x as likely to lead to a date [company-reported] | Every swipe records the playback second. Chips refer to it ("Lost me at 0:02") | 02 |
| Hinge "We Met" | Asks how the date went, feeds the answer to matching | Hinge calls it the "strongest signal" [journalism] | When results land, ask one question about a winner: "4,100 views. More like this?" | 02 |
| Dating choice research | Rejection rises across a session | Acceptance fell 27% from first to last option. Picking from 6 beat picking from 24 a week later [academic] | Drop of 8 videos. Late-session rejects count for less in memory | 02 |
| Zooniverse | Yes or no swipes for science labeling | 1 to 3 s per swipe vs 8 to 10 s per form, 95 to 99% agreement with experts [primary] | Swipe first, details optional | 02 |
| Duolingo streak | One lesson keeps the streak. Two freezes | +3.3% D14 retention, +1% DAU. Two freezes +0.38% DAU, three no better [primary] | Posting streak where one decision counts. Two bench videos act as freezes | 03 |
| Duolingo widget | Widget shows the streak on the home screen | Widget users retain "far better" after controlling for commitment, and learners called it "just as effective" as push [primary] | A home-screen widget is the main return trigger | 03 |
| Duolingo weekends | Weekend Amulet | DAU drops 5 to 10% on weekends. Amulet users 5% less likely to lose a streak [primary] | Lighter weekend drop, streak safe on weekends | 03 |
| Wordle | One puzzle a day, share grid | 90 players to over 2 million in about 10 weeks, mostly after the grid shipped [journalism] | Fixed daily drop and a shareable results card | 03 |
| BeReal | Random daily window, driven by push | Daily users fell from about 15M to under 6M in five months [journalism] | No random timing. Fixed, known times | 03 |
| Spotify | Discover Weekly every Monday. Wrapped once a year | Wrapped 2025 reached 200M users in 24 hours and 500M shares [company-reported] | Monday week-in-review card | 03, 06 |
| Midjourney | Rank image pairs to build a style profile | 40 ratings to start, 200 to stabilize, about 5 minutes [primary, journalism] | "This or that" hook pairs during onboarding, with a progress count | 06 |
| Midjourney rewards | Free GPU hour for the top 2,000 daily raters | Abuse forced a pause, then bot bans [primary] | Never reward swipe counts. A right swipe posts in public | 06 |
| Stitch Fix | Thumbs "style shuffle" game | 9B ratings, about 150K players a day [primary] | A small repeatable judgment tied to a real payoff | 06 |
| Instagram, TikTok | Editable "Your Algorithm" and topic lists | Meta reports "over 80% retention" for users who engage with feed controls, metric undefined [primary] | The taste notebook, editable | 01 |
| Explanation research | Show why something was recommended | 86% of users wanted explanations [academic]. A 97,845-user field test found a negligible click lift [academic] | Expect trust and shares from the notebook, not more swipes | 06 |
| Clash of Clans collectors | Collectors fill over hours to days | Builder Base fill time went from 12 to 24 hours [3p] | Agents never stop at a cap | 04 |
| Egg Inc | Offline earnings capped at 2 hours | Designer Anthony Pecorella churned over it. Cap later raised to 30 hours [primary, 3p] | Same as above | 04 |
| Clash of Clans attacks | Star 1 at 50%, star 2 for the Town Hall, star 3 at 100%. One star is a win | [3p wiki] | Raid stars on real outcomes | 04 |
| Clash of Clans defense | 8-hour shield after an attack, revenge hits a no-loss copy | Since Oct 2025 [primary] | Nothing is lost while you are away | 04 |
| Clash Royale | Removed chest timers and keys, April 2025 | Spending +127% year over year in June 2025, with a new mode launched at the same time [journalism] | No fake waits. Real waits shown as progress | 04 |
| Game juice studies | Vary effect size | Success-scaled feedback raised enjoyment (n=1,699). No juice and extreme juice both cut play time (n=3,018) [academic] | Effects scale with the result | 04 |
| Shopify | Cha-ching on every sale. "You've got sales" voice plays "twice a lifetime" | [primary] | Cash sound only for money. First-sale sound plays twice, then the normal one | 05 |
| YouTube Studio | Compares each video to "your typical performance", the last 10 similar videos | [primary] | Compare each video to the user's own baseline, never to other users | 05 |
| Robinhood (Massachusetts order) | Confetti, scratch-off free stock, "Come back tomorrow if you're feeling tappy" | All banned [primary] | No celebrations for swipe counts, no scratch reveals, no decay | 05 |
| Goal research | Show progress made early, show what's left near the goal | Car-wash cards with 2 free stamps: 34% completed vs 19% [academic] | Milestones at 10, 50, 100, 500, 1,000 views. Only real setup steps count as head start | 05 |
| Sora cameos | Your face in AI videos | Internal feed became "entirely cameos". Users later balked at sharing likeness [company-reported, journalism] | The user's business and earnings are the "you". No face needed | 06 |
| AI creation apps | Lensa, AI photo apps | Lensa revenue -92% in about 4 weeks. AI photo downloads -78% in 2 months [3p] | Track week 4 and week 8 retention. Results, not novelty, have to carry week 5 | 06 |
| YouTube policy | Won't pay for templated, interchangeable AI videos (July 2025) | [primary] | Forced variety. One labeled experiment per drop. AI label on every post | 06 |

## A day with Outpost

| Time | What happens | Why |
|---|---|---|
| 8:00 AM | The drop lands: 8 new videos. The morning results batch updates. The widget shows "8 waiting · 6-day streak · +2,814 views" | Fixed cue (Wood and Neal), CMB's noon drop, Duolingo widget (03) |
| On open, about 2 min | Away screen (work done, then results, one-tap collect). Base with agents walking. Studio shows "8 new". Feed. "Done for today" | Labor illusion (04), Snapchat's 1.5 min visits (01) |
| During the day | Approved videos post at queued times. Each can be pulled back until it posts | Undo has to be visible because a swipe publishes (02) |
| 6:00 PM | Second results batch: views, follows, clicks, sales | Batched delivery (05) |
| Monday | Week in review card, shareable | Fresh start effect, Discover Weekly (03) |

Habits take a median of 59 to 66 days to form in a meta-analysis of 2,601 people [academic] (03). The hackathon tests the first session and the first return, so the demo has to show both.

## Screen by screen

### 1. First open: under a minute to the first swipe

1. No sign-up wall. The user picks a niche with one tap from about 6 options, or types one. Skippable, with a varied starter set as the fallback (TikTok's pattern, 01).
2. While the studio renders the first drop, play "this or that": 5 pairs of hooks, about 1.5 s each (Midjourney's pace, 06). This seeds the taste profile and hides the render time. Compound renders one video in about 1 s, so 8 videos take about 9 s plus script writing. Script latency is untested until the Anthropic key arrives.
3. The first drop includes one video in a different style on purpose. TikTok mixes in out-of-interest videos to learn (01).
4. Accounts (Whop, TikTok, YouTube, Instagram) are asked at the first right swipe, when the user wants the video to go out.
5. After the first session, ask once to add the widget. Locket makes adding the widget step 1 (03).

### 2. While you were away

Order, from Clash's attack log and the labor illusion (04):

1. The work, in one line each: "12 videos rendered · 3 posted · 41 TikToks studied · 2 comments answered."
2. The results, small to large, ending on the biggest real number. Numbers count up from the last value the user saw (04). Each shows "as of 8:00 AM" because platform counts are estimates and can change for days [primary, YouTube Help] (05).
3. One "Collect" button takes everything (Clash has had one-tap collect since 2017, 04). The whole sequence runs under 1 s and a tap skips it (04).
4. The next result time is on screen: "Next results 6:00 PM." The no-notification group in Fitz 2019 reported more fear of missing out (05). A known time is the proposed fix. It is untested.

### 3. The base

1. Agents walk between buildings before the user touches anything (04).
2. Every building shows its real state without a tap. The studio smokes while rendering and shows "8 new" when the drop is ready. The tower shows views. The vault fills with net money (05: never show gross as a win when the user is net negative).
3. Building art changes at real milestones only: first sale, first 1,000 views (04).
4. Nothing decays when the user stays away. Clash moved to no-loss defense, and Massachusetts banned Robinhood's decay mechanic (04, 05).
5. Tap targets at least 44x44 pt, which allows about 6 to 8 buildings on the first screen (04).

### 4. The feed: the daily drop

Full screen, vertical, autoplay, loop, sound on with one-tap mute, captions burned into every video so it works on silent (01, 04).

| Gesture | Action | Evidence |
|---|---|---|
| Swipe right | Post it. The card flies into "Goes out 6:10 PM on TikTok, Shorts, Reels" | Binary choice (02) |
| Swipe left | Reject. The next video starts at once, reason chips slide up | One-tap feedback (01, 02) |
| Hold left or right third | 2x while held. Swipe down while holding to lock | Matches TikTok, Reels, Shorts (01) |
| Swipe up | Not sure. Goes to the back of the drop, no decision recorded | TikTok habit: users will swipe up anyway. Midjourney has a skip key (06). Judgment |
| Double tap | Heart this moment. Saves the playback second as a positive note | Hinge's part-level likes (02). Judgment for video |
| Two visible buttons | Reject and Post, in the lower middle, same size | Hidden gestures get forgotten. Gestures were 12 to 16% faster only when users were distracted [academic] (02) |

Commit rule: the card follows the finger, a "POST" or "REJECT" stamp fades in, and the swipe commits past about 50% of screen width or on a fast fling. Hold is recognized only after the finger stays still about 0.3 s, so it never fights the swipe (01, 02, judgment on the numbers).

**The left swipe "why".**

1. The reject is done on release. The reason is a bonus and never blocks the next video (02).
2. 4 to 6 chips written as orders: "Hook too slow", "Wrong product", "Voice sounds fake", "Too salesy", "Caption off", "Seen this already". "Say more" opens hold-to-talk with an editable transcript (02).
3. The chips use where the user swiped. A swipe in the first 2 seconds pre-fills "Hook?" as a one-tap confirm. Meta's ranking treats a skip within 2 s as its own signal [primary] (01, 02).
4. Ask on the first 3 rejects of a session, then every third reject, and whenever the memory is unsure. The taper is judgment (02).
5. Chips auto-dismiss after about 3 s. Judgment.

**Showing the learning.**

1. After a reason, a toast confirms in plain words: "Got it. Hooks under 1 second from now on." (01 R10)
2. The next video made from that note carries one line: "From your note: shorter hook." This is the ownership move from the ghostwriter studies, where people only felt they owned AI output they had shaped [academic] (06).
3. A 2x hold also teaches: "You sped through 0:03 to 0:06. Next cut is tighter." (01 R8)

**Make more.** When the drop is done, "Make 4 more" asks the studio for a new batch built on today's notes. The user watches the studio work on the base, then gets the new cards. Creating and steering is what brought Sora users back (06). Estimated 10 to 20 s per batch from our Compound timing plus unmeasured script time.

**Post slots and the bench.** 3 posts a day go out. Approvals past 3 go to a bench of ready videos. If the user misses a day, a bench video posts so the channel keeps its streak. This is Duolingo's two freezes made real (03), and Tinder's cap raised quality per right swipe 25% (02). The number 3 is judgment. It also keeps a new account from looking like spam on the platforms.

**One experiment per drop.** One of the 8 videos tries a new format and says so. TikTok told the WSJ it uses about 7% of the feed for discovery (06).

**Done for today.** "You're caught up. 3 going out today. Results at 6 PM. Next drop 8 AM." Then back to the base. A clear end is honest, and EU regulators have named infinite scroll and autoplay as addictive design in findings against TikTok and Meta in 2026 [journalism, primary] (01).

### 5. The taste notebook (Supermemory)

1. A plain-words list of what the agents learned, each line with its source: "Hooks under 1 s (from 4 rejects)", "No fake-voice narration (said twice)", "Desk-setup shots win (3 of 3 approved)". The user can edit or delete any line (01 R11, 06).
2. A progress count while it is young: "Taste profile 23 of 40". Midjourney's threshold was 40 to start (06). Our number is judgment until we test it.
3. Explicit swipes and reasons outrank watch signals. The EU found TikTok's watch time outweighed its "not interested" button, and regulators want the opposite (01).
4. Reasons are stored as negative labels the script writer reads on every run, not only as notes (02: the 60.8% vs 22.7% gap).

### 6. Results and firsts: the match moment

Dating apps celebrate a real event, mutual interest (02). Outpost's match is a real outcome.

1. Each first gets one full-screen moment: first video live, first 100 views, first follower, first link click, first sale (05). After that, smaller acknowledgments.
2. The first sale gets its own sound, played twice in the user's lifetime, then the normal cash sound (Shopify, 05). The cash sound plays only for money, never for views.
3. Effects scale with the result. A $2 sale gets a small coin hop and a light haptic. A record day gets the full burst and the success haptic (04).
4. Compare each video to the user's own last 10 (YouTube Studio, 05).
5. Small numbers: early on, show the total gained ("38 views across your first 3 videos"). Near a milestone, show what is left ("12 views to 1,000") (05).
6. After results land, ask one Hinge-style question about a winner or a flop (02).
7. A setting hides counts and shows only trends. Instagram made like counts optional after finding them "beneficial for some, and annoying to others" [primary]. 58% of surveyed creators say their self-worth drops when a post underperforms [journalism] (05).

### 7. Raids and stars

1. Star 1 at 50% of the revenue target, star 2 for the key outcome (first sale from that raid), star 3 at 100%. One star counts as a win (04).
2. Progress bars start from real work already done (05: endowed progress only with a real reason).
3. Stars appear one at a time, each with a heavier haptic (04).
4. A raid window survives a day away (Clash's Star Bonus stacks two deep, 04).

### 8. Coming back without push

| Trigger | Works on a free Apple ID | Notes | Report |
|---|---|---|---|
| Home-screen widget | Yes | 40 to 70 refreshes a day when visible. Timeline entries can change it at 8 AM and 6 PM with no network call [primary] | 03 |
| Fixed drop and result times | Yes | The known schedule is the cue | 03 |
| Live Activity countdown to results | Yes, started from the app | 8-hour limit. Remote updates need APNs [primary] | 03 |
| Local notifications | Yes, they are not push | Your call. You said no push. Local alerts still interrupt, so they stay off unless you want them | 03 |
| Remote push | No | Needs APNs and the paid program [primary] | 03 |

Builds on a free Apple ID expire after 7 days, so a multi-week test on testers' phones needs the paid program (03).

## Feel and speed budget

| Moment | Target | Status |
|---|---|---|
| Swipe to next video's first frame | Under 200 ms (01) | 80 ms average in a Release build on the simulator |
| Cold open to a playing video or a moving base | Under 2 s (01) | Not measured |
| Collect sequence | Under 1 s, tap to skip (04) | Not built |
| Away screen count-up | From last-seen value, about 0.6 s per number. Judgment | Not built |

Haptics, one meaning each (Apple HIG, 04):

| Event | Haptic |
|---|---|
| Swipe crosses the commit line | Selection tick |
| Post | Medium impact |
| Reject | Light impact |
| 2x engages | Soft tick |
| Sale | Success notification |
| Star 1, 2, 3 | Light, medium, heavy |
| Views update | None |

Everything must read on silent. iPhone silent mode mutes game sound and App Store previews start muted [primary] (04). Support Reduce Motion from day one (04).

## Polish order

From 04, ranked by effect on the first screen and the daily repeat:

1. Ambient life on the base: walking agents and building states at 60 fps.
2. The feed's swipe feel: finger tracking, stamp, spring back, haptics.
3. The collect moment: count-up, coins to the counter, scaled haptic.
4. The left-swipe chips and the "from your note" line.
5. The star reveal.
6. Building upgrades at milestones.

Skip screen shake on routine actions, particles that cover the next thing to tap, and the same big effect on every tap (04).

## Lines we won't cross

| Don't | Why | Report |
|---|---|---|
| Celebrate swipe or post counts | Massachusetts banned celebrations "tied to frequency of trading". Confetti raised trading 5.17% and drew in less literate users [primary, academic] | 05 |
| Show gross revenue as a win when the user is net negative | UK rules ban celebrating a return at or below the stake. Losses disguised as wins were as arousing as wins [primary, academic] | 05 |
| Scratch, slot or spin reveals for money | Banned in the Robinhood order [primary] | 05 |
| "Almost viral" copy on a single result | Near misses raise the urge to keep going with no reward [academic] | 05 |
| Pull-to-refresh that can change numbers between batches | A variable-ratio loop. Numbers update only at batch times | 05 |
| Fake or padded results, including fake activity | FTC action against NGL [journalism]. Every number in the app is real, zeros included | 03 |
| Decay or loss while away | Robinhood order, Clash's no-loss defense | 04, 05 |
| Rewards for rating volume | Midjourney's abuse problem | 06 |
| Show other users' earnings to motivate | Earnings-claim rules likely apply. Needs a legal read | 05 |
| Post without an AI label | Platforms require disclosure for realistic AI content. 76% of US adults want to know what AI made [primary, Pew] | 06 |

## What to log from day one

Per video: time on card before the swipe, playback second at the swipe, 2x holds and where they start, loops, sound on or off, chip tapped or skipped, "Say more" by voice or typing, undo before posting.

Per session: reject rate by position in the drop, drop size, minutes in app.

Per user: opens per day, D1, D7, D30, week 4 and week 8 retention, results checked within an hour of 8 AM and 6 PM. Measure return visits, not minutes (Kuaishou optimizes time to return, 01).

## Open risks

1. **No data on daily return without push.** Every daily-drop app in these reports also sent notifications (02, 03). The widget and fixed times are our best bet, untested.
2. **Small numbers can hurt.** A run of zero-view posts may make people quit faster than no data would. No data found (06). Mitigation: frame early posts as tests and compare to the user's own baseline.
3. **Slop risk.** If videos look alike, viewers and YouTube's monetization rules punish them (06). Mitigation: forced variety, the experiment slot, reasons that change the next batch.
4. **Week 4 to 8 cliff.** AI creation apps lost most users within weeks (06). Only real results can carry week 5.
5. **One bad post costs trust.** A right swipe publishes. Mitigation: queue with pull-back, post slots, conservative defaults for new users (02, 06).
6. **Drop size and post slots are guesses.** Test 5, 8 and 12 videos, and 2, 3 and 5 slots.
7. **Revenue may be rare.** Real Whop sales may come less than once a day per user. Views have to be the frequent reward and money the rare big one (04).
