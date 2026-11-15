# Daily return: how apps get opened every day, and what Outpost can copy without push

Scope: Duolingo, Snapchat, BeReal, Wordle and NYT Games, Candle, Finch, Locket, Co-Star, Spotify, Headspace and Calm, Gas, tbh and NGL, Pokémon GO, research on habits and streaks, and iOS return triggers that work with a free Apple ID.

## Source tags

- [primary] An official company publication: filing, shareholder letter, company blog or newsroom, help center, App Store listing, or Apple developer docs.
- [company-reported] A number or claim a company gave in an interview, podcast or press story. It has not been audited.
- [academic] A peer-reviewed paper or preprint.
- [journalism] A news outlet's own reporting.
- [3p] An analytics firm, fan wiki, or third-party blog.
- [opinion] A judgment, including mine.
- [my arithmetic] A number I calculated from cited figures.
- [not found] I looked and did not find a source.

## Method and limits

I read company posts, filings, Apple docs and papers directly where I could. Partway through, the shared web-search budget for this session ran out. After that I only fetched pages I could reach by known URL. Because of that, three gaps remain. I found no user numbers for Locket. Co-Star and Headspace are thinly covered. I could not read the BMJ Pokémon GO paper. These are marked [not found] below.

## Short answer

1. The apps with the best daily return make the daily unit tiny. Duolingo split "one lesson" from the daily goal and got +3.3% day-14 retention and +1% daily active learners, relative. [primary] [Duolingo, Nov 2020](https://blog.duolingo.com/improving-the-streak/) Candle sells "1-minute daily rituals." [primary] [App Store](https://apps.apple.com/us/app/candle-couples-relationship/id6743355635)
2. Streak protection is a retention feature, not a giveaway. Letting learners hold two Streak Freezes raised daily active learners 0.38%. [primary] [Duolingo, Jan 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) A third freeze did no better than two. Giving new users two freezes at the start was "another huge DAU win." [company-reported] [Lenny's Podcast transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
3. The research backs forgiveness. Missing one day "did not materially affect the habit formation process." [academic] [Lally et al.](https://doi.org/10.1002/ejsp.674) Broken streaks lower later engagement, and letting people "repair" a streak weakens that drop. [academic] [Silverman & Barasch, JCR](https://doi.org/10.1093/jcr/ucac029) In a 61,293-person gym megastudy, the best of 54 interventions paid small rewards for coming back after a missed workout. [academic] [Milkman et al., Nature 2021](https://doi.org/10.1038/s41586-021-04128-4)
4. A widget is the best-documented return trigger that doesn't need push. Duolingo says half of learners with its widget have a streak of 6+ months, and that widget users retain "far better" even after controlling for commitment. Learners told Duolingo the widget was "just as effective" as push. [primary] [Duolingo, Aug 2023](https://blog.duolingo.com/widget-feature/) Locket's whole product is a widget. [primary] [App Store](https://apps.apple.com/us/app/locket-widget/id1600525061)
5. Widgets, Live Activities, local notifications, calendar events and background refresh all work with a free Apple ID. Remote push, widget push and Live Activity push do not. Apple's capability table gives the free tier App Groups and Background Modes but not Push Notifications. [primary] [Apple capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios) Local notifications are not push. Apple's `add(_:)` call "schedules local notifications only." [primary] [Apple](https://developer.apple.com/documentation/usernotifications/unusernotificationcenter/add(_:withcompletionhandler:))
6. A widget on a home screen the user often sees gets 40 to 70 refreshes a day, about every 15 to 60 minutes. Timeline entries can change what it shows at set times with no network call. [primary] [Apple WidgetKit](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
7. One-a-day scarcity drives sharing and ritual. Wordle went from 90 players on 1 Nov 2021 to over 300,000 on 2 Jan 2022 and over 2 million a week later, after the share grid shipped on 16 Dec 2021. [journalism] [Guardian](https://www.theguardian.com/games/2022/jan/11/wordle-creator-overwhelmed-by-global-success-of-hit-puzzle) [primary] [Wardle tweet](https://x.com/powerlanguish/status/1471493886031773707) Its creator credits "limiting players to one game per day." [journalism] [NYT via Daring Fireball](https://daringfireball.net/linked/2022/01/05/wordle)
8. Scarcity alone does not hold people. BeReal's daily users fell from about 15M in Oct 2022 to under 6M in Mar 2023, per Apptopia. [journalism] [NYT](https://www.nytimes.com/2023/04/13/style/bereal-app.html) BeReal also depends on a push alert that Outpost cannot send.
9. Daily return compounds into revenue. Duolingo reported 64.9M DAU and 153.1M MAU for Q3 2026. [primary] [Q3 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026069474/q3fy26duolingo9-30x26share.htm) That is a DAU/MAU of about 42%, up from about 37% a year earlier. [my arithmetic]

## Duolingo

### Mechanics, step by step

1. **The streak.** It counts consecutive days with at least one lesson. In 2020 Duolingo split the streak from the daily goal so one lesson was enough. [primary] [Duolingo 2020](https://blog.duolingo.com/improving-the-streak/)
2. **The reminder.** The practice reminder is sent "23 and a half hours after you practice the day before." [company-reported] [Shuttleworth on Lenny's Podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
3. **The stakes.** If you miss a day with no protection, the streak resets to zero.
4. **Protection.** You can hold up to two Streak Freezes at once. Each one covers one missed day. A refill cost 400 gems in the 2022 screenshot. [primary] [Duolingo 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) New users start with two. A paid repair was later replaced by "Earn Back," which "worked way better." [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
5. **The wager.** You bet gems that you'll keep a 7-day streak and win double if you do. [primary] [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
6. **Weekend protection.** DAU drops "as much as 5-10% on weekends," so Duolingo tested a Weekend Amulet. [primary] [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
7. **Status with no reward.** A "perfect streak" turns the streak gold. "There's no reward for doing it." [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
8. **Weekly leagues.** Learners compete on a weekly leaderboard and move up or down a league. [journalism] [Mazal, Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
9. **Friend Streaks.** You can keep a separate shared streak with up to five friends, and nudge a friend who hasn't done a lesson. [primary] [Duolingo, Aug 2024](https://blog.duolingo.com/friend-streak/)
10. **The widget.** It shows only the streak count and whether today is done. Duo looks more panicked as midnight nears and relaxed once the lesson is done. [primary] [Duolingo, Aug 2023](https://blog.duolingo.com/widget-feature/)

### First session

- **Lesson before sign-up.** Third-party write-ups say moving sign-up after the first lesson raised DAU by about 20%. They disagree on whether the 20% was DAU or next-day retention. [3p] [Appcues](https://www.appcues.com/blog/the-10-best-user-onboarding-experiences) I found no Duolingo source for this. [not found]
- **Commitment copy.** Changing the goal button to "commit to my goal" was "a massive win." [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
- **The first week is the fragile part.** "Once you get to seven days, loss aversion kicks in, and you retain." [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)

### Evidence

| Claim | Number | Tag and source |
|---|---|---|
| DAU, Q3 2026 | 64.9M, +29% year over year | [primary] [Q3 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026069474/q3fy26duolingo9-30x26share.htm) |
| MAU, Q3 2025 and Q3 2026 | 135.3M and 153.1M | [primary] same |
| DAU/MAU | About 37% to 42% | [my arithmetic] |
| Split streak from daily goal | +3.3% D14, +1% DAU, +10.5% share of learners on a streak in 20 days, all relative | [primary] [Duolingo 2020](https://blog.duolingo.com/improving-the-streak/) |
| Two freezes equipped | +0.38% daily active learners | [primary] [Duolingo 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) |
| Streak milestone animation | +1.7% of new learners still active on day 7 | [primary] same |
| 7-day streak | 3.6x more likely to finish the course | [primary] same |
| 7-day streak | 2.4x more likely to use Duolingo the next day | [primary] [Duolingo 2020](https://blog.duolingo.com/improving-the-streak/) |
| Streak Wager | Day-7 retention +14% | [primary] [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/) |
| Weekend Amulet | 4% more likely to return a week later, 5% less likely to lose the streak | [primary] same |
| Friend Streak | 22% more likely to finish the daily lesson | [primary] [Duolingo 2024](https://blog.duolingo.com/friend-streak/) |
| Year-long streaks | Nearly 8M in Aug 2024; over 9M per a Dec 2024 podcast | [primary] same; [company-reported] [podcast](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks) |
| Widget | Half of widget users have a 6+ month streak | [primary] [Duolingo 2023](https://blog.duolingo.com/widget-feature/) |
| Leaderboards and leagues | Learning time +17%; learners doing 1 hour a day, 5 days a week, tripled | [journalism] [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) |
| Retention program, about 2018 to 2022 | DAU 4.5x over four years; current-user retention +21%; daily churn of best users down over 40% | [journalism] same |
| Retention vs other levers | Current-user retention had "5 times the impact" on DAU of the next best metric | [journalism] same |
| Streak experiments | Over 600 in four years; about half lose | [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md) |
| Notification bandit | +0.5% DAU and +2% new-user retention | [academic] [Yancey & Settles, KDD 2020](https://research.duolingo.com/papers/yancey.kdd20.pdf) |

The bandit paper matters for Outpost. Duolingo picks among reminder templates and penalizes recently used ones, because repeated templates lose their effect. The paper calls these "recovering" arms. [academic] [Yancey & Settles](https://research.duolingo.com/papers/yancey.kdd20.pdf)

A widely repeated claim says the iOS widget raised "user commitment by 60%." I found no Duolingo source for it. Don't cite it. [not found]

### Downsides

- Making the streak easier wins engagement only up to a point. "You can almost always get engagement wins, up to a certain point, by just cheapening the streak." [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
- Weekend dips of 5 to 10% show the daily rhythm doesn't fit everyone's week. [primary] [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- The widget figure has selection bias, since committed learners are the ones who add widgets. Duolingo says it controlled for this but doesn't say how. [primary] [Duolingo 2023](https://blog.duolingo.com/widget-feature/)

## Snapchat: Snapstreaks and Snap Map

### Mechanics, step by step

1. Two friends send each other photo or video Snaps every day. Chat messages don't count. After a few days a fire emoji appears. [primary] [Snapchat help](https://help.snapchat.com/hc/en-us/articles/7012394193684-How-do-Streaks-work-and-when-do-they-expire) Third-party guides say three days, but Snap's help page doesn't give a number. [3p]
2. An hourglass emoji means the streak is about to end. Both people need to send a Snap within 24 hours. [primary] [Snapchat help](https://help.snapchat.com/hc/en-us/articles/7012318024852-I-lost-my-Streak-How-do-I-restore-it)
3. If more than a day passes without a Snap from everyone in the chat, the streak ends. [primary] [Snapchat help](https://help.snapchat.com/hc/en-us/articles/7012394193684-How-do-Streaks-work-and-when-do-they-expire)
4. Restore launched as a test in March 2023. One restore is free, more can be bought in the app, and Snapchat+ subscribers were promised a streak freeze. [primary] [Snap newsroom, 1 Mar 2023](https://newsroom.snap.com/keep-the-streak-with-restore?lang=en-GB) The help center says a restore works only for a limited time after the streak ends. [primary] [Snapchat help](https://help.snapchat.com/hc/en-us/articles/7012318024852-I-lost-my-Streak-How-do-I-restore-it)
5. Snap Map shows where friends are and what's happening nearby. You can open it any time, with no daily deadline.

### Evidence

- Snap Map had over 350M monthly users in Q2 2023. [primary] [Snap Q2 2023 investor letter](https://www.sec.gov/Archives/edgar/data/1564408/000156440823000036/q22023investorletter_vf.htm) In May 2025 that was over 400M. [primary] [Snap newsroom](https://newsroom.snap.com/2025-snap-map-mau)
- I found no streak usage numbers in the two Snap investor letters I checked, Q2 2023 and Q2 2024. [not found]
- Streak teens. In a Belgian survey of 2,483 early adolescents with a mean age of 13.5, 83.3% of girls and 66.9% of boys who used Snapchat had a current streak. The mean longest streak was 223 days for girls and 179 for boys. [academic] [van Essen & Van Ouytsel 2023](https://doi.org/10.1016/j.teler.2023.100087)

### Downsides

- The same study linked streaks to problematic smartphone use, with t(1925) = 6.22 and p < 0.001. Fear of missing out correlated with streak length at r = 0.175. The authors call all effects "relatively small." [academic] [van Essen & Van Ouytsel 2023](https://doi.org/10.1016/j.teler.2023.100087)
- Snap streaks are social. Your friend can break them, and you feel responsible to them. Outpost has no friend on the other side.

## BeReal

### Mechanics, step by step

1. Once a day, at a random time, everyone gets the same push alert. They then have two minutes to post a front and back camera photo. [journalism] [Wired](https://www.wired.com/story/how-to-use-bereal/)
2. You can't see friends' posts for the day until you post your own. When the next alert fires, yesterday's posts disappear. [journalism] same
3. Late posts are allowed but labeled with how late they were. [journalism] same
4. If you post on time you can post bonus BeReals. In July 2024 the limit went up to five. [primary] [BeReal help](https://help.bereal.com/hc/ja/articles/10388190752669-Bonus-BeReal)

**First session.** You see nothing until you post, so the first post comes before any reward. [journalism] [Wired](https://www.wired.com/story/how-to-use-bereal/)

### Evidence

| Measure | Number | Tag and source |
|---|---|---|
| DAU, late Aug 2022 | Over 10M | [journalism] [Social Media Today](https://www.socialmediatoday.com/news/bereal-rises-to-10-million-daily-active-users/630449/) |
| DAU, Oct 2022 to Mar 2023 | About 15M to under 6M, per Apptopia | [journalism] [NYT](https://www.nytimes.com/2023/04/13/style/bereal-app.html) |
| Drop | About 60% | [my arithmetic] |
| A different Apptopia series | 20M in Oct 2022 to 10.4M by Feb 2023, a 48% drop | [journalism] [TechCrunch](https://techcrunch.com/2023/02/18/this-week-in-apps-twitter-alternative-winners-and-losers-bereal-declines-ios-web-apps-to-get-notifications/) |
| At sale, June 2024 | "More than 40 million active users," and "half of them use the app at least 6 days a week." Sold for €500M | [primary] [BeReal press release](https://bereal.com/news/voodoo-acquires-bereal) |
| 2025 | €30M revenue, "stabilized audience in France," profitability targeted for 2027 | [primary] [Voodoo, Mar 2026](https://voodoo.io/news/2025-a-year-of-growth-and-transformation-for-voodoo) |

### Downsides

- The NYT reports users found the daily post monotonous after the novelty wore off. [journalism] [NYT](https://www.nytimes.com/2023/04/13/style/bereal-app.html)
- The whole loop rests on a push alert at an unknown time. Without push, Outpost can't copy the random window. A fixed daily time is the version that works without push.

## Wordle and NYT Games

### Mechanics, step by step

1. There is one puzzle a day, the same for everyone. [journalism] [Syntax podcast transcript](https://syntax.fm/show/430/creator-of-wordle-josh-wardle/transcript)
2. Six guesses. When you finish, there is nothing more to play until tomorrow.
3. A share button makes a spoiler-free emoji grid. Wardle added it on 16 Dec 2021 after a New Zealand player invented the format. [primary] [Wardle tweet](https://x.com/powerlanguish/status/1471493886031773707) [journalism] [Slate interview](https://slate.com/culture/2022/01/wordle-game-creator-wardle-twitter-scores-strategy-stats.html)
4. Your stats and streak are tracked. Hard puzzles break streaks. NYT reported that "Bongo" snapped 36,337 streaks on 14 May 2025. [journalism] [TODAY](https://www.today.com/popculture/hardest-wordle-connections-puzzle-2025-new-york-times-games-rcna251022)

**First session.** No account and no tutorial wall. You type a guess on the first screen. NYT later added logins to track stats. [3p] [Wikipedia](https://en.wikipedia.org/wiki/Wordle)

### Evidence

- Growth went from 90 players on 1 Nov 2021 to over 300,000 on 2 Jan 2022, and to over 2 million a week later. [journalism] [Guardian](https://www.theguardian.com/games/2022/jan/11/wordle-creator-overwhelmed-by-global-success-of-hit-puzzle)
- Wardle on the design: "The breakthrough, he said, was limiting players to one game per day. That enforced a sense of scarcity." He also said "It's something that encourages you to spend three minutes a day... it doesn't want any more of your time than that." [journalism] [NYT profile, quoted by Daring Fireball](https://daringfireball.net/linked/2022/01/05/wordle) and "people have an appetite for things that transparently don't want anything from you." [journalism] [TechCrunch](https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/)
- NYT bought Wordle in Jan 2022 for a sum "in the low seven figures." [journalism] [Forbes](https://www.forbes.com/sites/masonbissada/2022/01/31/new-york-times-buys-puzzle-game-wordle-for-low-seven-figures/)
- In 2025, NYT puzzles were played 11.2 billion times, including 4.2 billion Wordle solves and 1.6 billion Connections solves. Players shared an average of 46 Wordle scores per second. [journalism quoting NYT] [Fast Company](https://www.fastcompany.com/91539885/wordle-statistics-show-why-new-york-times-is-turning-game-into-nbc-tv-show) [TODAY](https://www.today.com/popculture/hardest-wordle-connections-puzzle-2025-new-york-times-games-rcna251022)

### Downsides

- The 2024 and 2025 figures count different things, plays versus solves, so they don't show a trend. [3p] [Wikipedia](https://en.wikipedia.org/wiki/The_New_York_Times_Games)
- Wardle chose not to grow by pushing attention: "I am a bit suspicious of mobile apps that demand your attention and send you push notifications." [journalism] [Kotaku, BBC Radio 4 interview](https://kotaku.com/wordle-creator-doesnt-want-his-popular-game-to-take-ove-1848316642) Wordle's daily return came from habit and sharing, not reminders. It is the closest model for an app with no push.

## Candle, a hackathon sponsor

### Mechanics, step by step

1. Two people pair up, either a couple or close friends.
2. Each day the app deals a new challenge. It can be a question, a "who's more likely" game, a photo prompt, a drawing or a debate. You "unlock your partner's answers" after answering yourself. [primary] [App Store listing](https://apps.apple.com/us/app/candle-couples-relationship/id6743355635)
3. Answering keeps a shared streak alive. [primary] [YC launch](https://www.ycombinator.com/launches/OFK-candle-the-duolingo-for-relationships)
4. Streak protection:
   - Every pair gets one free streak restore per month, added in v1.6.7 on 16 Dec 2025.
   - Sparks can be spent to "protect your streak."
   - A "Streak Reignite" costs $2.99.

   [primary] [App Store](https://apps.apple.com/us/app/candle-couples-relationship/id6743355635)
5. Sparks are the point currency. You earn them, send them to your partner, and spend them on decks, hints and streak protection. Version 2.0.0, out 12 Nov 2026, adds "Ember," a shared pet the pair raises with Sparks, plus quests. [primary] same
6. Widgets: streak widgets, a daily photo widget, a "Time Together" lock-screen counter, canvas and countdown widgets. Live Activities on iOS. [primary] same
7. "One tap deals your next question, date or game," and there is a "daily swiper." [primary] same

**First session.** The October 2026 update shipped a "new onboarding experience." [primary] same The details aren't public. [not found]

### Evidence

| Measure | Number | Tag and source |
|---|---|---|
| Users, Sept 2025 | 300,000, including 150,000 couples | [journalism] [TechCrunch](https://techcrunch.com/2025/09/24/these-yc-founders-pivoted-5-times-before-building-a-social-app-that-nabbed-300k-users-and-over-1m-arr-in-6-months) |
| Monthly actives | Over 250,000 | [company-reported] same |
| DAU/MAU | About 50% | [company-reported] same |
| Implied DAU | About 125,000 | [my arithmetic] |
| Revenue | Monthly revenue over $150,000, a run rate above $1M, six months after launch | [company-reported] same |
| Monthly churn under 8% | Already known to the team | Not re-verified here |
| App Store ratings | 12K ratings, 4.8 average, as of 12 Nov 2026 | [primary] [App Store](https://apps.apple.com/us/app/candle-couples-relationship/id6743355635) |

Candle's founder noticed people screenshotting questions into group chats, so the team built sharing to Instagram Stories into the app. [company-reported] [Alex Ruber on X](https://x.com/alex_ruber/status/1920911445350650175)

### Downsides

- TechCrunch's own open question is whether "a daily photo-and-game app" can "sustain 12-, 24-, or 36-month retention curves." Candle hasn't published them. [journalism] [TechCrunch](https://techcrunch.com/2025/09/24/these-yc-founders-pivoted-5-times-before-building-a-social-app-that-nabbed-300k-users-and-over-1m-arr-in-6-months)
- Review sites report complaints about an aggressive paywall and widgets that don't refresh. [3p] [search summary of review aggregators] [not found as a primary source]

## Finch

### Mechanics, step by step

1. You name and raise a small bird. Self-care goals you complete give it energy. [3p] [Finch fan wiki](https://finch.fandom.com/wiki/Adventuring)
2. At full energy the bird leaves on an adventure. It lasts about 8 hours for a baby bird and 6 hours for an adult. More energy shortens the trip by about 10 minutes per goal. [3p] same
3. The bird comes back and tells you about a "discovery." You pick one of two replies, and that shapes its personality. [3p] same
4. Your streak counts every day you open the app. "Just checking in is enough." [primary] [Finch help center](https://help.finchcare.com/hc/en-us/articles/37780736136205-Understanding-Streaks)
5. Rainbow Stones repair a broken streak. You also earn a free Streak Repair Saver every 3 adventures, up to 2 saved. Pause Mode freezes the streak while you're away. [primary] same; [3p] [fan wiki](https://finch.fandom.com/wiki/Streaks)
6. Several reviews say the pet never dies if you skip a day. [3p]

**First session.** You hatch and name the bird and set first goals. A paywall with a 7-day trial follows onboarding. [3p] [Adapty paywall library](https://adapty.io/paywall-library/finch/)

### Evidence

- D1 and D7 are about 54% and 37%, against Duolingo's 51% and 35%. These are Sensor Tower estimates and are already known to the team. [3p] [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- Sensor Tower estimated 400k iOS downloads and $2M revenue in the US for one month in 2026. [3p] [Sensor Tower](https://app.sensortower.com/overview/1528595748?country=US)
- Finch has published no company-reported retention or DAU figures. [not found]

### Downsides

The low-stakes design trades urgency for calm. I found no data on whether the absence of loss pressure lowers daily return compared with Duolingo. [not found]

## Locket

### Mechanics, step by step

1. Add the Locket widget to your home screen. The App Store listing calls this step 1. [primary] [App Store](https://apps.apple.com/us/app/locket-widget/id1600525061)
2. When a friend sends a photo, it "instantly appears" on your widget. [primary] same
3. Tap the widget, take a photo and send it. It appears "right on your friends' Home Screens." [primary] same
4. There is no streak in the core loop. The trigger is a new photo showing up on a screen you look at dozens of times a day.

### Evidence

- The listing shows 591K ratings averaging 4.8, an Editors' Choice badge, and #19 in Social Networking on 12 Nov 2026. [primary] [App Store](https://apps.apple.com/us/app/locket-widget/id1600525061)
- I found no DAU or retention numbers I could verify. [not found]

### What it means without push

Locket's "instant" widget updates almost certainly use push to reload the widget. That is my inference from Apple's docs, which offer WidgetKit push updates through APNs. [opinion] [Apple](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date) Without push, an Outpost widget updates on the 15 to 60 minute budget. That's fine for "results since yesterday" but not for real-time chat.

## Co-Star

### Mechanics, step by step

1. You enter your birth date, time and place. The app builds a chart and daily horoscopes, which you can compare with friends. [journalism] [NYT 2018](https://www.nytimes.com/2018/01/01/arts/how-astrology-took-over-the-internet.html)
2. A daily push notification in a blunt, odd tone is the brand's hook. [journalism] [Vanity Fair 2019](https://www.vanityfair.com/style/2019/05/co-star-astrology-app-notifications-founder)
3. There's nothing at stake if you skip. Today's reading is simply new.

### Evidence

Co-Star reported more than 20 million downloads at its April 2021 Series A. [company-reported] [Axios](https://www.axios.com/astrology-app-co-star-raises-15-million-funding-906179f9-b3db-40d8-88c0-883e121fab9d.html) I found no DAU or retention data. [not found]

### For Outpost

Co-Star shows that a short, personal, new-today text can be the reason to open. Its delivery depends on push, though.

## Spotify: Discover Weekly, Wrapped, daylist

### Mechanics, step by step

1. **Discover Weekly.** A new personalized playlist arrives every Monday. Spotify calls it "a Monday ritual for millions of listeners." [primary] [Spotify, June 2025](https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/) The old playlist is replaced, so last week's songs are gone unless you saved them.
2. **daylist.** It "updates multiple times a day" with a new mood title each time. The playlist page shows when the next update comes. It has three share-card formats. [primary] [Spotify, Sept 2023](https://newsroom.spotify.com/2023-09-12/ever-changing-playlist-daylist-music-for-all-day/)
3. **Wrapped.** Once a year, in late November or early December, you get a shareable story of your year. In 2025 it added "Wrapped Party," listening "Clubs" and a fan leaderboard. [primary] [Spotify, Dec 2025](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/)

### Evidence

- Discover Weekly had over 100 billion tracks streamed in 10 years and "more than 56 million new artist discoveries" each week. [primary] [Spotify 2025](https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/)
- By June 2020, users had spent over 2.3 billion hours on it. [primary] [Spotify 2020](https://newsroom.spotify.com/2020-07-09/spotify-users-have-spent-over-2-3-billion-hours-streaming-discover-weekly-playlists-since-2015/)
- Five months after launch, its songs had been streamed 1.7 billion times. [journalism] [Quartz, Dec 2015, via Wikipedia citation](http://qz.com/571007/the-magic-that-makes-spotifys-discover-weekly-playlists-so-damn-good/)
- Wrapped 2023 "engaged a record 227 million monthly active users." [primary] [Spotify 2024](https://newsroom.spotify.com/2024-12-04/10-years-spotify-wrapped/)
- Spotify has published no daylist usage numbers. [not found]

### Downsides

The 2024 Wrapped was widely criticized as thin and AI-generated. [journalism] [Forbes](https://www.forbes.com/sites/conormurray/2025/12/01/spotify-wrapped-could-drop-this-week-as-fan-pressure-mounts-after-panned-2024-edition/) A recap is only worth sharing if the insights land.

## Headspace and Calm

### Mechanics

- Headspace has a "run streak" counting days in a row you meditated. "Everyday Headspace" is "a daily meditation on a different topic each day," shown on the home screen. [primary] [Headspace](https://www.headspace.com/meditation/daily-meditation)
- Calm publishes a Daily Calm calendar. Users can subscribe to it in Apple, Google, Outlook or Yahoo calendars. [primary] [Calm](https://www.calm.com/blog/2020-daily-calm-calendar) That's a return trigger that needs no push.

### Evidence

- A study of 93 Android mental-health apps with 10,000+ installs found median 15-day retention of 3.9% and 30-day retention of 3.3%. [academic] [Baumel et al. 2019, JMIR](https://doi.org/10.2196/14567)
  - The median daily open rate was 4.0%.
  - Mindfulness and meditation apps had 4.7% median 30-day retention.
  - Meditation use peaked twice a day, in the morning and at night.
- Neither company has published DAU or retention figures that I found. [not found]

### Downsides

Even the category leaders sit in a category where almost everyone leaves within a month. A daily new session alone doesn't fix that. [academic] [Baumel et al.](https://doi.org/10.2196/14567)

## Gas, tbh and NGL

### Mechanics

- **tbh** and its successor **Gas** ran anonymous compliment polls about classmates. Winners got a "flame." [journalism] [TODAY](https://www.today.com/parents/family/what-is-gas-app-rcna64969)
- **NGL** gives you a link that people use to send you anonymous messages. [3p] [Wikipedia](https://en.wikipedia.org/wiki/NGL_(app))

### Evidence

| App | Rise | Fall | Sources |
|---|---|---|---|
| tbh | #1 on the US App Store in Oct 2017; bought by Facebook for an estimated $100M | Shut down 2 July 2018 for low usage | [journalism] [CNN](https://money.cnn.com/2017/10/16/technology/business/facebook-tbh/index.html), [Engadget](https://www.engadget.com/2018-07-02-facebook-shuts-down-tbh-hello-moves.html) |
| Gas | Over 5.1M downloads by early Nov 2022; bought by Discord in Jan 2023 | Shut 7 Nov 2023 after "a steep decline in users" | [journalism] [Washington Post](https://www.washingtonpost.com/technology/2022/11/09/debunking-gap-app-sex-trafficking-rumor/), [primary] [Discord](https://discord.com/blog/welcoming-gas-to-discord), [journalism] [The Information](https://www.theinformation.com/articles/discord-shutters-gas-making-it-two-in-a-row-for-gas-founder) |
| NGL | Viral in 2022 | FTC action in July 2024: banned for under-18s and found to have sent over 1,000 generated fake messages to get users to pay | [journalism] [CNN](https://www.cnn.com/2024/07/09/tech/ftc-ngl-anonymous-messaging-app-teens) |

### Lessons

- Novelty spikes fade within months. Both tbh and Gas closed within about a year of their peaks. [my arithmetic from dates above]
- Faking engagement to drive returns is a legal risk. For Outpost, never show invented views, sales or "someone liked this."

## Pokémon GO

### Mechanics, step by step

1. **First catch of the day.** Days 1 to 6 give 1,500 XP and 1,800 Stardust. Day 7 in a row gives 6,000 XP and 9,000 Stardust. [3p] [Pokémon GO wiki](https://pokemongo.fandom.com/wiki/Daily_Bonus) The day 7 reward is 4x the XP and 5x the Stardust. [my arithmetic]
2. **First PokéStop spin of the day.** It works the same way, with a bigger item bundle on day 7. [3p] same
3. The day resets at midnight local time. [primary] [Niantic, 2016](https://pokemongolive.com/post/daily-bonus/)
4. **Research Breakthrough.** You earn one stamp per day by claiming a Field Research reward. Seven stamps unlock a Breakthrough. Stamps don't need consecutive days. You can save a finished task to claim tomorrow. [3p] [Pokémon GO wiki](https://pokemongo.fandom.com/wiki/Research_tasks)

### Evidence

- Engaged players walked 1,473 more steps a day over 30 days, a gain of more than 25%. The study covered 32,000 users. [academic] [Althoff, White & Horvitz, JMIR 2016](https://doi.org/10.2196/jmir.6759) [arXiv](https://arxiv.org/abs/1610.02085)
- A BMJ difference-in-differences study looked at whether the effect faded. I couldn't open it, so I'm not quoting its numbers. [not found] [Howe et al., BMJ 2016](https://doi.org/10.1136/bmj.i6270)

### For Outpost

- The 7-day cycle gives a bigger reward for consistency without wiping out progress.
- The 7-stamp breakthrough rewards seven active days, not seven in a row. It is a forgiving weekly goal.

## Research on habits, streaks and daily limits

| Finding | Detail | Tag and source |
|---|---|---|
| Habit time varies widely | 96 volunteers, 82 analyzed. Time to 95% of peak automaticity ranged from 18 to 254 days. "Missing one opportunity to perform the behaviour did not materially affect the habit formation process." | [academic] [Lally et al. 2010](https://doi.org/10.1002/ejsp.674) |
| Meta-analysis | 20 studies, 2,601 people. Median time to habit was 59 to 66 days, means were 106 to 154 days, and individuals ranged from 4 to 335 days. | [academic] [Singh et al. 2024](https://doi.org/10.3390/healthcare12232488) |
| It depends on the behavior | Over 12M gym observations and 40M handwashing observations. Gym habits took months; hospital handwashing took weeks. | [academic] [Buyalskaya et al., PNAS 2023](https://doi.org/10.1073/pnas.2216115120) |
| Habits are cued by context | Once formed, habits fire from stable cues such as time, place and the previous action, rather than from goals. | [academic] [Wood & Neal 2007](https://doi.org/10.1037/0033-295X.114.4.843); [Neal et al. 2012](https://doi.org/10.1016/j.jesp.2011.10.011) |
| Intact vs broken streaks | Seven studies. Showing an intact streak raises later engagement compared with showing a broken one. The drop is bigger when people blame themselves and smaller when they can "repair" the streak. | [academic] [Silverman & Barasch, JCR](https://doi.org/10.1093/jcr/ucac029) |
| Reward the comeback | 61,293 gym members, 54 interventions. 45% of interventions raised weekly visits by 9% to 27%. The best paid microrewards for returning after a missed workout. Only 8% had measurable effects after the 4 weeks ended. | [academic] [Milkman et al., Nature 2021](https://doi.org/10.1038/s41586-021-04128-4) |
| Fresh starts | Goal behavior rises after temporal landmarks such as a new week, month or birthday. | [academic] [Dai, Milkman & Riis 2014](https://doi.org/10.1287/mnsc.2014.1901) |
| Breaks raise enjoyment | Across six studies, interrupting a pleasant experience made it more enjoyable afterward, though people avoid such breaks. | [academic] [Nelson & Meyvis 2008](https://doi.org/10.1509/jmkr.45.6.654) |
| Speed of consumption | Fast consumption makes people want variety. Slowing it down reverses the preference. People misjudge this. | [academic] [Galak, Kruger & Loewenstein 2011](https://doi.org/10.1017/S1930297500001431) |
| Streak pressure in teens | Streaks were linked to problematic phone use and FOMO, with small effects. | [academic] [van Essen & Van Ouytsel 2023](https://doi.org/10.1016/j.teler.2023.100087) |

### Daily-limited content versus endless content

- No study I found compares a daily-capped feed with an endless feed on retention head to head. [not found]
- The evidence is indirect:
  - **Wordle:** one puzzle, a viral share grid, and a still-huge daily base four years later. [journalism] [Fast Company](https://www.fastcompany.com/91539885/wordle-statistics-show-why-new-york-times-is-turning-game-into-nbc-tv-show)
  - **Discover Weekly:** a once-a-week drop that became a "ritual." [primary] [Spotify](https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/)
  - **Lab work on breaks and satiation:** above.
- Against it, BeReal had both scarcity and a daily slot and still lost about 60% of daily users in five months. [journalism] [NYT](https://www.nytimes.com/2023/04/13/style/bereal-app.html)
- The team's earlier feed research covers how endless autoplay feeds hold attention, including the Netflix autoplay study. See `engagement-research.md` in the project root.

## Return triggers on iOS without push, using a free Apple ID

### What a free Apple ID allows

- **Personal Team limits.** You can register up to 10 App IDs and 3 devices, and install up to 3 apps per device. Provisioning profiles expire after 7 days, so you have to rebuild and reinstall. [primary] [Apple account help](https://developer.apple.com/help/account/basics/about-your-developer-account)
- **Capabilities.** Apple's table has a column for the free "Apple Developer" tier.
  - It includes App Groups, Background Modes, Data Protection, HealthKit, HomeKit, Keychain Sharing and Maps.
  - It excludes Push Notifications, Time Sensitive Notifications, Communication Notifications, Siri, iCloud, In-App Purchase and Sign in with Apple.

  [primary] [Apple supported capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios)

### Trigger by trigger

| Trigger | Free Apple ID? | Limits | Source |
|---|---|---|---|
| Local notifications | Yes. They are not APNs push and need only the user's permission. No capability is listed for them. | They can't break through Focus, because Time Sensitive isn't available on the free tier. The system keeps only the soonest 64 pending notifications; a repeating notification counts as one. Content is fixed when scheduled unless the app reschedules. | [primary] [scheduling locally](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app), [add(_:)](https://developer.apple.com/documentation/usernotifications/unusernotificationcenter/add(_:withcompletionhandler:)), [64 limit](https://developer.apple.com/documentation/uikit/uilocalnotification) |
| Provisional notifications | Yes | They arrive quietly in Notification Center with Keep and Turn Off buttons, and need no permission prompt. | [primary] [Apple](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications) |
| Home screen and lock screen widgets | Yes. A widget extension needs no special capability. Sharing data with the app uses App Groups, which the free tier has. | A typical budget is 40 to 70 reloads a day, about every 15 to 60 minutes. Reloads don't count while the app is in the foreground or when the user taps an app intent. Timeline entries can change the display at future times with no reload. Widgets can use the network; Live Activities can't. | [primary] [keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date), [Live Activities doc](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities) |
| Widget push updates | No | They need APNs. | [primary] [WidgetKit](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date) |
| Smart Stack ranking | Yes | The system ranks widgets by behavior clues the app provides through App Intents and RelevanceKit. | [primary] [WidgetKit strategy](https://developer.apple.com/documentation/widgetkit/developing-a-widgetkit-strategy) |
| Live Activities started from the app | Yes. This needs only the `NSSupportsLiveActivities` Info.plist key. | The app must usually be in the foreground to start one. It can update one from the background, for example with BackgroundTasks. An activity lasts up to 8 hours active and 12 hours on the lock screen. Data is capped at 4 KB. | [primary] [Apple](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities) |
| Scheduled Live Activities | Yes, on iOS 26 and later | You can schedule a start date with an alert configuration, which is required for scheduled ones. Content is fixed at scheduling time unless the app updates it. | [primary] [request(...startDate:)](https://developer.apple.com/documentation/activitykit/activity/request(attributes:content:pushtype:style:alertconfiguration:startdate:)) |
| Live Activity push updates | No | They need APNs. | [primary] same |
| Background App Refresh | Yes. Background Modes is on the free tier. | "The system decides the best time" and gives up to 30 seconds. There's no guaranteed schedule. | [primary] [background strategies](https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app) |
| Silent background push | No | It needs APNs. | [primary] same |
| Calendar event with an alarm | Yes | Write-only access lets the app add events without reading the calendar. On iOS 17+, EventKitUI's editor can add an event with no calendar permission at all. EKAlarm sets the alert. | [primary] [EventKit access](https://developer.apple.com/documentation/eventkit/accessing-the-event-store), [EKAlarm](https://developer.apple.com/documentation/eventkit/ekalarm) |
| Subscribable calendar feed | Yes. It's server-side and needs no app capability. | The user subscribes once. Calm did this for Daily Calm challenges. I didn't verify whether iOS keeps alerts on subscribed calendars. [not found] | [primary] [Calm](https://www.calm.com/blog/2020-daily-calm-calendar) |
| Shortcuts personal automation | Yes, but the user has to build it | A "Time of Day" automation can run without asking. The app can expose App Shortcuts, which Shortcuts finds automatically. | [primary] [Apple support](https://support.apple.com/guide/shortcuts/create-a-new-personal-automation-apdfbdbd7123/ios), [App Shortcuts](https://developer.apple.com/documentation/appintents/app-shortcuts) |
| AlarmKit alarms | Technically, on iOS 26 and later | AlarmKit is built for alarms and timers. Using it for a daily product nudge would misuse it. | [primary] [AlarmKit](https://developer.apple.com/documentation/alarmkit), [opinion] |
| Notifications from TikTok, YouTube and Instagram | Outside Apple's control | When agents post to the user's own accounts, those apps notify the user about views and comments. That may pull the user back to Outpost to see results. It's untested. | [opinion] |

### Expo specifics

- `expo-widgets` builds iOS home screen widgets and Live Activities from Expo UI components.
  - It's in the SDK 58 reference.
  - It isn't available in Expo Go, so you need a development build.
  - It needs an App Group.

  [primary] [Expo docs](https://docs.expo.dev/versions/latest/sdk/widgets/)
- `expo-notifications` schedules local notifications with date, time-interval and calendar triggers. The docs say "Local notifications (in-app notifications) remain available in Expo Go," but that note is about Android. [primary] [Expo docs](https://docs.expo.dev/versions/latest/sdk/notifications/)

### The free-account catch for daily-use testing

The app stops launching 7 days after install unless it's rebuilt. [primary] [Apple](https://developer.apple.com/help/account/basics/about-your-developer-account) A real multi-week retention test on testers' phones needs either weekly reinstalls or the paid program, which brings TestFlight.

## What carries over to Outpost

Each rule names the evidence. Where a number in the rule is my own pick rather than measured, I say so.

### Daily loop rules

1. **Ship one daily drop at a fixed time, and make it finite.** Each day the agents deliver a batch of new videos at the same local time. When the batch is reviewed, the feed says "done for today" and shows what happens next.
   - Evidence: Wordle's one-a-day design and its creator's account of scarcity. [journalism] [NYT via Daring Fireball](https://daringfireball.net/linked/2022/01/05/wordle) Discover Weekly's "Monday ritual." [primary] [Spotify](https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/) Breaks raise enjoyment. [academic] [Nelson & Meyvis](https://doi.org/10.1509/jmkr.45.6.654) Habits form around stable cues such as time. [academic] [Wood & Neal](https://doi.org/10.1037/0033-295X.114.4.843)
   - A fixed time also makes the widget timeline and a local notification truthful, since both are set in advance.
   - Batch size is a guess. Start with 3 to 5 videos so review takes under 2 minutes, in line with Wordle's "three minutes a day" and Candle's "one minute a day." [opinion]
2. **Make the streak unit one decision.** A day counts if the user approves or rejects at least one video.
   - Evidence: Duolingo cut its unit to one lesson and got +3.3% D14 and +1% DAU, relative. [primary] [Duolingo 2020](https://blog.duolingo.com/improving-the-streak/) Shuttleworth called it "a huge driver of DAUs." [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
3. **Give protection on day one and cap it at two.** New users start with two streak freezes. Allow a free repair within a short window, such as one a month, like Candle and Snap.
   - Evidence: two freezes gave +0.38% DAU, three did no better than two, and starting with two was a "huge DAU win." [primary] [Duolingo 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md) Repair weakens the broken-streak drop. [academic] [Silverman & Barasch](https://doi.org/10.1093/jcr/ucac029) One missed day doesn't hurt habit formation. [academic] [Lally](https://doi.org/10.1002/ejsp.674)
4. **Reward the comeback, don't scold it.** After a gap, open on "while you were away" results, and give a small bonus for returning, such as a free extra video.
   - Evidence: the top intervention among 54 rewarded returning after a miss. [academic] [Milkman et al.](https://doi.org/10.1038/s41586-021-04128-4) Duolingo's Earn Back beat paid repair. [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
5. **Let results arrive at a known later time.** The approved video "goes out" and its first results come back at a set hour, like a Finch adventure that returns in 6 to 8 hours. [3p] [Finch wiki](https://finch.fandom.com/wiki/Adventuring) Candle's new shared pet Ember follows the same idea. [primary] [App Store](https://apps.apple.com/us/app/candle-couples-relationship/id6743355635)
   - In the app, start a Live Activity when the user approves. It shows a countdown to the results check-in, within the 8-hour limit. [primary] [Apple](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)
   - The evidence that the "away" loop itself drives retention is weak. Finch's retention is strong, but no study isolates the adventure mechanic. [3p] [not found]
6. **Make the widget the main return trigger, and ask for it in onboarding.** One small widget can show three things:
   - Drafts waiting.
   - Streak count.
   - Yesterday's real results.

   Pre-schedule timeline states through the day, so the widget can turn more urgent as midnight nears the way Duo does.
   - Evidence: Duolingo widget users' retention and the "just as effective as push" feedback. [primary] [Duolingo 2023](https://blog.duolingo.com/widget-feature/) Locket makes adding the widget step 1. [primary] [App Store](https://apps.apple.com/us/app/locket-widget/id1600525061) There are 40 to 70 refreshes a day, and widgets can use the network. [primary] [Apple](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
7. **If the team allows notifications at all, use local ones.** They're not push, and they work on a free Apple ID.
   - Send at most one a day, near the drop time or about 23.5 hours after the last session. Rotate the copy, because repeated templates lose effect. Ask for permission after the first approval, not on launch, or use provisional authorization.
   - Evidence: Duolingo's 23.5-hour timing [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md); recovering arms for novelty decay [academic] [Yancey & Settles](https://research.duolingo.com/papers/yancey.kdd20.pdf); Apple's in-context and provisional permission guidance [primary] [Apple](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)
8. **Add a weekly layer that resets on Monday.** Run a Monday "week in review" with posts, views and sales, plus a weekly goal that needs 5 active days rather than 5 days in a row.
   - Evidence: the fresh start effect [academic] [Dai et al.](https://doi.org/10.1287/mnsc.2014.1901); Discover Weekly's Monday cadence [primary] [Spotify](https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/); weekly leagues raised learning time 17% [journalism] [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth); Pokémon GO's 7-stamp breakthrough doesn't require consecutive days [3p] [wiki](https://pokemongo.fandom.com/wiki/Research_tasks)
9. **Make one shareable artifact a day or a week.** A small card works, such as "approved 4, rejected 2, 12k views, $38," and it shouldn't need a link to make sense.
   - Evidence: Wordle's grid preceded growth from 300,000 to over 2 million players in a week. [journalism] [Guardian](https://www.theguardian.com/games/2022/jan/11/wordle-creator-overwhelmed-by-global-success-of-hit-puzzle) Wrapped engaged 227M MAU in 2023. [primary] [Spotify](https://newsroom.spotify.com/2024-12-04/10-years-spotify-wrapped/) Candle built sharing after users screenshotted prompts. [company-reported] [X](https://x.com/alex_ruber/status/1920911445350650175)
10. **Get to the first swipe within a minute.** Have pre-generated videos ready for the first session. Ask for accounts and connections after the first approval. Use commitment wording such as "commit to my goal" for the daily time.
    - Evidence: third-party sources credit delayed sign-up at Duolingo with about 20%, which Duolingo hasn't confirmed [3p] [Appcues](https://www.appcues.com/blog/the-10-best-user-onboarding-experiences); "commit to my goal" was "a massive win" [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md); a 7-day streak predicts 2.4x next-day use and 3.6x course completion [primary] [Duolingo](https://blog.duolingo.com/improving-the-streak/)
11. **Celebrate milestones visually, not with prizes.** Mark streak days 3, 7 and 30 with an animation or a gold state.
    - Evidence: the milestone animation raised day-7 retention of new learners by 1.7%, and the perfect streak gives no reward beyond its look. [primary] [Duolingo 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
12. **Use the real stake and don't invent a fake one.** If the user skips, approved videos stop flowing, so nothing posts. Say that plainly. Don't add countdown pressure on top of it.
    - Evidence: Finch and Co-Star return users without punishment [3p]. Streak pressure is linked to problematic phone use and FOMO, though the effects are small. [academic] [van Essen & Van Ouytsel](https://doi.org/10.1016/j.teler.2023.100087)

### What to avoid

- **A random-time window like BeReal's.** It depends on push, and BeReal still lost about 60% of daily users in five months. [journalism] [NYT](https://www.nytimes.com/2023/04/13/style/bereal-app.html)
- **Invented results.** NGL's generated fake messages led to FTC action. [journalism] [CNN](https://www.cnn.com/2024/07/09/tech/ftc-ngl-anonymous-messaging-app-teens) Every view and sale in the feed, widget or notification must be real, including zeros.
- **A streak that resets with no way back.** Broken streaks reduce later engagement. [academic] [Silverman & Barasch](https://doi.org/10.1093/jcr/ucac029)
- **A streak so cheap it means nothing.** Duolingo's own PM warns of this. [company-reported] [podcast](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
- **Expecting a habit in 21 days.** Medians are 59 to 66 days, and complex habits take months. [academic] [Singh et al.](https://doi.org/10.3390/healthcare12232488) [Buyalskaya et al.](https://doi.org/10.1073/pnas.2216115120)
- **Counting on novelty.** tbh and Gas each faded within about a year. [journalism] [Engadget](https://www.engadget.com/2018-07-02-facebook-shuts-down-tbh-hello-moves.html) [The Information](https://www.theinformation.com/articles/discord-shutters-gas-making-it-two-in-a-row-for-gas-founder) Most gym interventions stopped working once the incentives ended. [academic] [Milkman et al.](https://doi.org/10.1038/s41586-021-04128-4)
- **Planning the week as if every day is the same.** Duolingo loses 5 to 10% of DAU on weekends. [primary] [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/) A lighter weekend drop or a built-in weekend freeze fits that pattern.
- **An endless review feed.** A capped batch gives a natural stopping point. See `engagement-research.md` on what happens without one.

## Open unknowns

- No study compares a daily-capped feed with an endless one on retention. [not found]
- Duolingo hasn't published the controlled widget effect size or how it controlled for selection. [not found]
- I found no verified Locket DAU or retention figures. [not found]
- Daily use of an AI-run business may not behave like language practice. The user's reward is money and views that come in days later, not progress in the session. No app here is a close match.
- Scheduled Live Activities need iOS 26 or later. I didn't check what share of the team's demo phones run it.
- I didn't verify whether iOS keeps alerts on subscribed calendar feeds.
- The free Apple ID's 7-day expiry blocks a clean multi-week retention test without the paid program.
- It's untested whether TikTok, YouTube and Instagram notifications about the user's own posted videos bring people back to Outpost.
- Candle 2.0 shipped on 12 Nov 2026 with a shared pet. There's no data on it yet.
- The team needs to decide whether local notifications count as "push." They are a different system, but they still interrupt the user.
