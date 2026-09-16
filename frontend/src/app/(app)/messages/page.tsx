import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";

export default function MessagesIndex() {
  return (
    <div className="hidden h-[calc(100dvh-2.5rem)] items-center justify-center lg:flex">
      <EmptyState icon={<MessageCircle />} title="Pick a conversation" body="Or find someone who gets it in Explore. Requests keep strangers at arm's length until you say otherwise." />
    </div>
  );
}
