import Link from "next/link";
import { Wind, Sparkles, Activity, BookOpenText, LifeBuoy, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const TOOLS = [
  { href: "/tools/breathe", icon: Wind, title: "Breathe", body: "Three guided patterns for the tight-chest moments. No account of your breath is kept.", tone: "bg-sky-soft text-sky" },
  { href: "/tools/untangle", icon: Sparkles, title: "Untangle", body: "Hand Ember the thought that's looping. Get it back kinder, and more accurate.", tone: "bg-violet-soft text-violet" },
  { href: "/tools/mood", icon: Activity, title: "Mood", body: "A 10-second daily check-in and a quiet chart of your month. Private by default.", tone: "bg-ember-soft text-ember" },
  { href: "/tools/reflection", icon: BookOpenText, title: "Weekly reflection", body: "Ember reads your week and writes back what it noticed. Part of Plus.", tone: "bg-gold-soft text-gold" },
  { href: "/resources", icon: LifeBuoy, title: "Crisis resources", body: "Helplines by country and what to do in the next ten minutes.", tone: "bg-rose-soft text-rose" },
];

export default function ToolsPage() {
  return (
    <div>
      <PageHeader title="Tools" subtitle="Small, doable things for hard moments." sticky={false} />
      <div className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card group flex gap-4 p-5 transition-shadow hover:shadow-pop">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-display text-[19px] text-fg">{t.title} <ArrowRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" /></span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-fg-muted">{t.body}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
