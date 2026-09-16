import { PageHeader } from "@/components/layout/page-header";
import { CrisisResources } from "@/components/misc/crisis-resources";

export const metadata = { title: "Crisis resources" };

const NOW = [
  "Move to a different room, or step outside, even for a minute. Changing where your body is changes what your brain is doing.",
  "Put anything you could use to hurt yourself somewhere harder to reach. Just for tonight.",
  "Text or call one person. You don't need a script. \"Rough night, can you talk?\" is enough.",
  "Cold water on your face or hands. Hold ice. It sounds silly and it works on the nervous system.",
  "Set a timer for 10 minutes and promise yourself only that much. Then another 10.",
];

export default function ResourcesPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="If tonight is bad" subtitle="You don't have to be certain it's an emergency to reach out." sticky={false} />
      <CrisisResources title="Talk to a person now" intro="Free, confidential, and used to hearing exactly what you're about to say." />
      <div className="card p-5">
        <h2 className="font-display text-[20px] text-fg">The next ten minutes</h2>
        <ol className="mt-3 space-y-3">
          {NOW.map((t, i) => <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-fg"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ember-soft text-[12px] font-semibold text-ember">{i + 1}</span>{t}</li>)}
        </ol>
      </div>
      <div className="card p-5 text-[14px] leading-relaxed text-fg-muted">
        <h2 className="font-display text-[20px] text-fg">If you&apos;re worried about someone here</h2>
        <p className="mt-2">Use <strong className="text-fg">Report → I&apos;m worried about this person</strong> on their post. Moderators see those first. If you know them offline and believe they&apos;re in immediate danger, contact local emergency services — in India, 112.</p>
        <p className="mt-2">only pain is peer support. It isn&apos;t a substitute for a doctor, therapist, or emergency care, and the people here — including Ember — can&apos;t provide those.</p>
      </div>
    </div>
  );
}
