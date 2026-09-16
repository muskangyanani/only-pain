import { PageHeader } from "@/components/layout/page-header";
import { Untangle } from "@/components/tools/untangle";

export const metadata = { title: "Untangle" };

export default function UntanglePage() {
  return (
    <div>
      <PageHeader back="/tools" title="Untangle" subtitle="For the thought that's been running the show." />
      <Untangle />
    </div>
  );
}
