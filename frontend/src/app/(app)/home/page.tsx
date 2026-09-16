"use client";

import * as React from "react";
import { Sparkles, Clock, Users } from "lucide-react";
import { qk } from "@/lib/query-keys";
import { useMe } from "@/hooks/use-me";
import { useStoredValue } from "@/hooks/use-now";
import { Feed } from "@/components/feed/feed";
import { PostComposer } from "@/components/post/post-composer";
import { Segmented } from "@/components/ui/misc";
import { greeting } from "@/lib/time";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Tab = "foryou" | "latest" | "following";

export default function HomePage() {
  const { me, isLoading } = useMe();
  const stored = useStoredValue("op:tab") as Tab | null;
  const [tab, setTab] = React.useState<Tab | null>(null);
  const change = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem("op:tab", t);
    } catch {}
  };
  const effective: Tab = me ? tab ?? stored ?? "foryou" : "latest";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-fg md:text-[30px]">
            {me ? <>{greeting()}, <span className="italic text-ember">{me.displayName?.split(" ")[0] || me.username}</span>.</> : <>the heavy stuff, <span className="italic text-ember">together</span>.</>}
          </h1>
          <p className="mt-0.5 text-[13.5px] text-fg-muted">{me ? "No pressure to post. Reading counts." : "Real people, real nights. Join to post, react and find your circle."}</p>
        </div>
        {me ? (
          <Segmented value={effective} onChange={change} options={[{ value: "foryou", label: "For you", icon: <Sparkles className="size-3.5" /> }, { value: "latest", label: "Latest", icon: <Clock className="size-3.5" /> }, { value: "following", label: "Following", icon: <Users className="size-3.5" /> }]} />
        ) : !isLoading ? (
          <Button asChild size="sm"><Link href="/signup">Join, it&apos;s free</Link></Button>
        ) : null}
      </div>

      {me && !me.onboardedAt && (
        <Link href="/onboarding" className="card flex items-center gap-4 border-ember/30 p-4 transition-shadow hover:shadow-glow">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-ember-soft text-ember"><Sparkles className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold text-fg">Tell us what you&apos;re carrying</span><span className="block text-[13px] text-fg-muted">Two minutes. It shapes your feed and finds people who get it.</span></span>
          <span className="text-[13px] font-medium text-ember">Start →</span>
        </Link>
      )}

      {me && <PostComposer />}

      <Feed
        key={effective}
        queryKey={qk.feed(effective)}
        path="/api/feed"
        params={{ tab: effective }}
        emptyTitle={effective === "following" ? "Nobody you follow has posted yet" : effective === "foryou" ? "Your feed is still forming" : "Quiet in here"}
        emptyBody={effective === "following" ? "Follow a few people from Explore and their posts will land here." : effective === "foryou" ? "Tell us what you're carrying in Settings, join a circle or two, and this will start to feel like yours." : "Be the first to say something tonight."}
        emptyAction={effective !== "latest" ? <Button asChild variant="outline"><Link href="/explore">Explore</Link></Button> : undefined}
      />
    </div>
  );
}
