# Game mechanics and game feel: what Outpost can borrow

Research date: 12 November 2026. Scope: base builders, idle games, casual event loops, game feel, isometric art, and visible working characters. The last section turns the evidence into rules for Outpost.

## How to read this file

Each claim carries a tag:

- [primary] official company page, patch notes, help center, platform docs, or a GDC session page
- [academic] peer-reviewed paper or preprint
- [journalism] news or trade press
- [3p] analytics firms, analysts, fan wikis and guides
- [company-reported] a number a company says about itself
- [opinion] a named person's view, or my own reading where marked
- [not found] I looked and found nothing usable

Numbers I computed myself say "my arithmetic". Fan wikis (Fandom, wiki.gg) are tagged [3p]. They are usually right about game rules because players test them, but they are not official.

Method limit: the shared web-search quota for this session ran out partway through. After that I could only fetch pages I already had links for. Items marked [not found] in sections 4 and 6 may exist but were not reachable. A follow-up session could close those gaps.

Already known and not repeated here: Supercell doubled low-level collector storage "so they don't cap out after 3 hours"; Clash of Clans removed troop training timers in March 2025; GameAnalytics 2026 D1 benchmarks.

## Short version

1. Supercell has lengthened time-to-full more than once. Builder Base collectors went from filling in 12 hours to 24 hours in October 2019 ([3p, quoting patch notes](https://clashofclans.fandom.com/wiki/Gold_Mine/Builder_Base)). Home Village Gold Mines now fill in 5 hours at level 1 and about 2 days 7 hours at max level ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).
2. Supercell keeps removing waits. Clash Royale removed chest queues, timers and keys to "eliminate every barrier that's stopped you from collecting rewards at your own pace" ([primary](https://supercell.com/en/games/clashroyale/blog/release-notes/april-update/)). AppMagic estimates put the game's June 2025 spending at $51.4m, its best month since December 2021 ([journalism](https://www.pocketgamer.biz/clash-royale-hits-post-pandemic-record-of-38m-daily-revenue-with-new-mode-merge-tactics/)). That is a correlation, not proof.
3. Raiding a Clash of Clans base no longer costs the defender much. Since October 2025 a defender gets an 8-hour Magic Shield after an attack, and Revenge attacks hit a "Shadow Base" copy that takes nothing ([primary](https://supercell.com/en/games/clashofclans/blog/release-notes/get-ready-for-ranked-update/)).
4. Clash of Clans stars: one for 50% destruction, one for the Town Hall, one for 100%. One star counts as a win ([3p](https://clashofclans.fandom.com/wiki/Raids)).
5. Idle game designer Anthony Pecorella called Egg Inc's 2-hour offline cap "a mistake" and said he "churned out myself largely because of this" ([primary slides, opinion](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)).
6. Idle games averaged 5.3 sessions a day and 8 minutes per session in a 2020 GameAnalytics cut ([3p](https://gameworldobserver.com/2020/12/22/gameanalytics-names-benchmark-engagement-metrics-idle-games)). All mobile games averaged 4 sessions a day in 2024, and North America was lowest at 3.67 ([3p](https://gamedevreports.substack.com/p/weekly-gaming-reports-recap-february-21d)).
7. The largest juiciness experiment (N = 3,018) found that both no juice and extreme juice cut play time compared with medium and high juice ([academic](https://doi.org/10.1016/j.entcom.2020.100359)).
8. A preregistered follow-up (n = 1,699) found that feedback scaled to success raised competence, curiosity and enjoyment. Uniform amplification that ignored success lowered competence ([academic](https://doi.org/10.1145/3613904.3642656)).
9. People can prefer a slower website that shows its work over an instant one with identical results. The authors call this the "labor illusion" ([academic](https://doi.org/10.1287/mnsc.1110.1376)). In food-service field tests, letting customers see the work raised customer-reported quality by 22.2% and cut throughput time by 19.2% ([academic](https://doi.org/10.1287/mnsc.2015.2411)).
10. People rate visual appeal of a web page within 50 ms, and those ratings match their 500 ms ratings ([academic](https://doi.org/10.1080/01449290500330448)). I found no equivalent study for games [not found].

---

## 1. Base builders and strategy games

### Resource collectors and storage caps

How it works in Clash of Clans:

1. A collector (Gold Mine, Elixir Collector) produces at a fixed hourly rate up to a capacity. "When the mine is full, production will be stopped until it is collected (or raided)" ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).
2. The building shows how full it is. "One can estimate the amount of resources in the mine by looking at the small cart at the right side of the mine" ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).
3. A resource icon appears over the building when there is something to collect. Since May 22, 2017, tapping one mine collects from all mines ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).
4. Uncollected loot is exposed. Attackers can take up to 50% of what sits in a mine ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).

Home Village Gold Mine fill times ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)):

| Level | Capacity | Rate per hour | Time to fill |
|---|---|---|---|
| 1 to 3 | 1,000 to 3,000 | 200 to 600 | 5h |
| 4 | 5,000 | 800 | 6h 15m |
| 5 | 10,000 | 1,000 | 10h |
| 8 | 50,000 | 1,900 | 1d 2h 19m |
| 12 | 200,000 | 4,200 | 1d 23h 37m |
| 17 | 420,000 | 7,560 | 2d 7h 33m |

Supercell's tuning statements:

- April 12, 2021: "Doubled Storage Capacity at levels 1 to 4 so they do not cap out after 3 hours" ([primary, Supercell patch note quoted by wiki](https://clashofclans.fandom.com/wiki/Elixir_Collector/Home_Village); original post [primary](https://supercell.com/en/games/clashofclans/blog/game-updates/spring-update-sp2/)). An older guide lists level 1 at 500 capacity and a 2h 30m fill ([3p](https://www.pocketgamer.com/clash-of-clans/gold-mine-clash-of-clans-building-breakdown/)). Doubling to 1,000 gives 5 hours (my arithmetic, matches the current table).
- October 16, 2019, Builder Base: "Gold Mines now have double storage capacity (so now fills in 24 hours rather than 12 hours)" ([3p quoting patch notes](https://clashofclans.fandom.com/wiki/Gold_Mine/Builder_Base)). Every Builder Base collector level fills in exactly 24 hours, and Builder Gold "isn't at risk even if it is destroyed" ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Builder_Base)).

My reading [opinion]: both changes push time-to-full past the gap between normal check-ins. New players get roughly a 5-hour window. The low-stakes Builder Base uses a flat 24-hour cycle with no theft.

Other games with a cap-and-refill clock:

- Rise of Kingdoms Action Points refill at about 1 per 45 seconds up to 1,000, and then stop ([3p](https://riseofkingdoms.fandom.com/wiki/Resources)). That is 12.5 hours from empty to full (my arithmetic).
- Candy Crush gives 5 lives with one refilled every 30 minutes, so 2 hours 30 minutes for a full set ([3p](https://candycrush.fandom.com/wiki/Lives)).

### Builders and upgrade timers

- Players get two Builder's Huts from the tutorial. Three more cost gems, and a sixth builder (B.O.B) comes from the Builder Base ([3p](https://clashofclans.fandom.com/wiki/Builder%27s_Hut)). Each upgrade occupies one builder.
- Timers stretch with level. A level 1 Gold Mine builds in 5 seconds and a level 8 in 1 hour ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)). Supercell has cut upgrade times many times, for example level 13 Gold Mine from 3 days to 1 day 16 hours in April 2021 ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).
- Builders are visible workers. When a builder is idle, "three small z's will appear from the roof of his house," signalling he is free ([3p](https://clashofclans.fandom.com/wiki/Builder)). Working builders walk to the building and hammer on it.
- March 24, 2025 ("Clash Anytime"): troops, spells and siege machines no longer need training, and heroes no longer need healing ([3p quoting patch notes](https://clashofclans.fandom.com/wiki/Version_History/2025)). Already known; listed only for context.

### Shields, attack logs and what you see when you return

The current rules (October 2025 "Get Ready for Ranked" update):

1. "Get an 8 hour Magic Shield after your Village is attacked." Attacking does not shorten it ([primary](https://supercell.com/en/games/clashofclans/blog/release-notes/get-ready-for-ranked-update/)).
2. The shield triggers when at least 30% of available loot is taken. It lasts 8 hours "regardless of loot taken and overall damage" ([3p](https://clashofclans.fandom.com/wiki/Shields)).
3. "You have 12 hours to get Revenge once your Village has been raided." You start Revenge from the Defense Log ([primary](https://supercell.com/en/games/clashofclans/blog/release-notes/get-ready-for-ranked-update/)).
4. "A Revenge attack pits you against a Shadow Base version of the player's Village, meaning they won't receive an attack on their end" ([primary](https://supercell.com/en/games/clashofclans/blog/release-notes/get-ready-for-ranked-update/)).
5. Shielded bases still appear in matchmaking as clones. "Attackers will get resources and Trophies from attacking clone bases, but the Defender will not lose any Trophies or resources" ([3p quoting March 2025 notes](https://clashofclans.fandom.com/wiki/Version_History/2025)).
6. New players start with a 3-day shield ([3p](https://clashofclans.fandom.com/wiki/Shields)).

What you see on return: the Defense Log lists each attack, its result, and a replay. Third-party summaries say Shadow Base attacks show a Magic Shield icon to mark that no real loot was lost ([3p](https://www.clash.ninja/blog/october-2025-update-is-live)). I did not find an official description of a single "while you were away" summary screen [not found].

Returning-player rules, from Supercell's support portal ([primary](https://ingame.support.supercell.com/clash-of-clans/en/articles/login-calendar.html)):

- Away 35+ days: a 7-day Login Calendar of rewards, with a 135-day cooldown.
- Away 90+ days: a 48-hour Magic Shield plus village boosts. Supercell says the boosts are worth "only around half of what you would earn from regularly emptying your collectors, mines, and drills."
- "Logging in and playing on a regular basis is the quickest way to make progress."

Older shield rules for comparison: before 2025, shields scaled with destruction, 12 hours at 30%, 14 at 60%, 16 at 90% ([3p](https://houseofclashers.com/wiki/en/clash-of-clans-home-village/shields/shields)).

### Stars in attacks

Rules ([3p](https://clashofclans.fandom.com/wiki/Raids)):

1. One star for destroying 50% of buildings.
2. One star for destroying the Town Hall.
3. One star for destroying 100% of buildings.
4. "If at least one star is earned in battle, the battle concludes as a victory for the attacker."
5. Battles last 3 minutes, after a 30-second scouting window.

The daily Star Bonus ([3p](https://clashofclans.fandom.com/wiki/Star_Bonus)):

- Earn 5 stars across battles to get bonus loot.
- The next bonus opens 24 hours after the fifth star.
- Up to two bonuses can stack, so missing one day does not lose the reward.
- The Attack button shows empty star outlines that fill as you score.

### Clash Royale chests and timed unlocks

The old system (before March 2025) ([3p](https://www.charlieintel.com/games/clash-royale-chest-cycle-explained-how-to-get-royal-wild-and-champion-chests-230804/), [3p](https://clashroyale.wiki/resources/chests/)):

1. Four chest slots. A win fills an empty slot.
2. With all four full, you could keep playing but earned no chest.
3. Only one chest unlocked at a time. Silver took 3 hours, Gold 8 hours, Magical and Giant 12 hours, Legendary 24 hours. Gems skipped the wait.

Why it changed:

- January 2025: for King Tower levels 1 to 9, Supercell made Silver and Wooden chests open instantly and gave Crown Chests a 24-hour timer. Its reason was that new players' expectations "may differ from those at the time of the game's release" ([primary](https://supercell.com/en/games/clashroyale/blog/news/chest-experiment-king-tower-levels-1-9/)).
- Chest Keys were removed so players could "play more games and earn rewards without having to worry about the Keys" ([primary](https://supercell.com/en/games/clashroyale/blog/news/chest-key-changes/)).
- April Update 2025: "We've completely removed Chest Queues, Timers, and Keys!" The first 3 wins each day give Lucky Drops, Bonus Rewards and Crowns. The next 7 give Bonus Rewards and Crowns ([primary](https://supercell.com/en/games/clashroyale/blog/release-notes/april-update/)).

What followed (AppMagic estimates via [journalism](https://www.pocketgamer.biz/clash-royale-hits-post-pandemic-record-of-38m-daily-revenue-with-new-mode-merge-tactics/)): $1.4m on April 7 against $734,000 the day before. June 2025 reached $51.4m, the highest month since December 2021. July 8 hit $3.8m in a day. The article credits a new mode (Merge Tactics) and later updates too.

### Boom Beach, Hay Day, Rise of Kingdoms

- Boom Beach used a vault instead of shields. A 2014 analysis estimated early vaults protected about 41% of stored resources ([opinion](https://www.gamedeveloper.com/business/clash-of-clans-vs-boom-beach-part-2---the-habit)). The same author contrasted Clash's negative return pressure (log in to protect loot) with Boom Beach's positive pulls, such as a daily reward based on victory points.
- Hay Day: wheat grows in 2 minutes and shows 5 visible growth stages ([3p](https://hayday.fandom.com/wiki/Wheat)). A fan guide says mature crops "wait for collection and do not rot" ([3p](https://www.farmgamehub.com/en/guides/hay-day/beginner)). A 2014 analysis said Hay Day passes the "Starbucks test," with something to do in 30 seconds or 30 minutes, and estimated Facebook DAU/MAU near 50% ([opinion, 3p](https://www.gamedeveloper.com/business/game-monetization-design-analysis-of-hay-day)).
- Rise of Kingdoms: resources stored as items "cannot be plundered by other governors," while raw resources can ([3p](https://riseofkingdoms.fandom.com/wiki/Resources)). Action Points cap at 1,000 (see above).

### The base as identity and progress display

- Gold Mines change appearance at levels 3 through 17 ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)). The base shows a player's history at a glance.
- Weaponized Builder's Huts (Town Hall 14+) put the builder into defense ([3p](https://clashofclans.fandom.com/wiki/Builder%27s_Hut)). Workers become part of the base's story.
- I found no published retention data on base customization or base-as-identity [not found].

### Supercell's own statements and retention data

- Supercell's CEO lists "Retention, retention, retention" under its first learning. The Clash team spent more than two years paying back design debt before the work "finally bore fruit" ([primary](https://supercell.com/en/news/10-learnings-10-years/7436/)).
- GDC 2015, Jonas Collaros: Clash developers favor "simply playing the game" over roadmaps and focus on "what matters most" ([primary](https://www.gdcvault.com/play/1021858/Clash-of-Clans-Designing-Games)).
- GDC 2020, Eino Joas: Clash of Clans had "over 2 billion installs" and record revenue after seven years ([primary](https://gdcvault.com/play/1026741/-Clash-of-Clans-Bigger)).
- GDC 2018, Touko Tahkokallio: "game design in practice is mostly about finding solutions to concrete problems," with Hay Day's economy as a worked example ([primary](https://www.gdcvault.com/play/1024934/Design-in-Depth-at-Supercell)).
- A commonly repeated figure of 10% two-year retention for Clash of Clans traces back to a LinkedIn summary I could not open. Treat it as unverified [not found].
- Supercell retention curves (D1, D7, D30) for any title: [not found].

---

## 2. Idle and tycoon games

### Offline earnings rules

| Game | Rule | Source |
|---|---|---|
| AdVenture Capitalist | Managers "automatically start a profit cycle after one ends, even if the player is disconnected" | [3p](https://adventure-capitalist.fandom.com/wiki/Managers) |
| Egg Inc | Each silo stores 1 hour of offline income. Standard permit: 2 silos, half rate. Pro permit: 10 silos, full rate. Research adds up to 2 more hours per silo, max 30 hours. Silos grow taller as capacity rises | [3p](https://egg-inc.fandom.com/wiki/Grain_Silos) |
| Cookie Clicker | Base unlock: 5% of normal output for 1 hour, then 0.5%. Upgrades raise it to 91% | [3p](https://cookieclicker.wiki.gg/wiki/Offline_Cookie_Production) |
| Idle Miner Tycoon | Store listing: "collect your idle cash income, even when you are offline!" Cap length: sources disagree | [primary](https://apps.apple.com/us/app/idle-miner-tycoon-money-games/id1116645064), cap [not found] |

On caps, Pecorella's GDC Europe 2016 slide on Egg Inc reads: "Has a 2 hour limit on offline earning. I think this was a mistake, I churned out myself largely because of this" ([primary slides, opinion](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)). Egg Inc later added silos and research that extend the window to 30 hours ([3p](https://egg-inc.fandom.com/wiki/Grain_Silos)).

### The collect and welcome-back moment

- Pecorella at GDC 2015: "the longer you're away from the game, the greater your incentive to return." He credited AdVenture Capitalist with popularizing offline progress, and said each return becomes a celebratory moment ([journalism](https://www.gamedeveloper.com/design/the-rise-of-games-you-mostly-don-t-play)).
- Kolibri playtests Idle Miner Tycoon as three 15-minute sessions with two-hour breaks, to match how people actually play. Players who reached the second mine shaft were "far less likely to churn" ([company-reported](https://start.playtestcloud.com/case-studies/kolibri-games)). No numbers given.
- Data on welcome-back screen design or "double your offline earnings" opt-in rates: [not found].

### Pacing and session data

- Idle games (GameAnalytics, 2020): 5.3 sessions a day, 8-minute sessions, 18% DAU/MAU. Top 10% of idle games: 45.55% D1, 5.82 sessions, 34.92 minutes a day ([3p](https://gameworldobserver.com/2020/12/22/gameanalytics-names-benchmark-engagement-metrics-idle-games)). The same numbers appear on GameAnalytics' own blog without a stated sample period ([3p](https://www.gameanalytics.com/blog/how-to-keep-players-engaged-and-coming-back-to-your-idle-game)).
- All mobile games (GameAnalytics, 2024 data): 4 sessions a day on average, 6 to 7 for midcore, 3.67 in North America. Median session 5 to 6 minutes; top quartile 8 to 9 ([3p](https://gamedevreports.substack.com/p/weekly-gaming-reports-recap-february-21d)).
- Idle Miner Tycoon's first version reached 75% D1 retention, launched after eight weeks ([company-reported](https://kolibrigames.com/blog/keep-on-shipping/)).
- Pecorella's design rule of thumb: players tend to prestige when they would gain "+50% to +200% prestige currency" ([primary slides, opinion](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)).

---

## 3. Casual hits and event loops

### Candy Crush lives

1. Five lives. Losing a level costs one. One life refills every 30 minutes ([3p](https://candycrush.fandom.com/wiki/Lives)).
2. You can wait, pay, or ask friends.
3. Tommy Palm, King, 2013: "I think it makes the game more fun long term... then you binge and eventually you stop playing... It's much better... to create a more balanced experience where you have natural breaks" ([journalism](https://time.com/archive/7066052/candy-crush-saga-the-science-behind-our-addiction/)).
4. King said more than 60% of players on the last level (544 at the time) had not paid "a cent" to get there ([company-reported, via journalism](https://time.com/archive/7066052/candy-crush-saga-the-science-behind-our-addiction/)).

### Monopoly GO

- Dice refill every hour up to a cap. Guides disagree on the base rate: about 5 per hour at the start, rising with net worth ([3p](https://www.thegamer.com/monopoly-go-free-dice-rolls-guide/)). Another guide says 20 per hour, and a Roll Boost event gives 100 per hour for up to 8 hours ([3p](https://theriagames.com/guide/monopoly-go-roll-boost-guide/)). No official figure found [not found].
- Sticker albums run about two to three months, with 21 sets of 9 stickers. Golden Blitz events allow trading normally untradeable gold stickers ([3p](https://www.pcgamesn.com/monopoly-go/wiki)).
- At least two events run at any time ([3p](https://www.pcgamesn.com/monopoly-go/wiki)).
- Revenue: over $6 billion lifetime in-app revenue in 2025, the fastest to that level (Sensor Tower estimate). Scopely says about $200 million a month. The same post says "70% of players returning every single day" without defining the measure ([3p and company-reported](https://sensortower.com/blog/monopoly-go-app-revenue-milestone)).
- Design note: an ex-Zynga product manager names Monopoly GO's "subtle haptic feedback when you're rolling the dice" as an example of design sense that consumer apps should copy ([opinion](https://www.deconstructoroffun.com/blog/2025/5/19/5-superpowers-to-leverage-inside-consumer-apps)).

### Royal Match

- The official help center lists 34 event types (my count) ([primary](https://dreamgames.helpshift.com/hc/en/3-royal-match/section/23-events-and-tournaments/)).
- Examples: Royal Pass has 30 steps and runs monthly. King's Cup pits you against 49 others. Sky Race against 4. Lava Quest needs 7 first-try wins in a row ([primary](https://dreamgames.helpshift.com/hc/en/3-royal-match/section/23-events-and-tournaments/)).
- Most events are small groups or short steps. Retention data: [not found].

### Pokémon GO

- Since November 2016, the first PokéStop each day gives bonus XP and items, and a 7-day streak gives a bigger bonus ([3p](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_GO)). TechCrunch framed it as Niantic's answer to "How the heck do they keep people coming back?" ([journalism](https://techcrunch.com/?p=1411038)).
- Research Breakthrough: one stamp per day, and seven stamps unlock a reward ([journalism](https://nintendowire.com/guides/pokemon-go/research-breakthrough-october-2026/)). A search summary said the days need not be consecutive, but I could not confirm that on the page [not verified].
- Niantic retention data tied to these features: [not found].

---

## 4. Game feel and juice

### Practitioner talks

- "Juice It or Lose It," Martin Jonasson and Petri Purho, GDC Europe 2012: they take a plain Breakout clone and add effects without changing rules, showing "neat little tricks you can apply to any game to make it more satisfying to play" ([primary](https://www.gdcvault.com/play/1016487/Juice-It-or-Lose)).
- "The art of screenshake," Jan Willem Nijman (Vlambeer), INDIGO Classes 2013 ([primary video](https://www.youtube.com/watch?v=AJdEqssNZ-U)). I could not load the transcript, so I do not list its specific tricks here.
- Steve Swink defines game feel as "real-time control of virtual objects in a simulated space, with interactions emphasized by polish" (book, 2008) ([3p summary](https://en.wikipedia.org/wiki/Game_feel)).
- Supercell or King talks focused on UI polish: [not found] (search quota ran out).

### What the experiments found

| Study | Design | Result |
|---|---|---|
| Kao 2020 ([academic](https://doi.org/10.1016/j.entcom.2020.100359)) | N = 3,018, action RPG, four juice levels | None and Extreme both lowered play time, player experience, motivation and performance compared with Medium and High |
| Kao et al. 2024 ([academic](https://doi.org/10.1145/3613904.3642656)) | n = 1,699, preregistered, 2x2 plus control | "Success dependence enhanced all motives, while amplification unexpectedly reduced them." Curiosity was "the strongest enjoyment and only playtime predictor" |
| Hicks et al. 2019 ([academic](https://doi.org/10.1145/3311350.3347171)) | n = 40 and n = 32, three games | Visual embellishments raised visual appeal in all games. They affected competence "only under specific circumstances" |
| Juul and Begy 2016 ([academic](https://www.academia.edu/28934462/Good_Feedback_for_bad_Players_A_preliminary_Study_of_juicy_Interface_feedback)) | n = 46, match-3 | No significant difference in ease of use, rated quality or performance (as summarized in Kao et al. 2024) |

Detail from Kao et al. 2024 (descriptive means from their Table 2): control players averaged 13.31 minutes of free play. The condition with amplified, success-dependent feedback averaged 14.76 minutes. That gap is 1.45 minutes, about 11% (my arithmetic). Competence fell from 5.19 to 4.80 on a 7-point scale in the condition where amplification fired regardless of success. The authors traced that drop to a glow effect that hid the next hit. Their design advice: "success-dependent amplified feedback enhances competence, curiosity, effectance, and enjoyment."

My reading [opinion]: juice works best when its size tracks how well something went, and when it never hides the next thing the player needs to see.

### Animation timing

- Response limits (Nielsen): 0.1 second feels instant, 1 second keeps flow, 10 seconds is the attention limit ([primary](https://www.nngroup.com/articles/response-times-3-important-limits/)).
- Apple: "Aim for brevity and precision in feedback animations." "Let people cancel motion... don't make people wait for an animation to complete." "Maintaining a consistent frame rate of 30 to 60 fps typically results in a smooth, visually appealing experience" ([primary](https://developer.apple.com/design/human-interface-guidelines/motion)).
- Apple on Reduce Motion: cut automatic and repeating animations, tighten springs to reduce bounce, swap slides for fades ([primary](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
- Classic principles from The Illusion of Life (1981): squash and stretch, anticipation, follow-through, slow in and slow out, timing, arcs, exaggeration ([3p summary](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)).
- Measured data on number pop-ups or coin-fly-to-counter animations: [not found]. These are craft conventions without published effect sizes.

### Haptics

Apple's guidance ([primary](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)):

- "Use system-provided haptic patterns according to their documented meanings."
- "Build a clear, causal relationship between each haptic and the action that causes it." Using the same pattern for failure and success confuses people.
- "Match the intensity and sharpness of a haptic with the intensity and sharpness of the animation it accompanies."
- "Avoid overusing haptics... the best haptic experience is one that people may not be conscious of, but miss when it's turned off."
- "Make haptics optional."
- Built-in patterns: Notification (success, warning, error), Impact (light, medium, heavy, rigid, soft), Selection.

WWDC21 "Practice audio haptic design" gives three principles ([primary](https://developer.apple.com/videos/play/wwdc2021/10278/)): Causality ("it must be obvious what caused it"), Harmony ("It should feel the way it looks, and the way it sounds"), and Utility ("Reserve haptics and audio for significant moments").

Data on haptics and engagement or retention: [not found].

### Sound

- When an iPhone is on silent, people "also want to silence nonessential sounds, such as... sound effects, game soundtracks" ([primary](https://developer.apple.com/design/human-interface-guidelines/playing-audio)).
- App Store previews "play with the sound muted" by default ([primary](https://developer.apple.com/app-store/app-previews/)).
- Published rates of sound-on versus sound-off play in mobile games: [not found] (search quota ran out). Design as if most players have sound off.

### First impressions

- Web pages: visual appeal judged after 50 ms correlated highly with ratings after 500 ms ([academic](https://doi.org/10.1080/01449290500330448)).
- Perceived beauty drove perceived usability after use, while actual usability did not ([academic](https://doi.org/10.1016/S0953-5438(00)00031-X)). This was an ATM simulation, not a game.
- Apple's game guidance: "Let people play as soon as installation completes" and "Teach through play" ([primary](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)).
- Hicks et al. found visual embellishments raised visual appeal in every game tested (see table above).
- A study measuring how fast players judge a game's quality from its first screen or first seconds: [not found].

---

## 5. Isometric art for a small team

### Why isometric

- Games draw isometric with a 2:1 pixel ratio, so axes run at about 26.565 degrees ([3p](https://en.wikipedia.org/wiki/Isometric_video_game_graphics)).
- Objects keep their size anywhere on the map, so sprites need no scaling. The angle shows faces a top-down view hides ([3p](https://en.wikipedia.org/wiki/Isometric_video_game_graphics)).
- The view makes it easier to read and direct many units at once, which is why strategy and city builders use it (SimCity 2000, Civilization II) ([3p](https://en.wikipedia.org/wiki/Isometric_video_game_graphics)).

### Readability rules

Apple's rules that apply directly:

- "Avoid relying solely on color to differentiate between objects... use text labels or glyph shapes" ([primary](https://developer.apple.com/design/human-interface-guidelines/color)).
- iOS controls: 44x44 pt default, 28x28 pt minimum, with about 12 to 24 pt padding ([primary](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

Rules I would add [opinion]: give every building a distinct silhouette, one accent color per system, and a visible state change (fill level, smoke, light) that reads at thumbnail size. Clash of Clans does this with the mine cart and the idle builder's "z's" ([3p](https://clashofclans.fandom.com/wiki/Gold_Mine/Home_Village)).

### Asset sources and licenses

| Source | License | What fits | Link |
|---|---|---|---|
| Kenney | CC0. "Attribution is not required," commercial use allowed | 16 isometric packs, including Isometric Miniature Bases (40 files, 2023), Isometric Tiles Buildings, City, Landscape, Roads | [primary](https://kenney.nl/support), [list](https://kenney.nl/assets/tag:isometric), [pack](https://kenney.nl/assets/isometric-miniature-bases) |
| Quaternius | CC0. Free for commercial use, no attribution needed | 3D buildings, rigged and animated characters | [primary](https://quaternius.com/faq.html) |
| KayKit (Kay Lousberg) | Not stated on the index page. Check each pack | City Builder Bits, Medieval Hexagon, characters | [primary](https://kaylousberg.com/game-assets), license [not found] |
| React Native Skia | MIT | Code-drawn shapes, paths, shaders | [primary](https://github.com/Shopify/react-native-skia) |
| Reanimated | MIT | Springs and gesture-driven motion | [primary](https://github.com/software-mansion/react-native-reanimated) |

CC0 packs have a look many players have already seen. Recoloring them, combining them with code-drawn shapes, and adding original characters keeps the look original [opinion].

### AI image generation

- Consistency is a known open problem. Text-to-image users "struggle with the generation of consistent characters," which the authors flag for "game development" and "asset design" ([academic preprint](https://arxiv.org/abs/2311.10093)). Another paper calls portraying the same subject across prompts "challenging" ([academic preprint](https://arxiv.org/abs/2402.03286)).
- Ownership: the US Copyright Office (January 29, 2025) says AI outputs are protectable "only where a human author has determined sufficient expressive elements," and prompts alone do not qualify. Human arrangement or modification of AI output can qualify ([primary](https://www.copyright.gov/newsnet/2025/1060.html)).
- Practical reading [opinion]: AI is fine for mood boards. For final building and agent art, code-drawn shapes or edited CC0 parts give consistency and clearer ownership.

---

## 6. Visible workers and characters

- Labor illusion: across five experiments in online travel and dating, people "can actually prefer websites with longer waits to those that return instantaneous results ... even when those results are identical" when the site shows the effort it is making. Perceived effort produced feelings of reciprocity ([academic](https://doi.org/10.1287/mnsc.1110.1376)).
- Seeing the work, in the field: two field and two lab experiments in food service. Letting customers see the cooks and cooks see the customers raised customer-reported quality by 22.2% and cut throughput time by 19.2% ([academic](https://doi.org/10.1287/mnsc.2015.2411)).
- Neko Atsume: cats visit the yard while you are away. You return to see who came and collect their gifts. It passed 10 million downloads by December 2015 and won a CEDEC game design award ([journalism summary](https://en.wikipedia.org/wiki/Neko_Atsume)). Its designer said, "to be honest, I do not know why this game is so popular."
- Clash of Clans builders walk to jobs, hammer, rush to the Town Hall during raids, and show "z's" when idle ([3p](https://clashofclans.fandom.com/wiki/Builder)).
- Egg Inc silos grow taller as away-time capacity rises ([3p](https://egg-inc.fandom.com/wiki/Grain_Silos)).
- Finch: its site claims a 5.0 rating from "500k+ ratings" ([company-reported](https://finchcare.com/)). I found no Finch retention data.
- Goal progress: people work harder as they get closer to a reward, and a 12-stamp card with 2 bonus stamps finished faster than a plain 10-stamp card ([academic](https://doi.org/10.1509/jmkr.43.1.39)). Giving people artificial early progress raised completion ([academic](https://doi.org/10.1086/500480)).
- A measured retention lift from animated characters in a game or app: [not found]. "Bside's character life": [not found].

---

## What carries over to Outpost

### Base screen

1. Open on the base, not the feed. Judges form a visual verdict in well under a second (Lindgaard, 50 ms), and visual polish raises perceived usability (Tractinsky). The feed is one tap away.
2. Show motion from the first frame. Agents should be walking between buildings before the user touches anything. The labor illusion research says visible effort raises perceived value. Clash of Clans uses walking builders for the same purpose.
3. Every building must show its real state without a tap. The vault fills like the Gold Mine cart, the studio smokes while rendering, and the tower lights up with views. An idle agent shows an idle sign, the way Clash's builder hut shows "z's." Use shape and motion, not color alone (Apple).
4. Keep buildings big enough to tap. Each needs at least a 44x44 pt hit area (Apple). On a phone that limits the opening view to about 6 to 8 buildings [opinion].
5. Make the base a record of real progress. Change a building's art at real milestones (first sale, first 10k views), the way Gold Mines change look at 15 levels.

### Collect moment

1. Never stop agents at a cap. Supercell lengthened fill times twice, and Pecorella churned from a 2-hour cap. If the vault shows a "full" state, size it to at least a day of typical earnings, matching Builder Base's 24 hours.
2. Expect sparse revenue. Idle games collect about 5 times a day (GameAnalytics). Real Whop sales may come less than once a day. Make views the frequent collect and revenue the rare big one [opinion based on the session data].
3. Scale the juice to the size of the result. A $2 sale gets a small coin hop and a light impact haptic. A record day gets the full coin burst, count-up and a success notification haptic. Kao et al. 2024 found success-dependent feedback helps and uniform amplification hurts.
4. One tap collects everything, as Clash has done since 2017.
5. Keep the sequence under about 1 second and let a tap skip it. Nielsen's 1-second flow limit and Apple's "let people cancel motion" both apply. Match haptic strength to the animation (Apple Harmony).
6. Count up real numbers from the last-seen value. The genuine uncertainty about how many views came in is the curiosity driver Kao et al. measured. Never fake randomness.

### Raids and stars

1. Copy Clash's star structure. Star 1 at 50% of the revenue target, star 2 for the key outcome (the "Town Hall" of the raid, such as a first sale), star 3 at 100%. One star counts as a win, so most raids end in some success.
2. Show each star's progress bar on the base and in the raid card. People speed up as a goal gets close (Kivetz et al.), and early progress raises completion (Nunes and Drèze). Start the bar from real work already done, never from fake progress.
3. Reveal stars one at a time, each with its own impact haptic, getting heavier from star 1 to star 3.
4. Keep a raid report with a short replay of what agents did, like the Defense Log replay.
5. Forgive missed days. Clash lets two Star Bonuses stack. A raid window should survive a day away.
6. Do not punish the user's real business for not opening the app. Clash itself moved to Shadow Bases and no-loss Ranked defenses.

### Away screen

1. Make the return the reward, since there are no push notifications. Pecorella: "the longer you're away... the greater your incentive to return." Neko Atsume built a hit on finding out who came while you were gone.
2. List the work, then the results. Show videos made, posted and approved, then views gained and sales. The labor illusion says showing the effort raises the value of the result.
3. Order items from small to large and end on the biggest real number, then drop the user on the base [opinion].
4. Use honest, real waits. Clash Royale removed artificial timers and its revenue later rose (AppMagic, correlation only). Outpost's waits (rendering, views accruing) are real, so show them as progress, never as gates to pay past.
5. Give a real reason to open daily. Clash says regular play beats return boosts, which pay "around half." For Outpost, the feed's approvals can be that reason if agents hold drafts for review [opinion, team decision].

### Polish budget, in build order

1. Ambient life on the base: agents walking, building state animations at 60 fps. This drives the first-screen verdict and the labor-illusion effect. It costs the most and matters most for judges.
2. The collect moment: count-up, coin fly to counter, scaled haptic. This is the moment the user repeats daily.
3. Swipe approve and reject: the card tracks the finger, springs back under threshold, and gives a selection tick at the threshold. Approve and reject get two different, consistent haptics (Apple: one meaning per pattern).
4. Star reveal: sequential stamps with stepped impact haptics.
5. Building upgrade swap at real milestones.

Leave out, or use rarely:

- Screen shake on routine actions.
- Particles that cover the next thing to tap. Kao et al. traced a drop in competence to exactly this.
- The same big effect on every tap. Kao 2020 found extreme juice lowered play time.
- Anything that depends on sound. Apple silences game sound on silent, and store previews start muted.
- Support Reduce Motion from day one: fades instead of slides, tighter springs.

---

## Open unknowns

1. Sound-on rates for mobile games: no published figure found. Search quota ran out.
2. Haptics and retention: no study found linking haptics to engagement or retention.
3. Game first impressions: no study found on how fast players judge a game from its first screen. The 50 ms result is for web pages.
4. Visible characters and retention: no measured effect found for animated workers or pets. The labor illusion evidence comes from websites and restaurants.
5. Supercell retention curves: not public, apart from "retention, retention, retention." The 10% two-year Clash figure is unverified.
6. Real-outcome stars: no evidence on whether stars tied to real money motivate like game stars, or whether a failed real raid stings more than a failed game raid.
7. Revenue sparsity: how often a new Outpost user's vault gets a real sale is unknown. That rate decides whether revenue can carry the collect moment.
8. Monopoly GO's dice refill rate and the meaning of "70% of players returning every single day" are not officially documented.
9. Idle Miner Tycoon's offline cap and the conversion rates of "double your offline earnings" offers: not found.
10. Pokémon GO Research Breakthrough's no-reset rule could not be confirmed on the fetched page.
