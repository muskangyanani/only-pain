import { Wordmark } from "@/components/brand/wordmark";

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="aurora"><span /><span /><span /></div>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8">
        <Wordmark href="/home" />
        <div className="my-auto py-10">{children}</div>
      </div>
    </div>
  );
}
