# Short-video feeds: how the UX works and what drives return visits

Research for Outpost.

Scope: TikTok, Instagram Reels, YouTube Shorts, Snapchat Spotlight, Douyin and Kuaishou. For each one this file covers first open, feed mechanics, gestures (with hold to 2x in detail), negative feedback, session and return data, published ranking signals, and speed.

Already known and not redone here: TikTok US 81 min/day (CNBC), the "habit moment" of 260 videos in week one (Kentucky AG filing via NPR), the WSJ bot study, Monolith retraining every few minutes, and the leaked "TikTok Algo 101" objective.

## How to read the tags

- [primary] company newsroom, help center, engineering blog, earnings call or filing, regulator press release, court filing.
- [academic] peer-reviewed paper or arXiv preprint.
- [journalism] news outlet.
- [3p] analytics firm, survey firm or research nonprofit.
- [company-reported] a company number repeated by someone else.
- [opinion] design blog, teardown, how-to guide or book.
- [not found] I looked and found nothing usable.
- "My arithmetic" marks any number I computed myself.

Research limit: my web search budget ran out partway through. After that I could only fetch pages whose URLs I already had. Snapchat Spotlight mechanics, Instagram sound and loop defaults, and progress bars are thinner than the rest for that reason. The gaps are listed under open unknowns.

---

## 1. TikTok

### First open and cold start

1. Install and open. The current flow shows one optional interest screen, then a prompt to swipe up, then the For You feed. [opinion] [TechCult](https://techcult.com/why-is-tiktok-making-me-sign-up/). After the picker, TikTok shows prompts saying the feed gets more personal the more you use the app. [opinion] [Appcues GoodUX](https://goodux.appcues.com/blog/tiktok-user-onboarding). An Icons8 teardown that reportedly gives the exact screen copy returned HTTP 403, so the exact current copy is [not found].
2. No account is needed to watch. You choose interests, tap Next, swipe up and land in For You. An account is only needed to like, comment or upload. [opinion] [TechCult](https://techcult.com/why-is-tiktok-making-me-sign-up/)
3. The flow has changed over time. A 2021 guidebook shows a "Sign Up for TikTok" screen on open, then birthday, email or phone, password, username, then "Choose your interests, or not" with a Skip link. After that came a short tutorial video, then For You, then a notification permission prompt. [opinion] [TikTok For Dummies excerpt, Wiley 2021](https://catalogimages.wiley.com/images/db/pdf/9781119803416.excerpt.pdf). One designer timed that account-first version at about 1.5 minutes of registration before any video. [opinion] [Medium](https://medium.com/@laurens_mesure/why-do-most-onboarding-flows-suck-23592d827218)
4. What TikTok says about new users: new users are invited to pick categories "such as pets or travel." If they pick nothing, TikTok shows "a generalized feed of popular videos" until likes, comments and replays start to shape it. [primary] [TikTok newsroom, June 18 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
5. How fast it personalizes. An audit of 347 real users found TikTok "exploits users' interests in between 30% and 50% of all recommended videos". The share of personalized videos rises over the first videos and settles after about 100 recommendations. [academic] [Vombatkere et al., WWW 2024](https://arxiv.org/html/2403.12410)
6. Time from first open to first frame: [not found]. No teardown gives a measured number.

### Feed mechanics

- Full screen, vertical, one video at a time, swipe up for the next. [opinion] [Wiley 2021](https://catalogimages.wiley.com/images/db/pdf/9781119803416.excerpt.pdf)
- Replays count as a signal. TikTok names "likes, comments, and replays" as what moves a new user off the generic feed, so videos loop and a loop is read as interest. [primary] [TikTok newsroom 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
- Diversity rules. The feed avoids two videos in a row with the same sound or creator and skips duplicates and videos already seen. It also adds some videos outside your apparent interests on purpose. [primary] [TikTok newsroom 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en). In 2021 TikTok said it was testing ways to "interrupt repetitive patterns." [primary] [TikTok newsroom, Dec 16 2021](https://newsroom.tiktok.com/en-us/an-update-on-our-work-to-safeguard-and-diversify-recommendations)
- Preloading and pre-rendering. TikTok's Android team named both as "critical" for smooth playback of videos in succession. Pre-rendering means drawing the first frame of the next video before you reach it. [primary] [Android Developers blog, Sept 2 2022](https://android-developers.googleblog.com/2022/08/precise-improvements-how-tiktok-enhanced-its-social-experience-on-android.html)
- ByteDance's player SDK defaults to preloading 5 seconds of each video (`preloadTime` default 5). [primary] [TikTok developer docs, Minis player](https://developers.tiktok.com/docs/en/minis-player)
- Sound default, loop setting, progress bar, auto-scroll: [not found] in primary docs. My search budget ran out before I could source these.

### Gestures

- Long press opens a menu. "Not interested" lives there. [primary] [TikTok newsroom 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en) and [TikTok written evidence to UK Parliament](https://committees.parliament.uk/writtenevidence/137806/default/). Third-party guides say the same long-press menu also holds "Playback speed" (0.5x, 1x, 1.5x, 2x). [opinion] [Technobezz](https://www.technobezz.com/how-to-fix-tiktok-hold-for-2x-speed-not-working)
- Hold to 2x. Press and hold the left or right edge of the screen. A "2x" label appears on the video. Lift your finger and it goes back to 1x. Pocket-lint, Sept 21 2023: "TikTok hasn't officially announced this feature." [journalism] [Pocket-lint](https://www.pocket-lint.com/how-to-fast-forward-tiktok-watch-2x-speed-playback/). CapCut, a ByteDance product, describes the same edge hold. [opinion] [CapCut guide](https://www.capcut.com/resource/how-to-fast-forward-on-tiktok)
- Hold to 2x usage data: [not found].
- Double-tap to like: [not found] in a TikTok primary doc.
- "Why this video": tap Share, then the question-mark icon. Reasons shown include things you watched, liked or shared, accounts you follow, and content popular or posted recently in your region. [primary] [TikTok newsroom, Dec 20 2022](https://newsroom.tiktok.com/en-us/learn-why-a-video-is-recommended-for-you)

### Negative feedback

- Path: long press, then "Not interested." That is 2 actions. [primary] [UK Parliament evidence](https://committees.parliament.uk/writtenevidence/137806/default/)
- Since Dec 2021, "Not interested" also lets you skip future videos from that creator or with that sound. [primary] [TikTok newsroom, Dec 2021](https://newsroom.tiktok.com/en-us/an-update-on-our-work-to-safeguard-and-diversify-recommendations)
- A "tell us why" reason list after "Not interested": [not found] in any TikTok source. One SEO blog claims you can optionally pick a reason, but it is not reliable. [opinion] [SocialBoosting](https://www.socialboosting.com/blog/how-to-change-your-interests-on-tiktok)
- Other controls:
  - Refresh (Mar 16 2023) lets you see For You "as if they just signed up." [primary] [TikTok newsroom](https://newsroom.tiktok.com/en-us/introducing-a-way-to-refresh-your-for-you-feed-on-tiktok)
  - Manage Topics (June 3 2025) adjusts how often 10+ topics appear. It "won't eliminate any topics entirely." [primary] [TikTok newsroom](https://newsroom.tiktok.com/more-ways-to-discover-new-content-and-creators-you-love?lang=en)
  - Keyword filters have filtered "over 200M words" globally, and TikTok planned to raise the limit to 200 keywords. [primary] (same page)
- How often people use controls. In March 2025, 2,619,937 EU users had keyword or hashtag filters on. That is about 1.6% of 159M EU monthly users. The figure comes from TikTok's DSA risk assessment as reported by Tech Policy Press. [journalism] [Tech Policy Press](https://www.techpolicy.press/can-the-eu-make-tiktok-take-responsibility-for-its-rabbit-holes/). Usage rate of "Not interested": [not found].
- Does it work? On Nov 6 2026 the European Commission preliminarily found that "using the 'not interested' button may not be enough to change the content feed. The algorithm prioritises showing users content based on viewing time, over their choice to see less of certain content." It asked TikTok to "rely more on users' explicit preferences, disable viewing time as an indicator to recommend content, increase the accessibility and usability of user controls." [primary] [EC press release IP/26/2361](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_26_2361/IP_26_2361_EN.pdf)

### Ranking signals TikTok has published

- User interactions (likes, shares, follows, comments, content you create), video information (captions, sounds, hashtags), and device and account settings. TikTok says device and account settings get lower weight. [primary] [TikTok newsroom 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
- Strong signals outweigh weak ones. The example TikTok gives is "whether a user finishes watching a longer video from beginning to end." [primary] (same page)
- Independent audit: following a creator has the strongest effect on personalization, then liking, then video view rate. [academic] [Boeker and Urman, WWW 2022](https://arxiv.org/abs/2201.12271). In the 2024 audit, the most personalized quartile of users came from followed creators 30% of the time against 2% for the least personalized. Liked share was 14% against 3%. Watch percentage was 93% against 84%. Early skip rate showed no significant difference (0.11 against 0.09). [academic] [Vombatkere et al. 2024](https://arxiv.org/html/2403.12410)

### Session and return

- Teens averaged about 108.5 min/day before TikTok's time-limit tool and about 107 min with it, a drop of about 1.5 minutes. One employee said the goal was to "contribute to DAU and retention." Internal documents say users fall into a filter bubble after about 30 minutes in one sitting. [primary, court filing via journalism] [OPB/NPR, Oct 11 2024](https://www.opb.org/article/2024/10/11/tiktok-knows-its-app-is-harming-kids-new-internal-documents-show/)
- Opens per day and session length. These figures are secondhand and disagree:
  - "19 opens/day, 10 min 51 s per session," credited to Sensor Tower via the FT. [3p, secondhand, unverified] [SQ Magazine](https://sqmagazine.co.uk/time-spent-on-tiktok-statistics/). My arithmetic: 19 × 10.85 = 206 min/day. That does not match the ~95 min/day the same sites report, so treat it as unreliable.
  - Android, Aug 2025: 10 opens/day, 9 min 42 s per session, 1 h 37 min/day. Attributed to Similarweb via DataReportal. [3p, secondhand] [SQ Magazine screen-time page](https://sqmagazine.co.uk/social-media-screen-time-statistics/), [Axis Intelligence](https://axis-intelligence.com/tiktok-active-users-demographics-statistics/). My arithmetic: 10 × 9.7 = 97 min. That one adds up.
- Teens: 21% of US teens use TikTok "almost constantly," the highest of any platform (YouTube 17%, Instagram 12%, Snapchat 12%). [3p] [Pew, Dec 9 2025](https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/)
- D1/D7/D30 retention from a primary source: [not found]. One stats site lists D1 19.2%, D7 5.9% and D30 3.3% with no stated source or method. [3p, method unknown, low trust] [Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-apps/tiktok)

### Speed

- After TikTok's Android work, the first frame of a video appeared 41% faster, the chance of video lag fell 27%, and app startup time fell 45%. [primary] [Android Developers blog, 2022](https://android-developers.googleblog.com/2022/08/precise-improvements-how-tiktok-enhanced-its-social-experience-on-android.html)
- ByteDance engineering numbers for Douyin-style feeds are in the Douyin section below.

### TikTok evidence table

| Claim | Number | Tag | Source |
|---|---|---|---|
| Watch without an account | 0 sign-up screens before the first video (current flow) | [opinion] | [TechCult](https://techcult.com/why-is-tiktok-making-me-sign-up/) |
| Interest picker is optional | 1 skippable screen | [opinion] / [primary] | [TechCult](https://techcult.com/why-is-tiktok-making-me-sign-up/), [TikTok 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en) |
| Old account-first registration time | ~1.5 min | [opinion] | [Medium](https://medium.com/@laurens_mesure/why-do-most-onboarding-flows-suck-23592d827218) |
| Personalized share of feed | 30-50% | [academic] | [Vombatkere 2024](https://arxiv.org/html/2403.12410) |
| Personalization settles | ~100 recommendations | [academic] | same |
| "Not interested" taps | 2 (long press + tap) | [primary] | [UK Parliament](https://committees.parliament.uk/writtenevidence/137806/default/) |
| EU users with keyword filters | 2.62M, ~1.6% of MAU | [journalism] | [Tech Policy Press](https://www.techpolicy.press/can-the-eu-make-tiktok-take-responsibility-for-its-rabbit-holes/) |
| EU: viewing time outweighs "not interested" | preliminary finding | [primary] | [EC IP/26/2361](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_26_2361/IP_26_2361_EN.pdf) |
| Time-limit tool effect on teens | -1.5 min/day (108.5 to 107) | [primary via journalism] | [OPB/NPR](https://www.opb.org/article/2024/10/11/tiktok-knows-its-app-is-harming-kids-new-internal-documents-show/) |
| Teens "almost constantly" | 21% | [3p] | [Pew 2025](https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/) |
| Android opens/day, session length | 10, 9 min 42 s | [3p, secondhand] | [SQ Magazine](https://sqmagazine.co.uk/social-media-screen-time-statistics/) |
| First frame faster after optimization | 41% | [primary] | [Android Dev blog](https://android-developers.googleblog.com/2022/08/precise-improvements-how-tiktok-enhanced-its-social-experience-on-android.html) |
| Hold-to-2x shipped | by Sept 2023, never announced | [journalism] | [Pocket-lint](https://www.pocket-lint.com/how-to-fast-forward-tiktok-watch-2x-speed-playback/) |
| D1/D7/D30 | [not found] in primary sources | | |

---

## 2. Instagram Reels

### First open and cold start

- Instagram requires an account before any content. Reels is a tab inside a social app, so there is no standalone cold start for it. Exact current screen order: [not found].
- The system collects candidates from accounts you follow plus reels similar to your recent engagement. A lightweight model narrows these to about 100 reels, and heavier models score and order them. [primary] [Meta Reels system card, updated Nov 11 2025](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/)

### Feed mechanics

- Full screen, vertical, swipe up.
- Preloading. Meta keeps the videos next to the current Reel ready in memory, in both directions, so a swipe up or down starts at once ("adjacent preload"). Meta replaced a disk cache plus several warm player instances with one player and an in-memory preload manager. A "Device Stress Detection" system pauses preloading when CPU or I/O load is high. Instagram saw "faster playback starts and an increase in total watch time," and Meta said removing join latency "directly increased engagement metrics." No percentages were published. [primary] [Android Developers blog with Meta, Mar 5 2026](https://developer.android.com/blog/posts/instagram-and-facebook-deliver-instant-playback-and-boost-user-engagement-with-media3-preload-manager)
- Since early 2022 Meta has "prefetched multiple Reels videos earlier, before they were played," because people scroll across several Reels quickly. [primary] [Meta engineering, AV1 for Reels, Feb 2023](https://engineering.fb.com/2023/02/21/video-engineering/av1-codec-facebook-instagram-reels/)
- Sound. Meta counts "How many times this reel has been viewed with the sound on" as an input to its prediction of short views. My inference: sound-off viewing is common enough that Meta models it. [primary] [Meta Reels system card](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/). Default sound state: [not found].
- Looping, progress bar, auto-scroll: [not found] in primary docs.

### Gestures

- Hold to 2x. Launched globally on Mar 27 2025. Long press the right or left side of the screen and the reel plays at 2x. Release and it returns to 1x. [journalism] [TechCrunch](https://techcrunch.com/2025/03/27/instagram-now-lets-you-speed-up-videos-just-like-on-tiktok/). Meta's announcement: "Today, we're globally launching the ability to play an Instagram Reel at 2x speed." At launch it offered only normal or 2x and also worked on horizontal videos. [journalism] [Engadget](https://www.engadget.com/apps/instagram-will-let-you-watch-reels-at-twice-the-speed-120047663.html), [NetInfluencer](https://www.netinfluencer.com/instagram-rolls-out-2x-speed-feature-for-reels/). Instagram's stated reason was community feedback. Reels had grown from 15 seconds to 3 minutes. [journalism] [MacRumors](https://www.macrumors.com/2025/03/28/instagram-new-fast-forward-feature/)
- Later reports describe a speed menu (0.5x, 1x, 1.5x, 2x), opened by pressing the middle of a Reel or from the three-dot menu, while the edge hold stays a temporary 2x. [opinion, unverified] [PCMonks](https://www.pcmonks.net/social-media/instagram-reels-auto-scroll-playback-speed/)
- Usage data for 2x: [not found].

### Negative feedback

- Path: three-dot menu, then "Not interested." The system "will attempt to filter out similar content." [primary] [Meta Reels system card](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/). That is 2 taps.
- Instagram also shows "Interested / Not interested" options below some Reels and predicts the chance you tap "Interested." [primary] (same card)
- "Your Algorithm" (US launch Dec 10 2025) shows an AI-written list of topics Instagram thinks "you've been into lately." You can ask for more or less of each topic, add your own, and share the list to Stories. It expanded to Explore in April 2026 and to the main feed later in 2026. [journalism] [Search Engine Land](https://searchengineland.com/instagram-your-algorithm-465987). In the Q2 2026 call Meta said users can now "write natural language prompts" there. For Facebook's similar "Shape Your Feed," Meta said "Early results show over 80% retention among users who engage with it." [primary, call transcript] [Fool transcript, Q2 2026](https://www.fool.com/earnings/call-transcripts/2026/08/07/meta-meta-q2-2026-earnings-call-transcript/). The "80% retention" metric is not defined further.
- How often people use "Not interested": [not found]. How much one tap weighs: [not found].

### Ranking signals Meta has published

Reels tab predictions, quoted from the system card [primary] [Meta](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/):

- "How likely you are to watch less than three seconds of a reel." Inputs include "How many times the post has been skipped within two seconds of being opened," "How many times the reel was dismissed," and "How many times this reel has been viewed with the sound on."
- "How likely you are to watch more of a reel than 95% of users who watched reels of the same length." Completion is judged against videos of the same length, not as a raw percentage.
- Likelihood to reshare, to share off Instagram, to comment, to follow the author, to click "Interested," and to use the reel's audio.

Mosseri, 2023: "The most important predictions we make are how likely you are to reshare a reel, watch a reel all the way through, like it, and go to the audio page." [primary] [Instagram Ranking Explained, May 31 2023](https://about.instagram.com/blog/announcements/instagram-ranking-explained)

Mosseri, Jan 2025: "The top three signals that matter most for ranking are watch time, likes and sends... Likes are slightly more important for connected content, and sends are slightly more important for unconnected content." [journalism quoting Mosseri video] [Kompozy](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance)

### Session and return (Meta earnings)

- Q3 2025: "video time spent on Instagram up more than 30% since last year." Recommendation work gave Facebook 5% more time spent and Threads 10%. On Facebook, the system was "surfacing twice as many Reels published that day than at the start of the year." [primary] [Meta Q3 2025 call transcript](https://s21.q4cdn.com/399680738/files/doc_financials/2025/q3/META-Q3-2025-Earnings-Call-Transcript.pdf)
- Q1 2026: ranking changes "drove a 10% lift in Reels time spent." Meta doubled the length of user interaction sequences used in training. Same-day posts are now over 30% of recommended Reels. [journalism quoting call] [MediaNama](https://www.medianama.com/2026/05/223-llm-based-recommenders-ads-ai-agents-metas-growth-strategy-q1-fy26-earnings-call/)
- Q2 2026: the largest Reels ranking release to date "drove a 15 basis point increase in sessions on Instagram with particular strength in reshares and time spent." Over half of recommended Feed content is now less than 1 day old. [primary, call transcript] [Fool](https://www.fool.com/earnings/call-transcripts/2026/08/07/meta-meta-q2-2026-earnings-call-transcript/)
- Q3 2026: Reels time spent rose over 4% in the quarter, credited to a model that scores sequences of Reels instead of single videos, plus "richer watch-time signals." [journalism] [Storyboard18](https://www.storyboard18.com/brand-marketing/instagram-time-spent-hits-record-high-as-ai-driven-reels-recommendations-lift-engagement-4-113119.htm)
- D1/D7/D30 for Reels: [not found].

### Instagram evidence table

| Claim | Number | Tag | Source |
|---|---|---|---|
| Candidates scored per request | ~100 reels | [primary] | [Meta card](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/) |
| Fast-skip window Meta models | under 3 s watched; skipped within 2 s | [primary] | same |
| Completion benchmark | beats 95% of viewers of same-length reels | [primary] | same |
| "Not interested" taps | 2 (three-dot + tap) | [primary] | same |
| Hold to 2x launch | Mar 27 2025, left or right edge, binary 2x | [journalism] | [TechCrunch](https://techcrunch.com/2025/03/27/instagram-now-lets-you-speed-up-videos-just-like-on-tiktok/) |
| Preload strategy | adjacent videos in memory, both directions | [primary] | [Android Dev/Meta](https://developer.android.com/blog/posts/instagram-and-facebook-deliver-instant-playback-and-boost-user-engagement-with-media3-preload-manager) |
| Video time growth | +30% YoY (Q3 2025) | [primary] | [Meta Q3 2025](https://s21.q4cdn.com/399680738/files/doc_financials/2025/q3/META-Q3-2025-Earnings-Call-Transcript.pdf) |
| Ranking release effect | +15 bp sessions (Q2 2026) | [primary] | [Fool](https://www.fool.com/earnings/call-transcripts/2026/08/07/meta-meta-q2-2026-earnings-call-transcript/) |
| Feed control retention | "over 80% retention among users who engage with it" | [primary] | same |
| Same-day share of recommended Reels | >30% (Q1 2026) | [journalism] | [MediaNama](https://www.medianama.com/2026/05/223-llm-based-recommenders-ads-ai-agents-metas-growth-strategy-q1-fy26-earnings-call/) |

---

## 3. YouTube Shorts

### First open and cold start

- Shorts is a tab inside the YouTube app. New-user handling for Shorts specifically: [not found]. YouTube's main recommendation explainer does not say how new users are handled. [primary] [Goodrow, YouTube blog, Sept 15 2021](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)

### Feed mechanics

- Full screen, vertical, swipe up. A view now counts "whenever a Short starts to play or replay," with no minimum watch time, starting Mar 31 2025. The old definition lives on as "engaged views." Shorts loop, and every loop is a counted view. [journalism quoting YouTube Help] [Search Engine Journal](https://www.searchenginejournal.com/youtube-changes-shorts-view-counts-no-change-to-monetization/543005/)
- Sound is on by default. As of June 2026 you mute by tapping to pause, then tapping a mute icon. [primary] [YouTube blog, June 25 2026](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/)
- Clear Screen mode (June 2026) "temporarily hides all icons and text from your playback view." You turn it on from the three-dot menu. YouTube compared the overlay to "splotches on your windshield." [primary] (same post) and [journalism] [Engadget](https://www.engadget.com/2202221/youtube-shorts-nixes-dislikes-adds-double-playback-speed/)
- Progress bar and preloading details: [not found].

### Gestures

- Hold to 2x on Shorts shipped June 25-26 2026. YouTube: "You can now double the playback speed on a Short." [primary] [YouTube blog](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/). Gesture as YouTube described it: "hold down the edge of the screen in the Shorts player and the video will start playing at 2x speed. To stop, just lift your finger. You can also lock the speed at 2x for the entire video by swiping down while pressing on the player." [journalism quoting YouTube] [Social Media Today](https://www.socialmediatoday.com/news/youtube-updates-reaction-options-for-shorts/823836/)
- Demand: YouTube called it "a top-requested feature from our community." [journalism quoting YouTube] [Thurrott](https://www.thurrott.com/music-videos/337955/youtube-adds-clear-screen-mode-and-2x-speed-option-for-shorts-videos). Engadget reported it as "the most requested feature" for Shorts. [journalism] [Engadget](https://www.engadget.com/2202221/youtube-shorts-nixes-dislikes-adds-double-playback-speed/)
- History on regular YouTube videos. In July 2023 YouTube tested hold-to-2x for Premium users. You held anywhere on the player and a message "Playing at 2x speed" appeared at the top. The old path took 4 steps: tap video, open controls, choose playback speed, pick a speed. [journalism] [TechCrunch, July 18 2023](https://techcrunch.com/2023/07/18/youtube-test-2x-playback-speed)
- Like became a heart in June 2026 and the dislike button was removed from Shorts. [primary] [YouTube blog](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/)
- Usage data for 2x: [not found].

### Negative feedback

- Why dislike was removed. YouTube said dislikes were ambiguous. People used them for things like weak audio, not just disinterest, and "it wasn't always clear which option to choose." YouTube now relies on "Not interested" and "Don't recommend this channel," which it calls "more precise controls." [primary] [YouTube blog, June 2026](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/), [journalism] [Thurrott](https://www.thurrott.com/music-videos/337955/youtube-adds-clear-screen-mode-and-2x-speed-option-for-shorts-videos)
- The "Tell us why" flow on a computer: More (three dots), then "Not interested," then "Tell us why," then pick "I've already watched the video" or "I don't like the video." That is 3 to 4 clicks. On TVs a third reason, "Don't recommend channel," appears. The help page does not list phone steps for "Tell us why," so the mobile flow is [not found] in primary docs. For the Shorts shelf on Home there is a separate "Show fewer Shorts." [primary] [YouTube Help, Manage your recommendations](https://support.google.com/youtube/answer/6342839)
- How well the controls work. Mozilla ran a randomized test with 22,722 participants and over 567M recommendations, comparing each control with sending no signal:
  - "Don't recommend channel" prevented 43% of similar unwanted recommendations.
  - "Remove from watch history" prevented 29%.
  - "Dislike" prevented 12%.
  - "Not interested" prevented 11%.
  - 39.3% of people who used the controls felt nothing changed. [3p] [Mozilla, Sept 2022](https://www.mozillafoundation.org/en/youtube/user-controls/), [peer-reviewed version](https://dl.acm.org/doi/10.1145/3774904.3792183)
- One tap gets used more. Mozilla's one-click "Stop Recommending" button produced about 80 pieces of feedback per 1,000 videos watched against about 37 with YouTube's native controls. YouTube's native controls need "at least two clicks." With high-volume users removed the numbers were 50 against 23, a strong significant result. Watch rate did not drop and was higher with the button. [3p] [Mozilla report PDF](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf). My arithmetic: about 2.2x more feedback.
- Mozilla's design advice: label controls by outcome ("Block future recommendations on this topic"), not by the signal ("I don't like this recommendation"). [3p] (same PDF)
- A sock-puppet study found the opposite of Mozilla. Repeated "Not interested" removed 88% of unwanted topic recommendations on average. In its survey, 44% of users did not know the button existed. Of those who knew, 82.8% had used it and rated it 3.42/5. This study covered regular YouTube, not Shorts. [academic] [Liu, Wu, Resnick, ICWSM 2024](https://arxiv.org/abs/2307.14551)
- Google's own paper. In a "short-form content platform serving billions of users" with an "immersive feed" (product not named; YouTube Shorts is my inference), Google treated dislikes and skips as negative training labels:
  - Dislike rate fell 2.44% on the homepage and 1.10% in the immersive feed.
  - Repeated dislikes on the same creator fell 9.60% and 7.10%.
  - After a dislike, similar recommendations dropped 60.8% by content and 64.1% by creator, against 22.7% when dislike was only an input feature.
  - Adding skips as negative labels raised "user enjoyment" 0.40% and daily active users with 1+ hour of activity 0.61%. Repeated skips from the same creator fell 1.44%.
  - Skips are "much higher density than explicit dislikes."
  [academic] [Wang et al., RecSys 2023](https://arxiv.org/abs/2308.12256)

### Ranking signals YouTube has published

- Clicks, watch time, survey responses, sharing, likes and dislikes. Watch time was added in 2012 because clicks did not mean people watched, and adding it caused "an immediate 20% drop in views." [primary] [Goodrow 2021](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)
- "Valued watchtime": YouTube surveys viewers to rate videos 1 to 5 stars. Only 4 to 5 star videos count. A 1-2 star rating prompts a follow-up asking why. A model predicts survey answers for everyone else. [primary] (same)
- Shorts-specific: YouTube Studio reports "Viewed (vs. swiped away)," the share of feed impressions where a person watched instead of swiping on. A YouTube guidance quote says "Our systems use the signals for % of viewers who chose to view, avg. view duration and avg. % viewed to inform ranking." [3p quoting YouTube; original URL not verified] [Retensis](https://retensis.com/blog/youtube-shorts-viewed-vs-swiped-away)

### Session and return

- Shorts gets more than 200 billion daily views. [journalism, company-reported] [Variety on Alphabet Q2 2025](https://variety.com/2025/digital/news/youtube-q2-2025-earnings-ad-revenue-alphabet-1236468214/). Sundar Pichai gave the figure on the Q2 2025 call. Variety now redirects bots to a paywall, so I could not recheck the page at writing time. The count is inflated by the Mar 2025 rule that every loop counts.
- Teens "almost constantly" on YouTube: 17%. [3p] [Pew 2025](https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/)
- Sessions per day, minutes per day and D1/D7/D30 for Shorts alone: [not found].

### YouTube Shorts evidence table

| Claim | Number | Tag | Source |
|---|---|---|---|
| Hold to 2x on Shorts | shipped June 2026; edge hold; swipe down to lock | [primary] / [journalism] | [YouTube blog](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/), [SMT](https://www.socialmediatoday.com/news/youtube-updates-reaction-options-for-shorts/823836/) |
| Old speed path | 4 steps | [journalism] | [TechCrunch 2023](https://techcrunch.com/2023/07/18/youtube-test-2x-playback-speed) |
| "Tell us why" | 2 reasons on computer, 3 on TV, 3 to 4 clicks | [primary] | [YouTube Help](https://support.google.com/youtube/answer/6342839) |
| Control effectiveness | 43 / 29 / 12 / 11% prevented | [3p] | [Mozilla](https://www.mozillafoundation.org/en/youtube/user-controls/) |
| One-click feedback rate | 80 vs 37 per 1,000 videos | [3p] | [Mozilla PDF](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf) |
| Unaware of "Not interested" | 44% | [academic] | [Liu et al.](https://arxiv.org/abs/2307.14551) |
| Dislike as training label | -60.8% similar recs after a dislike | [academic] | [Wang et al.](https://arxiv.org/abs/2308.12256) |
| Skips as negative labels | +0.40% enjoyment, +0.61% heavy DAU | [academic] | same |
| Views from watch-time switch | -20% views in 2012 | [primary] | [Goodrow](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/) |
| Daily Shorts views | 200B+ | [journalism] | [Variety](https://variety.com/2025/digital/news/youtube-q2-2025-earnings-ad-revenue-alphabet-1236468214/) |

---

## 4. Snapchat Spotlight

### First open and cold start

- Snapchat opens to the camera. You reach Spotlight by tapping its icon "at the bottom of your screen." [primary] [Snapchat Support, About Spotlight](https://help.snapchat.com/hc/articles/7012271311892)
- Spotlight launched Nov 23 2020 with more than $1M a day paid to creators. [primary] [Snap newsroom](https://newsroom.snap.com/introducing-spotlight)
- Cold start for Spotlight: [not found]. Snap's recommendation-eligibility rules treat "new-user status" as an audience factor for what can be shown. [primary] [Snap recommendation eligibility guidelines](https://values.snap.com/policy/content-guidelines-recommendation-eligibility)

### Feed mechanics and gestures

- Vertical full-screen feed. Autoplay, sound, loop, preloading and hold-to-2x on Spotlight: [not found]. My search budget ran out before I could source these.
- Favorites are a stated personalization input. When you favorite a Spotlight Snap, Snap will "use it to personalize your Spotlight experience." Snap also tailors the feed "as you explore and engage," for example more dance content if you keep watching dance challenges. [primary] [Snap privacy by product](https://values.snap.com/privacy/privacy-by-product)
- Spotlight has no public comments at launch, by design. [primary] [Snap newsroom 2020](https://newsroom.snap.com/introducing-spotlight)

### Negative feedback

- The only primary mentions are reporting, plus "user feedback" and "engagement signals" as reasons Snap may limit recommendations. [primary] [Snap recommendation eligibility](https://values.snap.com/policy/content-guidelines-recommendation-eligibility). A "Don't show me this" type flow: [not found].

### Session and return

- Q2 2025: "Spotlight time spent grew 23% year-over-year, now contributes more than 40% of total content time spent." Spotlight averaged more than 550M monthly users. [primary] [Snap Q2 2025 results](https://investor.snap.com/news/news-details/2025/Snap-Inc--Announces-Second-Quarter-2025-Financial-Results/default.aspx)
- Q3 2025: the share of Spotlight views from content posted in the last 24 hours rose more than 300% YoY in the US. [journalism, call transcript] [Investing.com](https://www.investing.com/news/transcripts/earnings-call-transcript-snap-inc-q3-2025-beats-earnings-expectations-93CH-4335913)
- Q1 2026: "total time spent watching Spotlight increasing 11% year-over-year," with "AI-driven personalization" credited. Spotlight shares and reposts grew 62% globally and 124% in the US. [primary, call transcript] [Fool, Snap Q1 2026](https://www.fool.com/earnings/call-transcripts/2026/05/07/snap-snap-q1-2026-earnings-call-transcript/)
- Visit frequency, from before Spotlight existed. Users visited Snapchat "more than 18 times per day" and spent "25 to 30 minutes" a day. Under-25s visited 20+ times. [primary] [Snap S-1, 2017](https://www.sec.gov/Archives/edgar/data/1564408/000119312517029199/d270216ds1.htm). My arithmetic: about 1.4 to 1.7 minutes per visit. This is the clearest primary evidence that many short check-ins a day is a stable pattern.
- Teens "almost constantly" on Snapchat: 12%. [3p] [Pew 2025](https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/)

### Snapchat evidence table

| Claim | Number | Tag | Source |
|---|---|---|---|
| Spotlight time growth | +23% YoY (Q2 2025), +11% (Q1 2026) | [primary] | [Snap Q2 2025](https://investor.snap.com/news/news-details/2025/Snap-Inc--Announces-Second-Quarter-2025-Financial-Results/default.aspx), [Fool Q1 2026](https://www.fool.com/earnings/call-transcripts/2026/05/07/snap-snap-q1-2026-earnings-call-transcript/) |
| Spotlight share of content time | >40% | [primary] | [Snap Q2 2025](https://investor.snap.com/news/news-details/2025/Snap-Inc--Announces-Second-Quarter-2025-Financial-Results/default.aspx) |
| Fresh-content view share | +300% YoY (US, Q3 2025) | [journalism] | [Investing.com](https://www.investing.com/news/transcripts/earnings-call-transcript-snap-inc-q3-2025-beats-earnings-expectations-93CH-4335913) |
| Visits per day (2017, pre-Spotlight) | 18+ visits, 25-30 min | [primary] | [S-1](https://www.sec.gov/Archives/edgar/data/1564408/000119312517029199/d270216ds1.htm) |
| Hold to 2x, negative feedback flow | [not found] | | |

---

## 5. Douyin and Kuaishou

### Hold to 2x origin

- Speed controls reached Douyin and Kuaishou in mid-September 2021. On Douyin you long pressed the video for about 2 seconds to open a bottom menu with 0.5x, normal, 1.5x and 2x. The setting applied to one video only. Douyin said it mainly targeted horizontal videos of about 5 minutes. [journalism] [VISTA via Sohu, Oct 12 2021](https://www.sohu.com/a/494700217_220034)
- By July 2023 Chinese press reported that Douyin and Bilibili "already" supported press-and-hold 2x when YouTube began testing it. [journalism] [Gamersky, July 19 2023](https://www.gamersky.com/tech/202307/1620918.shtml). Exact Douyin ship date for the edge hold: [not found].
- Douyin user tutorials describe holding either side in an empty area (no text or icons), and sliding down while holding to lock 2x. [opinion, unverified, search summary only]
- Read across platforms, the sequence is a long-press speed menu (Douyin 2021), then a hold to 2x (Douyin and Bilibili by 2023), then TikTok (by Sept 2023), Instagram (Mar 2025) and YouTube Shorts (June 2026). Every Western app that shipped it chose the screen edges and a temporary 2x that ends on release. YouTube added swipe-down to lock.

### Speed engineering (ByteDance Volcano Engine, which builds Douyin's player)

- Recommended setup for Douyin-style feeds [primary] [Volcano Engine docs, "Douyin-style short video best practices"](https://docs.volcengine.com/docs/4/101200):
  - Preload 3 to 5 upcoming videos, about 800 KB each for videos under 10 minutes.
  - Pre-render exactly 1 next video. Decode its first frame and use that frame as the cover image.
  - Start playback when the finger lifts and the next page is about to show, not when the scroll animation stops.
  - Use a non-black first frame as cover to avoid black flashes.
  - Use async player calls so swiping does not stutter.
  - The result is first-frame time of 100 to 300 ms.
- The 200 ms threshold. A Volcano Engine engineer plotted first-frame time against the rate at which users leave a video. There was a flat tolerance band from about 70 to 200 ms. Above 200 ms the leave rate "deteriorates noticeably." The team concluded that under 200 ms is "largely lossless" for the business. About 50% of first frames in the core business were already under 100 ms, which they call "zero first frame." Async decoder init saved 80 to 120 ms and decoder reuse saved over 40 ms. The analysis covers one business and gives no sample sizes. [primary, engineering article] [Volcano Engine developer community](https://developer.volcengine.com/articles/7034471690427957262)
- Starting playback the instant the first frame decodes increases stalls in the first 1 to 3 seconds. Buffering a little first "significantly" raises watch time and plays, with no number given. On mid and low-end phones, decode and render alone can take over 200 ms, which is why pre-rendering matters. [primary, engineering article] [Volcano Engine](https://developer.volcengine.com/articles/7316456932528390182)
- ByteDance's TT Player cut video open time from about 0.8 s to about 0.2 s. [journalism] [Zhihu](https://zhuanlan.zhihu.com/p/346306902)

### Kuaishou usage and ranking (primary filings and papers)

- Average daily time spent per DAU on the Kuaishou app [primary]:
  - Q3 2025: 134.1 min, with 416.2M DAU. [Kuaishou IR](https://ir.kuaishou.com/news-releases/news-release-details/kuaishou-technology-announces-third-quarter-2025-unaudited/)
  - Q4 2025: 126.0 min. [Kuaishou IR](https://ir.kuaishou.com/news-releases/news-release-details/kuaishou-technology-announces-fourth-quarter-and-full-year-2025)
  - Q1 2026: 412.7M DAU, time per DAU "remained relatively stable." [via Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/kuaishou-technology-announces-first-quarter-083800230.html)
- Kuaishou defines retention as "the ratio of visiting the system again, and commonly referred to the retention at next day," and calls DAU "the core value of the short video app." [academic] [Cai et al., WWW 2023](https://arxiv.org/abs/2302.01724)
- Ranking heads, from the same paper. Kuaishou scores each candidate with eight models: watch time, short view, long view, like, follow, forward, comment, and profile-page entry. It returns 6 videos per request. [academic] (same)
- Optimizing for return time, not watch time. The model learns to minimize the time until the user comes back. After 100+ days live it converged to:
  - +0.450% app open frequency
  - +0.2% DAU
  - +0.053% next-day retention
  - +0.063% 7-day retention
  The effects grew slowly for about 80 days, then sharply between day 80 and day 100. The paper notes that a 0.01% retention gain and a 0.1% DAU gain are statistically significant at this scale. [academic] (same)
- New users are different, not just data-poor. Kuaishou found new users' behavior "follows a much different distribution" from regular users. A sub-model per user group raised new-user watch time 7.75%, against 2 to 3% for other groups. [academic] [POSO, Dai et al. 2021](https://arxiv.org/abs/2108.04690)
- Speed-watching means low interest. A study using Kuaishou and Taobao logs treats skimming and speed-watching, meaning watching below the user's own normal ratio, as "tolerance" of content they don't want. 88% of survey respondents agreed these behaviors signal lack of interest. 59% reported frustration or wasted time after investing in content that turned out uninteresting. 70% said they would leave the platform if tolerance kept rising. The authors report that higher tolerance goes with lower later engagement in the Kuaishou and Taobao logs, but give no effect size. A field test ran on an unnamed Chinese video platform with 80,000 users per group, on a two-column list, not a full-screen feed. The two groups that treated tolerance as a negative signal raised day-2 retention by an average 0.36% and 0.67%, and cut dwell time by 1.28% and 1.18%. Daily results swung both ways over the 7 days. [academic] [Zou et al., CHI 2026](https://arxiv.org/html/2412.09950v2). The survey sample came mostly from a developer community.

---

## 6. Cross-platform comparisons

### Hold to 2x

| Platform | Where you press | What the UI shows | Lock | When | Tag |
|---|---|---|---|---|---|
| Douyin | Long press about 2 s opened a menu (2021). Later, hold either side | Menu 0.5x/1x/1.5x/2x (2021) | Slide down while holding (tutorials, unverified) | Menu Sept 2021; hold by July 2023 | [journalism] |
| TikTok | Left or right edge | "2x" label on video | [not found] | By Sept 2023, never announced | [journalism] |
| YouTube (regular) | Anywhere on the player | "Playing at 2x speed" at top | n/a | Premium test July 2023 | [journalism] |
| Instagram Reels | Left or right edge | [not found] | No, release to stop | Mar 27 2025 | [journalism] |
| YouTube Shorts | Edge of the screen | [not found] | Swipe down while pressing | June 25-26 2026 | [primary] / [journalism] |
| Snapchat Spotlight | [not found] | | | | |

Usage data on how many people use hold to 2x: [not found] on every platform. The only demand signal is YouTube calling it top-requested for Shorts. The only interpretation evidence is the tolerance study, which reads speed-watching as low interest.

### Negative feedback paths

| Platform | Path | Taps | Reasons offered | Effect evidence |
|---|---|---|---|---|
| TikTok | Long press, then "Not interested" | 2 | None found. Creator or sound sub-options since 2021 | EU: viewing time outweighs it [primary] |
| Instagram Reels | Three dots, then "Not interested" | 2 | None found | [not found] |
| YouTube (Shorts and regular) | Three dots, "Not interested," "Tell us why" | 3-4 | "Already watched," "Don't like the video" | 11% (Mozilla) vs 88% (Liu) prevented |
| Snapchat Spotlight | [not found] | | | |
| Mozilla's test button | One click | 1 | None | 2.2x more feedback, no watch-rate drop |

### Speed and engagement

| Finding | Number | Tag | Source |
|---|---|---|---|
| Viewers start abandoning video | after 2 s of startup delay | [academic] | [Krishnan and Sitaraman, IMC 2012](https://people.cs.umass.edu/~ramesh/Site/HOME_files/imc208-krishnan.pdf) |
| Each extra second past 2 s | +5.8% abandonment | [academic] | same |
| Failed visit | -2.32% chance of returning within a week | [academic] | same |
| Short-clip viewers are less patient than long-form viewers | qualitative | [academic] | same |
| Douyin leave-rate inflection | 200 ms first frame | [primary] | [Volcano Engine](https://developer.volcengine.com/articles/7034471690427957262) |
| Douyin-style target | 100-300 ms first frame | [primary] | [Volcano docs](https://docs.volcengine.com/docs/4/101200) |
| TikTok Android first frame | 41% faster | [primary] | [Android Dev](https://android-developers.googleblog.com/2022/08/precise-improvements-how-tiktok-enhanced-its-social-experience-on-android.html) |
| Instagram in-memory adjacent preload | more watch time, % not given | [primary] | [Android Dev/Meta](https://developer.android.com/blog/posts/instagram-and-facebook-deliver-instant-playback-and-boost-user-engagement-with-media3-preload-manager) |

My arithmetic on Krishnan: if the 5.8% per second holds in a straight line, a 5 s start loses about 17% more viewers than a 2 s start (3 × 5.8). The paper measured this on Akamai video traffic in 2012, not on short-video feeds.

### Regulatory context (affects "hard to put down" framing)

- Feb 6 2026: the European Commission preliminarily found TikTok's "addictive design" in breach of the DSA. It named infinite scroll, autoplay, push notifications and the personalized recommender as features that can push users into "autopilot mode." Possible remedies included disabling infinite scroll over time and adding screen-time breaks. [journalism] [Computer Weekly](https://www.computerweekly.com/news/366639072/European-Commission-TikToks-addictive-design-breaches-EU-law)
- July 10 2026: similar preliminary findings against Instagram and Facebook. Reported remedies include autoplay and infinite scroll off by default and a recommender that is "less engagement-oriented." [journalism, secondhand, not verified against the EC text] [HabitDoom summary](https://habitdoom.com/blog/eu-addictive-design-findings)
- Nov 6 2026: the TikTok "rabbit hole" finding quoted above. Regulators want explicit preferences to outweigh viewing time. [primary] [EC IP/26/2361](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_26_2361/IP_26_2361_EN.pdf)

---

## 7. What carries over to Outpost

Outpost differs from every app above in three ways that change how the evidence applies.

1. The inventory is small and finite. The feed holds the user's own agent-made videos, maybe a handful to a few dozen per day, not an endless pool.
2. A swipe is a decision with consequences. On TikTok a swipe is a cheap skip. In Outpost, swipe right posts the video publicly and swipe left sends feedback to the agents.
3. The learner is a memory layer that steers creation, not a ranker choosing from existing videos. Feedback changes what gets made next.

Each rule below names its evidence. Confidence reflects how directly the evidence transfers.

### First open

**R1. Get a playing video on screen with no sign-up wall. Ask for accounts (Whop, TikTok, YouTube, Instagram) only at the first approve.**
TikTok lets new users watch with zero account screens and asks for an account only when it is needed to act. [opinion] [TechCult](https://techcult.com/why-is-tiktok-making-me-sign-up/). The old account-first TikTok flow cost about 1.5 minutes before any video. [opinion] [Medium](https://medium.com/@laurens_mesure/why-do-most-onboarding-flows-suck-23592d827218). Confidence: medium. The pattern is clear, but no source gives a conversion number for gating vs not gating.

**R2. Offer one optional, skippable niche picker. Have a fallback batch ready if the user skips.**
TikTok uses one skippable interest screen and falls back to "a generalized feed of popular videos." [primary] [TikTok 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en). For Outpost the fallback should be a prebuilt starter batch of 3 to 5 sample videos in different niches and styles. Agents cannot generate on demand fast enough for a first open. That last point is my judgment, not sourced.

**R3. Make the first batch varied on purpose. Treat the first sessions as exploration.**
TikTok adds videos outside your apparent interests to learn. [primary] [TikTok 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en). Personalization settles after about 100 recommendations. [academic] [Vombatkere 2024](https://arxiv.org/html/2403.12410). New users behave differently from regulars, and a dedicated new-user model added 7.75% watch time. [academic] [POSO](https://arxiv.org/abs/2108.04690). Outpost will not see 100 swipes in a day, so each early swipe must carry more information. That is why reasons (R9) and the taste list (R11) matter more here than on TikTok. Confidence: medium.

### Playback speed

**R4. The next video must be on screen in under 200 ms after a swipe. A cold app open must reach a playing first frame in under 2 s.**
Leave rate rises past 200 ms first frame on Douyin. [primary] [Volcano Engine](https://developer.volcengine.com/articles/7034471690427957262). Abandonment starts after 2 s and grows 5.8% per extra second, and short-clip viewers are the least patient. [academic] [Krishnan and Sitaraman](https://people.cs.umass.edu/~ramesh/Site/HOME_files/imc208-krishnan.pdf). Instagram credited removing join latency with more watch time. [primary] [Android Dev/Meta](https://developer.android.com/blog/posts/instagram-and-facebook-deliver-instant-playback-and-boost-user-engagement-with-media3-preload-manager). Confidence: high for the direction, medium for the exact thresholds.

**R5. Preload the next 2 to 3 videos into memory and pre-render the next first frame. Use that frame as the poster. Start playback when the finger lifts, not when the animation ends. Never show a black frame.**
These are ByteDance's published recommendations for Douyin-style feeds: preload 3 to 5 videos at about 800 KB each, pre-render 1, play on finger lift, non-black cover. [primary] [Volcano docs](https://docs.volcengine.com/docs/4/101200). Instagram keeps adjacent videos in memory in both directions. [primary] [Android Dev/Meta](https://developer.android.com/blog/posts/instagram-and-facebook-deliver-instant-playback-and-boost-user-engagement-with-media3-preload-manager). Outpost's queue is finite and known in advance, so the whole day's batch can sit on disk before the user opens the app. A feed with unlimited inventory cannot do that. Buffer a little before starting, because starting on the very first frame causes stalls in seconds 1 to 3. [primary] [Volcano Engine](https://developer.volcengine.com/articles/7316456932528390182). Confidence: high.

**R6. Back off preloading under device stress.**
Meta pauses preloading when CPU or I/O is high so scrolling stays smooth. [primary] [Android Dev/Meta](https://developer.android.com/blog/posts/instagram-and-facebook-deliver-instant-playback-and-boost-user-engagement-with-media3-preload-manager). This matters if the base-builder layer animates while videos preload. Confidence: medium.

### Gestures

**R7. Hold to 2x: hold on the left or right third of the screen to play at 2x. Show a small "2x" pill. Release to return to 1x. Swipe down while holding to lock 2x for the rest of the video. Keep the center long press for a menu.**
TikTok, Instagram and YouTube Shorts all put it on the edges, end it on release, and show a "2x" label. YouTube adds swipe-down to lock and called the feature top-requested. [primary] [YouTube blog](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/), [journalism] [SMT](https://www.socialmediatoday.com/news/youtube-updates-reaction-options-for-shorts/823836/), [TechCrunch](https://techcrunch.com/2025/03/27/instagram-now-lets-you-speed-up-videos-just-like-on-tiktok/), [Pocket-lint](https://www.pocket-lint.com/how-to-fast-forward-tiktok-watch-2x-speed-playback/). Users arriving from TikTok or Reels already know this gesture. Confidence: high that users expect it. There is no data on how often it is used.

**R8. Read 2x as a pacing complaint, not approval. Log it and pass it to the video agents as "too slow at second X."**
Speed-watching is "tolerance" behavior, and 88% of surveyed users say it signals lack of interest. Treating it as a negative signal raised day-2 retention by an average 0.36% and 0.67% in two test groups on a two-column video list. [academic] [Zou et al. 2026](https://arxiv.org/html/2412.09950v2). On the user's own video, 2x more likely means "the pacing drags" than "I hate this." That reading is my inference. Log where in the video the hold starts. Confidence: medium.

**Gesture conflict note.** Outpost uses horizontal swipes for approve and reject, and the hold-to-2x zones are the same left and right edges. Recognize a hold only after the finger has stayed still for a short time. iOS's default long-press recognizer uses 0.5 s and 10 points of allowed movement (Apple UIKit defaults, from my own knowledge; I could not fetch Apple's page to confirm). Recognize a swipe as soon as horizontal movement passes the slop distance. On this screen, turn off the system left-edge back-swipe so it does not fight with reject. All of this is design judgment, not evidence.

### Approve and reject

**R9. Make reject one swipe. Then show 4 to 6 one-tap reason chips that name what the agents will change, with optional voice or text and a skip. Do not hide reject in a menu.**
- A one-click feedback button produced about 2.2x more feedback than YouTube's two-click menus, with no drop in watching. [3p] [Mozilla PDF](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf)
- 44% of YouTube users did not know "Not interested" existed. It lives behind a menu. [academic] [Liu et al.](https://arxiv.org/abs/2307.14551)
- YouTube removed dislike from Shorts because it was ambiguous, with people using it for things like weak audio. [primary] [YouTube blog](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/)
- Mozilla's advice is to label controls by outcome ("Block future recommendations on this topic"). [3p] (Mozilla PDF)
- YouTube's "Tell us why" offers only 2 reasons on a computer. [primary] [YouTube Help](https://support.google.com/youtube/answer/6342839)

Outpost's chips should map to things an agent can act on. Examples: "Weak hook," "Too slow," "Voice," "Visuals," "Wrong topic," "Off-brand," "Product doesn't fit." Write them as outcomes, for example "Fewer videos with this hook style." The exact chip set is my judgment. Confidence: high for one swipe and visible reasons, medium for the chip count.

**R10. Show the feedback working. Confirm what changed, and make sure the next batch visibly reflects it.**
- Feeds whose controls don't visibly work lose trust. 39.3% of YouTube control users felt nothing changed. [3p] [Mozilla](https://www.mozillafoundation.org/en/youtube/user-controls/)
- The EU found TikTok's "not interested" ineffective because viewing time outweighed it. [primary] [EC IP/26/2361](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_26_2361/IP_26_2361_EN.pdf)
- Training on negative labels cut similar recommendations about 61 to 64% after a dislike. [academic] [Wang et al.](https://arxiv.org/abs/2308.12256)

For Outpost: explicit swipes and reasons should outrank implicit watch signals in Supermemory. After a reject, show a confirmation such as "Got it. Agents will avoid slow intros." Then tag the next batch, for example "Made with your note: faster hook." Confidence: high.

**R11. Show the learned taste as an editable list, so Supermemory is visible and correctable.**
- Instagram's "Your Algorithm" shows an AI-written topic list you can turn up, turn down or add to, and now takes natural-language prompts. [journalism] [Search Engine Land](https://searchengineland.com/instagram-your-algorithm-465987), [primary] [Meta Q2 2026](https://www.fool.com/earnings/call-transcripts/2026/08/07/meta-meta-q2-2026-earnings-call-transcript/)
- TikTok has Manage Topics and Refresh. [primary] [TikTok 2025](https://newsroom.tiktok.com/more-ways-to-discover-new-content-and-creators-you-love?lang=en), [TikTok 2023](https://newsroom.tiktok.com/en-us/introducing-a-way-to-refresh-your-for-you-feed-on-tiktok)
- Meta reported "over 80% retention among users who engage with" its feed-control feature. The metric is undefined. [primary] (Q2 2026)

Confidence: medium. The pattern is converging across platforms, but the outcome data is thin.

**R12. Approving posts publicly, so guard against accidental right swipes. Use a short undo window or a two-stage swipe.**
No platform above has a swipe that publishes, so there is no direct evidence. Design judgment.

### Implicit signals to log (secondary to explicit swipes)

**R13. Log these per video:**
- time to first swipe
- whether the user swiped within 2 to 3 seconds
- watch percentage, judged against videos of the same length
- loops and replays
- 2x holds and where they start
- pauses
- sound on or off
- opening the comments or product overlay

Sources:
- Meta models watching under 3 seconds, skipping within 2 seconds, and completion against same-length videos. [primary] [Meta card](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/)
- YouTube Shorts tracks "viewed vs swiped away." [3p] [Retensis](https://retensis.com/blog/youtube-shorts-viewed-vs-swiped-away)
- TikTok uses replays and finishing longer videos. [primary] [TikTok 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
- Kuaishou scores short view, long view and watch time separately. [academic] [Cai et al.](https://arxiv.org/abs/2302.01724)
- Skips used as negative labels raised enjoyment. [academic] [Wang et al.](https://arxiv.org/abs/2308.12256)

For Outpost a quick swipe on your own video is a decision, not a skip. So these signals describe how good the video felt to watch, which is still useful to the video agents. Confidence: medium.

### Feed presentation

**R14. Full screen, vertical, autoplay and loop. Sound on by default, with one-tap mute. Add a "clear screen" toggle so the user can judge the video as viewers will see it.**
- Every platform here is full-screen vertical, and Shorts and TikTok loop. [primary] [SEJ on Shorts replays](https://www.searchenginejournal.com/youtube-changes-shorts-view-counts-no-change-to-monetization/543005/), [TikTok 2020](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en)
- YouTube Shorts plays with sound and added Clear Screen because overlays are like "splotches on your windshield." [primary] [YouTube blog](https://blog.youtube/news-and-events/youtube-shorts-experience-updates-features/)
- Meta tracks sound-on viewing, so many people watch muted. [primary] [Meta card](https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/)

The voiceover is part of what the user approves, so sound on by default matters more here than in a consumer feed. That is my judgment. Whether to respect the iPhone silent switch is an open question. Confidence: medium.

### Sessions and return without push

**R15. Design for short, frequent check-ins with a clear end, not endless scroll. Show "You're caught up" when the queue is empty, then send the user to the base.**
- Snapchat users visited 18+ times a day for 25 to 30 minutes total, about 1.4 to 1.7 minutes per visit (my arithmetic). [primary] [Snap S-1](https://www.sec.gov/Archives/edgar/data/1564408/000119312517029199/d270216ds1.htm)
- TikTok Android sessions run about 10 minutes. [3p, secondhand] [SQ Magazine](https://sqmagazine.co.uk/social-media-screen-time-statistics/)
- Outpost's queue is finite anyway.
- EU regulators have named infinite scroll and autoplay as addictive-design risks for TikTok and Meta. [journalism] [Computer Weekly](https://www.computerweekly.com/news/366639072/European-Commission-TikToks-addictive-design-breaches-EU-law)

A clean end state is honest and lower risk. Confidence: medium.

**R16. Open on "since you left" results (new views, sales, approvals that went live) before the review queue. Fresh results are Outpost's version of fresh content.**
- Meta and Snap both credit freshness for engagement gains. Same-day posts are over 30% of recommended Reels. [journalism] [MediaNama](https://www.medianama.com/2026/05/223-llm-based-recommenders-ads-ai-agents-metas-growth-strategy-q1-fy26-earnings-call/). Over half of recommended Instagram Feed content is under a day old. [primary] [Meta Q2 2026](https://www.fool.com/earnings/call-transcripts/2026/08/07/meta-meta-q2-2026-earnings-call-transcript/). Snap's US share of Spotlight views from content under 24 hours old rose over 300% YoY. [journalism] [Investing.com](https://www.investing.com/news/transcripts/earnings-call-transcript-snap-inc-q3-2025-beats-earnings-expectations-93CH-4335913)
- Kuaishou optimizes directly for time-to-return. App-open frequency rose 0.45% once the model learned what brings people back. [academic] [Cai et al.](https://arxiv.org/abs/2302.01724)

Without push notifications, the reason to open has to come from the user's own memory that results arrive. Confidence: low to medium. No source tests this without push.

**R17. Measure return frequency (opens per day, D1, D7), not minutes spent.**
- Kuaishou treats next-day retention as "the ultimate goal" because it "reflects user satisfaction." [academic] [Cai et al.](https://arxiv.org/abs/2302.01724)
- Treating low-interest viewing as negative raised day-2 retention while cutting dwell time. [academic] [Zou et al.](https://arxiv.org/html/2412.09950v2)
- Benchmarks are weak. a16z's targets for social apps are D1 50/60/70%, D7 35/40/50% and D30 20/25/30% for OK, good and great. [opinion] [a16z](https://a16z.com/do-you-have-lightning-in-a-bottle-how-to-benchmark-your-social-app/)
- Note that a 0.01% retention gain counts as significant at Kuaishou's scale. A hackathon cohort will only show large effects.

Confidence: medium.

---

## 8. Open unknowns

1. Time from first open to first frame on any of these apps: [not found]. The team could measure TikTok and Reels themselves with screen recordings.
2. Usage rate of hold to 2x on any platform: [not found].
3. Usage rate of "Not interested" on TikTok, Reels or Shorts: [not found]. The only usage figures are TikTok keyword filters (about 1.6% of EU users) and YouTube survey awareness (56%, my arithmetic from 44% unaware).
4. Whether TikTok, Reels or Spotlight show a reason list after "Not interested": not found in any primary source. YouTube's is documented.
5. Snapchat Spotlight mechanics: autoplay, sound, hold to 2x, negative feedback flow and cold start are all [not found]. My search budget ran out.
6. Default sound behavior and iPhone silent-switch handling on TikTok, Reels and Shorts: [not found] in primary docs.
7. Progress bars: when each platform shows one, whether it scrubs, and the video length threshold: [not found].
8. Primary D1/D7/D30 retention for TikTok, Reels or Shorts: [not found]. Kuaishou gives definitions and lifts, not levels.
9. What "over 80% retention among users who engage with it" means in Meta's Q2 2026 call: undefined in the transcript.
10. Whether daily return can be built without push. Every platform above uses notifications. The EU's Feb 2026 TikTok finding lists them as an addictive-design feature. No source isolates return rates without push. This is the largest evidence gap for Outpost.
11. Whether the TikTok "habit after 260 videos" finding transfers. Outpost users may see 5 to 30 videos a day, so a habit would have to come from decisions and results, not volume. Untested.
12. Instagram and Facebook EU findings of July 2026: seen only through a secondary summary. The EC text should be checked before quoting.
13. Whether "Tell us why" chips reduce reject volume or slow the user down. No source compares 0, 2 and 5 reasons.
