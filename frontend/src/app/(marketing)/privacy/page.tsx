import { Legal } from "@/components/marketing/legal";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Legal title="Privacy" updated="September 2026">
      <p>This is written to be read, not skimmed past. The short version: we collect as little as we can, we never sell it, and anonymous means anonymous.</p>
      <h2>What we store</h2>
      <ul>
        <li><strong>Account:</strong> username, email, a password hash (never the password), optional display name, pronouns, bio, avatar URL, and the struggles you select.</li>
        <li><strong>What you write:</strong> posts, comments, messages, mood check-ins, Ember conversations, untanglings and reflections. All deletable by you; deletion is permanent.</li>
        <li><strong>Technical:</strong> login sessions (device string, IP address) so you can see and revoke them, and basic server logs kept for a short period for debugging and abuse prevention.</li>
      </ul>
      <h2>Anonymous posts</h2>
      <p>An anonymous post keeps your account id in the database so that you can find and delete it. That link is stripped at the service layer before any response leaves the server — it is not shown in feeds, on profiles, in notifications, or in the moderation queue. Moderators see anonymous content as anonymous.</p>
      <h2>AI processing</h2>
      <p>Ember conversations and the safety review of new posts are processed by a third-party model provider (Anthropic) under our API terms; they are not used to train models. The safety pass reads text to estimate risk to the author and harm to readers. Its output is a label and a one-sentence rationale, stored with the post for moderators.</p>
      <h2>Who can see what</h2>
      <ul>
        <li>Public posts, comments, your public profile and your non-anonymous post history are visible to anyone, including logged-out visitors.</li>
        <li>Mood check-ins, Ember chats, untanglings, reflections, saved posts and your anonymous post list are private to you. A 7-day mood ring appears on your profile only if you switch it on.</li>
        <li>Direct messages are visible only to the two participants and, when reported, to moderators handling that report.</li>
      </ul>
      <h2>Payments</h2>
      <p>Plus is billed by Stripe. We never see your card number. We store your Stripe customer id, subscription status and renewal date.</p>
      <h2>Your rights</h2>
      <p>Export everything from Settings → Your data. Delete your account from Settings → Danger zone; this removes your content immediately. Email <a href="mailto:privacy@onlypain.app" className="text-ember">privacy@onlypain.app</a> for anything else.</p>
      <h2>Cookies</h2>
      <p>Two httpOnly cookies keep you logged in. A local-storage entry remembers your feed tab and theme. That is all.</p>
      <h2>Children</h2>
      <p>only pain is for people 16 and older.</p>
    </Legal>
  );
}
