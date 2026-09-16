/**
 * Demo seed: a small, believable community so the app feels alive locally.
 * Refuses to run against production unless SEED_FORCE=1.
 *
 *   npm run db:seed          (from repo root)
 *
 * Demo login: demo / password123  (and every seeded account uses password123)
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
  console.error("Refusing to seed a production database. Set SEED_FORCE=1 to override.");
  process.exit(1);
}

const prisma = new PrismaClient();
const PASSWORD = "password123";
const H = (n: number) => new Date(Date.now() - n * 3600 * 1000);
const D = (n: number) => new Date(Date.now() - n * 86400 * 1000);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const users = [
  { username: "demo", displayName: "Muskan", pronouns: "she/her", bio: "Building this place. Occasionally using it.", struggles: ["anxiety", "burnout", "insomnia"], role: "ADMIN" as const },
  { username: "quietstorm", displayName: "Riya", pronouns: "she/her", bio: "recovering overachiever. tea > coffee. here at 3am mostly.", struggles: ["anxiety", "insomnia", "self-worth"] },
  { username: "notfinebutok", displayName: "Arjun", pronouns: "he/him", bio: "software engineer, 27. burnt out twice, learning to say no.", struggles: ["burnout", "work", "anxiety"] },
  { username: "moth_to_lamp", displayName: "Sam", pronouns: "they/them", bio: "adhd brain, 40 tabs open, 0 of them the one I need.", struggles: ["adhd", "self-worth", "loneliness"] },
  { username: "after_the_rain", displayName: "Priya", pronouns: "she/her", bio: "lost amma in march. figuring out who I am after.", struggles: ["grief", "loneliness", "insomnia"] },
  { username: "halfway_home", displayName: "Dev", pronouns: "he/him", bio: "412 days sober. one at a time, all of them.", struggles: ["recovery", "addiction", "depression"] },
  { username: "smallhours", displayName: "Zara", pronouns: "she/her", bio: "new city, new job, same brain. trying.", struggles: ["loneliness", "anxiety", "relationships"] },
  { username: "kabir_k", displayName: "Kabir", pronouns: "he/him", bio: "med student. ironic, I know.", struggles: ["panic", "burnout", "intrusive-thoughts"] },
  { username: "paperboats", displayName: "Ananya", pronouns: "she/her", bio: "therapist-in-training who still forgets to drink water.", struggles: ["family", "self-worth", "anxiety"] },
  { username: "ghost_in_the_group_chat", displayName: "Noor", pronouns: "they/them", bio: "left on read since 2019. dark humour is a coping skill, thanks.", struggles: ["depression", "loneliness", "trauma"] },
  { username: "slowmornings", displayName: "Ishaan", pronouns: "he/him", bio: "dad of two. nobody told me the tired was permanent.", struggles: ["burnout", "family", "insomnia"] },
  { username: "tinyvictories", displayName: "Mira", pronouns: "she/her", bio: "collecting small wins like bottle caps.", struggles: ["depression", "recovery", "self-worth"] },
];

const circles = [
  { slug: "3am-club", name: "3am club", emoji: "🌙", hue: 265, tagline: "For everyone awake when they shouldn't be.", tags: ["insomnia", "anxiety", "intrusive-thoughts"], description: "Can't sleep? Neither can we. No advice unless asked — just company at the hour when everything feels bigger than it is.", guidelines: "Keep it gentle. No sleep-shaming. If someone's spiralling, sit with them before suggesting anything." },
  { slug: "burnout-ward", name: "burnout ward", emoji: "🔥", hue: 25, tagline: "You're not lazy. You're depleted.", tags: ["burnout", "work", "anxiety"], description: "For people whose jobs, studies or caregiving have quietly eaten them. Rest without guilt, resign without shame, rebuild without hustle-speak." },
  { slug: "grief-kitchen", name: "the grief kitchen", emoji: "🕯️", hue: 40, tagline: "Where we talk about the people who aren't here.", tags: ["grief", "loneliness", "family"], description: "Loss of any kind — a parent, a friend, a pet, a version of yourself. Say their name here as often as you need." },
  { slug: "anxious-and-still-here", name: "anxious & still here", emoji: "🌊", hue: 200, tagline: "Panic, worry, the what-ifs. Together.", tags: ["anxiety", "panic", "intrusive-thoughts"], description: "Grounding, reality-checking and a lot of 'me too'. Bring your spirals; we'll help you find the floor." },
  { slug: "one-day-at-a-time", name: "one day at a time", emoji: "🌱", hue: 140, tagline: "Recovery in all its shapes.", tags: ["recovery", "addiction", "small-wins"], description: "Substances, self-harm, eating, anything you're working to leave behind. Relapse talk is welcome. Judgement isn't." },
  { slug: "adhd-brains", name: "adhd brains", emoji: "🧠", hue: 300, tagline: "40 tabs open, none of them this one.", tags: ["adhd", "self-worth", "work"], description: "Late-diagnosed, undiagnosed, medicated or not. Body doubling threads, dopamine menus, and permission to be exactly this scattered." },
  { slug: "lonely-together", name: "lonely together", emoji: "🫂", hue: 330, tagline: "New cities, old friendships, empty evenings.", tags: ["loneliness", "relationships", "depression"], description: "For the ache of being surrounded and still alone. Low-pressure introductions, check-in buddies, no expectations." },
  { slug: "small-wins", name: "small wins", emoji: "✨", hue: 50, tagline: "Showered. Answered the email. Got out of bed.", tags: ["small-wins", "depression", "recovery"], description: "Post the win that would sound tiny to anyone who doesn't get it. We get it." },
];

type SeedPost = { u: string; content: string; tags: string[]; anon?: boolean; circle?: string; h: number; cw?: string };
const posts: SeedPost[] = [
  { u: "quietstorm", content: "It's 3:12am and my brain has decided now is the time to replay a conversation from 2017. Anyone else's mind run a nightly highlights reel of every awkward thing they've ever said?", tags: ["insomnia", "intrusive-thoughts"], circle: "3am-club", h: 2 },
  { u: "notfinebutok", content: "Told my manager I can't take on the new project. First time I've ever said no at work. My hands were shaking on the call and I still feel like I did something wrong. But I said it.", tags: ["burnout", "work", "small-wins"], circle: "burnout-ward", h: 5 },
  { u: "after_the_rain", content: "Made amma's dal today from memory. Got the tempering wrong and cried into the pan, then ate it anyway. It tasted almost right. That 'almost' is going to be the rest of my life, isn't it.", tags: ["grief", "family"], circle: "grief-kitchen", h: 8 },
  { u: "moth_to_lamp", content: "Spent 45 minutes looking for my keys. They were in my hand. I'd like to formally apologise to everyone I've ever been late for, my brain has never once been on my side.", tags: ["adhd", "dark-humor"], circle: "adhd-brains", h: 11 },
  { u: "demo", content: "Genuinely don't know if I'm tired or depressed or just a person who has been running on 5 hours of sleep for six months. Is there a difference at this point?", tags: ["burnout", "insomnia", "advice-wanted"], anon: true, h: 14 },
  { u: "halfway_home", content: "412 days. Last night was the first night in a while I really, really wanted a drink. Sat in the car outside the shop for twenty minutes. Drove home. Made tea. Hated the tea. Still 412.", tags: ["recovery", "addiction", "small-wins"], circle: "one-day-at-a-time", h: 20 },
  { u: "smallhours", content: "Moved to Bangalore for the job three months ago. I know exactly one person here and she's my landlord. Weekends are the hardest. How do adults make friends? Genuinely asking.", tags: ["loneliness", "advice-wanted", "relationships"], circle: "lonely-together", h: 26 },
  { u: "kabir_k", content: "Had a panic attack in the hospital library during exam prep. The irony of being a med student who can't regulate his own nervous system is not lost on me. 5-4-3-2-1 grounding got me through. Sharing in case someone needs it: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.", tags: ["panic", "anxiety"], circle: "anxious-and-still-here", h: 30 },
  { u: "ghost_in_the_group_chat", content: "my therapist said 'that sounds really hard' and I said 'it's fine' and then cried for the remaining 47 minutes. so. productive session.", tags: ["depression", "dark-humor"], h: 34 },
  { u: "tinyvictories", content: "Showered. Changed the sheets. Opened the blinds. It's 4pm and this is everything I did today and I'm posting it here because I know you'll understand why it's a lot.", tags: ["small-wins", "depression"], circle: "small-wins", h: 40 },
  { u: "paperboats", content: "Went home for the weekend and within an hour I was 14 again — apologising for existing, monitoring everyone's moods. It's wild how fast the old wiring switches on. Back in my own flat now, relearning how to take up space.", tags: ["family", "self-worth", "trauma"], h: 47 },
  { u: "slowmornings", content: "Both kids finally asleep. Sitting in the dark kitchen not doing anything because doing nothing is the only thing that's mine. Anyone else parent from a place of love and total depletion at the same time?", tags: ["burnout", "family", "insomnia"], circle: "burnout-ward", h: 52 },
  { u: "quietstorm", content: "unpopular opinion: 'just go to therapy' is sometimes as useful as 'just calm down'. therapy is expensive and waitlists are months long. what actually helped me while waiting: this place, honestly, and a very patient friend.", tags: ["anxiety", "advice-wanted"], h: 60 },
  { u: "moth_to_lamp", content: "Got the diagnosis at 29. Spent the whole drive home crying — not sad, just... every 'lazy', 'careless', 'you're so smart why can't you just' from the last two decades suddenly had a different name. Grief and relief at the same time.", tags: ["adhd", "self-worth", "grief"], circle: "adhd-brains", h: 70 },
  { u: "notfinebutok", content: "Resigned. No new job lined up. Everyone in my life thinks it's reckless. My body, which stopped sleeping in February, thinks it's the first sane thing I've done all year.", tags: ["burnout", "work"], anon: true, h: 78 },
  { u: "after_the_rain", content: "Six months. People stopped asking how I'm doing around month two. I don't blame them. I just want someone to say her name sometimes. Her name was Lakshmi. She laughed with her whole body.", tags: ["grief", "loneliness"], circle: "grief-kitchen", h: 90 },
  { u: "smallhours", content: "Update on the friends thing: went to a board game meetup alone. Sat in the car for 15 mins first. Talked to two people. One of them added me on Instagram. Not a friendship yet but it's a door.", tags: ["loneliness", "small-wins", "anxiety"], circle: "lonely-together", h: 96 },
  { u: "halfway_home", content: "Thing nobody tells you about getting sober: you have to feel everything. All of it. The boredom is the worst part. Not the cravings — the flat, grey Tuesday afternoons with nothing to reach for.", tags: ["recovery", "depression"], circle: "one-day-at-a-time", h: 110 },
  { u: "ghost_in_the_group_chat", content: "the way I will cancel plans I was excited about because on the day my body decides it weighs 400kg. and then feel worse for cancelling. and then cancel the next thing because I feel worse. incredible system, ten out of ten.", tags: ["depression", "loneliness", "dark-humor"], h: 120 },
  { u: "kabir_k", content: "Intrusive thought of the day: what if I've been faking being okay so well that even I can't tell anymore. Posting it here so it lives somewhere other than my skull.", tags: ["intrusive-thoughts", "anxiety"], anon: true, circle: "anxious-and-still-here", h: 130 },
  { u: "tinyvictories", content: "Called the dentist. That's the post. That's the whole post. Seven months of 'I'll do it tomorrow' and today I just did it.", tags: ["small-wins", "anxiety"], circle: "small-wins", h: 140 },
  { u: "paperboats", content: "For anyone who grew up managing a parent's moods: you are allowed to be a person with needs now. You don't have to earn rest by being useful. I have to relearn this weekly. Reminder for both of us.", tags: ["family", "self-worth"], h: 150 },
  { u: "demo", content: "Building this app has been its own kind of therapy and its own kind of avoidance. Some nights I write code instead of feeling things. Tonight I'm just going to feel things. See you tomorrow.", tags: ["burnout", "vent"], h: 160 },
  { u: "slowmornings", content: "My four-year-old asked why I'm 'always tired daddy' and I didn't have an answer that wouldn't scare either of us.", tags: ["family", "burnout"], anon: true, h: 175 },
  { u: "quietstorm", content: "3am club roll call. Who's up. What's the brain doing. Mine is doing taxes I don't owe.", tags: ["insomnia", "dark-humor"], circle: "3am-club", h: 190 },
  { u: "smallhours", content: "Is it normal to feel lonelier around people than alone? Went to a work dinner and came home feeling like a ghost that everyone politely stepped around.", tags: ["loneliness", "relationships"], circle: "lonely-together", h: 200 },
  { u: "moth_to_lamp", content: "Body doubling thread: I'm cleaning my kitchen for the next 30 minutes. Reply with what you're doing. We're doing it together, separately.", tags: ["adhd", "small-wins"], circle: "adhd-brains", h: 215 },
  { u: "halfway_home", content: "My sponsor said 'you don't have to want to be sober forever. just until bedtime.' 412 bedtimes so far.", tags: ["recovery", "addiction"], circle: "one-day-at-a-time", h: 230 },
  { u: "ghost_in_the_group_chat", content: "Content warning for anyone who needs it: talking about the bad years. I used to hurt myself to feel like I had a handle on something. Two years clean of that now. If you're in it, it does loosen its grip. Slowly, then suddenly.", tags: ["recovery", "trauma", "depression"], cw: "self-harm", circle: "one-day-at-a-time", h: 245 },
  { u: "after_the_rain", content: "Found a voice note from her. 12 seconds. 'Beta, did you eat.' I've listened to it forty times today. Yes amma. I ate.", tags: ["grief", "family"], circle: "grief-kitchen", h: 260 },
  { u: "notfinebutok", content: "Week two of not working. Slept 11 hours. Went for a walk with no podcast on. Heard birds. I forgot birds were a thing that happens.", tags: ["burnout", "small-wins"], circle: "burnout-ward", h: 280 },
  { u: "kabir_k", content: "The panic doesn't care that I know the physiology. Knowing my amygdala is misfiring does not stop it from misfiring. But it does help to remember it's a smoke alarm going off with no fire.", tags: ["panic", "anxiety"], circle: "anxious-and-still-here", h: 300 },
  { u: "tinyvictories", content: "Depression brain: 'you did nothing today.' Reality: I fed myself three times, replied to two messages, and didn't spiral once. Counting it.", tags: ["depression", "small-wins", "self-worth"], circle: "small-wins", h: 320 },
  { u: "paperboats", content: "Therapist-in-training confession: I can hold space for anyone's pain except my own. Working on it. Slowly. With a lot of tea.", tags: ["self-worth", "anxiety"], h: 340 },
  { u: "demo", content: "Welcome to only pain. The name is a joke; the place isn't. Post anonymously if you need to. React with more than a heart. Find your circle. And if it's 3am and you need someone, Ember is awake. — M", tags: ["vent", "small-wins"], h: 360 },
];

const comments: { post: number; u: string; content: string; anon?: boolean; replyToIdx?: number }[] = [
  { post: 0, u: "moth_to_lamp", content: "the 2017 conversation replay is a premium feature, mine adds subtitles" },
  { post: 0, u: "kabir_k", content: "Every night. What helps me a little: writing the replay down in one sentence, closing the notebook. Brain seems to accept it's been 'filed'." },
  { post: 0, u: "quietstorm", content: "filed. I'm going to try that tonight. thank you both", replyToIdx: 1 },
  { post: 1, u: "slowmornings", content: "Shaking hands and saying it anyway — that's the whole thing. Proud of you, stranger." },
  { post: 1, u: "demo", content: "The 'I did something wrong' feeling is just the old rule losing its grip. It'll get quieter each time." },
  { post: 2, u: "paperboats", content: "The 'almost' becomes a kind of company after a while. Not the same. But company. Sending so much warmth." },
  { post: 2, u: "ghost_in_the_group_chat", content: "she'd be so glad you ate it anyway." },
  { post: 4, u: "halfway_home", content: "Honestly? Six months of 5 hours would make anyone feel like this. Sleep first, then ask the question again. It might answer itself." },
  { post: 4, u: "kabir_k", content: "There is a difference but it's almost impossible to see from inside sleep deprivation. Not medical advice, just a tired person who's been there: protect one night this week. Just one." },
  { post: 5, u: "tinyvictories", content: "412. The car park counts. Driving home counts. Even hating the tea counts." },
  { post: 5, u: "demo", content: "Twenty minutes in that car is the bravest thing I've read today." },
  { post: 6, u: "moth_to_lamp", content: "Adults make friends by showing up to the same boring thing repeatedly until it isn't boring. Pick one thing weekly. That's the cheat code, and it's slow." },
  { post: 6, u: "tinyvictories", content: "I'm in Bangalore too. No pressure, but the DMs are open if you ever want a coffee that's allowed to be awkward.", anon: false },
  { post: 8, u: "after_the_rain", content: "47 minutes of crying IS the session. That's the work." },
  { post: 9, u: "notfinebutok", content: "Blinds open is huge. Light is medicine. Well done." },
  { post: 15, u: "demo", content: "Lakshmi. Who laughed with her whole body. Thank you for telling us her name." },
  { post: 15, u: "slowmornings", content: "Lakshmi. Saying it with you." },
  { post: 16, u: "smallhours", content: "(that Instagram add turned into a coffee. reporting back because you all held my hand through this)", anon: false },
  { post: 19, u: "quietstorm", content: "It lives here now. You can pick it back up if you want it. You probably won't.", anon: true },
  { post: 20, u: "ghost_in_the_group_chat", content: "the dentist is the final boss. you WON." },
  { post: 26, u: "tinyvictories", content: "folding laundry. 30 min. go." },
  { post: 26, u: "smallhours", content: "replying to emails I've been avoiding for a week. together, separately." },
  { post: 29, u: "paperboats", content: "'Beta, did you eat.' I'm undone. Yes, you ate. She'd be glad." },
];

async function reset() {
  const order = [
    prisma.report, prisma.notification, prisma.message, prisma.conversation, prisma.circleMember, prisma.circle,
    prisma.bookmark, prisma.reaction, prisma.comment, prisma.post, prisma.moodEntry, prisma.companionMessage,
    prisma.companionSession, prisma.reframeEntry, prisma.weeklyReflection, prisma.aiUsage, prisma.block,
    prisma.follow, prisma.refreshSession, prisma.user,
  ] as unknown as { deleteMany: () => Promise<unknown> }[];
  for (const m of order) await m.deleteMany();
}

async function main() {
  console.log("🧹 clearing database…");
  await reset();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  console.log("👥 users…");
  const userByName = new Map<string, string>();
  for (const [i, u] of users.entries()) {
    const created = await prisma.user.create({
      data: {
        username: u.username,
        email: `${u.username}@example.com`,
        passwordHash,
        displayName: u.displayName,
        pronouns: u.pronouns,
        bio: u.bio,
        struggles: u.struggles,
        role: u.role ?? "USER",
        emailVerified: true,
        onboardedAt: D(30 - i),
        lastActiveAt: H(i * 3),
        createdAt: D(40 - i * 2),
        plan: u.username === "demo" ? "PLUS" : "FREE",
      },
    });
    userByName.set(u.username, created.id);
  }

  console.log("⭕ circles…");
  const circleBySlug = new Map<string, string>();
  for (const c of circles) {
    const created = await prisma.circle.create({ data: { ...c, isOfficial: true, createdById: userByName.get("demo") } });
    circleBySlug.set(c.slug, created.id);
  }
  // memberships: everyone joins circles matching their struggles (+ demo joins all)
  for (const u of users) {
    for (const c of circles) {
      const matches = c.tags.some((t) => u.struggles.includes(t)) || u.username === "demo";
      if (!matches) continue;
      await prisma.circleMember.create({
        data: { circleId: circleBySlug.get(c.slug)!, userId: userByName.get(u.username)!, role: u.username === "demo" ? "OWNER" : "MEMBER" },
      });
    }
  }
  for (const c of circles) {
    const memberCount = await prisma.circleMember.count({ where: { circleId: circleBySlug.get(c.slug)! } });
    await prisma.circle.update({ where: { id: circleBySlug.get(c.slug)! }, data: { memberCount } });
  }

  console.log("📝 posts…");
  const postIds: string[] = [];
  for (const p of posts) {
    const created = await prisma.post.create({
      data: {
        authorId: userByName.get(p.u)!,
        content: p.content,
        tags: p.tags,
        isAnonymous: !!p.anon,
        circleId: p.circle ? circleBySlug.get(p.circle)! : null,
        contentWarning: p.cw ?? null,
        createdAt: H(p.h),
        aiReviewedAt: H(p.h),
      },
    });
    postIds.push(created.id);
  }

  console.log("💬 comments…");
  const commentIds: string[] = [];
  for (const [i, cm] of comments.entries()) {
    const parentId = cm.replyToIdx !== undefined ? commentIds[cm.replyToIdx] ?? null : null;
    const post = posts[cm.post]!;
    const created = await prisma.comment.create({
      data: {
        postId: postIds[cm.post]!,
        authorId: userByName.get(cm.u)!,
        content: cm.content,
        isAnonymous: !!cm.anon,
        parentCommentId: parentId,
        createdAt: H(post.h - 1 - (i % 3) * 0.3),
      },
    });
    commentIds.push(created.id);
  }

  console.log("💛 reactions…");
  const types = ["HEART", "FEEL_THIS", "NOT_ALONE", "STRENGTH", "HUG"] as const;
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (const [i, postId] of postIds.entries()) {
    const reactors = users.filter((u) => u.username !== posts[i]!.u && rand() < 0.55);
    for (const r of reactors) {
      await prisma.reaction.create({ data: { postId, userId: userByName.get(r.username)!, type: types[Math.floor(rand() * types.length)]! } });
    }
  }
  for (const postId of postIds) {
    const [reactionCount, commentCount] = await Promise.all([prisma.reaction.count({ where: { postId } }), prisma.comment.count({ where: { postId } })]);
    await prisma.post.update({ where: { id: postId }, data: { reactionCount, commentCount } });
  }
  for (const c of circles) {
    const postCount = await prisma.post.count({ where: { circleId: circleBySlug.get(c.slug)! } });
    await prisma.circle.update({ where: { id: circleBySlug.get(c.slug)! }, data: { postCount } });
  }

  console.log("🤝 follows, bookmarks, moods, dms…");
  const follows: [string, string][] = [
    ["demo", "quietstorm"], ["demo", "after_the_rain"], ["demo", "halfway_home"], ["demo", "tinyvictories"],
    ["quietstorm", "demo"], ["quietstorm", "kabir_k"], ["notfinebutok", "demo"], ["notfinebutok", "slowmornings"],
    ["moth_to_lamp", "tinyvictories"], ["after_the_rain", "paperboats"], ["smallhours", "tinyvictories"], ["tinyvictories", "smallhours"],
    ["kabir_k", "quietstorm"], ["ghost_in_the_group_chat", "halfway_home"], ["halfway_home", "demo"], ["paperboats", "demo"],
  ];
  for (const [a, b] of follows) {
    await prisma.follow.create({ data: { followerId: userByName.get(a)!, followingId: userByName.get(b)! } });
  }
  for (const idx of [2, 5, 7, 21]) {
    await prisma.bookmark.create({ data: { userId: userByName.get("demo")!, postId: postIds[idx]! } });
  }
  const demoId = userByName.get("demo")!;
  const moods: [number, number, string[], string | null][] = [
    [13, 2, ["tired", "overwhelmed"], "shipped a deadline, felt nothing"],
    [12, 2, ["anxious", "tired"], null],
    [11, 3, ["restless"], "walked without headphones"],
    [10, 3, ["okay", "tired"], null],
    [9, 4, ["hopeful", "calm"], "slept 7 hours??"],
    [8, 3, ["numb"], null],
    [7, 2, ["sad", "lonely"], "sunday scaries came early"],
    [6, 3, ["anxious", "okay"], null],
    [5, 4, ["grateful", "calm"], "coffee with R"],
    [4, 3, ["tired"], null],
    [3, 4, ["hopeful"], "said no to the thing"],
    [2, 3, ["overwhelmed", "okay"], null],
    [1, 4, ["calm", "grateful"], "quiet evening. no screens after 10."],
  ];
  for (const [daysBack, score, feelings, note] of moods) {
    const d = D(daysBack);
    await prisma.moodEntry.create({ data: { userId: demoId, dayKey: dayKey(d), score, feelings, note, createdAt: d, updatedAt: d } });
  }
  // A couple of conversations for the demo account
  const tv = userByName.get("tinyvictories")!;
  const [a1, b1] = demoId < tv ? [demoId, tv] : [tv, demoId];
  const convo = await prisma.conversation.create({
    data: {
      userAId: a1, userBId: b1, initiatorId: tv, status: "ACCEPTED", lastMessageAt: H(3), lastMessagePreview: "same time next week? no pressure if the brain says no",
      unreadA: a1 === demoId ? 1 : 0, unreadB: b1 === demoId ? 1 : 0,
      messages: {
        create: [
          { senderId: tv, content: "hey — saw your anonymous-sounding post about the 5 hours of sleep thing (not assuming it was you!). just wanted to say the tired/depressed question is one I asked for a year.", createdAt: H(30) },
          { senderId: demoId, content: "ha, it was me. thank you for reaching out honestly. what did the year tell you?", createdAt: H(28) },
          { senderId: tv, content: "that it was both, and that fixing the sleep made the other one much easier to see clearly. not fixed. just visible.", createdAt: H(27) },
          { senderId: demoId, content: "'not fixed, just visible' is going on a sticky note", createdAt: H(26) },
          { senderId: tv, content: "same time next week? no pressure if the brain says no", createdAt: H(3) },
        ],
      },
    },
  });
  const sh = userByName.get("smallhours")!;
  const [a2, b2] = demoId < sh ? [demoId, sh] : [sh, demoId];
  await prisma.conversation.create({
    data: {
      userAId: a2, userBId: b2, initiatorId: sh, status: "PENDING", lastMessageAt: H(9), lastMessagePreview: "hi! you replied to my friends post a while ago…",
      unreadA: a2 === demoId ? 1 : 0, unreadB: b2 === demoId ? 1 : 0,
      messages: { create: [{ senderId: sh, content: "hi! you replied to my friends post a while ago and it stuck with me. would you be up for the occasional check-in? totally fine if not.", createdAt: H(9) }] },
    },
  });
  void convo;

  // Notifications for demo
  const n = (data: Prisma.NotificationUncheckedCreateInput) => prisma.notification.create({ data });
  await n({ userId: demoId, type: "REACTION", actorId: userByName.get("halfway_home")!, postId: postIds[22]!, createdAt: H(1), isRead: false });
  await n({ userId: demoId, type: "COMMENT", actorId: userByName.get("kabir_k")!, postId: postIds[4]!, commentId: commentIds[8]!, createdAt: H(4), isRead: false });
  await n({ userId: demoId, type: "FOLLOW", actorId: userByName.get("paperboats")!, createdAt: H(6), isRead: false });
  await n({ userId: demoId, type: "DM_REQUEST", actorId: sh, conversationId: (await prisma.conversation.findFirst({ where: { initiatorId: sh } }))!.id, createdAt: H(9), isRead: false });
  await n({ userId: demoId, type: "REACTION", actorId: userByName.get("quietstorm")!, postId: postIds[34]!, createdAt: H(20), isRead: true });
  await n({ userId: demoId, type: "CIRCLE_JOIN", actorId: userByName.get("smallhours")!, circleId: circleBySlug.get("lonely-together")!, createdAt: H(40), isRead: true });

  // A companion conversation for demo
  const session = await prisma.companionSession.create({ data: { userId: demoId, title: "can't switch my brain off", createdAt: H(50), updatedAt: H(49) } });
  await prisma.companionMessage.createMany({
    data: [
      { sessionId: session.id, role: "USER", content: "can't switch my brain off tonight. keep thinking about everything I didn't finish.", createdAt: H(50) },
      { sessionId: session.id, role: "ASSISTANT", content: "That sounds like the kind of tired where your body's done but your mind hasn't got the memo. The unfinished-things loop is brutal at night because there's nothing you can actually do about them until morning — so the brain just keeps rereading the list.\n\nCan I ask what's the one thing on that list that's loudest right now?", createdAt: H(49.9) },
      { sessionId: session.id, role: "USER", content: "the launch. everything's on me and I'm scared it'll be bad and people will see that", createdAt: H(49.5) },
      { sessionId: session.id, role: "ASSISTANT", content: "So underneath \"it'll be bad\" is \"people will see that I'm not enough.\" That's a heavier thought than a launch, and it makes sense your brain won't let it go — it's trying to protect you from being seen.\n\nHere's something small for tonight, not for the launch: write the one next step on paper, then close the notebook. Tell your brain the list is filed. It won't fully believe you, but it usually loosens a bit. And for what it's worth — the fact that you care this much is not evidence you're not enough. It's evidence you're building something that matters to you.", createdAt: H(49) },
    ],
  });

  // A saved reframe
  await prisma.reframeEntry.create({
    data: {
      userId: demoId,
      thought: "If the launch goes badly, everyone will finally see I've been faking it the whole time.",
      validation: "When you've carried something alone for months, it makes sense that the launch feels like a verdict on you rather than a release of software.",
      patterns: [
        { name: "mind-reading", how: "It assumes you already know what everyone will conclude about you." },
        { name: "all-or-nothing", how: "A launch can only be a triumph or an exposure — no room for 'shipped, learned, iterated'." },
        { name: "labelling", how: "'Faking it' turns a normal amount of uncertainty into a character flaw." },
      ],
      reframe: "I'm nervous because I care and because I've done this mostly alone. A rough launch would be information, not a verdict — and nobody who matters is keeping score the way my brain is.",
      tinyStep: "Text one person who knows you're launching and say 'nervous, could use a good luck'.",
      createdAt: H(45),
    },
  });

  const counts = { users: users.length, circles: circles.length, posts: postIds.length, comments: commentIds.length };
  console.log("✅ seeded", counts);
  console.log("   demo login → username: demo  password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
