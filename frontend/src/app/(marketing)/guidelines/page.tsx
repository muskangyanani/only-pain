import { Legal } from "@/components/marketing/legal";

export const metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <Legal title="Community guidelines" updated="September 2026">
      <p>These exist so this stays a place where people can be honest about the worst of it without being hurt or hurting anyone else.</p>
      <h2>Welcome here</h2>
      <ul>
        <li>Venting. Rage. Numbness. Dark humour about your own life. Not knowing what you feel.</li>
        <li>Talking about suicidal thoughts, self-harm, relapse, eating struggles — <strong>as your experience</strong>. Add a content note when it might land hard on someone else.</li>
        <li>Asking for advice. Not wanting advice. Say which.</li>
        <li>Small wins that sound tiny to anyone who doesn&apos;t get it.</li>
      </ul>
      <h2>Not welcome</h2>
      <ul>
        <li>Methods, encouragement, or romanticising of suicide or self-harm. Pro-eating-disorder content. Dosing or sourcing information.</li>
        <li>Harassment, pile-ons, mockery of someone&apos;s pain, or telling someone to &quot;just&quot; anything.</li>
        <li>Hate on the basis of who someone is. Doxxing. Screenshots taken outside.</li>
        <li>Spam, selling, recruiting, or unsolicited &quot;coaching&quot;.</li>
        <li>Diagnosing strangers. Sharing someone&apos;s private messages.</li>
      </ul>
      <h2>How to respond to hard posts</h2>
      <p>Reflect what you read. Say you&apos;re there. Don&apos;t rush to fix. If you don&apos;t have words, use a reaction — that&apos;s exactly what they&apos;re for. If someone sounds like they&apos;re in danger, reply gently <em>and</em> report with &quot;I&apos;m worried about this person&quot; so a moderator sees it fast.</p>
      <h2>How moderation works</h2>
      <p>A safety model reads new posts and flags risk and harm; humans decide. Hidden content shows its author a notice and can be restored. Bans are for repeated harm to others, never for being in pain. Anonymous content stays anonymous, even to moderators.</p>
      <h2>If you break a rule</h2>
      <p>Mostly: the content comes down and you get a note. For harm to others: suspension. You can always ask why at <a href="mailto:safety@onlypain.app" className="text-ember">safety@onlypain.app</a>.</p>
    </Legal>
  );
}
