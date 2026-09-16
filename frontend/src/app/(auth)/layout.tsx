import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

const VOICES = [
  { q: "Posted at 3am expecting nothing. Woke up to eleven people saying 'same'.", who: "quietstorm" },
  { q: "The 'not alone' reaction did more for me than a week of 'stay strong' texts.", who: "smallhours" },
  { q: "I talk to Ember when I can't afford to wake anyone. It doesn't try to fix me.", who: "halfway_home" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const voice = VOICES[0]!;
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-surface lg:block">
        <div className="aurora"><span /><span /><span /></div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <Wordmark size="lg" />
          <div className="max-w-md">
            <p className="font-display text-[40px] leading-[1.1] text-fg text-balance">It&apos;s okay to not be okay <span className="italic text-ember">here</span>.</p>
            <blockquote className="mt-10 border-l-2 border-ember/50 pl-5">
              <p className="font-display text-[20px] italic leading-snug text-fg">“{voice.q}”</p>
              <footer className="mt-2 text-[13px] text-fg-muted">— @{voice.who}, a member</footer>
            </blockquote>
          </div>
          <p className="text-[12.5px] text-fg-subtle">Peer support, not a medical service. In crisis? <Link href="/resources" className="text-ember hover:underline">Resources →</Link></p>
        </div>
      </section>
      <section className="flex flex-col px-5 py-8 sm:px-10 sm:py-12">
        <div className="mb-8 lg:hidden"><Wordmark /></div>
        <div className="mx-auto my-auto w-full max-w-[400px]">{children}</div>
      </section>
    </div>
  );
}
