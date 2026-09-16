import type { Metadata } from "next";
import { PostDetail } from "./post-detail";

const API = process.env.API_PROXY_URL ?? "http://localhost:4000";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/api/posts/${id}`, { next: { revalidate: 120 } });
    const json = await res.json();
    if (json?.success) {
      const p = json.data as { content: string; isAnonymous: boolean; author: { username: string; displayName?: string | null } };
      const who = p.isAnonymous ? "Anonymous" : p.author.displayName || `@${p.author.username}`;
      const snippet = p.content.length > 70 ? `${p.content.slice(0, 70).trimEnd()}…` : p.content;
      return { title: `${who}: “${snippet}”`, description: p.content.slice(0, 160), openGraph: { title: `${who} on only pain`, description: p.content.slice(0, 160) } };
    }
  } catch {}
  return { title: "Post" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail id={id} />;
}
