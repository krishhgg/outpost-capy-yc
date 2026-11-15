# Testing on an iPhone with Revyl

Every app-facing pull request is proven on a cloud iPhone before it merges. Revyl builds the PR's app, an agent
exercises the change, and a regression suite checks the screens that already work. No green run, no merge.

The config is `outpost/.revyl/config.yaml`. The tests are `outpost/.revyl/tests/`. Revyl runs the config and the test
files from the PR's own head commit, so a PR that changes a test runs its changed test.

## What runs on a pull request

Any non-draft PR that changes a file under `outpost/` gets a Revyl run, except PRs that only touch
`outpost/convex/`, `outpost/studio/`, `outpost/docs/` or Markdown files, since those can't change the app build. A
PR that touches `src/` and `convex/` together still runs.

1. **Build.** Revyl builds the `pull-request` profile for the iOS simulator (Release, Xcode 26.6 image). iPhone only:
   Outpost is iOS-first and an Android build doubled the wait. With `REVYL_USE_FINGERPRINT`, a PR that leaves native
   code alone (no new native package, no `app.json` plugin change) reuses an earlier native build and only repacks
   the JavaScript.
2. **Proof of changes.** An agent installs the build on an iPhone 17 Pro Max, exercises what the diff changes, and
   checks one invariant on every run: the app opens straight to the Base village with no sign-in screen.
3. **Regression suite.** The saved workflow `outpost-regression` runs its tests against the same build.

The build talks to the production backend (`patient-flamingo-104`) as a fixed test user, the device id
`revyl-proof-ios-fixed-device-for-pull-request-proofs` (`EXPO_PUBLIC_DEVICE_ID`, read by `src/device.ts`). That user
is in `dryRun`, so nothing it approves is ever posted. Because the backend is production, Convex changes in a PR are
not live during its proof: a PR whose app change needs new Convex functions can only be proven once those functions
are deployed. Land the Convex half first, or say in the PR body which part was out of reach.

## Read the verdict

Revyl posts one comment on the PR and updates it on every push.

- **Preview builds**: build status and time. **Open preview** starts a live session on that build.
- **Proof of changes**: the verdict (Passed, Found a problem, Couldn't verify, Couldn't fully verify), a confidence
  score from 1/5 to 5/5, and screenshots. **Proof details** lists what was covered, what was out of reach, and what
  would make it provable. The evidence link opens the full step-by-step report and session video without a login.
- **Workflows**: `outpost-regression` with each test's result and report link.

A PR is ready when the build is Ready, the proof has no open finding, and every regression test passed. Copy the
proof's report link and its screenshots into the PR body (the screenshots in the Revyl comment can be dragged into
the PR description). A 1/5 "Couldn't verify" is normal for a PR with nothing visible to exercise; say why in the PR.

## Re-run

- **Agents**: push an empty commit. Revyl ignores `@revyl` commands from the Capy bot.
  `git commit --allow-empty -m "Re-run Revyl proof" && git push`
- **People with write access**: comment `@revyl rerun ios <guidance>` on the PR, or use **Re-run** in the comment's
  proof table.

## Run the regression suite yourself

Install the CLI (`curl -fsSL https://revyl.com/install.sh | sh`, then `export PATH=$HOME/.revyl/bin:$PATH`) and set
`REVYL_API_KEY`. From `outpost/`:

```sh
revyl build list --app "Outpost iOS"                      # find the build to test, e.g. your PR's commit
revyl workflow run outpost-regression --ios-app db085c7f-c3e1-48dd-a52a-d8bf110e5236 --ios-build-id <build id>
revyl test run outpost-smoke --build-id <build id>        # one test
```

Each run prints its report link. Runs from a checkout use that checkout's test files.

## The suite

| Test | Checks | State |
|---|---|---|
| `outpost-smoke` | First launch shows no sign-in screen; the Base tab shows the village (Collect on the away card can open the Feed first); Hood opens Under the Hood and Done returns; the Feed shows a video card or a designed empty state with the dry-run chip; the You tab shows the streak card | Active |
| `outpost-bounties-take` | The Bounties tab lists cards with brand, reward and TAKE or TAKEN; Take on an open bounty turns it TAKEN; the top card shows TAKEN, a ready-count pill and Swipe them. Once every bounty is taken it checks the TAKEN card only (reset with `purgeTestUser`) | Active |
| `outpost-feed-bounty-tag` | Feed card with bounty tag and forecast chip | Pending: T8 |
| `outpost-edit-chip-remake` | Edit chip queues a remake | Pending: T8 + T6 |
| `outpost-right-swipe-status` | Right swipe shows posting and submitting status | Pending: T8 + T4 |
| `outpost-left-swipe-reason` | Left swipe asks for a reason and sends the card back | Pending: T8 |
| `outpost-scoreboard` | Pending dollars and taste score on the HUD and You tab | Pending: T9 + T14 |

Today's screens share one test because the org runs about two devices at a time and each session spends most of its
time installing and launching the app: one session takes about 3 minutes, four separate ones took 6. When a new
check lands on a screen a test already visits, add steps to that test instead of a new one.

Pending tests live in `.revyl/tests/pending/`. Revyl only reads files directly in `.revyl/tests/`, so they are
skipped until promoted. Each one starts by dismissing the "While you were away" card when it shows.

### Promote a pending test

When its feature merges (and is deployed, if it needs Convex):

```sh
git mv .revyl/tests/pending/<name>.yaml /tmp/<name>.yaml       # fix its steps to match the shipped UI first
revyl test create --from-file /tmp/<name>.yaml --no-open      # writes .revyl/tests/<name>.yaml with its remote id
revyl test run <name> --build-id <build of the feature>       # must pass
revyl workflow add-tests outpost-regression <name>
```

Commit the new `.revyl/tests/<name>.yaml`. Add tests the same way: write the YAML (one intent per instruction step,
outcomes in separate validation steps), create it, run it, add it to the workflow.

## Seed data for the proof user

The Feed needs ready videos, and the studio runs only on the team's laptop. `convex/testkit.ts` seeds the proof user
with labeled 3-second test clips. It refuses any device id that doesn't start with `revyl-proof-` and any user not
in `dryRun`, and it deletes that user's queued videos so the studio never renders for a test user. Only the builder
who deploys runs it, after a deploy that includes `testkit.ts`:

```sh
npx convex run testkit:seedProofUser '{"deviceId":"revyl-proof-ios-fixed-device-for-pull-request-proofs"}'
```

It tops the user up to 10 ready clips (`count` changes that, up to 20) and prints `{added, ready, clearedQueued}`.
Run it again whenever the proof user's Feed runs low.

## Rules

- Tests and proofs run only as `revyl-proof-*` users in `dryRun` posting and the Whop sandbox. Never post publicly
  or submit to a real bounty from a test.
- Keep the `testID`s on screens; tests and proofs lean on them.
- Non-phone checks still run in CI: `npx tsc --noEmit`, `npx tsc --noEmit -p convex`, `node --check studio/worker.mjs`.
