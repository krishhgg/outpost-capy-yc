# Swipe-to-decide apps and "tell us why" feedback

Research for Outpost.

## How to read this

Every claim carries a tag.

- [primary] means company newsroom, docs, filings, patents or a company engineering paper.
- [academic] means a peer-reviewed paper or a research preprint.
- [journalism] means a news outlet reporting the fact.
- [company-reported] means the number comes from the company, even when a journalist carries it. Treat these as marketing-grade. Most have no baseline, sample size or confidence interval.
- [3p] means a third-party guide or analytics firm.
- [opinion] means a design essay, teardown or quote.
- [not found] means I looked and found nothing usable.
- "My arithmetic" marks numbers I computed from the cited figures.

Limits of this pass. The shared web-search budget ran out partway through. After that I could only fetch pages whose URLs I already had. Raya, Jodel, recipe swipe apps, Spotify's official docs, Pinterest's official docs and Bumble's official data got little or no coverage. Those gaps are listed under open unknowns.

---

## 1. Tinder

### Mechanics, step by step

1. The deck is a stack of cards. Each card is one person: a photo plus a few profile fields. The patent describes users who "swipe through the stack of cards", where a right swipe means approval and a left swipe means disapproval. After the gesture the interface removes the card and shows the next one. A match exists only when both people have said yes. [primary] [US 9,733,811 B2](https://patents.google.com/patent/US9733811B2/en), filed 2013, issued Aug 2017.
2. Buttons sit under the card and do the same thing as the gestures. Super Like works by "swiping up, or simply tapping the new blue star icon". [primary] [Tinder press room, Sept 2015](https://www.tinderpressroom.com/updated-introducing-super-like-a-new-type-of-swipe)
3. A right swipe on someone who already liked you triggers the "It's a Match" screen. Hinge's CEO described it as "an on-screen celebration giving you the feeling that you've won" and compared the loop to a slot machine. [opinion, from a competitor] [Hinge essay on Medium, 2016](https://medium.com/@Hinge/swiping-for-love-in-all-the-wrong-places-21a681109505), quoted again in [TheWrap, Nov 2017](https://www.thewrap.com/hinge-dating-app-swipe-right-tinder-bumble/).
4. Undo is called Rewind, and it is a paid feature. [3p] [SwipeStats](https://www.swipestats.io/blog/bumble-swipe-left-or-right)
5. Card physics. Tinder has not published its drag thresholds, velocity rules or spring constants. [not found] Section 10 has Android's documented defaults for the same kind of interaction.

### Where the swipe came from

- Co-founder Jonathan Badeen said: "Using the buttons to move the cards felt clunky," and he "wanted more fluidity." The idea came from wiping a fogged mirror. [journalism] [CNBC, Jan 2017](https://www.cnbc.com/2017/01/06/how-a-tinder-founder-came-up-with-swiping-and-changed-dating-forever.html)
- "The early version of the app did not have the swipe right feature at all." The swipe "evolved over a six month period" of tinkering with the animation. Badeen pictured physical card piles: "yes, no and maybe." [journalism] [VentureBeat, Apr 2016](https://venturebeat.com/2016/04/04/why-swipe-right-wasnt-in-the-first-version-of-tinder/)
- In Match v. Bumble, Judge Albright wrote that the swipe was a commercial success because it "increased the speed of a user's navigation through potential matches". [journalism, quoting a court ruling] [Law.com, Dec 2018](https://www.law.com/texaslawyer/2018/12/20/judge-swipes-right-on-tinder-app-patents/), [Yahoo mirror](https://finance.yahoo.com/news/judge-swipes-tinder-app-patents-100341530.html)
- One critic argues that Tinder's design patents cover only "the two particular arrangements of cards of the shape shown", not the swipe animation. [opinion] [Patent Progress, Mar 2018](https://patentprogress.org/2018/03/courts-will-swipe-left-on-tinders-suit-against-bumble/)

### Usage data

- In 2014 the average user logged in 11 times a day. Women's sessions ran 8.5 minutes and men's 7.2 minutes. Men swiped right on 46% of profiles they saw, "almost three times more often" than women. [company-reported via NYT] [Engadget, Oct 2014](https://www.engadget.com/2014-10-29-tinder-user-stats.html), [NYT syndicated copy](https://www.timesunion.com/living/article/Tinder-taps-an-age-old-truth-5861531.php). By my arithmetic, 11 sessions at 7.2 to 8.5 minutes is 79 to 94 minutes a day. The widely repeated "90 minutes a day" is an upper estimate, not a measured average.
- In 2017: 1.4 billion swipes a day across 196 countries. [journalism] [CNBC](https://www.cnbc.com/2017/01/06/how-a-tinder-founder-came-up-with-swiping-and-changed-dating-forever.html) The team already has the Sept 2015 SEC figure (about 9.6M daily users). By my arithmetic, 1.4B / 9.6M is about 146 swipes per daily user per day.
- In a crawl of about 480k profiles, men's honeypot profiles matched 0.6% of the time and women's 10.5%. 21% of women's matches sent a message, against 7% of men's. Men's median time to first message was 2 minutes and women's 38 minutes. In the survey, 35% of men said they "casually like most profiles" and 0% of women did. [academic] [Tyson et al., ASONAM 2016](https://arxiv.org/html/1607.01952v1). The survey sample is small (131 people).

### Features that changed metrics

| Feature | What it did | Reported effect | Tag and source |
|---|---|---|---|
| Right-swipe limit (Mar 2015) | Algorithm caps likes in a 12-hour window. Unlimited likes moved to the paid Plus tier. | +25% matches per right swipe, +25% messages per match, spam bots down more than 50%, measured 10 days after launch | [company-reported] [TechCrunch, Mar 2015](https://techcrunch.com/2015/03/12/hate-it-or-love-it-tinders-right-swipe-limit-is-working) |
| Limit test (UK, Feb 2015) | 100 right swipes a day, then pay or wait 24 hours | none published | [journalism] [The Tab](https://thetab.com/2015/02/20/tinder-are-going-to-charge-you-to-swipe-right-and-some-might-fork-out-over-150-a-year-uk-root-30707) |
| Super Like (Sept 2015) | Swipe up or tap the star. 1 a day free, 5 a day on Plus, no rollover. The receiver sees a blue footer. | 3x more likely to match, conversations 70% longer | [company-reported] [Tinder press room](https://www.tinderpressroom.com/updated-introducing-super-like-a-new-type-of-swipe), [VentureBeat](https://venturebeat.com/2016/04/04/why-swipe-right-wasnt-in-the-first-version-of-tinder/) |
| Smart Photos (Oct 2016) | Tests which of your photos to lead with, per viewer | "up to 12%" more matches in testing | [company-reported] [Tinder press room](https://www.tinderpressroom.com/introducing-smart-photos-for-the-most-swipeworthy-you) |
| Top Picks (2018) | Curated daily set with short highlight tags. Refreshes every 24 hours. 1 free a day after the global launch, more for Gold. | "early success", no numbers | [primary] [Tinder press room](https://www.tinderpressroom.com/introducing-picks), [journalism] [Engadget, Sept 2018](https://www.engadget.com/2018-09-11-tinders-curated-top-picks-available-worldwide.html) |
| Swipe Night (Oct 2019) | Scheduled interactive story event | matches +26%, messages +12% against a typical weekend | [company-reported] [Tinder press room, Sept 2020](https://www.tinderpressroom.com/news?item=122478) |

Why the like limit matters for Outpost. Making "yes" scarce made each yes carry more information. Tinder's stated target was users who "only swipe right just to see who likes them back" ([TechCrunch](https://techcrunch.com/2015/03/12/hate-it-or-love-it-tinders-right-swipe-limit-is-working)).

---

## 2. Hinge

### Mechanics, step by step

1. In Oct 2016 Hinge dropped swiping. You no longer judge the whole person. You like or comment on one specific photo or prompt answer. [journalism] [NPR, Oct 2016](https://www.npr.org/sections/alltechconsidered/2016/10/11/497526528/can-dating-app-hinge-make-you-talk-not-swipe)
2. The like or comment arrives tied to that piece of content, so the receiver knows what caught the sender's eye.
3. Limits. In 2017 free users got 10 likes a day [journalism] ([TheWrap, Nov 2017](https://www.thewrap.com/hinge-dating-app-swipe-right-tinder-bumble/)). Standouts is a separate feed of top prompts and photos that refreshes daily. Liking a Standout costs a Rose, and members get 1 free Rose a week. [journalism] [Global Dating Insights](https://www.globaldatinginsights.com/news/hinge-reveals-standouts-and-roses/)
4. Most Compatible is one suggested pair per day, chosen with a Gale-Shapley-style stable matching. It shows to both people at once and disappears after 24 hours. [journalism] [The Hustle](https://thehustle.co/hinge-machine-learning-algorithm)
5. We Met. "A few days after you exchange phone numbers," Hinge asks each person privately whether they met, and whether the date was someone they'd want to see again. Answers feed the matching model. [journalism] [Engadget, Oct 2018](https://www.engadget.com/2018-10-16-hinge-we-met-first-date-ai.html), [Refinery29](https://www.refinery29.com/en-us/2018/10/214128/hinge-we-met-feature-dating-app). CEO Justin McLeod: "if you went on a date with someone and you thought they were great, that's the strongest signal" (quoted in the [Global Dating Insights](https://www.globaldatinginsights.com/news/we-met-gives-hinge-feedback-on-users-first-dates/) coverage).
6. Your Turn Limits (Sept 2024). Once 8 or more matches are waiting on your reply, you have to reply or end a chat before you can send new likes. [primary] [PR Newswire, May 2024](https://www.prnewswire.com/news-releases/hinge-tests-limiting-unanswered-messages-to-reduce-dating-burnout-302144187.html)

### Evidence

- Before the 2016 relaunch, "only one in 500 Hinge swipes led to a phone number exchange." [company-reported] [Mixpanel case study, 2018](https://mixpanel.com/blog/how-hinge-disrupted-online-dating/). The stated diagnosis was a "signal and noise problem": people liked to find out who liked them, not because they were interested.
- 2016 beta of the swipe-free app: 2x initial connections, 5x connections that became conversations, 7x phone number exchanges. [company-reported] [Dating Sites Reviews](https://www.datingsitesreviews.com/article.php?story=hinge-rebrands-and-relaunches-to-defeat-the--dating-apocalypse), [Nylon](https://www.nylon.com/articles/hinge-swipe-free-relaunch), [VentureBeat](https://venturebeat.com/technology/tinder-rival-hinge-ditches-swiping-relaunches-as-a-serious-relationship-app-at-7-per-month)
- One year later, McLeod said only "one in 500" conversations opened with a plain "hey." [company-reported] [TheWrap](https://www.thewrap.com/hinge-dating-app-swipe-right-tinder-bumble/)
- "Likes sent with a comment are twice as likely to lead to a date." 72% of surveyed daters are more likely to consider someone when the like includes a message. [company-reported, primary] [Hinge newsroom, Dec 2025](https://hinge.co/newsroom/convo-starters)
- "In 2024, likes on text prompts were 47% more likely to lead to a date than likes on photos." [company-reported, primary] [Hinge newsroom, Jan 2025](https://hinge.co/newsroom/prompt-feedback). Several blogs misquote this as a figure for comments. It compares prompt likes with photo likes.
- Most Compatible was "8x more likely to result in dates" in trials. The baseline is not stated. [company-reported] [The Hustle](https://thehustle.co/hinge-machine-learning-algorithm)
- We Met beta: 90% said the first date was great and 72% wanted a second. [company-reported] [Engadget](https://www.engadget.com/2018-10-16-hinge-we-met-first-date-ai.html). These are self-reports from people who chose to answer, so expect selection bias.
- The "Your Turn" reminder cut stalemated chats by 13%. A redesign raised new-user retention by 20%, with no time frame given. [company-reported] [Mixpanel](https://mixpanel.com/blog/how-hinge-disrupted-online-dating/)
- Your Turn Limits raised responsiveness by 20% in testing. 48% of surveyed users said it helped them focus on "quality over quantity." [company-reported] [Yahoo/Mashable, Sept 2024](https://www.yahoo.com/lifestyle/hinge-adds-limit-unanswered-messages-120000786.html). Matches where the first message got a reply within 24 hours were 72% more likely to lead to a date. [company-reported] [PR Newswire](https://www.prnewswire.com/news-releases/hinge-tests-limiting-unanswered-messages-to-reduce-dating-burnout-302144187.html)
- Does the X (remove) button on Hinge ask why? [not found]

What Hinge shows. Feedback attached to a specific part of the content carries more signal than a whole-item yes or no. Hinge also closed the loop by asking about the real-world outcome days later, and it fed those answers back into the model.

---

## 3. Bumble

1. Swipe deck like Tinder's. When a man and a woman match, the woman has 24 hours to send the first message or the match expires. Extend adds 24 hours once per match. [3p] [SwipeStats](https://www.swipestats.io/blog/bumble-swipe-left-or-right), [The Match Artist](https://thematchartist.com/bumble/how-does-bumble-work)
2. Backtrack (undo) is paid, works only on left swipes, and only right after the swipe. [3p] [roast.dating](https://roast.dating/blog/bumble-swipe-left-right), [SwipeStats](https://www.swipestats.io/blog/bumble-swipe-left-or-right)
3. Free users get roughly 25 to 50 right swipes a day. [3p] [SwipeStats](https://www.swipestats.io/blog/bumble-swipe-left-or-right)
4. Official metrics on the 24-hour timer or Backtrack. [not found]

---

## 4. Coffee Meets Bagel

1. Launched in 2012 with one match per day, delivered at noon. Only the two matched people see each other for 24 hours. [journalism] [TechCrunch, Sept 2012](https://techcrunch.com/2012/09/26/daily-dating-site-coffee-meets-bagel-lands-600k-from-lightbank-match-com-co-founder/)
2. CEO Arum Kang: "We don't inundate our members with low quality matches," and the work on the member's part is "a minute per day." [journalism] [StartUp Beat, Oct 2012](https://startupbeat.com/qa-with-coffee-meets-bagel-co-founder-and-ceo-id3011/2675/)
3. 70% of users checked for matches every day. The service grew 50% month over month and made over 100,000 introductions, which led to 6,000 connections. [company-reported] [TechCrunch, Sept 2012](https://techcrunch.com/2012/09/26/daily-dating-site-coffee-meets-bagel-lands-600k-from-lightbank-match-com-co-founder/). By my arithmetic that is a 6% connection rate.
4. The app later moved to a small curated batch instead of a single match. [3p] [growthscribe](https://growthscribe.com/coffee-meets-bagel-worth/). Retention data for the later model. [not found]

What CMB shows. A fixed daily drop gives people a reason to open the app on a schedule. The 70% daily-check figure is the strongest number in this set for a scheduled drop. It is company-reported, from a small early user base, and CMB used notifications, which Outpost will not have.

---

## 5. Raya, Jodel, and swipe shopping or recipe apps

- Raya card UX and metrics. [not found] It is invite-only and publishes little.
- Jodel swipe data. [not found]
- Recipe swipe apps. [not found]
- Shopping. Stylect, a "Tinder for fashion" app, said about 1.5% of users had made a purchase and the average session ran about 7 minutes. [company-reported] [Fashionista, May 2014](https://fashionista.com/2014/05/tinder-for-fashion-apps). An agency claimed swipe shopping plus a tuned checkout gives "conversion rates three to five times higher than typical mobile site benchmarks." [opinion] [Digiday](https://digiday.com/marketing/swipe-right-buy-e-commerce-apps-take-design-cues-tinder/). Neither has a method behind it.

---

## 6. Non-dating swipe: Zooniverse and Galaxy Zoo

1. The Zooniverse mobile app reduces each task to one binary question. You swipe left or right for Yes/No or A/B. Multi-image subjects scroll vertically. [primary] [Zooniverse blog, mobile tag](https://blog.zooniverse.org/tag/mobile/)
2. Speed and accuracy. Yes/No classifications took "1 second (on the mobile swipe app) to 3 seconds, while Survey classifications took 8-10 seconds." Four Yes/No questions took half the time of one survey workflow. Aggregated answers agreed with the expert 95 to 99% of the time. [primary] [Zooniverse, Sept 2017](https://daily.zooniverse.org/2017/09/11/keeping-it-simple/)
3. Share of work. From July 15, 2019, over 30% of classifications came through the mobile app. In 2020 it was 6.2M of 86.7M (7%). [primary] [Zooniverse blog](https://blog.zooniverse.org/tag/mobile/)
4. A Galaxy Zoo lens-finding workflow retired each image after 10 binary votes. [academic] [arXiv 2509.22311](https://arxiv.org/pdf/2509.22311)

What Zooniverse shows. Splitting a hard judgment into a binary swipe, then asking finer questions only where needed, kept accuracy high and cut time per item about 3 to 8 times (my arithmetic from 1 to 3 s against 8 to 10 s).

---

## 7. Swipe vs scroll vs tap: academic evidence

- Dou and Sundar (2016), N = 252. Adding horizontal swiping to a mobile site "positively affected behavioral intentions to use the website," and "perceived enjoyment was a key variable that explained this effect." [academic] [Penn State record](https://pure.psu.edu/en/publications/power-of-the-swipe-why-mobile-websites-should-add-horizontal-swip/)
- Choi, Kirshner and Wu (2016). In a shopping app, swiping produced more cognitive absorption and playfulness than scrolling. Absorption raised reuse intention and task performance. [academic] [Springer, HCI in Business 2016](https://link.springer.com/chapter/10.1007/978-3-319-39396-4_16)
- Sundar's warning: with swiping, users "may not absorb the content, they may not elaborate on the content that is there, but they're very much hooked on the action." [opinion, researcher quote] [Built In](https://builtin.com/articles/tinder-swipe-design)
- Bragdon et al. (CHI 2011), 15 participants. Gestures matched soft buttons when users looked at the phone and beat them under distraction. Bezel marks against soft buttons:

| Condition | Bezel gesture | Soft button | Gesture faster by (my arithmetic) |
|---|---|---|---|
| Looking at phone | 1022 ms | 1097 ms | 6.8%, not significant |
| Indirect attention | 1102 ms | 1271 ms | 13.3% |
| Walking | 1134 ms | 1286 ms | 11.8% |
| Attention-saturating task | 1112 ms | 1321 ms | 15.8% |

[academic] [Bragdon et al., CHI 2011](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/11/Mobile-Touch-Gestures-CHI-2011.pdf). Caveat: these were bezel-initiated mark gestures, not card swipes. The direction carries over. The exact numbers do not.

---

## 8. Choice overload and swipe fatigue

- Pronk and Denissen (2020), three studies with N = 315, 158 and 305. People "immediately started to reject more hypothetical and actual partners when dating online, cumulating on average in a decrease of 27% in chance on acceptance from the first to the last partner option." The drop came with falling satisfaction with the pictures and with lower perceived dating success. For women it also meant fewer matches. [academic] [Tilburg University record](https://research.tilburguniversity.edu/en/publications/a-rejection-mind-set-choice-overload-in-online-dating/), sample sizes from [PsyPost](https://www.psypost.org/new-research-shows-online-dating-can-cultivate-a-rejection-mindset/). Study 1 showed 45 or 90 pictures and Study 3 showed 50.
- A secondary summary of Study 2, which used real, available people, says the rejection rate held steady up to about 30 choices and then dropped faster. [academic, via secondary summary, not checked against the full text] [SAGE](https://journals.sagepub.com/doi/10.1177/1948550619866189)
- Pronk's own advice is "a maximum of five profiles" per session. She cites an outside figure of about 140 profiles per typical Tinder session. [opinion, researcher blog] [SPSP](https://spsp.org/news-center/character-context-blog/why-online-dating-heaven-and-hell)
- D'Angelo and Toma (2017). Daters who picked from 24 options were less satisfied a week later than those who picked from 6, and more likely to change their pick. Those who had a big set and could reverse their choice were the least satisfied. [academic] [author PDF](https://catalinatoma.weebly.com/uploads/8/4/8/5/84856566/dangelotoma_in_press__--_there_are_plenty_of_fish_in_the_sea.pdf)
- Hinge, from a competitor's point of view: users "spend twice as much time swiping as they do messaging." [company opinion] [Hinge essay](https://medium.com/@Hinge/swiping-for-love-in-all-the-wrong-places-21a681109505)

---

## 9. Thumb reach and touch accuracy

- Hoober (2013) logged 1,333 observations of people using phones in public. Among the 780 who were touching the screen, 49% held the phone in one hand, 36% cradled it and tapped with the other hand, and 15% used two hands. In one-handed use, the right thumb was on the screen 67% of the time and the left 33%. People "change the way they're holding their phone very often, sometimes every few seconds." [opinion, field observation] [UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)
- Touch accuracy by region: 7 mm at the center, 9 mm along the edges, 12 mm in the corners. People "view and touch the center of the screen the most, the fastest, and the most accurately." Hoober calls the usual bottom thumb-sweep chart wrong. [opinion, built on large touch logs] [4ourth Mobile](https://www.4ourthmobile.com/publications/designing-for-touch), [UXmatters 2017](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)
- The thumb's reachable area on the holding hand forms a parabola set by hand size and grip. The model was fit on 20 participants. [academic] [Bergstrom-Lehtovirta and Oulasvirta, CHI 2014](http://www.netlab.tkk.fi/~oulasvir/pubs/paper2117.pdf)
- An often-repeated claim that "75% of interactions are thumb-driven" does not appear in Hoober's 2013 article. [not found]

---

## 10. Gesture discoverability and card physics

- NN/g: "Lack of signifiers makes it unclear where the contextual swipe can be used." Users who know the gesture "may occasionally forget to perform it in the absence of any visible cues." Accidental swipes happen, so "always ask for confirmation or provide an easy way to undo the swipe," and make undo "highly salient on the screen." [opinion, usability practice, no numbers] [NN/g, Feb 2017](https://www.nngroup.com/articles/contextual-swipe/)
- Android's swipe-to-dismiss defaults. The view must travel at least half the container width ("Default value is .5f"), or a fling must pass a minimum escape velocity. A swipe only counts when velocity in its direction is larger than the perpendicular velocity. Otherwise "user's movement is ambiguous." [primary] [Android ItemTouchHelper.Callback](https://developer.android.com/reference/androidx/recyclerview/widget/ItemTouchHelper.Callback)
- Tinder's own thresholds, rotation angles and spring values. [not found]

---

## 11. Netflix: stars to thumbs

1. Until April 2017 Netflix asked for 1 to 5 stars. It replaced them with thumbs up or down and a personal "% Match." [primary] [About Netflix](https://about.netflix.com/en/news/goodbye-stars-hello-thumbs)
2. "When we tested replacing stars with thumbs we saw an astounding 200% increase in ratings activity." [company-reported, primary] [About Netflix](https://about.netflix.com/en/news/goodbye-stars-hello-thumbs). The test ran in 2016 with "hundreds of thousands" of members. [journalism] [TechCrunch, Mar 2017](https://techcrunch.com/2017/03/16/netflix-is-replacing-five-star-ratings-with-thumbs-up-or-down/)
3. The stated reason: members treated stars as a public review score. Thumbs read as "teaching the system" about your taste. People gave documentaries 5 stars and silly movies 3, yet watched the silly movies more. [primary] [About Netflix](https://about.netflix.com/en/news/goodbye-stars-hello-thumbs), [journalism] [MacRumors](https://www.macrumors.com/2017/03/17/netflix-star-ratings-thumbs-up-down/)
4. Later "two thumbs up" option. I could not load a primary page for it. [not found]

What Netflix shows. Going from five choices to two tripled rating volume (a 200% increase), and the input was framed as teaching the system rather than reviewing the title. Outpost's swipe already has both properties.

---

## 12. YouTube: "Not interested", "Tell us why" and surveys

### Mechanics

1. On Home and Watch Next, the menu has "Not interested" and "Don't recommend channel." For videos, "Tell us why" offers "I've already watched the video" or "I don't like the video." On TV the same menu also lists "Don't recommend channel." [primary] [YouTube Help](https://support.google.com/youtube/answer/6342839)
2. Surveys. Viewers rate videos from 1 to 5 stars. A rating of 1 or 2 stars prompts a "why" follow-up, and so does a rating of 4 or 5. Only 4- and 5-star videos count as "valued watchtime." Because most people never answer, YouTube trains a model on the answers it does get to predict what everyone else would say. [primary] [YouTube blog, Sept 2021](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)

### Evidence

- "Although explicit feedback mechanisms exist on YouTube (thumbs up/down, in-product surveys, etc.) we use the implicit feedback of watches... based on the orders of magnitude more implicit user history available." [primary, Google paper] [Covington et al., RecSys 2016](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/45530.pdf)
- Mozilla, Sept 2022. 22,722 people contributed 567,880,195 recommendations. Each participant was randomly assigned to one of the four YouTube controls or to a control group with no signal. Share of unwanted look-alike recommendations prevented:

| Control | Prevented |
|---|---|
| Don't recommend channel | about 43% |
| Remove from watch history | about 29% |
| Dislike | about 12% |
| Not interested | about 11% |

[3p, independent randomized audit by Mozilla Foundation with University of Exeter researchers] [Mozilla report PDF](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf). The control group's bad-recommendation rate was about 2.3%. Mozilla's reading is that controls which read as instructions ("don't recommend channel") beat controls which read as vague preferences ("not interested").
- Mozilla survey, n = 2,161 who used the controls. 39.3% felt their recommendations did not change at all, 27.6% said they did, 23.0% saw mixed results and 10.0% didn't know. [same source]. Selection bias applies, since participants installed a tool built to report regrets.

---

## 13. TikTok, Spotify, Pinterest, Facebook

- TikTok. Long-press, then "Not interested." People "won't be shown similar content." Manage Topics lets users "dial up, or down" a topic, and keyword filters take up to 200 words. [primary] [TikTok newsroom, June 2025](https://newsroom.tiktok.com/tiktoks-new-features-to-help-you-control-your-scroll?lang=en-AU). Refresh resets the For You feed "as if they just signed up." [primary] [TikTok newsroom](https://newsroom.tiktok.com/en-us/introducing-a-way-to-refresh-your-for-you-feed-on-tiktok-us). The current reason menu after "Not interested" is not documented in these posts. [not found]
- Spotify. Official docs for "Hide song," "Exclude from your taste profile" and DJ voice requests. [not found], because the URLs I tried returned 404. Academic evidence on skips: in Pandora data, learned embeddings for skips were much closer to thumbs-down (cosine 0.82) than to thumbs-up (0.16). [academic] [arXiv 2406.04488](https://arxiv.org/abs/2406.04488)
- Pinterest. The pin menu has "See fewer" or "Not interested." There is also a "see fewer" control for AI-generated content. [3p] [Online Tech Tips](https://www.online-tech-tips.com/see-fewer-ai-generated-pins-pinterest/). Pinterest's PinnerFormer paper chose not to use explicit negatives such as hides in its loss. [academic] [arXiv 2205.04507](https://arxiv.org/abs/2205.04507). Official data on reason menus. [not found]
- Facebook. Surveys ask whether posts were "worth their time," and the answers inform ranking. From 2020, surveys were combined with hides and reports to "predict which pieces of content they're unlikely to want to see." [primary] [Meta newsroom](https://about.fb.com/news/2019/05/more-personalized-experiences/). No response rates were published.
- Amazon "not interested" data. [not found]

---

## 14. Implicit vs explicit feedback in recommenders

- Explicit feedback is scarce. Yahoo: "users rarely provide explicit ratings or direct feedback (such as 'like' or 'dislike')... explicit user ratings are too sparse to be usable." Training on dwell time beat training on clicks offline (NDCG@10 rose from 0.5680 with click as target to 0.5793 with dwell as target and 0.5820 with dwell as weight). In live tests the dwell-time bucket beat the click bucket on engagement and on CTR. [academic, Yahoo] [Yi et al., RecSys 2014 best paper](https://www.hongliangjie.com/publications/recsys2014.pdf)
- Explicit negatives still matter, as long as the model trains on them. Google ran live tests on a short-form platform "serving billions of users." [academic, Google] [Wang et al., RecSys 2023](https://arxiv.org/abs/2308.12256)
  - Training on dislikes (as labels plus input) cut the dislike rate by 2.44%. Using dislikes only as an input feature gave -0.34% (not significant). Filtering disliked items out of the input gave -0.84%.
  - Repeat dislikes of the same creator fell 9.60%.
  - In simulation, a dislike reduced similar recommendations by 22.7% when used only as input, and by 60.8% when also used as a training label.
  - Skips were used as dense implicit negatives on the immersive feed. Enjoyment rose 0.40%, daily users with at least 1 hour of activity rose 0.61%, and repeat skips of the same creator fell 1.44%.
  - "The implicit skip signal has a much higher density than explicit dislikes."
- Pinterest. A penalty for shallow close-ups (an implicit negative) improved sessions and time spent. Retention fell for non-core users, though, which shows that negative signals can hurt some segments. [academic] [arXiv 2607.14192](https://arxiv.org/pdf/2607.14192)

What this means. Use implicit signals (watch time, time to swipe, 2x use, rewatches) for volume, and explicit reasons for direction. Explicit negatives only pay off when the model actually trains on them and the user can see the change.

---

## 15. Feedback friction: closed vs open vs voice

- Open vs closed. In Pew's panel, item nonresponse on open-ended questions averaged "around 18%," with a range of 3% to just over 50%. Closed-ended questions averaged 1 to 2%. Multi-sentence prompts had an 18% median and one-word prompts 13%. Medium- and high-burden prompts had 2x and 3x the median nonresponse of low-burden ones. Nonresponse was higher on mobile than on desktop. The analysis covered 92 open questions from 2018 to 2021. [primary, research org] [Pew Research, Oct 2021](https://www.pewresearch.org/decoded/2021/10/14/why-do-some-open-ended-survey-questions-result-in-higher-item-nonresponse-rates-than-others/). By my arithmetic, typing costs roughly 9 to 18 times more skipped answers than picking.
- Length. In about 100,000 surveys, the first question took about 75 s. Later questions took 30 s, then 25 s, then 19 s each as surveys got longer, so people rushed. Abandonment rose for surveys longer than 7 to 8 minutes. [3p] [SurveyMonkey](https://www.surveymonkey.com/curiosity/survey_completion_times/). Across 25,080 web surveys, completion fell as length and question difficulty rose. [academic] [Liu and Wronski, SSCR 2018](https://doi.org/10.1177/0894439317695581). Per-tap or per-question decay curves for in-app micro-feedback. [not found]
- Voice vs text, response rate. In a 2025/26 US experiment, 47% of respondents in the voice condition answered each open question, against 99% in the text condition. Most break-offs came from the voice group (204 of 246). Spoken answers were longer, by about 2 to 4 words on 5 of 9 items, and slightly more informative by entropy. [academic] [JSSAM](https://academic.oup.com/jssam/advance-article/doi/10.1093/jssam/smag030/8812674)
- Voice willingness. About 40% (39.7%) of a German online panel (N = 2,146) would answer by voice. Top reasons for refusing: no stated reason (18.5%), preferring to write (15.1%), other people nearby (7.7%), privacy (7.7%), too much effort (6.4%). In a probability panel only about 16% agreed to voice. [academic] [Lenzner and Höhne, IJMR 2022](https://jkhoehne.eu/wp-content/uploads/2025/08/lenzner-hoehne-2022-who-is-willing-to-use-audio-and-voice-inputs-in-smartphone-surveys-and-why.pdf)
- Recording vs dictation. Audio recording "led to substantially higher nonresponse." Keyboard dictation led to only "slightly higher nonresponse" than typing. Completion time dropped with voice. [academic] [Revilla et al., SSCR 2020](https://journals.sagepub.com/doi/abs/10.1177/0894439318810715). Voice answers to sensitive questions were "more than twice as long" as typed ones. [academic] [Höhne et al., SSCR 2024](https://journals.sagepub.com/doi/full/10.1177/08944393231160961)

---

## What carries over to Outpost

Outpost differs from dating in three ways that shape every rule below.

1. The user is judging their own agents' work. A reject is not a dead end. It is a production instruction. The value of a reason is high because each bad video costs compute and the user's time.
2. "Approve" publishes to TikTok, Shorts and Reels. It has public consequences, unlike a like.
3. The payoff (views, sales) arrives hours or days later, and there are no push notifications.

Each rule says how strong its evidence is. "Inference" means I am carrying a finding across domains. Treat those as hypotheses to A/B test.

### The swipe card

1. **Binary decision first, everything else optional.** Right means post, left means reject. The decision completes on release, with nothing else required. Evidence: Netflix's two-option thumbs got 200% more ratings than five stars ([primary](https://about.netflix.com/en/news/goodbye-stars-hello-thumbs)). Zooniverse binary swipes took 1 to 3 s against 8 to 10 s for multi-question forms, with 95 to 99% agreement ([primary](https://daily.zooniverse.org/2017/09/11/keeping-it-simple/)). Strength: good.
2. **Gesture plus two visible buttons.** Put approve and reject buttons in the lower-middle band, away from the corners. Evidence: hidden gestures get missed or forgotten ([NN/g](https://www.nngroup.com/articles/contextual-swipe/)). Tinder kept buttons and gave Super Like both a swipe and a tap ([primary](https://www.tinderpressroom.com/updated-introducing-super-like-a-new-type-of-swipe)). Gestures equal buttons when users focus and beat them by 12 to 16% when distracted ([academic](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/11/Mobile-Touch-Gestures-CHI-2011.pdf)). Touch accuracy needs 12 mm targets in corners against 7 mm in the center ([Hoober](https://www.4ourthmobile.com/publications/designing-for-touch)). One-handed use is 49% of touching users, and a third of that is left-thumb, so keep the buttons symmetric ([Hoober 2013](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)). Strength: good.
3. **Commit rule.** The card follows the finger. It commits when released past about 50% of screen width, or on a fast fling. Otherwise it springs back. Lock to horizontal only when horizontal velocity beats vertical. Evidence: Android's documented defaults ([primary](https://developer.android.com/reference/androidx/recyclerview/widget/ItemTouchHelper.Callback)). Tinder's real values are [not found], so tune by test. Fade in a "POST" or "REJECT" label as the card moves so the user sees the outcome before letting go. That label is inference, with no data found.
4. **Hold-to-2x and drag must not collide.** A finger that stays still past a short delay means hold. A finger that moves sideways past a small slop distance means drag. Evidence: none found specific to this. It follows from the direction-lock rule above. Inference.
5. **Free, short undo for approve.** Approve moves the video to a "posting in N seconds" state with a large undo, and it actually publishes after the window or on the next decision. Evidence: swipes are easy to trigger by accident, so undo must be salient ([NN/g](https://www.nngroup.com/articles/contextual-swipe/)). Tinder and Bumble charge for undo ([3p](https://www.swipestats.io/blog/bumble-swipe-left-or-right)), but their cost of a mistake is a missed match, not a public post. Keep the window short. Daters with big choice sets and the ability to reverse were the least satisfied a week later ([academic](https://catalinatoma.weebly.com/uploads/8/4/8/5/84856566/dangelotoma_in_press__--_there_are_plenty_of_fish_in_the_sea.pdf)). Strength: medium.
6. **Guard against approve-without-watching.** Swiping can make people "hooked on the action" without absorbing content ([Sundar quote](https://builtin.com/articles/tinder-swipe-design)). Tinder made right swipes scarce because indiscriminate liking hurt quality, and matches per right swipe rose 25% ([company-reported](https://techcrunch.com/2015/03/12/hate-it-or-love-it-tinders-right-swipe-limit-is-working)). For Outpost, log time-on-card before approve. If approvals regularly come in under the hook length, show a one-time nudge rather than a hard block. Inference.
7. **One scarce strong-positive gesture.** Swipe up means "post this and make more like it." Limit it to one or a few per day. Evidence: Super Like (1 a day free) came with 3x match rates and 70% longer conversations ([company-reported](https://www.tinderpressroom.com/updated-introducing-super-like-a-new-type-of-swipe)). Hinge Roses are 1 free a week ([journalism](https://www.globaldatinginsights.com/news/hinge-reveals-standouts-and-roses/)). In Outpost the receiver is the memory layer, so scarcity keeps the signal strong. Inference.

### The payoff moment

1. **Two payoffs, kept separate.** On approve, give an instant, honest confirmation: the card flies into a "queued for TikTok, Shorts, Reels" tray. Don't stage a fake celebration, because the outcome is unknown at swipe time. Evidence: Tinder's match screen celebrates a real event, mutual interest ([Hinge's description](https://medium.com/@Hinge/swiping-for-love-in-all-the-wrong-places-21a681109505)). Inference.
2. **Results arrive as a daily drop, shown first on open.** The order is "Since you left" (views and sales on past approvals), then today's batch. Keep it on a fixed schedule so the user learns when to come back. Evidence: CMB's noon drop came with 70% of users checking daily ([company-reported](https://techcrunch.com/2012/09/26/daily-dating-site-coffee-meets-bagel-lands-600k-from-lightbank-match-com-co-founder/)). Tinder Top Picks refreshes every 24 hours ([primary](https://www.tinderpressroom.com/introducing-picks)), Hinge Standouts refreshes daily ([journalism](https://www.globaldatinginsights.com/news/hinge-reveals-standouts-and-roses/)), and Most Compatible expires after 24 hours ([journalism](https://thehustle.co/hinge-machine-learning-algorithm)). A scheduled event (Swipe Night) lifted matches 26% ([company-reported](https://www.tinderpressroom.com/news?item=122478)). Caveat: all of these apps also used notifications. Outpost has none, so the drop must be worth opening on its own. Unknown.
3. **Close the loop the way Hinge's We Met does.** When results come in, ask one question about a winner or a flop ("This hit 40k views. More like it?"). Evidence: Hinge asks a few days after the real-world outcome and calls that the "strongest signal" ([journalism](https://www.engadget.com/2018-10-16-hinge-we-met-first-date-ai.html)). YouTube asks "why" on high ratings as well as low ones ([primary](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)). Strength: medium.
4. **Show that feedback changed something.** Label the next relevant video, for example "Shorter hook, from your note yesterday." Evidence: 39.3% of YouTube control users felt nothing changed ([Mozilla](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf)). Google cut similar recommendations after a dislike by 60.8% only when the dislike was a training label, against 22.7% as an input feature only ([academic](https://arxiv.org/abs/2308.12256)). Strength: good for "make feedback actually train the model". Inference for "show it."

### Daily limits

1. **Small daily batch with a clear end.** Start with about 5 to 12 videos per drop and a hard ceiling well under 30, then a "done for today" screen that previews when results land. Evidence: acceptance fell 27% from first to last option, and in one study rejection held steady to about 30 choices before falling faster ([academic](https://research.tilburguniversity.edu/en/publications/a-rejection-mind-set-choice-overload-in-online-dating/)). The same researcher advises at most 5 profiles a session ([opinion](https://spsp.org/news-center/character-context-blog/why-online-dating-heaven-and-hell)). Choosing from 6 beat choosing from 24 on later satisfaction ([academic](https://catalinatoma.weebly.com/uploads/8/4/8/5/84856566/dangelotoma_in_press__--_there_are_plenty_of_fish_in_the_sea.pdf)). CMB launched with 1 a day and Hinge gave 10 free likes a day ([journalism](https://www.thewrap.com/hinge-dating-app-swipe-right-tinder-bumble/)). The exact number for self-made videos is unknown, so test 5 against 10 against 15.
2. **Discount late-session rejections in memory.** If the reject rate climbs across a session, weight later rejections lower, or confirm them before they shape taste. Evidence: the rejection mind-set builds within a session ([academic](https://research.tilburguniversity.edu/en/publications/a-rejection-mind-set-choice-overload-in-online-dating/)). Inference.
3. **Cap the unreviewed backlog.** If more than N videos wait for a decision, agents pause new videos of that type and work on non-video tasks. Evidence: Hinge's 8-unanswered cap raised responsiveness 20% ([company-reported](https://www.yahoo.com/lifestyle/hinge-adds-limit-unanswered-messages-120000786.html)). Inference.
4. **Use limits to raise quality, not to sell upgrades.** Tinder's like cap raised matches per swipe 25% and messages per match 25% ([company-reported](https://techcrunch.com/2015/03/12/hate-it-or-love-it-tinders-right-swipe-limit-is-working)). Outpost's limit also controls posting volume on the user's real accounts.

### The left-swipe "why" flow

1. **The reject completes on swipe. The reason is a bonus.** Never block the next video. Show reason chips over the bottom of the next card for a few seconds, then auto-dismiss. Evidence: closed questions get 1 to 2% nonresponse against about 18% for open ones, and nonresponse is higher on mobile ([Pew](https://www.pewresearch.org/decoded/2021/10/14/why-do-some-open-ended-survey-questions-result-in-higher-item-nonresponse-rates-than-others/)). Longer surveys lose completions ([academic](https://doi.org/10.1177/0894439317695581)). The auto-dismiss timing is inference.
2. **Four to six chips, written as instructions to the agents.** Examples: "Hook too slow," "Wrong product," "Voice sounds fake," "Caption off," "Not my brand," "Seen this already." Evidence: on YouTube, controls that read as instructions prevented 29 to 43% of unwanted look-alikes, against 11 to 12% for vague ones ([Mozilla](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf)). YouTube's own "Tell us why" offers 2 or 3 concrete options ([primary](https://support.google.com/youtube/answer/6342839)). The best chip count is [not found], so 4 to 6 is inference. Rank chips by what the memory layer is least sure about.
3. **Anchor the reason to the moment.** Record the playback position at the swipe. Let chips refer to it ("Lost me at 0:03"), and allow a tap on the scrubber to mark a spot. Evidence: Hinge feedback tied to one piece of content beat whole-profile swipes (5x more conversations in beta). Comments on a specific item were 2x as likely to lead to a date ([company-reported](https://hinge.co/newsroom/convo-starters)). Transfer to video is inference.
4. **Typing and voice are second-level, behind a "Say more" chip.** Use hold-to-talk with on-device transcription shown as editable text, and keep a keyboard fallback. Don't make voice the default. Evidence: voice gave longer, slightly more informative answers, but only 47% answered against 99% for text ([academic](https://academic.oup.com/jssam/advance-article/doi/10.1093/jssam/smag030/8812674)). About 40% of a panel would use voice at all, and "other people around" and privacy were top reasons to refuse ([academic](https://jkhoehne.eu/wp-content/uploads/2025/08/lenzner-hoehne-2022-who-is-willing-to-use-audio-and-voice-inputs-in-smartphone-surveys-and-why.pdf)). Dictation lost far fewer answers than audio recording ([academic](https://journals.sagepub.com/doi/abs/10.1177/0894439318810715)). Strength: good.
5. **When to ask, and when not to.**
   - Ask on the first few rejects of a session, then taper, for example to every third reject. The taper rate is inference, since no source gave a per-ask decay curve for in-app micro-feedback. [not found]
   - Skip the ask when implicit signals already explain the reject. A swipe in the first second points to the hook, so pre-fill that guess and show "Hook?" as a one-tap confirm. Evidence: implicit signals are orders of magnitude denser ([YouTube paper](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/45530.pdf)). Skips behave like thumbs-down in learned embeddings ([academic](https://arxiv.org/abs/2406.04488)). YouTube predicts what non-responders would say instead of asking everyone ([primary](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)).
   - Ask more when the memory layer's prediction is uncertain, or when the same reject pattern repeats. Inference.
   - Also ask on approvals now and then, and on post-results winners. Evidence: YouTube asks why on 4- and 5-star ratings ([primary](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)). Hinge asks after real outcomes ([journalism](https://www.engadget.com/2018-10-16-hinge-we-met-first-date-ai.html)).
6. **Make rejections train the model and show it.** Store reasons as negative labels that the generation and ranking steps actually use, not only as context notes. Evidence: the gap between 22.7% and 60.8% response in Google's test ([academic](https://arxiv.org/abs/2308.12256)), and the 39.3% of YouTube control users who saw no change ([Mozilla](https://assets.mofoprod.net/network/documents/Mozilla-Report-YouTube-User-Controls.pdf)).

### What to log from day one

Log these so the team can check the rules above against its own data:

- time on card before each decision
- whether 2x was used, and at what playback position the swipe happened
- reject rate by position within the session
- chip tap rate, and which chip
- "Say more" use, split by voice and typing
- undo rate
- share of approvals made before the hook finished
- next-day return rate by batch size

---

## Open unknowns

1. Batch size for judging your own AI videos. All overload data comes from dating, where the options are people. Self-made content may tire people faster or slower.
2. Whether a scheduled results drop brings people back without push. CMB, Tinder and Hinge all had notifications. I found no data on drop-based retention in apps with no push.
3. Reason-chip count and taper rate. I found no study of how response falls with each extra tap or each repeat ask inside an app, as opposed to in surveys.
4. Voice feedback inside a consumer app. All voice data here comes from survey research. In-app voice feedback rates. [not found]
5. Tinder's card physics: thresholds, rotation, spring and velocity values. [not found]
6. Raya, Jodel, recipe swipe apps, Bumble official metrics, Spotify official docs (Hide, taste-profile exclusion, DJ voice requests), Pinterest reason menus, Amazon "not interested." Not found, or not reached before the search budget ran out.
7. Most company figures here (Super Like 3x, Hinge 2x and 47%, Most Compatible 8x, CMB 70%, Tinder like limit +25%) lack baselines and confidence intervals. They show direction, not effect size.
8. Pronk's "stable to about 30 choices" detail comes from a secondary summary. Check it against the full paper before quoting it as a hard threshold.
9. Whether public consequences change swipe behavior. In dating a right swipe is private. In Outpost it publishes. That could slow decisions and raise undo use. No data found.
