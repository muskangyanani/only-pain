import { Legal } from "@/components/marketing/legal";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <Legal title="Terms of use" updated="September 2026">
      <p>By using only pain you agree to these terms and to the <a href="/guidelines" className="text-ember">community guidelines</a>. Plain language on purpose.</p>
      <h2>What only pain is — and isn&apos;t</h2>
      <p>only pain is a peer-support community with an AI companion. It is <strong>not</strong> a medical, psychological, or emergency service, and nothing here — including anything Ember says — is medical advice or a substitute for care from a qualified professional. If you are in immediate danger, contact local emergency services (India: 112) or a helpline listed on our <a href="/resources" className="text-ember">resources page</a>.</p>
      <h2>Your account</h2>
      <ul>
        <li>You must be 16 or older.</li>
        <li>You are responsible for keeping your password safe. You can log out of every device from Settings.</li>
        <li>One account per person. Don&apos;t impersonate anyone.</li>
      </ul>
      <h2>Your content</h2>
      <p>You own what you write. You give us a licence to store and display it so the service can work. You can delete it at any time; deleted content is removed, not archived.</p>
      <h2>Acceptable use</h2>
      <p>Follow the community guidelines. In short: no content that encourages or instructs self-harm, suicide, disordered eating or substance misuse; no harassment, hate, doxxing, spam, or sexual content involving minors. We may hide or remove content and suspend accounts that violate these rules, with priority given to safety over speed.</p>
      <h2>Ember and AI features</h2>
      <p>Ember is an AI. It can be wrong, and it can misunderstand. Free accounts have daily usage limits; Plus accounts have fair-use limits. We may change limits with notice.</p>
      <h2>Plus</h2>
      <p>Plus is a monthly subscription billed through Stripe. Cancel any time from Settings → Plus; access continues to the end of the paid period. We don&apos;t offer partial refunds, but if something went wrong, email us and we&apos;ll be reasonable.</p>
      <h2>Liability</h2>
      <p>The service is provided as-is. To the fullest extent permitted by law we are not liable for indirect or consequential losses arising from your use of only pain. Nothing here limits liability that cannot be limited by law.</p>
      <h2>Changes</h2>
      <p>If we change these terms materially we&apos;ll say so in-app before it takes effect.</p>
      <p>Questions: <a href="mailto:hello@onlypain.app" className="text-ember">hello@onlypain.app</a></p>
    </Legal>
  );
}
