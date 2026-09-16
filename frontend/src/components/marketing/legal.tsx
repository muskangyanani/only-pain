export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-[40px] leading-tight text-fg">{title}</h1>
      <p className="mt-2 text-[13px] text-fg-subtle">Last updated {updated}</p>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-fg-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-fg">{children}</div>
    </article>
  );
}
