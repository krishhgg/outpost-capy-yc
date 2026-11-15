# Outpost: Project Brief
Canonical product direction from Charlie. Change it only on Charlie's word.

## Context
- Built at YC Consumer Mobile Hackathon, SF, Sun Nov 15 2026. Theme: consumer mobile app people open every day. ~180 builders. Winner gets YC interview.
- Sponsors: Whop (core to product), Convex, Capy, Revyl, Candle, Kakai (iMessage agents).
- Team: 2 (Charlie + partner).

## One-liner
Get paid for your taste. Swipe through AI-made short videos built for real paid brand bounties (Whop Content Rewards); approve, tweak, or kill; approved clips post to your account and earn per view. "Mercor for ads."

## Pitch
- Taste/judgment = one of your most valuable assets, the thing AI can't do for you. You give it away free for hours daily (likes, shares, reposts) training Instagram's algorithm; Instagram keeps the money.
- Outpost flips it: same swiping habit, but your picks get posted and earn. AI does all production; you're the director.
- Anti-slop line: "Nothing posts unless a human with taste chose it. We're not adding to the flood, we're filtering it."
- Closing hook: "Every day you train Instagram's algorithm for free. We let your taste work for you."

## Whop Content Rewards (the bounty source)
- Whop: marketplace for digital products. Content Rewards = largest clipping marketplace. Public board: whop.com/contentrewards. ~719 live campaigns (Oct 2026), $40k+/day paid out, ~1M videos/mo.
- Campaign = brand/creator/streamer funds budget, sets $ per 1K views, rules, allowed platforms (TikTok, Reels, Shorts, X), usually provides source footage (YouTube channel, Drive). Types: per-view (vast majority), per-post, pool, retainer. UGC campaigns pay higher.
- Examples seen live: Lovable Clipping $1/1K, Rolling Loud Movie Clipping $1.25/1K, Coinbase x Valorant $1.50/1K.
- Anyone can join; no follower minimum. Clipper posts publicly, submits post URL.
- Review: checked against rules; auto-approved after 48h unless rejected. Botting = ban.
- Payout: $0.20 to $6 per 1K views (avg ~$1). Only after campaign's min view threshold; capped at per-clip max; until budget runs out. Payout requestable every 3 days. Whop fee: 7% of clipper payouts.
- Account rules: social account must be linked to the clipper's own Whop account via OAuth (TikTok, IG, X) or channel verification (YouTube). One social account per Whop profile. Public accounts only.
- Payout goes to whoever's Whop account submitted. Money never flows through Outpost.

## User flow
1. Onboard: connect own TikTok/socials (bring your own account) + own Whop account; link socials to Whop (one-time, on Whop).
2. Bounty marketplace: in-app list = the Whop campaign board (brand, $/1K, budget left, platforms). Hide no-budget campaigns. Tap to take one; app joins it.
3. Generation: main agent reads bounty rules (length, required tags/mentions, CTAs, banned content) into a checklist, pulls source footage, spins up sub-agents. Opus picks moments, writes hooks/captions; most bounties = cut brand's long-form footage into vertical clips. Clips stream into feed as each finishes (first ones in ~a minute).
4. Director feed: full-screen vertical, like Reels. Left = kill. One-tap edit chips ("punchier hook", "shorter", "funnier captions") or short voice/text direction = tweak. Right = approve.
5. Approve = post to user's account via posting API, then submit public URL to the Whop campaign.
6. Scoreboard (top bar + tab): total views, estimated pending earnings, per-clip status (submitted / under review / approved), taste score.
7. Main agent has its own iMessage number: "our clip is blowing up" + link, "30 new clips ready". Kakai fit. Key demo moment.
- Daily loop: open, swipe, approve, check numbers, get texted, come back.

## Taste score
- Goal: measure taste, stop rubber-stamping.
- Score = approval rate x performance.
  - Approval rate: share of user's posted clips brand approved (weak alone: review mostly checks rules + 48h auto-approve, so it's a filter).
  - Performance: approved clips' views vs that account's own baseline (>1 = better than usual). Normalizes for account size: 300-follower account hitting 3K views beats 50K account at its usual.
- Display: 0 to 100 + trend arrow.
- Real signal is slow (48h review, views over days) so add instant feedback (predicted score / agreement with other reviewers), settle later.
- Demo: seed from clips posted that morning, update live.

## Pending earnings
- Estimate = views / 1000 x campaign rate. $0 until min view threshold passed; capped at per-clip max.
- Label: estimated, not guaranteed, pending Whop review. Flips to approved when Whop approves.

## Business model (open)
- Whop pays users directly, so Outpost can't skim payouts. Options: subscription or separate fee.
- Original idea (user gets % of payout scaled by taste score) doesn't map to bring-your-own-account. Open: how taste score ties to money (leaderboard, perks, fee discounts, access to better bounties).

## Architecture
- App: Expo (React Native). Backend: Convex (realtime feed/queue/stats).
- Agents: one main manager agent per user/channel (niche, swipe history, active bounties, performance) orchestrates sub-agents. Keep mechanical steps (download, transcribe, cut, caption) as plain code; LLM only for creative calls (moment picking, hooks). Thin manager for hackathon.
- Campaign data: no official Content Rewards API. Board runs on a public discover endpoint (~50 campaigns/page), readable without login; third-party scrapers (Apify etc.) already use it.
- Join + submit: no public API. Plan: user logs into Whop once in in-app WebView; store session cookies encrypted; backend replays Whop's internal requests (capture via Chrome DevTools > Network while joining/submitting manually). Fallback 1: Playwright/browser agent clicks through. Fallback 2: copy URL + open campaign submit page, user taps submit. Reference: github.com/raj3kk/whopclip (one-time login, encrypted cookies sent to server, picks campaigns by active/budget/not-submitted/joined/highest $/1K).
- Block risk: low at human volume from each user's own session; risky at scale (server IPs, rapid fire, Cloudflare). Endpoints can change anytime; sessions expire (need re-login prompt). Long term: Whop partnership.
- Clip engine: don't build from scratch. OpenShorts (github.com/mutonby/openshorts, MIT, API + MCP server for agents; moment detection, face-tracked 9:16 reframing, subtitles, dubbing). Alt: SupoClip (AGPL, avoid commercially). podcli for prompt/caption reference (styles: branded, hormozi, karaoke, subtle). Stack: yt-dlp (download; can get blocked from server IPs, pre-download demo footage), Whisper/Deepgram (timestamped transcript), FFmpeg (cut, reframe, burn captions).
- Quality levers (from OpusClip): virality scoring, word-by-word animated captions, auto-reframe, hook titles. Tune hook prompts with viral examples.
- Edits: only change params (cut points, hook text, caption style) + re-render = seconds.
- Posting: audited aggregator (Ayrshare, Upload-Post, Late) returns public URL. Verify posts go live, not drafts; fallback platform Reels/Shorts.
- Tracking: poll views via aggregator analytics on schedule.
- Safety: human posting volume (few posts/day/account), no pooled accounts.

## Competition
- OpusClip etc.: pro clipping tools for creators. AutoClip: already integrates Whop campaign browsing.
- "AI clips for Whop" isn't new; expect other Whop-based teams today. Differentiators: consumer swipe feed, taste score, iMessage agent, taste-for-money framing.

## Judge objections -> answers
- Content factory / slop: human picks every post; taste score punishes approving junk.
- Whop wrapper: Whop = first bounty source; later direct brand deals (agent emails brands) + other platforms.
- Why daily: fresh clips daily, climbing pending total, agent texts.
- Same footage for everyone: different cuts/hooks per user shaped by their swipe history.
- Why mobile: swiping is native for judging short video; agent lives in iMessage.
- Tiny money: true for most; taste score concentrates earnings on best judges.
- Why now: AI clip generation just got good/cheap enough (Opus).
- Boring feed: mix many bounties in one feed (719 campaigns, wide variety), not one at a time.
- Rubber stamp (if AI is great, where's taste?): the directing moment + taste score proves human value.

## Risks
- Whop endpoint changes/automation blocking; session expiry.
- New accounts: low day-one reach.
- Campaigns may reject AI-edited or duplicate-looking clips; check rules per campaign.
- Budgets run out; payouts need thresholds.
- Ad-heavy feed could make users' accounts feel like billboards.

## Demo plan
- Use a real account with followers; post clips in the morning so real views + real pending $ exist by demo.
- Open with taste pitch (first 30s, pre-empt slop bias).
- Live directing moment: okay clip -> clearly better in 1 to 2 taps.
- Live swipe right -> posts + submits.
- Agent texts "our clip is blowing up" on stage.
- Pre-generate clips; backup screen recording; only the post is truly live.
- End on real traction numbers.

## Vision (last slide)
Outpost's agent = your AI talent manager: own email to pitch brands and bring deals back as bounties, own iMessage number to keep you in the loop.

## Open
- Business model + taste score to money link.
- Content format per bounty (most want clips of brand footage; AI-generated/3D content discussed as option).
