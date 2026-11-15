# Why short-video feeds hold attention, and what carries over to this app

These tags show what kind of source backs each claim:

- **[primary]** company or government document
- **[academic]** peer-reviewed or preprint
- **[report]** industry report
- **[journalism]** press coverage
- **[3p]** other third party
- **[not found]** no source turned up

Lines tagged **[mapping]** are design translations of a finding. They are not findings themselves.

## Short answer

No study directly compares feeds with gamified apps. [not found] Separate bodies of evidence point to five differences.

1. **The content is the reward, and it's always new.** Novelty activates the brain's dopamine midbrain (Bunzeck & Düzel 2006). Variety slows hedonic adaptation (Sheldon & Lyubomirsky 2012; Epstein et al. 2009). TikTok says its feed "generally won't show two videos in a row made with the same sound or by the same creator." Gamification puts points on a task that repeats, and its effect fades after about 4 weeks (Rodrigues 2022). [academic] [primary]
2. **TikTok is built to maximize time spent.** The leaked "TikTok Algo 101" document names "retention" and "time spent" as the targets. [journalism]
3. **It learns each person fast.** The WSJ's bot accounts showed their interests only through how long they watched. TikTok "fully learned many of our accounts' interests in less than two hours," some in under 40 minutes. [journalism] ByteDance's Monolith system retrains models every few minutes. [academic]
4. **Nothing tells you to stop.** Turning off Netflix autoplay cut about 21 minutes a day (Schaffner et al. 2025). The EU Commission found that TikTok's design pushes users into "autopilot mode." [academic] [primary]
5. **Rewards are immediate.** An immediate reward raised intrinsic motivation more than a delayed one of any size (Woolley & Fishbach 2018). [academic]

The extrinsic-reward meta-analysis shows the cost of gamifying. Rewards for doing or finishing a task lowered intrinsic motivation, by d = -0.28 to -0.40. Positive feedback raised it, by d = +0.31 to +0.33 (Deci, Koestner & Ryan 1999, 128 studies). Another paper disputes these results. [academic]

## 1. Time spent

| Measure | Figure | Source |
|---|---|---|
| TikTok, US, 2025 | 81 min/day. YouTube 80, Instagram 55 | [report via CNBC](https://www.cnbc.com/2026/01/20/most-of-instagrams-ads-ran-on-reels-in-2025-data-shows.html) |
| TikTok, global Android, Aug 2025 | 1h37m/day, 10 opens/day | [report, DataReportal](https://datareportal.com/reports/digital-2026-global-overview-report) |
| Reels' share of US Instagram time | 46% in 2025, up from 37% in 2024 | [report via CNBC](https://www.cnbc.com/2026/01/20/most-of-instagrams-ads-ran-on-reels-in-2025-data-shows.html) |
| TikTok's internal "habit moment" | 260 videos in a user's first week, under 35 minutes of viewing | [journalism quoting the Kentucky AG filing](https://www.npr.org/2024/10/11/nx-s1-5150088/the-biggest-findings-from-uncensored-tiktok-lawsuit-documents) |
| Effect of TikTok's 60-minute screen-time prompt | Teen use fell from 108.5 to 107 min/day | [same](https://www.npr.org/2024/10/11/nx-s1-5150088/the-biggest-findings-from-uncensored-tiktok-lawsuit-documents) |

The widely repeated figure of "95 min/day" couldn't be traced to a primary source. [3p]

## 2. What TikTok optimizes and how it learns

- **Signals.** Interactions, video information, and device settings, which get "lower weight." Finishing a longer video "would receive greater weight." [primary] [TikTok newsroom 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
- **Objective.**
  - The ultimate goal is more daily active users, pursued by optimizing "retention" and "time spent."
  - The score is Plike×Vlike + Pcomment×Vcomment + Eplaytime×Vplaytime + Pplay×Vplay, which the document calls "highly simplified." TikTok confirmed the document is real.
  - [journalism] [NYT, Dec 2021](https://www.nytimes.com/2021/12/05/business/media/tiktok-algorithm.html), quoted via [Inverse](https://www.inverse.com/input/culture/tiktok-internal-docs-reveal-just-how-simple-it-is-to-keep-you-addicted)
- **Speed.**
  - Over 100 bot accounts showed interest only by rewatching or pausing. Watch time was the dominant signal.
  - TikTok learned most of their interests in under two hours, some in under 40 minutes.
  - TikTok says real users' interests are more varied than bots'.
  - [journalism] [WSJ 2021](https://www.wsj.com/video/series/inside-tiktoks-highly-secretive-algorithm/investigation-how-tiktok-algorithm-figures-out-your-deepest-desires/6C0C2040-FF25-4827-8528-2BD6612E3796)
- **Real-time training.**
  - Monolith syncs model updates every few minutes. In a 7-day live test of an ads model, online training raised AUC by 14 to 18% over batch training.
  - It wasn't tested on video ranking.
  - [academic] [arXiv 2209.07663](https://arxiv.org/abs/2209.07663)
- **Meta's equivalent.** Doubling the interaction history Meta's model trains on "drove a 10% lift in Reels time spent" (Q1 2026 call). [primary] [transcript](https://www.fool.com/earnings/call-transcripts/2026/04/29/meta-meta-q1-2026-earnings-call-transcript/)

## 3. Mechanisms and how strong the evidence is

| Mechanism | Evidence | Strength |
|---|---|---|
| Reward prediction error (dopamine responds to the gap between expected and actual reward) | Schultz, Dayan & Montague, Science 1997 [academic](https://www.its.caltech.edu/~jkenny/nb250c/papers/Schultz-1997.pdf). Uncertainty coding is contested (Fiorillo 2003 vs Niv 2005). | Strong for the basic mechanism. No study has measured dopamine in people scrolling short video. [not found] |
| Variable rewards on social media | Over 1M posts from 4,000+ people fit reward-learning models, and an experiment with 176 people showed likes causally shape posting (Lindström et al. 2021) [academic](https://www.nature.com/articles/s41467-020-19607-x) | Strong for posting. It doesn't cover viewing. |
| Personalized feed and brain response | Personalized TikTok videos activated reward areas (VTA) more than non-personalized ones in fMRI (Su et al. 2021) [academic](https://doi.org/10.1016/j.neuroimage.2021.118136) | Moderate. fMRI isn't a direct dopamine measure. |
| Autoplay and no stopping cues | Turning Netflix autoplay off cut about 21 min/day, n=76 (Schaffner 2025) [academic](https://arxiv.org/abs/2412.16040). Autoplay extended children's viewing (Hiniker 2018) [academic](https://dl.acm.org/doi/abs/10.1145/3173574.3173828). Turning off autoplay and adding scroll friction on a TikTok-like prototype cut posts viewed but lowered ratings (Alin 2026, n=48) [academic](https://dl.acm.org/doi/10.1145/3772318.3791716). | Moderate, from small samples |
| Immediate feedback | 5 studies found immediate bonuses raise intrinsic motivation more than delayed ones (Woolley & Fishbach 2018) [academic](https://doi.org/10.1037/pspa0000116) | Moderate to strong |
| Novelty and variety | Novelty activates the dopamine midbrain (Bunzeck & Düzel 2006) [academic](https://doi.org/10.1016/j.neuron.2006.06.021). Variety slows adaptation, n=481 over 3 months (Sheldon & Lyubomirsky 2012) [academic](https://journals.sagepub.com/doi/abs/10.1177/0146167212436400) | Moderate to strong |
| Flow and time distortion | Time distortion predicted problematic TikTok use (β=0.371), and enjoyment didn't predict it directly (Qin 2023) [academic](https://pmc.ncbi.nlm.nih.gov/articles/PMC9915640/) | Weak, from a one-time survey |
| Breaks increase enjoyment | Interruptions made pleasant experiences more enjoyable, though people avoided taking breaks (Nelson & Meyvis 2008, 6 studies) [academic](https://journals.sagepub.com/doi/10.1509/jmkr.45.6.654) | Moderate |

## 4. Why gamification fades

- Fitocracy, 195 users: perceived enjoyment and usefulness fell the longer people used the app. [academic] [Koivisto & Hamari 2014](https://doi.org/10.1016/j.chb.2014.03.007)
- Gamified course, 14 weeks: the effect started dropping after week 4, then partly recovered. [academic] [Rodrigues 2022](https://link.springer.com/article/10.1186/s41239-021-00314-6)
- Physical-activity meta-analysis: g = 0.42 during programs, 0.15 at follow-up. [academic] [Mazeas 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8767479/)
- Habitica, 45 users: all of them hit counterproductive effects, such as being penalized during productive periods. [academic] [Diefenbach & Müssig 2019](https://doi.org/10.1016/j.ijhcs.2018.09.004)
- Rewards contingent on the task lower intrinsic motivation, while positive feedback raises it (Deci, Koestner & Ryan 1999). [academic] [PDF](https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf)

## 5. Precedents for swiping on real decisions or money

- **Tinder.** About 9.6M daily users swiped through more than 1.4 billion profiles a day in Sept 2015, or about 146 swipes per user per day (my arithmetic). [primary] [Match Group SEC filing](https://www.sec.gov/Archives/edgar/data/0001575189/000110465915079968/a15-16521_16fwp.htm)
- **Galaxy Zoo Mobile.** Volunteers swipe left or right to classify galaxies for research. The mobile app produced 6.2M classifications by Nov 2020. [primary] [Zooniverse](https://blog.zooniverse.org/2020/11/06/zooniverse-mobile-app-release-v2-8-2/)
- **Robinhood.**
  - Massachusetts alleged "gamification strategies to manipulate customers" (Dec 2020). [journalism] [CNBC](https://www.cnbc.com/2020/12/16/massachusetts-sec-o-commonwealth-galvin-says-robinhood-is-a-reckless-company-gamifying-investing.html)
  - The 2024 settlement was $7.5M. Robinhood must "permanently cease the future use of confetti" for Massachusetts accounts and drop features that mimic games of chance. [journalism] [Insurance Journal](https://www.insurancejournal.com/news/east/2024/01/19/756246.htm)
- **An app where users swipe to approve commercial work, with engagement data.** [not found]

## 6. How this maps onto the app

Each line names the finding it comes from. All of these are [mapping], not evidence.

- **The main screen is a full-screen feed of agent output, one item at a time.** Swipe right to approve, left to reject. Items include a Short draft that autoplays, a hook or script, a product idea, a sale, and a view milestone. *(Single item with two gestures. Tinder swipe volume. Galaxy Zoo.)*
- **Approval acts immediately.** The Short posts to YouTube and Instagram, or the product goes live on Whop. The card shows the result as you swipe. *(Woolley & Fishbach: immediate rewards.)*
- **The next card loads the moment you decide, with no "done for today" screen.** *(Autoplay and stopping-cue studies. Note the EU findings in section 7.)*
- **Outcomes arrive later and vary in size.** Views, followers and Whop sales come back as cards in the feed when they happen. *(Reward prediction error. Variable rewards.)*
- **Rank the queue by how long you look before deciding, not only by approve or reject.** Re-rank after every swipe, and keep your taste in Supermemory. *(WSJ: dwell time was the dominant signal. Monolith: retraining every few minutes.)*
- **Never show two similar cards in a row.** Alternate between video, script, product and sale cards. *(TikTok's diversity rule. Variety slows adaptation.)*
- **Show what your swipes caused, not points.** For example: "Your pick got 4,200 views" or "$12 sale." Don't give XP per swipe. *(Deci et al.: feedback raises intrinsic motivation, task rewards lower it.)*
- **The Clash-style base is where results that piled up while you were away get collected.** The gold mine is Whop revenue, and the barracks hold posted videos and views. *(Nelson & Meyvis: breaks increase enjoyment.)*
- **Track a "habit moment."** Count each user's swipes in their first week. *(TikTok's internal 260-videos-in-week-one metric.)*

**Cost limit on an endless feed.** These figures are my arithmetic from sourced prices:
- Video costs $0.05 to $0.40 per second ([Runway](https://docs.dev.runwayml.com/guides/pricing/)). Nomen paid $2.49 to $4.20 per finished video ([README](https://github.com/aiden-guan/nomen)).
- An 8-second clip costs $0.40 to $3.20. At Tinder's 146 swipes a day, an all-video feed would cost $58 to $467 per user per day.
- Text cards from an LLM cost cents. Nomen's research and strategy steps cost $0.09 to $1.19 per run.
- So the feed can't be all generated video. The cheap step (hook or script) has to be approved first, and only approved scripts become videos.

## 7. Legal limits worth knowing (for a real launch, not the hackathon)

- **EU.** The Commission preliminarily found that TikTok's infinite scroll, autoplay, push notifications and recommender breach the Digital Services Act (Feb 6, 2026). It made a further finding on "rabbit holes" on Nov 6, 2026. No final decision yet. [primary] [EC Feb 2026](https://ec.europa.eu/commission/presscorner/detail/en/ip_26_312), [EC Nov 2026](https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktoks-you-feed-breach-digital-services-act-harmful-rabbit-holes)
- **US states.** Meta settled with the states for about $17B over 10 years (Aug 2026), with time caps for children. [journalism] [PBS](https://www.pbs.org/newshour/nation/meta-reaches-17-billion-settlement-with-states-in-landmark-trial-over-teen-social-media-addiction)
- **New York.** The SAFE for Kids Act bars personalized feeds for users under 18 without parental consent, starting Jan 25, 2027. [primary] [NY Governor](https://www.governor.ny.gov/news/governor-hochul-and-attorney-general-james-announce-final-safe-kids-act-rules-protect-children)
- **Money actions.** Confetti and game-of-chance features tied to money moves were part of the Robinhood settlement (section 5).
- **Coverage of this app.** Whether these laws would cover an app that ranks agent output is [not found].

## Open unknowns

- Whether swiping on agent work holds attention the way entertainment does. No study tests this.
- No randomized trial compares infinite scroll with pagination, or full-screen items with a grid.
- Per-user minutes for YouTube Shorts. YouTube reports views, and since Mar 2025 a view counts even when the user scrolls past quickly.
- The original NYT and WSJ articles weren't accessible, so their quotes come from secondary coverage.
