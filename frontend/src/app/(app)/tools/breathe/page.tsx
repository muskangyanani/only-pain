import { PageHeader } from "@/components/layout/page-header";
import { BreatheWidget } from "@/components/tools/breathe";

export const metadata = { title: "Breathe" };

export default function BreathePage() {
  return (
    <div>
      <PageHeader back="/tools" title="Breathe" subtitle="Follow the circle. Longer out than in tells your body it's safe." />
      <BreatheWidget />
      <p className="mt-4 text-center text-[13px] text-fg-subtle">If breathing exercises make you more anxious (it happens), stop — try naming five things you can see instead.</p>
    </div>
  );
}
