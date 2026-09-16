"use client";

import { useParams } from "next/navigation";
import { EmberChat } from "@/components/tools/ember-chat";

export default function EmberSessionPage() {
  const { id } = useParams<{ id: string }>();
  return <EmberChat sessionId={id} />;
}
