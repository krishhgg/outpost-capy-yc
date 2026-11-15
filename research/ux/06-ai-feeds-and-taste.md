# AI-content feeds and taste training: what the data says for Outpost

Research date: 12 November 2026. Scope: feeds of AI-generated content, apps that learn taste from swipes or ratings, user-as-creator loops, and novelty decay. Written for the Outpost team.

## How to read this

Every claim has a source tag.

- [primary] means an official company page or doc.
- [academic] means a peer-reviewed paper or preprint.
- [journalism] means a news outlet.
- [3p] means an analytics firm such as Appfigures, Sensor Tower, Apptopia, data.ai or Similarweb. When a news outlet reports their numbers, the tag is [3p via journalism].
- [company-reported] means a company said it in an interview, post or pitch deck, not in a formal doc.
- [opinion] means a commentator's view.
- [not found] means I looked and found nothing.

"My arithmetic" marks numbers I computed from cited figures. A verification note at the end lists which sources I read in full and which I saw only through search excerpts or secondary reports.

## Short version

1. AI-video feeds built for watching did not hold people. Sora's day-30 retention was "sub-8%" per Sensor Tower, as cited by a16z, against "above 30%" for top consumer apps. Users spent about 13 minutes a day on Sora versus about 90 on TikTok. OpenAI shut the app down six months after launch.
2. The people who did come back came back to make things, not to watch. On Sora, about 70% of return visits involved creating. On Meta's Vibes, 52% of returning users mainly prompted and 30% mainly scrolled.
3. Taste systems need few explicit picks to start and a few hundred signals to settle. Netflix asks for about 3 titles, Pinterest asked for 5 topics, and Midjourney needed 40 ratings to start a profile and 200 for stability.
4. Showing people what a system learned raises trust and gets shared. The evidence that it raises clicks or retention is weak.
5. AI creation apps spike and crash within weeks unless the output has an ongoing use. Lensa's revenue fell 92% from its peak in about a month. Suno, whose output people keep using, grew steadily.
6. Platforms where Outpost posts now label AI content, let viewers turn it down, and demonetize template-like mass-produced AI video. An AI label alone lowers belief in content by a small but real amount.

---

## 1. AI video and image feeds

### Sora: what happened, step by step

1. **30 September 2025.** OpenAI launched the Sora app as an invite-only iOS app with a vertical feed of AI videos, "cameos" of your own face and voice, and remix. [journalism] [MIT Technology Review](https://www.technologyreview.com/2025/10/07/1124998/the-three-big-unanswered-questions-about-sora/)
2. **Feed design.** OpenAI said it was "not optimizing for time spent in feed" and designed the app "to maximize creation, not consumption." The feed was steerable in plain language and asked users about their wellbeing from time to time. [primary] [OpenAI, Sora 2 is here](https://openai.com/index/sora-2/). The page blocked my fetch, so I took these quotes from coverage that cites it.
3. **First week.** The app hit No. 1 on the US App Store and passed 1 million downloads faster than ChatGPT. Launch day brought over 100,000 iOS installs. [journalism] [TechCrunch, 29 Jan 2026](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
4. **Cameos took over.** In internal testing the feed became "entirely cameos" within days. [company-reported] [Sequoia Training Data podcast with the Sora team](https://sequoiacap.com/podcast/openai-sora-2-team-how-generative-video-will-unlock-creativity-and-world-models)
5. **Creation numbers.** Rohan Sahai, Sora's product lead, said almost 100% of users who got past the invite code created on day one. About 70% of return visits involved creating, and about 30% of users posted to the public feed. Sora was producing almost 7 million generations a day. [company-reported] [Sequoia podcast](https://sequoiacap.com/podcast/openai-sora-2-team-how-generative-video-will-unlock-creativity-and-world-models). Bill Peebles, head of Sora, separately said 70% of Sora's nearly 2 million weekly active users were creating. [company-reported] [TBPN post on X](https://x.com/tbpn/status/1976759087456305191)
6. **November 2025.** OpenAI opened access and launched Sora on Android. Daily active users peaked at about 1 million in early November, then settled around 750,000. [3p] [Similarweb on X](https://x.com/Similarweb/status/2001266304867778982). November downloads peaked at about 3.33 million. [3p via journalism] [TechCrunch, 29 Jan 2026](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
7. **Retention data surfaces.** Olivia Moore of a16z posted a Sensor Tower chart comparing Sora with TikTok and wrote that "most users aren't sticking on the app." [opinion, with 3p data] [Olivia Moore on X](https://x.com/omooretweets/status/1991273107152334875). a16z's year-end report put Sora's day-30 retention at "sub-8%" and said "D30 retention is above 30% for top consumer apps." [3p] [a16z, State of Consumer AI 2025](https://a16z.com/state-of-consumer-ai-2025-product-hits-misses-and-whats-next/). Some outlets read the chart as day-1 10%, day-7 2%, day-30 1% and day-60 near 0%. [journalism] [AIbase, 1 Dec 2025](https://news.aibase.com/news/23248). The two readings conflict. Use "under 8%" as the safer number.
8. **Time spent.** In early December, users averaged about 13 minutes a day on Sora versus about 90 on TikTok. [3p via journalism] Sensor Tower data reported by the [Financial Times](https://www.ft.com/content/b14490d9-3ac9-45ce-bce5-df6c39db472f), as cited by [Spencer Dailey](https://spencerdailey.com/2026/01/14/openais-sora-sits-at-71-in-the-us-app-store-and-100-on-play-store-what-just-happened/). My arithmetic puts that at about one-seventh of TikTok's daily time.
9. **December 2025 and January 2026.** Downloads fell 32% month over month in December, despite the holiday lift most apps get, and another 45% in January to 1.2 million. Lifetime totals at that point were 9.6 million downloads and $1.4 million in consumer spending. Sora ranked No. 101 among free US iPhone apps. [3p via journalism] Appfigures data via [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
10. **Disney deal.** A December 2025 deal gave Sora access to Disney characters but did not lift installs or spending. [journalism] [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
11. **24 March 2026.** OpenAI announced it would discontinue Sora. Per the WSJ, users had peaked around 1 million and fallen below 500,000, and the app cost roughly $1 million a day to run. [journalism] [TechCrunch summarizing WSJ](https://techcrunch.com/2026/03/29/why-openai-really-shut-down-sora/). Appfigures put lifetime in-app revenue at about $2.1 million. [3p via journalism] (several outlets; I did not open Appfigures' own page). My arithmetic puts that at about two days of the reported running cost.
12. **26 April 2026.** The app closed. The API was scheduled to close 24 September 2026. [journalism] [CNN](https://www.cnn.com/2026/03/24/tech/openai-sora-video-app-shutting-down). I saw these dates only in search excerpts.

### Why commentators think Sora did not retain

- **Copyright tightening.** Sora moved from opt-out to opt-in for studios, which cut the popular-character content (SpongeBob, Pikachu) that drove early use. [journalism] [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
- **Likeness.** Many users did not want others, even friends, using their likeness. [journalism] [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
- **Competition.** Meta's Vibes and Google's Nano Banana pulled attention. [journalism] [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
- **Short-lived novelty.** An MIT Technology Review writer said the novelty held his interest for about five minutes. [opinion] [MIT Technology Review](https://www.technologyreview.com/2025/10/07/1124998/the-three-big-unanswered-questions-about-sora/)
- **Cost.** Compute was scarce, and OpenAI chose to refocus on coding and enterprise. [journalism] [TechCrunch summarizing WSJ](https://techcrunch.com/2026/03/29/why-openai-really-shut-down-sora/)
- **Weak social app, strong creative tool.** Moore called the model "truly viral," with a base of power users making and exporting videos, while most users did not stay. [opinion] [Olivia Moore on X](https://x.com/omooretweets/status/1991273107152334875). a16z judged Sora "less successful as a social app." [opinion] [a16z](https://a16z.com/state-of-consumer-ai-2025-product-hits-misses-and-whats-next/)

### Meta Vibes

1. **25 September 2025.** Meta launched Vibes as "a new feed of AI videos" in the Meta AI app. It starts with a mix of creator videos and "becomes more tailored to each user over time." Users can remix videos, DM them to friends, and cross-post to Instagram and Facebook. [primary] [Meta](https://about.fb.com/news/2025/09/introducing-vibes-ai-videos/)
2. **Four weeks later.** Meta AI app daily users rose from about 775,000 to 2.7 million. Daily downloads reached about 300,000, up from under 200,000. Similarweb noted this does not prove Vibes caused the rise. [3p via journalism] [TechCrunch](https://techcrunch.com/2025/10/20/meta-ais-app-downloads-and-daily-users-spiked-after-launch-of-vibes-ai-video-feed), [Tubefilter](https://www.tubefilter.com/2025/10/22/meta-generative-ai-vibes-feed-app-downloads/)
3. **9 November 2025.** Internal data showed about 2 million Vibes daily users, roughly flat week over week. India had 704,000 of them and Brazil 114,000. The Philippines fell 9% and Thailand 7%. [journalism] Business Insider's internal-data report via [WinBuzzer](https://winbuzzer.com/2025/11/18/metas-vibes-ai-feed-hits-2-million-daily-users-fueled-by-ai-slop-strategy-in-emerging-markets-xcxwbn/) and [Social Media Today](https://www.socialmediatoday.com/news/data-shows-that-metas-ai-based-vibes-feed-is-struggling-to-hold-attentio/805862/). My arithmetic puts India at about 35% of the total.
4. **Who returns.** 52% of returning users mainly prompt the AI to make videos and 30% mainly scroll. About 40% of daily users arrived because the app pushed them into the feed, and that group interacted less. Among users who generated a video, about 60% came back. [journalism] [WinBuzzer, citing Business Insider](https://winbuzzer.com/2025/11/18/metas-vibes-ai-feed-hits-2-million-daily-users-fueled-by-ai-slop-strategy-in-emerging-markets-xcxwbn/). Outlets word the 40% and 60% figures slightly differently.
5. **Mid-December 2025.** The Meta AI app had 4.2 million daily and 26.6 million monthly users, mostly outside the US. a16z wrote that "the vibes ... haven't been amazing." [3p] [a16z](https://a16z.com/state-of-consumer-ai-2025-product-hits-misses-and-whats-next/)
6. **Commentary.** Social Media Today argued that the surge reflected curiosity, and that a stream of AI clips with no strong concept or craft behind it does not hold attention. [opinion] [Social Media Today](https://www.socialmediatoday.com/news/data-shows-that-metas-ai-based-vibes-feed-is-struggling-to-hold-attentio/805862/)
7. **Retention.** I found no day-30 retention figure for Vibes. [not found]

### Other AI-content feeds

- **Midjourney's explore feed.** Midjourney uses ratings to "populate the explore page." [primary] [Midjourney, Mar 2024](https://updates.midjourney.com/new-style-refs-and/). In November 2025 it launched public profiles and offered 5 free fast GPU hours to anyone who completed a profile within 24 hours, to seed it. [primary] [Midjourney, Profiles](https://updates.midjourney.com/profiles-on-midjourney/). Explore-feed engagement or retention numbers: [not found].
- **Character.ai.** In June 2025 it announced AvatarFX video (5 videos a day for all users), Scenes and Streams, with a community feed "coming soon." It blocks photos of real people and watermarks videos. [journalism] [TechCrunch](https://techcrunch.com/2025/06/02/chatbot-platform-character-ai-unveils-video-generation-social-feeds). The feed later launched, but usage numbers: [not found].
- **Suno (AI music).** The mobile app earned about $27 million in gross revenue from July 2024 to October 2025, including about $7 million in October 2025 alone. Appfigures called the curve "almost textbook" for a subscription app with strong retention. [3p] [Appfigures](https://appfigures.com/resources/insights/20251031?f=1). Suno's investor deck reportedly showed about 25% of subscribers still active after 30 days. [company-reported via journalism] [MBI Deep Dives, citing Billboard](https://www.mbi-deepdives.com/musics-ai-mess-part-2/). It also reportedly showed weekly retention of 78% for subscribers and 39% for all users, and about 20 minutes per creation session. [company-reported via journalism] [EDM.com, citing Billboard](https://edm.com/industry/suno-ai-music-tracks-surpass-spotify-entire-catalog-every-two-weeks/). I saw those two figures only in excerpts. In February 2026 the CEO announced 2 million paid subscribers and $300 million ARR. [company-reported via journalism] [Billboard](https://www.billboard.com/pro/suno-2-million-paid-subscribers-300m-arr-revenue/), seen in excerpts only. Suno is the AI-content product here that kept growing, and its users mostly make and keep songs rather than scroll strangers' songs.
- **Udio.** After settling with UMG in October 2025, Udio disabled downloads and put creations inside a "walled garden." [journalism] [Music Ally](https://musically.com/2025/10/30/umg-settles-udio-lawsuit-companies-plan-new-ai-music-service-together/), [Hollywood Reporter](https://www.hollywoodreporter.com/music/music-industry-news/universal-music-group-announces-settlement-with-udio-1236414023/), both seen in excerpts only. Usage data after the change: [not found].
- **YouTube and Google.** YouTube announced Veo 3 inside Shorts in June 2025. Shorts were drawing 200 billion daily views at the time. [company-reported via journalism] [Search Engine Land](https://searchengineland.com/google-brings-ai-video-tool-veo-3-to-youtube-shorts-457262), seen in excerpts only. Nano Banana produced 200 million images and brought 10 million new users to Gemini in its first week. [company-reported via 3p] [a16z](https://a16z.com/state-of-consumer-ai-2025-product-hits-misses-and-whats-next/). Usage of AI creation tools inside Shorts: [not found].

### Bottom line: do people keep watching AI feeds?

Hard numbers exist only for Sora, and they say no. Day-30 retention was under 8%, against 30%+ for top apps, and daily time was about 13 minutes against TikTok's 90. Vibes shows a flat 2 million daily users concentrated in two markets. In both apps, returning users were mostly creators, not viewers. No public data shows a pure AI-content viewing feed holding a mainstream audience.

---

## 2. Taste-training UX

### Midjourney: pair ranking and personalization profiles

1. **March 2024.** Midjourney turned back on free GPU hours for rating. "The top 2000 raters every day get 1 free fast GPU hour." It had stopped the rewards earlier because of abuse, and it now warned that "Using bots for ranking or mashing random buttons over and over may result in your account being banned." Ranking used 1 and 2 hotkeys on PC or taps on mobile. [primary] [Midjourney](https://updates.midjourney.com/new-style-refs-and/)
2. **June 2024.** Personalization (--p) launched. It learned from pair-ranking votes and from likes on the explore page, and needed "roughly 200 pair rankings / likes." Each personalized prompt got a shareable code. A strength setting ran from 0 to 1000. Midjourney called it "a 'fun feature constantly in flux'" that would change "as you do more pair ratings." [primary] [Midjourney](https://updates.midjourney.com/personalization/)
3. **December 2024.** With moodboards and multiple named profiles, the minimum dropped to 40 ratings to start a profile, with "optimal stability" at 200. Ranking got five times faster. [journalism] [VentureBeat](https://venturebeat.com/ai/midjourney-adds-pinterest-like-moodboards-and-support-for-multiple-custom-ai-image-models)
4. **April 2025.** V7 was the first model with personalization on by default. Users had to unlock it first, which took "~5 minutes." [primary] [Midjourney V7 alpha](https://updates.midjourney.com/v7-alpha/). Third-party guides say this meant about 200 ratings. My arithmetic: 200 ratings in 5 minutes is about 1.5 seconds per rating.
5. **2025 to 2026.** Midjourney ran "rating parties" before each model release. V8's instructions: pick the more beautiful image "based on your own personal aesthetic taste," press 3 to skip when unsure, and "These ratings are very serious please try your best." [primary] [Midjourney V8 rating party](https://updates.midjourney.com/v8-rating-party/), [Style ranking, Oct 2025](https://updates.midjourney.com/style-ranking-and-tv-update/)

### Onboarding pickers

- **Netflix.** New profiles pick a few titles they like to "jump start" recommendations. The step is optional. Skippers get "a diverse and popular set of titles." Viewing activity then "supersede[s]" the initial picks, and recent activity counts for more. [primary] [Netflix Help](https://help.netflix.com/en/node/100639). A signup teardown describes the screen as "Pick 3 that you like." [opinion] [LinkedIn teardown](https://www.linkedin.com/pulse/how-streamers-onboard-users-netflix-mark-a-jansen)
- **Netflix thumbs.** Replacing 5-star ratings with thumbs up or down produced "an astounding 200% increase in ratings activity." Netflix said stars confused members because people read them as a public average. [primary] [Netflix](https://about.netflix.com/en/news/goodbye-stars-hello-thumbs)
- **Pinterest.** The onboarding screen asked users to "Follow 5 topics," with the line "Then we'll build a custom home feed for you." [journalism] [Appcues interview with Casey Winters](https://medium.com/appcues/casey-winters-reveals-how-pinterest-perfected-user-onboarding-639fcc7486d7). Localizing the topic picker for non-US users raised new-user activation and retention by 5 to 10%. [primary] [Pinterest Engineering](https://medium.com/pinterest-engineering/personalizing-pinterests-new-user-experience-abroad-60f8f55177ac). The page blocked my fetch, so this number comes from search excerpts.
- **TikTok.** New users are invited to pick interest categories such as pets or travel. Skippers get a general feed of popular videos. Finishing a longer video is a strong signal and counts more than weak ones. [primary] [TikTok Newsroom](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
- **TikTok in practice.** In the WSJ's 2021 bot test, the bots never searched, followed or liked. They only lingered on or swiped past videos. One bot's feed locked onto its assigned interest after 224 videos, about 36 minutes, and 93% of its feed then matched. Most bots were profiled in under two hours, and the fastest in under 40 minutes. The WSJ found watch time was the strongest signal. [journalism] [Tubefilter on the WSJ investigation](https://www.tubefilter.com/2021/07/21/tiktok-recommendation-algorithm-wall-street-journal-guillaume-chaslot/), [9to5Mac](https://9to5mac.com/2022/12/20/how-tiktoks-algorithm-works/)
- **Spotify and Deezer.** Deezer's deployed cold-start system found that "liking at least three artists during the onboarding session also improves recommendations." Users with no interactions, about 5% of the sample, scored 5.01 precision points below average. [academic] [Briand et al., KDD 2021](https://arxiv.org/abs/2106.03819). Spotify's own published lift from its artist picker: [not found].

### Ongoing feedback as a game

- **Stitch Fix Style Shuffle.** This is a thumbs-up or thumbs-down game on clothing. By March 2019, over 75% of active clients had tried it and it had over 1 billion ratings. The CTO said players had better "keep rates" because Stitch Fix sent them more relevant items. She gave no number for the lift. [company-reported via journalism] [Retail Dive](https://www.retaildive.com/news/cto-adds-controls-and-support-as-stitch-fix-grows-into-a-mature-public-c/550716/). By early 2022, about 150,000 clients played every day and lifetime ratings had passed 9 billion. [primary] [Stitch Fix Newsroom](https://newsroom.stitchfix.com/blog/a-year-in-review-24-innovations-at-stitch-fix-in-2021/)
- **Hinge Most Compatible.** Hinge shows one daily pick, shown to both people at once, that expires after 24 hours. In trials it was "8x more likely to result in dates." [company-reported via journalism] [The Hustle](https://thehustle.co/hinge-machine-learning-algorithm). Hinge does not explain to users why a pick was chosen.

### How many signals before it feels personal

| System | Explicit signals to start | Signals to settle | Source |
|---|---|---|---|
| Netflix | "a few" titles, about 3, optional | replaced by viewing behavior | [primary] [Netflix](https://help.netflix.com/en/node/100639) |
| Pinterest | 5 topics | not stated | [journalism] [Appcues](https://medium.com/appcues/casey-winters-reveals-how-pinterest-perfected-user-onboarding-639fcc7486d7) |
| Deezer | 3 or more artists helps | not stated | [academic] [KDD 2021](https://arxiv.org/abs/2106.03819) |
| Midjourney | 40 ratings to start (Dec 2024) | 200 for stability; 200 originally required | [journalism] [VentureBeat](https://venturebeat.com/ai/midjourney-adds-pinterest-like-moodboards-and-support-for-multiple-custom-ai-image-models); [primary] [Midjourney](https://updates.midjourney.com/personalization/) |
| TikTok (WSJ bots, implicit only) | 0 | about 224 videos, about 36 minutes, in one case; most under 2 hours | [journalism] [Tubefilter](https://www.tubefilter.com/2021/07/21/tiktok-recommendation-algorithm-wall-street-journal-guillaume-chaslot/) |

The pattern is 3 to 5 explicit picks to avoid a blank start, then behavior takes over. A stable profile takes a few hundred binary or pairwise judgments. No source measured when users themselves felt it had become personal. [not found]

### Showing users what the system learned

- **Spotify Wrapped 2025.** Over 200 million engaged users in the first 24 hours and over 500 million shares, up 41% on 2024. Wrapped 2024 took 62 hours to reach 200 million. The 2024 edition was criticized for thin stats and an AI podcast, and Spotify answered in 2025 with deeper data and no consumer-facing AI feature. [company-reported via journalism] [TechCrunch](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day)
- **Spotify DJ.** On days users tuned in, they spent 25% of their listening time with DJ, and more than half of first-time listeners returned the next day. Spotify said "when listeners hear commentary alongside personal music recommendations, they're more willing to try something new." [company-reported] [Spotify Newsroom, Mar 2023](https://newsroom.spotify.com/2023-03-08/spotify-new-personalized-ai-dj-how-it-works/). By August 2023 the share was "nearly one-third." [company-reported] [Spotify Newsroom, Aug 2023](https://newsroom.spotify.com/2023-08-08/ai-dj-expanded-new-markets-how-to-use-feature/), seen in excerpts only.
- **Instagram "Your Algorithm" (10 December 2025).** An AI-written summary of your recent interests, for example "Lately you've been into creativity, sports hype, fitness motivation, and skateboarding." You can boost or mute topics, type your own, and share the snapshot to Stories. [journalism] [Hypebeast](https://hypebeast.com/2025/12/instagram-launches-your-algorithm-controls-for-reels). Engagement impact: [not found].
- **TikTok "Why this video" (December 2022).** Shows reasons such as past interactions, accounts you follow, and what is popular in your region. [journalism] [Tubefilter, quoting TikTok](https://www.tubefilter.com/2022/12/20/tiktok-for-you-feed-recommendation-algorithm-explained/). TikTok also has "Manage Topics" sliders (June 2025) and, from November 2025, a slider for AI-generated content. [journalism] [MacRumors](https://www.macrumors.com/2025/11/19/tiktok-ai-content-limits/). Engagement impact: [not found].
- **Midjourney.** Exposes the learned profile as a code you can share and a strength dial. [primary] [Midjourney](https://updates.midjourney.com/personalization/)

### Research on explanations

- **Herlocker, Konstan and Riedl (2000).** In a MovieLens study, "86% of these users said that they would like to see their explanation interface added." The same study found no significant change in how well users filtered good from bad recommendations. The best explanations were simple, such as a histogram of similar users' ratings. [academic] [CSCW 2000](https://dl.acm.org/doi/10.1145/358916.358995), seen through excerpts and the paper's summary.
- **News recommender field test (N = 97,845).** Telling users where recommendations came from raised satisfaction and trust in a prior study. In the field, one treatment raised interaction by a "statistically significant but practically negligible" amount. [academic] [ACM, DOI 10.1145/3774935.3806163](https://doi.org/10.1145/3774935.3806163), from the abstract excerpt only.
- **Gai and Klesse (2019), Journal of Marketing.** Six experiments, two in the field inside a mobile app. Framing the same recommendation as user-based ("people like you liked") instead of item-based ("similar to items you liked") raised click-through. [academic] [Journal of Marketing](https://journals.sagepub.com/doi/full/10.1177/0022242919873901), from the abstract excerpt only.
- **Reciprocal explanations on dating platforms.** Explaining why both sides might like each other beat one-sided explanations when accepting a match has a real cost (N = 287). [academic] [arXiv 1807.01227](https://arxiv.org/abs/1807.01227). An excerpt of the paper body reported 38% versus 24% acceptance. I could not confirm that in the full text.
- **Overall.** Explanations reliably raise stated trust and willingness to use a system. Evidence that they raise clicks or retention is thin and small. Treat "show what we learned" as a trust and sharing feature, not a growth lever.

---

## 3. User-as-creator feedback loops

### Lensa and the AI avatar wave (late 2022)

1. **Spike.** Magic Avatars launched around Thanksgiving 2022. Lensa had 23.44 million downloads in December 2022. [3p via journalism] Apptopia via [TechCrunch, Oct 2023](https://techcrunch.com/2023/10/30/chatgpt-app-revenue-shows-no-signs-of-slowing-but-some-other-ai-apps-top-it/)
2. **Peak.** The category of AI photo apps (Lensa plus 14 others) peaked in mid-December at about 4.3 million downloads and about $1.8 million in spending per day. [3p via journalism] Apptopia via [TechCrunch, Feb 2023](https://techcrunch.com/2023/02/13/the-ai-photo-app-trend-has-already-fizzled-new-data-shows)
3. **About 4 weeks later.** Lensa's revenue was down to about $206,000 a day, "down 92% from its peak." [3p, analyst post] [Sasha Kaletsky on X](https://x.com/SashaKaletsky/status/1610421803016503296), seen in excerpts only.
4. **About 2 months later.** The same app group fell to about 952,000 downloads and about $507,000 in spending per day. My arithmetic puts that at roughly 78% down on downloads and 72% down on spending. [3p via journalism] [TechCrunch](https://techcrunch.com/2023/02/13/the-ai-photo-app-trend-has-already-fizzled-new-data-shows)
5. **About 9 months later.** Lensa was at 413,814 installs a month. My arithmetic puts that about 98% below December 2022. [3p via journalism] [TechCrunch, Oct 2023](https://techcrunch.com/2023/10/30/chatgpt-app-revenue-shows-no-signs-of-slowing-but-some-other-ai-apps-top-it/)
6. **Reasons given.** Ethical backlash over artists' work, a one-time task many did not want to repeat, subscriptions for a one-off, a flood of copycat apps, and attention moving to ChatGPT. [journalism] [TechCrunch](https://techcrunch.com/2023/02/13/the-ai-photo-app-trend-has-already-fizzled-new-data-shows)

### Remini (July 2023)

- A TikTok video of AI "professional headshots" made from 8 to 12 selfies reached 42.9 million views. Remini hit No. 1 on the US App Store on 11 July. [journalism] [TechCrunch](https://techcrunch.com/2023/07/20/remini-tops-the-app-store-for-its-viral-ai-headshots-but-its-body-edits-go-too-far-some-say/)
- It had over 22 million downloads in 30 days and over 20 million daily users, by Apptopia's estimate. Spending rose 1,055% week over week, by data.ai's estimate. [3p via journalism] [TechCrunch](https://techcrunch.com/2023/07/20/remini-tops-the-app-store-for-its-viral-ai-headshots-but-its-body-edits-go-too-far-some-say/)
- Downloads later settled from about 23 million in the peak month to about 7 million, while revenue held up. [3p] [Appfigures](https://appfigures.com/resources/insights/the-company-squeezing-money-from-apps-you-used-to-love/amp), seen in excerpts only.

### CapCut templates

- CapCut had over 318 million monthly users outside China in mid-2024, compared with about 97.4 million for Canva. [3p via journalism] Sensor Tower via Bloomberg, summarized on [Techmeme](https://www.techmeme.com/240729/p10)
- Template videos posted to TikTok carry a CapCut link that invites viewers to use the same template. This is a built-in growth loop from creation to distribution. [journalism] [Yahoo Finance / Bloomberg](https://finance.yahoo.com/news/rise-bytedance-capcut-threatens-adobe-120000162.html), seen in excerpts only.
- CapCut retention or template-use totals: [not found].

### Sora cameos

- Cameos became the main feature during internal testing. [company-reported] [Sequoia podcast](https://sequoiacap.com/podcast/openai-sora-2-team-how-generative-video-will-unlock-creativity-and-world-models)
- After launch, OpenAI added controls to limit how others could use your cameo. [journalism] [MIT Technology Review](https://www.technologyreview.com/2025/10/07/1124998/the-three-big-unanswered-questions-about-sora/). Reporting later said many users did not want others using their likeness. [journalism] [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/)
- So seeing yourself was the strongest hook, and it was also the main source of discomfort.

### Research on making things and valuing them

- **IKEA effect.** Norton, Mochon and Ariely, Journal of Consumer Psychology, 2012. [academic] [HBS PDF](https://www.hbs.edu/ris/Publication%20Files/11-091.pdf)
  - People who assembled a plain IKEA box bid $0.78 for it. People who got it pre-built bid $0.48 (N = 52). My arithmetic: about 63% more.
  - Origami builders valued their own pieces at $0.23. Non-builders offered $0.05 for the same pieces, and $0.27 for experts' origami.
  - Completion mattered. Full builders bid $1.46 and builders stopped two steps short bid $0.59. Building and then taking apart a Lego set erased the effect. The paper says labor raises value "only when labor results in successful completion of tasks."
- **AI ghostwriter effect.** Draxler et al., two studies, N = 30 and N = 96. People did not feel they owned or authored AI-written text, yet did not publicly credit the AI. People who had more influence over the text felt more ownership. [academic] [arXiv 2303.03283](https://arxiv.org/abs/2303.03283)
- **AI adoption and peer response.** Zhou and Lee studied over 4 million artworks from over 50,000 users on an art platform. After adopting text-to-image AI, artists' favorites per view rose from about 2% to about 3% by month six. Average content novelty and visual novelty both fell over time. [academic] [PNAS Nexus, 2024](https://academic.oup.com/pnasnexus/article/3/3/pgae052/7618478)
- **Effort justification.** The classic idea is that people value what they suffered or worked for. It applies only weakly when the labor is a swipe. I found no study on approval-only work, where you curate but do not make. [not found]

---

## 4. Novelty decay, AI slop and labels

### How fast the novelty wears off

| Product | Peak | Decline | Time | Source |
|---|---|---|---|---|
| Lensa revenue | about $2.5M+ a day (implied) | down 92% | about 4 weeks | [3p] [Kaletsky](https://x.com/SashaKaletsky/status/1610421803016503296) |
| AI photo apps, downloads | 4.3M a day | about 78% down (my arithmetic) | about 2 months | [3p via journalism] [TechCrunch](https://techcrunch.com/2023/02/13/the-ai-photo-app-trend-has-already-fizzled-new-data-shows) |
| Sora downloads | 3.33M (Nov 2025) | down 66% to 1.13M | 3 months | [3p via journalism] [TechCrunch](https://techcrunch.com/2026/01/29/openais-sora-app-is-struggling-after-its-stellar-launch/) and later Appfigures reports |
| Sora daily users | about 1M | below 500K | about 4 months | [3p] [Similarweb](https://x.com/Similarweb/status/2001266304867778982); [journalism] [WSJ via TechCrunch](https://techcrunch.com/2026/03/29/why-openai-really-shut-down-sora/) |
| Vibes daily users | 2.7M Meta AI app (Oct) | about 2M Vibes, flat (Nov) | about 3 weeks | [3p] / [journalism], as above |

The Lensa peak row is my arithmetic: $206,000 divided by 0.08. Kaletsky did not state the peak figure.

Across products, the curve repeats. A spike comes in weeks 1 to 3, a cliff in weeks 4 to 8, then a long tail. The exceptions are products whose output keeps a use after the first try: Suno songs, Remini edits that people keep paying for, and Midjourney images.

### How much AI slop there is, and the backlash

- A new YouTube account's first 500 Shorts included 104 AI-generated videos (21%) and 165 "brainrot" videos (33%). The first 16 had neither. [3p] [Kapwing, Nov 2025](https://www.kapwing.com/blog/ai-slop-report-the-global-rise-of-low-quality-ai-videos/). This is a single-account sample.
- 76% of US adults say it is extremely or very important to be able to tell whether content was made by AI or people. 53% are not confident they can tell (N = 5,023, June 2025). [academic/survey] [Pew Research Center](https://www.pewresearch.org/science/2025/09/17/how-americans-view-ai-and-its-impact-on-people-and-society/)
- In a 23,000-person, 13-country study cited by Meta, 82% favored warning labels on AI content that shows people saying things they did not say. [primary] [Meta](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/)
- Art labeled as made by a human is liked more than the same art labeled as made by AI. [academic] [Bellaiche et al., Cognitive Research, 2023](https://cognitiveresearchjournal.springeropen.com/articles/10.1186/s41235-023-00499-6). The page blocked my fetch, so I am using only the headline finding.
- Stories written with AI ideas were rated more creative, but they were more similar to each other than stories by humans alone. [academic] [Doshi and Hauser, Science Advances, 2024](https://www.science.org/doi/10.1126/sciadv.adn5290). The page blocked my fetch, so this is the headline finding only. It matches Zhou and Lee's finding that novelty falls over time.

### Platform labeling and policy, as of late 2026

- **YouTube (March 2024).** Creators must disclose realistic altered or synthetic content. The label sits in the description, or on the video itself for sensitive topics. Clearly unrealistic or animated content is exempt. [primary] [YouTube Blog](https://blog.youtube/news-and-events/disclosing-ai-generated-content/)
- **YouTube (15 July 2025).** The "repetitious content" policy became "inauthentic content." Not monetizable: "AI-generated content made with generic or unoriginal templates giving the impression of mass production," and channels "where content feels interchangeable from video to video." [primary] [YouTube Help](https://support.google.com/youtube/answer/1311392)
- **Meta.** "Made with AI" labels started April 2024 and were renamed "AI info" in July 2024 after complaints about minor edits being labeled. Since September 2024, content only edited with AI has the label in the post menu, while AI-generated content keeps a visible label. Triggers are industry signals and self-disclosure. [primary] [Meta](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/)
- **TikTok (November 2025).** A Manage Topics slider lets viewers see more or less AI-generated content in For You. It cannot turn AI content off entirely. TikTok is also testing invisible watermarks on content made with its AI tools or carrying C2PA credentials. [journalism] [MacRumors](https://www.macrumors.com/2025/11/19/tiktok-ai-content-limits/), [Social Media Today](https://www.socialmediatoday.com/news/tiktok-adds-option-to-limit-ai-content-in-your-for-you-feed/805952/)

### Effect of labels on engagement

- **Altay and Gilardi (2024).** Two preregistered experiments, N = 4,976, US and UK. Labeling headlines as AI-generated lowered perceived accuracy and sharing intent by about 2.66 percentage points in Study 1. The effect on sharing alone was not significant. True headlines and human-written headlines labeled as AI were penalized too. The effect was about three times smaller than a "False" label (about 9.33 points). [academic] [PNAS Nexus](https://academic.oup.com/pnasnexus/article/3/10/pgae403/7795946)
- Platform data on how AI labels change views, watch time or reach on TikTok, Shorts or Reels: [not found].

---

## What carries over to Outpost

Outpost's feed is different in kind from Sora's or Vibes'. The videos are the user's own. Each one has a job, which is selling a Whop product. A right swipe publishes it. The evidence above says the parts of AI feeds that retained people were making and steering, while the parts that failed were passive watching. Outpost should lean on the first and avoid the second.

### Rules

1. **Treat the feed as a short daily review queue, not an endless scroll.** Sora and Vibes users came back to create and steer: about 70% of Sora return visits and 52% of returning Vibes users. They did not come back to watch, as Sora's 13 minutes a day and under-8% day-30 retention show. Give each day a fixed batch, for example "9 new videos," and a clear finished state. Measure success as decisions made and money earned, not minutes watched. Even OpenAI said it was not optimizing for time in feed.

2. **Close the loop with real results inside the feed.** The IKEA effect needs completion. Complete builders bid $1.46 against $0.59 for incomplete ones, and destroyed work lost its value. Zhou and Lee found that AI adopters kept making art as favorites per view rose from about 2% to 3%. For Outpost, "posted," "first 1,000 views" and "first sale" are the completion events. Show them on the approved video's card and as the first card of the next session. Without this, a swipe is just a vote into a void.

3. **Keep the swipe binary and log implicit signals too.** Netflix got 200% more ratings when it moved from stars to thumbs. Stitch Fix built 9 billion thumbs ratings, with about 150,000 players a day. TikTok and the WSJ both point to watch time and completion as the strongest signals. Log completion, rewatches, hold-to-2x and the time before a swipe as taste signals alongside left and right.

4. **Cold start with 3 to 5 explicit picks, then let behavior take over.** Netflix asks for about 3 titles, Pinterest asked for 5 topics, and Deezer found 3 or more artists improve recommendations. All of these are optional or replaced by behavior. Ask for niche, tone and a few "this or that" choices, then stop asking.

5. **Use pairwise "this or that" cards to train taste fast, and be honest about when it is personal.** Midjourney's whole personalization system runs on pair rankings. It started at 40 ratings, became stable at 200, and took about 5 minutes to unlock, which my arithmetic puts at about 1.5 seconds per rating. Pair two hooks or two thumbnails during onboarding and now and then later. Show progress toward a threshold, for example "Taste profile: 23 of 40," and say the profile keeps changing, as Midjourney does with "constantly in flux."

6. **Do not reward swipe volume.** Midjourney had to switch off rating rewards because of abuse, then added bot detection and ban warnings. In Outpost a right swipe publishes in public, so careless swiping causes real harm. Add a skip option (Midjourney has a skip key), a short undo window before posting, and rewards tied to outcomes such as a first sale, not to swipe counts.

7. **Show what the memory learned in plain words, let users edit it, and make it shareable.** Instagram's "Your Algorithm" gives an AI-written summary plus topic controls plus share to Stories. TikTok has "Why this video" and topic sliders. Spotify Wrapped reached 200 million users in 24 hours and 500 million shares. Herlocker found 86% of users wanted explanations. Expect trust and shares, not more swipes: the 97,845-user news test found a negligible click effect. Keep the summary concrete and data-based. Wrapped 2024 was criticized for leaning on an AI podcast over real stats.

8. **Put a one-line reason on each video that names the user's input.** In the ghostwriter studies, people with more influence over AI text felt more ownership. Gai and Klesse found that a "people like you" framing raised clicks in the field. Spotify said spoken context made listeners "more willing to try something new." An example line: "Made because you approved 3 desk-setup videos and said 'shorter hooks.'" This turns the agents' work into the user's work, which is the closest Outpost gets to the IKEA effect.

9. **Build variety in on purpose.** YouTube will not monetize template-like, interchangeable AI videos. TikTok now lets viewers turn AI content down. Zhou and Lee found novelty drops over time with AI, and TikTok avoids back-to-back videos with the same sound or creator. Have the agents rotate format, hook style and product angle. Reserve a small, labeled share of each batch for experiments. TikTok told the WSJ it uses about 7% of the feed for discovery.

10. **Label AI content on every publish and expect a small cost.** YouTube requires disclosure for realistic synthetic content, and Meta and TikTok apply labels automatically from metadata. An AI label cut belief by about 2.66 points even for true content. 76% of Americans want to know what is AI. Apply each platform's AI disclosure by default. Favor formats where being AI-made is not the point, such as product demos, explainers and text-led videos.

11. **Make the user's business the personal element, not their face.** Sora's internal feed turned into "entirely cameos," but users later balked at sharing their likeness. For Outpost, the user's product name, brand and earnings play the "you" role. If face or voice clones are offered, keep them opt-in and private by default.

12. **Notify only for real events.** On Vibes, the 40% of daily users pushed in by app prompts interacted less, while users who had generated something came back at about 60%. Notify when a batch is ready, a post passes a view milestone, or a sale happens. Do not send generic "come watch" nudges.

13. **Plan for the week 4 to 8 cliff and cap generation cost.** Lensa lost 92% of its revenue in about 4 weeks, AI photo apps lost about 78% of downloads in 2 months, and Sora's downloads fell 32% and then 45%. Sora reportedly cost $1 million a day against about $2.1 million in lifetime revenue. Keep the daily batch small and let swipe data cut wasted renders. Track week-4 and week-8 retention from day one.

### Risks, and how Outpost's feed should differ

- **Risk: it becomes a slop feed.** If the videos look interchangeable, users will feel what Social Media Today said of Vibes: "stuff to look at" with no concept behind it. YouTube may also demonetize the channel. The mitigation is rules 9 and 2: forced variety, plus results that show which videos work.
- **Risk: public underperformance turns the loop negative.** Showing results cuts both ways. A run of zero-view posts could make users quit faster than no data at all. I found no data on this. Consider framing early results as tests and comparing each video with the user's own baseline.
- **Risk: weak ownership.** A swipe is light labor, and the ghostwriter effect says people do not feel they own AI output they barely shaped. The mitigation is rule 8, plus left-swipe reasons that visibly change the next batch.
- **Risk: copyright and likeness limits remove the fun content.** Sora lost its popular characters when it switched to opt-in. Outpost should avoid relying on third-party IP or real people's likeness from the start.
- **Risk: brand damage from one bad post.** Approval means publishing. One embarrassing video posted by mistake could end trust. The mitigation is the undo window, a "not sure" skip, and conservative defaults for new users.
- **Difference from Sora and Vibes.** Those feeds asked people to watch strangers' AI videos for fun. Outpost asks people to make quick business decisions about their own videos and then see the outcome. The closest analogs that held up are Stitch Fix's style game, Midjourney's ranking, Suno's creation habit and Hinge's single daily pick. Each pairs a small, repeatable judgment with a concrete payoff.

---

## Open unknowns

- No public retention data exists for any app where users review AI-made content for their own business. All analogs are partial.
- Sora's exact day-30 retention is disputed. a16z says under 8%, and some outlets read the same chart as 1%.
- No source says how many swipes a video-generation taste model needs before users feel it is personal. Midjourney's 40 and 200 figures are for still images ranked in pairs.
- Showing users what the system learned raises trust. Whether it raises daily return rates is not shown in any data I found.
- Platform data on how AI labels change reach, watch time or sales on TikTok, Shorts or Reels: [not found].
- How TikTok's AI slider is being used, and how much it lowers distribution for labeled AI videos: [not found].
- Whether IKEA-type effects apply to curation-only work such as approve or reject: [not found].
- Vibes performance after November 2025, and any Vibes retention curve: [not found].
- Spotify's measured lift from its onboarding artist picker, and Pinterest's figure at source: not verifiable (Pinterest's page blocked my fetch).
- Outpost's own cost per generated video, which decides how big a daily batch can be.

---

## Verification notes

- **Read in full or in part directly.** TechCrunch (Sora, Jan and Mar 2026; Lensa, Feb and Oct 2023; Remini; Character.ai; Wrapped), the a16z State of Consumer AI 2025, the Sequoia podcast page, MIT Technology Review, Meta's Vibes and labeling posts, Midjourney update posts (through archived copies of updates.midjourney.com), the VentureBeat Midjourney article, Netflix Help and the thumbs post, the Spotify DJ March 2023 post, the Stitch Fix Newsroom, Retail Dive, The Hustle, the TikTok Newsroom, Hypebeast, MacRumors, Social Media Today (two articles), WinBuzzer, Tubefilter (Vibes), Kapwing, Pew, Altay and Gilardi, Zhou and Lee, the ghostwriter-effect abstract, the reciprocal-explanations abstract, the IKEA-effect PDF, the Deezer paper, YouTube's disclosure post and inauthentic-content policy, Appfigures on Suno, MBI Deep Dives, AIbase, Spencer Dailey and Techmeme.
- **Seen only through search excerpts or secondary reports.** Posts on X (Olivia Moore, Similarweb, TBPN, Kaletsky), the original OpenAI Sora pages (blocked), the FT, Business Insider and the WSJ (paywalled; cited through other outlets), the Pinterest Engineering post (blocked), the Herlocker paper text (blocked; the quote came from excerpts), Gai and Klesse (blocked), the news-recommender field study (blocked), Bellaiche et al. (blocked), Doshi and Hauser (blocked), Billboard and EDM.com on Suno, Music Ally on Udio, Search Engine Land on Veo, and Appfigures on Remini and Bending Spoons.
- My web-search allowance ran out near the end of the research. Topics I could not search further include more studies on how AI labels affect engagement, Midjourney's official docs page on personalization (blocked), and any 2026 Vibes data.
