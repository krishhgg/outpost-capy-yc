// The reel format: what the writer returns (SCRIPT_SCHEMA, system), how a script is kept in Convex, and layout(),
// which turns a script and the voice's word timings into a flat list of timed events for template/index.tsx.
// Everything that needs the timings is decided here, so the template only draws what it is given.
//
// The frame: a 3D set (template/world.ts) cut into shots of about two seconds, a small label on top, cards in the
// top third for lists, numbers and texts, and word-timed captions at about two thirds down with the key words lit.

export const W = 1080, H = 1920;
const r3 = (n) => Math.round(n * 1000) / 1000;
const clean = (w) => w.toLowerCase().replace(/[^a-z0-9$%]/g, "");

// Beats the writer can pick, and what each one does on screen.
export const KINDS = ["statement", "danger", "question", "list", "number", "messages", "twist"];
// What the freelancer does and how he looks in a beat. template/world.ts poses and draws each one.
export const ACTS = ["talk", "type", "phone", "facepalm", "shrug", "point", "think", "shock", "celebrate", "wave", "slump"];
export const MOODS = ["neutral", "happy", "worried", "shocked", "smug", "sad", "determined"];
// Who speaks a beat: the deep narrator, the freelancer himself, or the second character when the video has one.
export const WHO = ["narrator", "you", "them"];
// The second characters, the talking objects and the sets template/world.ts can build, as the writer sees them.
export const CAST = {
  boss: ["THE BOSS", "his boss, in a suit and tie"], client: ["THE CLIENT", "a client in a blazer"],
  friend: ["YOUR FRIEND", "his friend in a cap"], coworker: ["YOUR COWORKER", "a coworker in a cardigan"],
  roommate: ["YOUR ROOMMATE", "his roommate in a hoodie"], landlord: ["THE LANDLORD", "his landlord, bald with a moustache"],
};
export const BUDDY = { invoice: "a talking invoice", piggy: "a talking piggy bank", calendar: "a talking calendar", mug: "a talking coffee mug" };
export const SET = { city: "a glowing grid floor in a night city", office: "an open office with cubicles", home: "his bedroom at night", cafe: "a cozy cafe" };
// Voices for lines spoken in character. The narrator keeps the deep voices in worker.mjs.
export const VOICE_OF = { you: "am_liam", boss: "bm_george", client: "af_sarah", friend: "am_puck", coworker: "af_heart", roommate: "am_eric", landlord: "bm_lewis" };
// What a character can do in a shot; the phone and the laptop belong to the freelancer.
const ACTS2 = ["talk", "facepalm", "shrug", "point", "think", "shock", "celebrate", "wave", "slump"];
export const lookOf = (b) => ({
  set: SET[b?.set] ? b.set : "city", cast: CAST[b?.cast] ? b.cast : "", buddy: BUDDY[b?.buddy] ? b.buddy : "invoice",
});

// What claude -p must return, and how to ask for it.
export const SCRIPT_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["angle", "hook", "sub", "hookAct", "hookMood", "beats", "cta", "keyword", "caption", "title"],
  properties: {
    angle: { type: "string" },
    hook: { type: "string" },
    sub: { type: "string" },
    hookAct: { type: "string", enum: ACTS },
    hookMood: { type: "string", enum: MOODS },
    beats: {
      type: "array", minItems: 5, maxItems: 7,
      items: {
        type: "object", additionalProperties: false, required: ["kind", "who", "say", "punch", "items", "value", "unit", "act", "mood"],
        properties: {
          kind: { type: "string", enum: KINDS }, who: { type: "string", enum: WHO }, say: { type: "string" }, punch: { type: "string" },
          items: { type: "array", items: { type: "string" } }, value: { type: "number" }, unit: { type: "string" },
          act: { type: "string", enum: ACTS }, mood: { type: "string", enum: MOODS },
        },
      },
    },
    cta: { type: "string" },
    keyword: { type: "string" },
    caption: { type: "string" },
    title: { type: "string" },
  },
};
// briefed: the video comes with a brief from trend research, which picks the format, the story and the hook style.
// look: the set, second character and talking object from lookOf(), which decide who can speak.
export const system = (niche, briefed = false, look = lookOf()) => `You write 20 to 30 second vertical reels for a faceless account. Niche: ${niche}${briefed ? ", and work and money life in general: jobs, bosses, clients, side hustles, rent, budgets, burnout" : ""}.
The account sells one product: a $9 Notion client-invoice template for freelancers.
Every reel is a tiny animated story on a 3D set, ${SET[look.set]}: a blocky young guy with glasses and a hoodie (he is "you", the viewer)
${look.cast ? `and ${CAST[look.cast][1]}, with ${BUDDY[look.buddy]} nearby` : `and his sidekick, ${BUDDY[look.buddy]}`}. A deep narrator tells it in second person while the camera cuts every two seconds.
Rules:
- Talk to the viewer in second person or as a how-to. Never claim personal experience, results, income or earnings. No invented numbers or statistics.
- hook: spoken first. ${briefed ? "At most 10 words, in the hook style the brief's format calls for. Start with \"POV:\" only when the format is a POV." : "Starts with \"POV:\" and has at most 9 words after it: a moment the viewer knows too well."}
- sub: a scene-setter shown at the top while the hook plays, 2 to 4 words, like a time or a place: "Friday, 11:52 PM" or "Your inbox, Monday". It must fit the set. Not spoken.
- hookAct and hookMood: what the freelancer does and how he looks during the hook.
- beats: ${briefed ? "5 or 6, so the whole reel stays under 30 seconds," : "5 to 7,"} flowing from the problem and why it hurts, to the fix, to why it works, to one turn where it gets better, to a closing truth. Each beat:
  - say: one spoken sentence of at most ${briefed ? 12 : 14} words.
  - who: who says it. "narrator" is the deep narrator, in second person. "you" is the guy himself, a short line in first person, said out loud in the scene.${look.cast ? ` "them" is ${CAST[look.cast][1]}, a short line of dialogue to him.` : ` Never "them": there is no one else in this video.`} ${look.cast ? "When the format is a skit, a dialogue or a conversation, give at least three beats to \"you\" and \"them\". Otherwise use them for one or two beats at most." : "Mostly narrator; at most two beats for \"you\"."} Lines in character are fiction, but never claim real results, income or earnings.
  - kind, one of:
    statement: a plain claim.
    danger: a mistake or risk.
    question: a question the next beat answers.
    list: 2 to 4 things, in items, each at most 4 words, in the order say mentions them.
    number: a rule of thumb built on one number, like half up front or net 7 terms. value is the number and unit its unit ("%", " days", or "$" for dollars). Never a statistic, a result or an income figure.
    messages: texts the viewer gets (from clients, the boss, a friend, whoever fits): 3 or 4 texts in items, at most 6 words each.
    twist: the turn, where it gets better. Exactly one beat is a twist.
  - punch: 1 to 3 words copied exactly from say, the ones to light up on screen.
  - act: what the speaker does in this shot (the guy, unless who is "them"). talk, type (at his laptop), phone (reading his phone), facepalm, shrug,
    point (at the card above him), think, shock, celebrate, wave, slump. Pick what the sentence shows, and vary them.
  - mood: the speaker's face. neutral, happy, worried, shocked, smug, sad, determined. Worried or sad in the problem, determined
    or smug at the fix, happy from the twist on.
  - items is [] unless the kind is list or messages. value is 0 and unit is "" unless the kind is number.
  Use at least four different kinds, and at most one number beat and one messages beat.
- cta: said aloud last and shown in a card at the end, at most 9 words. ${briefed ? "Point to the $9 invoice template (\"Grab the $9 invoice template, link in bio\") only when the story is about clients, invoices or getting paid. Otherwise ask for a follow or a comment" : "About 1 reel in 3 points to the $9 invoice template (\"Grab the $9 invoice template, link in bio\"). The rest ask for a follow or a comment"}, like "Comment LATE if a client owes you". Never promise to send anything.
- keyword: one word copied from cta, lit up in the card.
- caption: at most 140 characters, then 2 or 3 hashtags.
- title: a YouTube Shorts title, at most 70 characters, no hashtags.
- angle: the topic in at most 6 words.
Plain everyday words. No em dashes, no emojis, no quotes around the hook.`;

// Convex keeps a script as hook, lines and cta; a reel's beats ride in lines with their kind and extras.
export const toStored = (s) => ({
  hook: s.hook, sub: s.sub, cta: s.cta, keyword: s.keyword, caption: s.caption, title: s.title, angle: s.angle,
  lines: s.beats.map(b => ({ say: b.say, label: b.punch, kind: b.kind, who: b.who, items: b.items, value: b.value, unit: b.unit })),
});
// Convex doesn't keep act and mood, so a reused script gets the usual ones for each kind.
const ACT_FOR = {
  statement: ["talk", "neutral"], danger: ["facepalm", "worried"], question: ["think", "worried"], list: ["point", "determined"],
  number: ["point", "smug"], messages: ["phone", "worried"], twist: ["celebrate", "happy"],
};
export const fromStored = (st) => ({
  angle: st.angle, hook: st.hook, sub: st.sub ?? "", cta: st.cta, keyword: st.keyword ?? "", caption: st.caption, title: st.title,
  hookAct: "phone", hookMood: "worried",
  beats: st.lines.map(l => {
    const kind = l.kind ?? "statement", [act, mood] = ACT_FOR[kind] ?? ACT_FOR.statement;
    return { kind, who: l.who ?? "narrator", say: l.say, punch: l.label, items: l.items ?? [], value: l.value ?? 0, unit: l.unit ?? "", act, mood };
  }),
});

// Groups spoken words into captions of up to `max` words, cutting at punctuation. The punch words stay lit inside
// whichever caption they land in: `hi` is that run's character range in the caption's text.
function captions(words, punch, max = 3) {
  const p = (punch ?? "").split(/\s+/).map(clean).filter(Boolean);
  let from = -1;
  if (p.length) {
    const ws = words.map(w => clean(w[0]));
    for (let i = 0; i + p.length <= ws.length; i++) {
      if (p.every((x, k) => ws[i + k] === x)) { from = i; break; }
    }
  }
  const lit = (i) => from >= 0 && i >= from && i < from + p.length;
  const out = [];
  let cur = [];
  const flush = () => {
    if (!cur.length) return;
    const text = cur.map(i => words[i][0]).join(" ");
    let at = 0, a = -1, b = -1;
    for (const i of cur) {
      if (lit(i)) { if (a < 0) a = at; b = at + words[i][0].length; }
      at += words[i][0].length + 1;
    }
    out.push({ text, s: words[cur[0]][1], end: words[cur.at(-1)][2], hi: a >= 0 ? [a, b] : null });
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    // The punch starts a fresh caption, so it lands on its own beat of the voice.
    if (i === from && cur.length) flush();
    cur.push(i);
    if (cur.length === max || /[.,!?;:]$/.test(words[i][0]) || i === from + p.length - 1) flush();
  }
  flush();
  return out;
}

// Finds when an item is first spoken: the first word of the item that turns up at or after `from`.
function spokenAt(words, item, from) {
  const keys = item.split(/\s+/).map(clean).filter(w => w.length > 2);
  for (let i = from; i < words.length; i++) {
    if (keys.includes(clean(words[i][0]))) return i;
  }
  return -1;
}

// The end card reads like "Comment LATE / if a client owes you": a big first line through the keyword, then the
// rest smaller. Without a keyword near the front it is one line.
function ctaLines(cta, keyword) {
  const words = cta.trim().split(/\s+/);
  const found = keyword ? words.findIndex(w => clean(w) === clean(keyword)) : -1;
  // A number right after the keyword stays with it: "Follow for part 2 / before the next email lands".
  const k = found >= 0 && /^\d+$/.test(clean(words[found + 1] ?? "")) ? found + 1 : found;
  const cut = k >= 0 && k < words.length - 1 && found <= 4 ? k + 1 : words.length;
  const cta1 = words.slice(0, cut).join(" "), cta2 = words.slice(cut).join(" ");
  // Montserrat ExtraBold runs about 0.85 em for a capital, 0.7 for a small letter and 0.3 for a space, so the size
  // keeps the first line on one line: a long keyword like SCREENSHOT or a line like "Comment which roommate".
  const ems = [...cta1].reduce((n, ch) => n + (/[A-Z0-9$]/.test(ch) ? 0.85 : ch === " " ? 0.3 : 0.7), 0);
  return { cta1, cta2, ctaSize: Math.max(44, Math.min(76, Math.floor(860 / ems))) };
}

// The label on top names the part of the story a beat is in.
const SECTION = { statement: "THE PROBLEM", danger: "THE MISTAKE", question: "THE QUESTION", list: "THE FIX", number: "THE RULE", messages: "THE INBOX", twist: "THE TURN" };

export function layout({ script, parts, palette = 0, preset = 0, audio, id, duration, look: cfg = lookOf() }) {
  const cast = CAST[cfg.cast] ? cfg.cast : "";
  const evs = [];
  const sfx = (src, s, vol = 0) => evs.push({ k: "sfx", src, s: r3(Math.max(0, s)), vol });
  const ends = parts.map((p, i) => (i + 1 < parts.length ? parts[i + 1].start : duration));
  const seed0 = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  let n = 0, lastCam = "";
  // Cameras for plain beats, in an order that keeps changing the size of the shot.
  const ROTATE = ["ms", "mcu", "orbit", "cu", "wide", "mascot"];
  let turn = seed0 % ROTATE.length;
  const pick = (want) => {
    let cam = want ?? ROTATE[turn++ % ROTATE.length];
    if (cam === lastCam) cam = ROTATE[turn++ % ROTATE.length];
    return cam;
  };
  // One beat on screen is one or more shots; a long one cuts again about every two seconds, on a word.
  const shoot = (s, e, look, words = []) => {
    if (look.cam === "them" && !cast) look = { ...look, cam: "cu" };
    const cuts = [s];
    for (const w of words) if (w[1] - cuts.at(-1) >= 1.7 && e - w[1] >= 1) cuts.push(w[1]);
    cuts.forEach((c, k) => {
      const cam = k === 0 ? pick(look.cam) : pick(look.next?.[k - 1]);
      lastCam = cam;
      evs.push({ k: "shot", s: r3(c), e: r3(k + 1 < cuts.length ? cuts[k + 1] : e), cam, act: look.act, mood: look.mood,
        tint: look.tint ?? "night", bill: look.bill ?? "worried", hud: !!look.hud, seed: seed0 + n++,
        act2: look.act2 ?? "idle", mood2: look.mood2 ?? "neutral", talk: look.talk ?? "" });
      if (k > 0) sfx("whoosh", c - 0.12, -22);
    });
  };
  const say = (words, end, { punch, tone = "y" } = {}) => {
    const cs = captions(words, punch);
    cs.forEach((c, k) => {
      const e = k + 1 < cs.length ? cs[k + 1].s : Math.min(end, c.end + 0.5);
      evs.push({ k: "cap", t: c.text, s: r3(c.s), e: r3(e), hi: c.hi, tone });
    });
  };
  const total = script.beats.length + 2;
  const tag = (a, b, s, e, i) => evs.push({ k: "tag", a, b, s: r3(s), e: r3(e), n: i, of: total });

  // 0. The hook: a close-up, then the two of them, spoken without its "POV:" label.
  const h = parts[0];
  shoot(0, ends[0], { cam: "cu", next: ["ms"], act: script.hookAct ?? "phone", mood: script.hookMood ?? "worried" }, h.words);
  sfx("boom", 0, -12);
  tag((script.sub || "").toUpperCase(), "", 0, ends[0], 0);
  say(h.words, ends[0], { punch: h.words.slice(-2).map(w => w[0]).join(" ") });

  // 1. The beats.
  let turned = false;
  script.beats.forEach((b, i) => {
    const p = parts[i + 1], end = ends[i + 1];
    if (b.kind === "twist") turned = true;
    // Without a second character in the video, a line written for them falls back to the narrator.
    const who = b.who === "them" && !cast ? "narrator" : b.who ?? "narrator";
    const react = turned ? "happy" : "neutral";
    let look = { act: b.act, mood: b.mood, bill: turned ? "paid" : "worried", tint: turned ? "bright" : "night", act2: "idle", mood2: react, talk: who === "you" ? "me" : "" };
    // When they speak, they act out the line and he listens.
    if (who === "them") look = { ...look, act: "idle", mood: turned ? "happy" : b.kind === "danger" ? "shocked" : "worried", act2: ACTS2.includes(b.act) ? b.act : "talk", mood2: b.mood, talk: "them" };
    const section = who === "them" ? CAST[cast][0] : who === "you" ? "YOU" : turned && b.kind === "statement" ? "THE PAYOFF" : SECTION[b.kind] ?? "THE PROBLEM";
    tag(section, (b.punch || "").toUpperCase(), p.start, end, i + 1);
    let tone = "y";

    if (b.kind === "twist") {
      shoot(p.start, end, { ...look, cam: who === "them" ? "them" : "low", next: who === "them" ? ["low", "ms"] : ["mascot", "ms"], tint: "bright" }, p.words);
      sfx("whoosh", p.start - 0.25, -12);
      sfx("chime", p.start, -14);
      tone = "g";
    } else if (b.kind === "danger") {
      shoot(p.start, end, { ...look, cam: who === "them" ? "them" : "cu", next: who === "them" ? ["cu", "mascot"] : ["mascot", "mcu"], tint: "alarm", bill: "overdue" }, p.words);
      sfx("thud", p.start - 0.02, -8);
      sfx("glitch", p.start, -18);
      evs.push({ k: "flash", s: r3(p.start) });
      tone = "r";
    } else if (b.kind === "list" && b.items?.length) {
      const items = b.items.slice(0, 4);
      shoot(p.start, end, { ...look, cam: who === "them" ? "mascot" : "mcu", next: who === "them" ? ["ms", "mascot"] : ["ms", "mcu"], hud: true }, p.words);
      evs.push({ k: "card", s: r3(p.start), e: r3(end), title: (b.punch || section).toUpperCase(), rows: items.length, kind: "list" });
      let at = 0;
      items.forEach((item, k) => {
        const hit = spokenAt(p.words, item, at);
        const s = hit >= 0 ? p.words[hit][1] : p.start + ((end - p.start) * 0.8 * k) / items.length;
        if (hit >= 0) at = hit + 1;
        evs.push({ k: "item", t: item, n: k + 1, of: items.length, s: r3(s), e: r3(end) });
        sfx("tick", s, -10);
      });
    } else if (b.kind === "number" && b.value > 0) {
      shoot(p.start, end, { ...look, cam: who === "them" ? "mascot" : "mcu", next: ["ms"], hud: true }, p.words);
      const hit = p.words.findIndex(w => /\d/.test(w[0]));
      // The roll fits inside the beat, even when the number comes late in the sentence. The card comes in with it.
      const s = Math.max(p.start, Math.min(hit >= 0 ? p.words[hit][1] - 0.15 : p.start + 0.2, end - 0.6));
      evs.push({ k: "card", s: r3(Math.max(p.start, s - 0.2)), e: r3(end), title: (b.punch || section).toUpperCase(), rows: 0, kind: "number" });
      const roll = Math.min(0.7, Math.max(0.2, (end - s) / 2));
      const dollar = b.unit?.trim() === "$";
      const fmt = (v) => (dollar ? `$${v}` : `${v}${b.unit ?? ""}`);
      const steps = 10;
      for (let k = 0; k < steps; k++) {
        const x = (k + 1) / steps;
        const v = Math.round(b.value * (1 - (1 - x) ** 2)); // fast at first, settling on the value
        const ts = s + (roll * k) / steps;
        evs.push({ k: "count", t: fmt(k === steps - 1 ? b.value : v), s: r3(ts), e: r3(k === steps - 1 ? end : ts + roll / steps), final: k === steps - 1 });
      }
      sfx("roll", s, -12);
      sfx("boom", s + roll - 0.05, -12);
    } else if (b.kind === "messages" && b.items?.length) {
      const items = b.items.slice(0, 4);
      shoot(p.start, end, { ...look, cam: who === "them" ? "mascot" : "mcu", next: who === "them" ? ["mcu"] : ["cu"], act: "phone", hud: true }, p.words);
      evs.push({ k: "card", s: r3(p.start), e: r3(end), title: cast ? `${CAST[cast][0]} · NEW MESSAGES` : "NEW MESSAGES", rows: items.length, kind: "messages" });
      items.forEach((t, k) => {
        const s = p.start + ((end - p.start) * 0.75 * k) / items.length;
        evs.push({ k: "bubble", t, row: k, of: items.length, s: r3(s), e: r3(end) });
        sfx("pop", s, -10);
      });
    } else {
      // statement and question: the camera follows the story; a question ends on a riser.
      const cam = who === "them" ? "them" : who === "you" ? "cu" : b.act === "type" ? "ots" : undefined;
      shoot(p.start, end, { ...look, cam, next: who === "them" ? ["mascot", "ms"] : who === "you" ? ["mcu"] : undefined }, p.words);
      if (b.kind === "question") sfx("riser", Math.max(p.start, end - 1.4), -15);
    }
    say(p.words, end, { punch: b.punch, tone });
  });

  // 2. The call to action: he waves, the invoice is paid, and the end card pops on top.
  const last = parts.at(-1);
  shoot(last.start, duration, { cam: "mcu", next: ["low"], act: "wave", mood: "happy", bill: "paid", hud: true, act2: "wave", mood2: "happy" }, last.words);
  say(last.words, duration, { punch: script.keyword });
  evs.push({ k: "ctaPop", s: r3(last.start) });
  sfx("boom", last.start - 0.02, -14);

  return {
    id, palette, preset, audio, end: r3(duration), look: { set: cfg.set, cast, buddy: cfg.buddy },
    keyword: script.keyword ?? "", ...ctaLines(script.cta, script.keyword),
    evs: evs.sort((a, b) => a.s - b.s),
  };
}
