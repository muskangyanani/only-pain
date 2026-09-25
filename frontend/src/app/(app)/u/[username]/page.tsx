import type { Metadata } from "next";
import { ProfileView } from "./profile-view";

import { backendUrl } from "@/lib/server-env";

const API = backendUrl();

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const res = await fetch(`${API}/api/users/${username}`, { next: { revalidate: 300 } });
    const json = await res.json();
    if (json?.success) {
      const u = json.data as { username: string; displayName?: string | null; bio?: string | null };
      return { title: u.displayName ? `${u.displayName} (@${u.username})` : `@${u.username}`, description: u.bio ?? `@${u.username} on only pain` };
    }
  } catch {}
  return { title: `@${username}` };
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileView username={username} />;
}
