# Animated shorts on TikTok, week of Nov 7–14, 2026

This note covers what animated short videos are getting views on TikTok this week, and how the studio's batch of 100 videos for Nov 15 follows those trends.

## The sample

- 915 unique videos from 15 TikTok search and tag queries, collected in a signed-in browser by scrolling like a person. 232 were posted Nov 7–14.
- Queries with the most past-week videos: #aianimation (39), animated storytime (36), money animation (34), #fruitdrama (34), 2d animation (30), ai animation (27), #3danimation (24).
- Collection stopped at 915 because TikTok's daily screen-time limit asked for a passcode. The target was 3,000–5,000. No video files were downloaded, and nothing was liked, followed or commented on.

How to read the numbers:

- Each search card shows one number. That is the play count on search pages and the like count on some tag pages. Only 2 cards had a verified play count, so "views" below means the number on the card.
- The post time comes from the video id, whose top 32 bits are a Unix timestamp. Two video pages showed exact post times, and the decoded times were 8 and 26 seconds off.
- "Per hour" means the card number divided by hours since posting. It shows what is spreading now. It is not a growth curve, because each video was captured once.
- 127 of the 232 past-week cards showed a number. The medians below come from those 127.

## What's working

Captions that open a story did far better than captions made of hashtags.

| Caption pattern (past week) | Videos | Median per hour |
| --- | --- | --- |
| Fruit or talking object | 10 | 568 |
| Second person ("Your boyfriend...", "Your boss...") | 9 | 352 |
| Story hook (POV, what if, your, in this town, Part N) | 47 | 241 |
| Numbered serial (Part 1, Pt. 2) | 17 | 241 |
| Every video with a number | 127 | 58 |
| Ends on a question | 25 | 20 |
| Hashtags only, under 4 words of caption | 27 | 11 |

The trends behind those numbers:

1. **Talking fruit and object serials.** 49 of the 232 past-week captions mention fruit, and 29 number their parts. The top video of the week is a fruit story, "Part 1", at 6.2M plays in 5 days, about 48,000 an hour. Others: "In a world where everyone tells the truth Kiwi discovers he can lie" Part 1 (292K), "THE LIL EGGPLANT BOXER | PART 1" (121K), "KeyVon and Miss Potato Pt.2" (242K).
2. **Second-person couple and work stories.** "Your girlfriend doesn't feel good" reached 94K within a day, about 8,500 an hour. "Your boyfriend says he cleaned up after shaving" reached 13K the same day.
3. **"In this town" blocky 3D stories**, in a Roblox-like look. "My Schedule Said THE END And Then It Saw You!" reached 147K within a day. "In this town you can respawn" has 122K, and "In this town, the baddest girl is a skinwalker" has 226K.
4. **Cliffhangers that hand the viewer a choice.** "Lockdown. Someone is at the door... and it sounds like Zoe. Would you open it? Part 1" has 179K. "...So who just texted you from the stairs? LAB OR STAIRS?" reached 21K within a day.
5. **Money "what if" and would-you-rather.** "What if You Had Just $10, But It Never Ran Out? p1" has 64K. "What If You Could See Everyone's Luck" reached 10K within a day. "Would You Stay for $1 MILLION Every Minute?" has 128K (Oct 29). 40 of the 232 past-week captions mention money.
6. **Toxic-boss work stories.** "POV: Your boss fires the employee keeping the company running" has 519K (Nov 5). "My Boss Changed My Schedule at 2 AM, Then Marked Me a No-Show" has 35K (Nov 10).

## What isn't working

- **Hashtag-only captions.** The 27 past-week videos whose caption is under 4 words besides hashtags have a median of 11 an hour, a fifth of the overall median. The rare hit in that group is a meme visual, not a story.
- **A copied title from another account.** A Nov 12 re-upload of "POV: Your boss fires the employee keeping the company running" has 1,265, against 519K for the Nov 5 original. The title alone did not carry the copy.
- **A question tacked onto the caption.** Captions that end on "?" have a median of 20 an hour. A choice works when the story is built around it (trend 4). A question added to a finished caption doesn't help.

## How the Nov 15 batch follows this

The studio queued 100 briefs, one video each, all about work and money life. Each brief names the trend it follows. Neighboring videos in the Feed differ in set, second character and format, and each Part 2 lands three videos after its Part 1.

| Trend the brief follows | Briefs |
| --- | --- |
| Client-versus-freelancer skits | 16 |
| Toxic-manager serials | 10 |
| Money "what if" | 10 |
| Second-person everyday stories | 10 |
| "In this town" stories | 9 |
| Money would-you-rather | 8 |
| Corporate humor | 8 |
| Freelancer day-in-the-life and expectation vs reality | 8 |
| Same paycheck, different habits | 7 |
| "POV: Your boss fires the employee keeping the company running" | 6 |
| Talking-object drama | 4 |
| Cliffhangers that end on a choice | 2 |
| Part 2 of a serial | 2 |

The batch has 15 formats. The largest are dialogue skits (25), POV (17), what if (10), in this town (9) and would you rather (8). The 4 sets split office 37, home 25, city 20 and cafe 18. The briefs, in Feed order, are in [briefs-2026-11-15.json](briefs-2026-11-15.json).

## Limits

- 915 videos is a small sample, and only 2 had verified play counts.
- One capture per video, so per-hour numbers favor videos posted in the last day.
- Search results depend on the signed-in account's history.
- These are patterns in captions and titles. They don't show that the pattern caused the views.
