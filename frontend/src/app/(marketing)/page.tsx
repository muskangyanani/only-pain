import Link from "next/link";
import { Ghost, Users, Sparkles, ShieldCheck, HandHeart, Moon, ArrowRight, Check } from "lucide-react";
import { REACTIONS, REACTION_META, PLUS_PRICE, type ReactionType } from "@/lib/constants";
import { ReactionIcon, REACTION_TONE } from "@/components/icons/reaction-icon";
import { Button } from "@/components/ui/button";
import { EmberMark } from "@/components/brand/wordmark";

function MockPost({ name, handle, time, body, tags, anon, reactions, replies }: { name: string; handle?: string; time: string; body: string; tags: string[]; anon?: boolean; reactions: [ReactionType, number][]; replies: number }) {
  return (
    <div className="card p-5 text-left">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full ${anon ? "bg-surface-2 text-fg-subtle" : "text-white"}`} style={anon ? undefined : { background: "linear-gradient(135deg, oklch(0.72 0.14 300), oklch(0.55 0.16 350))" }}>{anon ? <Ghost className="size-5" /> : name[0]}</span>
        <div className="text-[14px]"><span className="font-semibold text-fg">{name}</span> {handle && <span className="text-fg-subtle">@{handle}</span>} <span className="text-fg-subtle">· {time}</span></div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-fg">{body}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((t) => <span key={t} className="rounded-full border border-border bg-surface px-2 text-[11.5px] font-medium leading-6 text-fg-muted">#{t}</span>)}</div>
      <div className="mt-4 flex items-center gap-1.5 text-[13px]">
        {reactions.map(([r, n]) => <span key={r} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-2.5 text-fg-muted"><ReactionIcon type={r} className={`size-4 ${REACTION_TONE[r].text}`} />{n}</span>)}
        <span className="ml-auto text-fg-subtle">{replies} replies</span>
      </div>
    </div>
  );
}

const FAQ = [
  ["Is this therapy?", "No. only pain is peer support — people who get it, plus Ember, an AI companion. We'll always point you to professionals and helplines, and we'll never pretend to be one."],
  ["How anonymous is anonymous?", "An anonymous post stores your account id in the database (so you can delete it) but that link is never sent to any screen — not the feed, not your profile, not moderators. Your public profile only shows what you posted as yourself."],
  ["What does the AI actually do?", "Ember is a companion you can talk to. Separately, a safety model reads new posts to spot someone who might be at risk and quietly surfaces helplines to them, and to hide genuinely harmful content (methods, pro-self-harm) until a human moderator looks. It doesn't hide venting. Dark humour is safe here."],
  ["Who can message me?", "Nobody, until you say so. Messages start as requests you can accept, decline or ignore. You can also limit requests to people you follow, or turn them off."],
  ["What does Plus pay for?", "The servers, the AI, and the free tier. Plus removes the daily Ember limit and adds the weekly reflection. If you can't pay and need more Ember, email us — nobody gets turned away."],
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <section className="relative px-6 pb-20 pt-16 sm:pt-24">
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated/70 px-3.5 py-1.5 text-[12.5px] font-medium text-fg-muted"><Moon className="size-3.5 text-violet" /> open all night · anonymous by default · no toxic positivity</p>
            <h1 className="mt-6 font-display text-[44px] leading-[1.02] text-fg text-balance sm:text-[68px]">It&apos;s okay to not be okay <span className="italic text-ember">here</span>.</h1>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-fg-muted text-pretty">only pain is a quiet corner of the internet for the heavy stuff — anxiety, burnout, grief, the 3am thoughts. Post anonymously, find people who actually get it, and talk to Ember when nobody else is awake.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/signup">Join, it&apos;s free <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/home">Just read for now</Link></Button>
            </div>
            <p className="mt-4 text-[12.5px] text-fg-subtle">The name is a joke. The place isn&apos;t.</p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            <MockPost name="Anonymous" anon time="3h" body="Genuinely don't know if I'm tired or depressed or just a person who has been running on 5 hours of sleep for six months. Is there a difference at this point?" tags={["burnout", "insomnia", "advice wanted"]} reactions={[["FEEL_THIS", 14], ["NOT_ALONE", 9]]} replies={11} />
            <MockPost name="Dev" handle="halfway_home" time="20h" body="412 days. Last night was the first night in a while I really wanted a drink. Sat in the car outside the shop for twenty minutes. Drove home. Made tea. Hated the tea. Still 412." tags={["recovery", "small wins"]} reactions={[["STRENGTH", 31], ["HUG", 12]]} replies={18} />
            <MockPost name="Priya" handle="after_the_rain" time="2d" body="Found a voice note from her. 12 seconds. 'Beta, did you eat.' I've listened to it forty times today. Yes amma. I ate." tags={["grief", "family"]} reactions={[["HEART", 40], ["NOT_ALONE", 22]]} replies={9} />
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ember">Three things you can do at 3am</p>
        <h2 className="mt-2 max-w-2xl font-display text-[36px] leading-[1.08] text-fg text-balance sm:text-[44px]">Say it. Find your people. Or just have someone to talk to.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: Ghost, tone: "bg-violet-soft text-violet", title: "Post anonymously", body: "Flip one switch and it's just words, not you. Your identity never reaches the screen — not the feed, not your profile, not the moderators' view. Content notes let you warn readers without hiding yourself." },
            { icon: Users, tone: "bg-ember-soft text-ember", title: "Find people who get it", body: "Tell us what you're carrying and we'll show you the people carrying the same — with the reason spelled out. Join circles: small rooms like 3am club, the grief kitchen, burnout ward. Messages start as requests, so nobody gets in uninvited." },
            { icon: Sparkles, tone: "bg-sky-soft text-sky", title: "Talk to Ember", body: "An AI companion that listens first and doesn't flinch. It keeps a few tools in its pocket — breathing, grounding, untangling the looping thought — and hands you to a human helpline the moment it matters. Private to you. Delete any time." },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <span className={`flex size-12 items-center justify-center rounded-2xl ${f.tone}`}><f.icon className="size-6" /></span>
              <h3 className="mt-5 font-display text-[24px] text-fg">{f.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted text-pretty">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div className="aurora"><span /><span /><span /></div>
          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ember">Reactions that mean something</p>
              <h2 className="mt-2 font-display text-[34px] leading-[1.08] text-fg text-balance">A heart is fine. Sometimes you need <span className="italic">“I feel this.”</span></h2>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">Five reactions built for hard posts, so you can respond without finding words. They&apos;re counted, never ranked. There&apos;s no algorithm rewarding the saddest post.</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {REACTIONS.map((r) => (
                <div key={r} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-bg-elevated/70 px-2 py-4 text-center">
                  <ReactionIcon type={r} className={`size-9 ${REACTION_TONE[r].text}`} />
                  <span className="text-[11px] font-medium leading-tight text-fg-muted">{REACTION_META[r].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sage">Safety, seriously</p>
            <h2 className="mt-2 font-display text-[36px] leading-[1.08] text-fg text-balance">Honest venting stays up. Harm doesn&apos;t.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-fg-muted text-pretty">Mental-health spaces fail in two ways: policing pain, or letting it fester into harm. We try to do neither.</p>
          </div>
          <ul className="space-y-4">
            {([
              [ShieldCheck, "A safety model reads new posts for risk and harm. Someone who sounds at risk quietly gets helplines — no flags, no shame. Harmful content (methods, pro-self-harm) is held until a human looks."],
              [HandHeart, "Crisis language surfaces resources instantly, in the composer, before you even post. Nothing is blocked; the door just opens."],
              [Users, "Human moderators see high-risk reports first. Report → \"I'm worried about this person\" jumps the queue."],
              [Ghost, "Requests gate every DM. Blocks are mutual and invisible. Anonymous is anonymous."],
            ] as [React.ElementType, string][]).map(([Icon, text], i) => (
              <li key={i} className="flex gap-4 rounded-2xl border border-border bg-bg-elevated/60 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage"><Icon className="size-4.5" /></span>
                <p className="text-[14.5px] leading-relaxed text-fg">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="plus" className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">Free, forever</p>
            <p className="mt-2 font-display text-[40px] leading-none text-fg">₹0</p>
            <ul className="mt-6 space-y-2.5 text-[14.5px] text-fg">{["Everything social: post, react, comment, circles, DMs", "Ember — 15 messages a day", "Untangle, mood check-ins, breathing", "Crisis resources, always"].map((x) => <li key={x} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-sage" />{x}</li>)}</ul>
          </div>
          <div className="card relative overflow-hidden border-ember/40 p-8 shadow-glow">
            <div className="aurora"><span /><span /><span /></div>
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ember"><EmberMark size={16} /> Plus</p>
              <p className="mt-2 font-display text-[40px] leading-none text-fg">{PLUS_PRICE}<span className="text-lg text-fg-muted"> / month</span></p>
              <ul className="mt-6 space-y-2.5 text-[14.5px] text-fg">{["Ember without a daily limit", "A weekly reflection Ember writes about your week", "More untanglings and reply ideas", "You keep the free tier free for someone else"].map((x) => <li key={x} className="flex gap-2.5"><Sparkles className="mt-0.5 size-4 shrink-0 text-ember" />{x}</li>)}</ul>
              <Button asChild size="lg" className="mt-8 w-full"><Link href="/signup">Start free, upgrade if it helps</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-[34px] leading-tight text-fg">Fair questions.</h2>
        <div className="mt-6 divide-y divide-border">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-fg">{q}<span className="text-fg-subtle transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted text-pretty">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-fg px-8 py-14 text-center text-bg">
          <h2 className="font-display text-[36px] leading-[1.05] text-balance sm:text-[48px]">You don&apos;t have to be okay to be here.</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] opacity-75">Make an account in a minute. Post nothing for a month. That&apos;s allowed.</p>
          <Button asChild size="lg" className="mt-8"><Link href="/signup">Join only pain</Link></Button>
        </div>
      </section>
    </div>
  );
}
