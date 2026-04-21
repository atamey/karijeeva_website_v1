import PolicyShell from "@/components/marketing/PolicyShell";
import { Link } from "react-router-dom";
import { useSiteSettings, pick } from "@/lib/siteSettings";

const LAST_UPDATED = "14 February 2026";

function FooterNote() {
  const settings = useSiteSettings();
  const legalEmail = pick(settings, "legal_email");
  return (
    <>For legal questions, please contact <a className="underline" href={`mailto:${legalEmail}`}>{legalEmail}</a>. This policy is subject to periodic review.</>
  );
}

// ─── Shipping Policy ────────────────────────────────────────────────
export function ShippingPolicy() {
  const settings = useSiteSettings();
  const supportEmail = pick(settings, "support_email");
  const supportPhone = pick(settings, "support_phone");
  const hours = pick(settings, "hours_ist");
  const fssai = pick(settings, "fssai_license");
  return (
    <PolicyShell
      testid="page-shipping-policy"
      kicker="Policy"
      title="Shipping &amp; Delivery"
      seoTitle="Shipping Policy — Karijeeva"
      seoDescription="Karijeeva shipping policy: dispatch within 24–48 hours, 5–7 day pan-India delivery, free shipping over ₹999, damaged-in-transit claim window of 48 hours."
      lastUpdated={LAST_UPDATED}
      breadcrumb={[{ name: "Shipping Policy", path: "/shipping-policy" }]}
      footerNote={<FooterNote />}
      sections={[
        { id: "dispatch", title: "Dispatch time", body: (
          <>
            <p>Orders placed before 4:00 PM IST on a business day are dispatched the same day. Orders placed after 4:00 PM, on weekends, or on public holidays are dispatched on the next business day. <strong>Target dispatch window is 24–48 business hours from payment confirmation.</strong></p>
            <p>You will receive an email and SMS with the tracking number (AWB) and carrier name the moment your order leaves our packing house.</p>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold/80 pt-2" data-testid="shipping-trust-note">
              FSSAI Licence: {fssai} · {hours}
            </p>
          </>
        ) },
        { id: "sla", title: "Delivery SLA", body: (
          <>
            <p>Once dispatched, you can expect delivery within:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Metros (Bengaluru, Chennai, Mumbai, Delhi, Hyderabad, Kolkata, Pune, Ahmedabad):</strong> 3–5 business days</li>
              <li><strong>Tier-2 cities and rest of pan-India:</strong> 5–7 business days</li>
              <li><strong>Northeast India and Jammu &amp; Kashmir:</strong> 7–10 business days</li>
            </ul>
            <p>These are carrier SLAs, not guarantees — weather, regional holidays, and occasional carrier exceptions can add 24–48 hours.</p>
          </>
        ) },
        { id: "fees", title: "Shipping fees", body: (
          <>
            <p><strong>Free shipping on all orders above ₹999.</strong> For orders below ₹999, a flat shipping fee of <strong>₹49</strong> applies, shown transparently at checkout before payment.</p>
            <p>No surprise handling fees, no cash-on-delivery surcharge (when COD is available), no fuel levies.</p>
          </>
        ) },
        { id: "serviceable", title: "Serviceable pincodes", body: (
          <>
            <p>We ship only within the <strong>Republic of India</strong> during the MVP launch. All Indian pincodes reachable by our courier partners are serviceable. If your pincode is not serviceable, you will be informed at checkout before payment.</p>
            <p>International shipping is on our post-launch roadmap.</p>
          </>
        ) },
        { id: "carriers", title: "Our carrier partners", body: (
          <>
            <p>We ship through one of: <strong>Delhivery, Blue Dart, DTDC, Ecom Express, or India Post Speed Post</strong>, chosen per pincode for the fastest reliable route. You will see the carrier and AWB number on your tracking link.</p>
          </>
        ) },
        { id: "tracking", title: "Tracking your order", body: (
          <>
            <p>Three ways to track an active order:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The tracking link in your dispatch email / SMS.</li>
              <li>Logged-in customers: <Link className="underline" to="/account/orders">/account/orders</Link> → Track.</li>
              <li>Guests: <Link className="underline" to="/track-order">/track-order</Link> with your order number + email.</li>
            </ul>
          </>
        ) },
        { id: "rto", title: "Undelivered / wrong address", body: (
          <>
            <p>If a shipment is returned-to-origin (RTO) because of an incorrect address, an unreachable phone, or three failed delivery attempts, we will reach out to confirm before re-dispatching. A re-dispatch fee of <strong>₹100</strong> may apply to cover the second courier leg.</p>
            <p>If you'd rather cancel and refund at that stage, we will refund the product amount — the original shipping fee is not refundable once a shipment has moved.</p>
          </>
        ) },
        { id: "damaged", title: "Damaged in transit", body: (
          <>
            <p><strong>Report within 48 hours of delivery</strong> by emailing <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your order number</li>
              <li>A short unboxing photo or video clearly showing the damage / leakage</li>
              <li>A photo of the outer carton showing any courier-side damage stickers</li>
            </ul>
            <p>We will ship a replacement or issue a full refund — your choice. No question you can't ask.</p>
          </>
        ) },
        { id: "help", title: "Need help? Call us", body: (
          <>
            <p>Prefer the phone? Our support desk is open {hours}.</p>
            <p>Call <a className="underline" href={`tel:${supportPhone.replace(/[^+\d]/g, "")}`}>{supportPhone}</a> or email <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> with your order number — we usually pick up on the first ring.</p>
          </>
        ) },
      ]}
    />
  );
}

// ─── Returns & Refunds ──────────────────────────────────────────────
export function ReturnsPolicy() {
  const settings = useSiteSettings();
  const supportEmail = pick(settings, "support_email");
  return (
    <PolicyShell
      testid="page-returns-policy"
      kicker="Policy"
      title="Returns &amp; Refunds"
      seoTitle="Returns &amp; Refunds Policy — Karijeeva"
      seoDescription="Return your Karijeeva order within 7 days of delivery for unopened bottles; damaged-in-transit refunds within 48 hours; Razorpay refunds in 5–7 business days."
      lastUpdated={LAST_UPDATED}
      breadcrumb={[{ name: "Returns Policy", path: "/returns-policy" }]}
      footerNote={<FooterNote />}
      sections={[
        { id: "window", title: "Return window", body: (
          <>
            <p>You have <strong>7 days from the date of delivery</strong> to initiate a return. Because we sell a food-grade product, returns are restricted to <strong>unopened bottles with the tamper-evident seal intact</strong>. Opened, partially consumed, or seal-broken bottles cannot be returned for food-safety reasons.</p>
          </>
        ) },
        { id: "qualifies", title: "What qualifies for return", body: (
          <>
            <ul className="list-disc pl-6 space-y-1">
              <li>Wrong product delivered</li>
              <li>Damaged-in-transit (report within 48 hours — see <Link className="underline" to="/shipping-policy">Shipping Policy</Link>)</li>
              <li>Leaked bottle</li>
              <li>Manufacturing defect — off-aroma, visible contamination, broken seal on arrival</li>
              <li>Unopened bottle you simply changed your mind about, within the 7-day window</li>
            </ul>
          </>
        ) },
        { id: "does-not", title: "What doesn't qualify", body: (
          <>
            <ul className="list-disc pl-6 space-y-1">
              <li>Bottles that have been opened, partially consumed, or had the seal broken</li>
              <li>Returns initiated after the 7-day window</li>
              <li>Damage caused by customer handling (e.g. dropped bottle after delivery)</li>
              <li>Oil that has solidified in winter — this is a sign of purity, not a defect. Warm the bottle in hot water for 2 minutes.</li>
            </ul>
          </>
        ) },
        { id: "initiate", title: "How to initiate a return", body: (
          <>
            <p>Two ways:</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>From your order page — click <strong>Cancel or Return</strong>, pick a reason, add a note. We respond within 24 hours.</li>
              <li>Or email <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> with your order number and the issue. Photos / video if damage.</li>
            </ol>
          </>
        ) },
        { id: "inspection", title: "Inspection &amp; approval", body: (
          <>
            <p>We send a courier to pick up the bottle — there is no charge to you on approved return requests. Once the bottle reaches our warehouse we inspect it within <strong>48 hours of receipt</strong> and email you the decision (approved / further info needed / declined with reason).</p>
          </>
        ) },
        { id: "refund-timeline", title: "Refund timeline", body: (
          <>
            <p>Approved refunds are issued via Razorpay to the <strong>original source of payment</strong> within <strong>5–7 business days</strong> of approval. UPI / cards typically settle within 3–5 days; netbanking and EMI can take up to 7.</p>
            <p>You will receive a refund confirmation email with the Razorpay refund reference ID the moment we issue the refund.</p>
          </>
        ) },
        { id: "replacement", title: "Replacement or refund — your choice", body: (
          <>
            <p>For damaged, defective, or wrong-product cases, you can pick <strong>replacement</strong> (we ship out a fresh bottle the same day of approval) or a <strong>full refund</strong>. We default to refund if you don't specify.</p>
          </>
        ) },
        { id: "cancellations", title: "Cancelling before dispatch", body: (
          <>
            <p>Orders can be cancelled any time before dispatch for a <strong>full refund</strong>. After dispatch, the shipment has to be received before a return can be initiated under the terms above.</p>
          </>
        ) },
      ]}
    />
  );
}

// ─── Privacy Policy ─────────────────────────────────────────────────
export function PrivacyPolicy() {
  const settings = useSiteSettings();
  const company = pick(settings, "company_name");
  const cin = pick(settings, "cin");
  const addr = pick(settings, "registered_address");
  const privacyEmail = pick(settings, "privacy_email");
  return (
    <PolicyShell
      testid="page-privacy-policy"
      kicker="Privacy"
      title="Privacy Policy"
      seoTitle="Privacy Policy — Karijeeva"
      seoDescription="How Karijeeva collects, uses, shares, and protects your personal data — written to be compliant with the Indian DPDP Act, 2023."
      lastUpdated={LAST_UPDATED}
      breadcrumb={[{ name: "Privacy Policy", path: "/privacy-policy" }]}
      footerNote={<FooterNote />}
      sections={[
        { id: "who", title: "Who we are", body: (
          <>
            <p>This website (karijeeva.in and related subdomains) is operated by <strong>{company}</strong>, a private limited company registered in Karnataka, India, under <strong>CIN {cin}</strong>, with its registered office at {addr}.</p>
            <p>For any data-protection question or grievance, write to our designated Data Protection Officer at <a className="underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>
          </>
        ) },
        { id: "what", title: "What we collect", body: (
          <>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contact &amp; identity:</strong> name, email address, phone number, shipping address.</li>
              <li><strong>Order &amp; transaction:</strong> order history, invoice records, and payment <em>metadata</em> returned by Razorpay — never raw card numbers, never CVV.</li>
              <li><strong>Account:</strong> hashed password (bcrypt, cost-12), account creation date, last sign-in IP.</li>
              <li><strong>Site analytics:</strong> pages visited, device type, coarse IP location, referrer. We currently run no third-party analytics beacons; if that changes, we will update this policy and surface a consent banner before loading them.</li>
              <li><strong>Cookies:</strong> see our <Link className="underline" to="/cookie-policy">Cookie Policy</Link>.</li>
              <li><strong>Review &amp; feedback:</strong> any review, rating, or free-text message you send us.</li>
            </ul>
          </>
        ) },
        { id: "why", title: "Why we collect it", body: (
          <>
            <ul className="list-disc pl-6 space-y-1">
              <li>To fulfil your order and deliver the product to you.</li>
              <li>To provide customer support and respond to your requests.</li>
              <li>To send transactional emails (order confirmation, shipping, delivery).</li>
              <li>To send marketing emails <strong>only if</strong> you've opted in via the newsletter — you can unsubscribe with one click from any email.</li>
              <li>To comply with Indian tax law (invoice retention) and consumer-protection law.</li>
              <li>To prevent fraud, abuse, and bot traffic.</li>
            </ul>
          </>
        ) },
        { id: "legal-basis", title: "Legal basis (DPDP Act, 2023)", body: (
          <>
            <p>Under the Digital Personal Data Protection Act, 2023, we process your data on the basis of:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Performance of contract</strong> — fulfilment of the order you placed.</li>
              <li><strong>Consent</strong> — marketing emails, cookies beyond strictly-necessary, review submissions.</li>
              <li><strong>Legitimate interest</strong> — fraud prevention, service improvement, internal analytics.</li>
              <li><strong>Legal compliance</strong> — invoice retention, tax records, consumer-protection disputes.</li>
            </ul>
          </>
        ) },
        { id: "sharing", title: "Who we share it with", body: (
          <>
            <p>We share your data with the minimum set of third parties needed to deliver the product and service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Razorpay Software Pvt Ltd</strong> — payment processing (PCI-DSS Level 1 certified).</li>
              <li><strong>Courier partners</strong> — Delhivery, Blue Dart, DTDC, Ecom Express, or India Post — to deliver the package to your address.</li>
              <li><strong>Google Fonts</strong> — to serve typography; no tracking cookies are loaded.</li>
              <li><strong>Email providers</strong> — once we launch transactional email. This is currently <em>not yet active</em>; we will update this policy and the signup flow before enabling it.</li>
            </ul>
            <p>We <strong>do not sell</strong> or rent your personal data to anyone, for any purpose.</p>
          </>
        ) },
        { id: "retention", title: "Data retention", body: (
          <>
            <p>Order and invoice records are retained for <strong>seven years</strong> in keeping with Indian tax law. Account data is retained for as long as your account is active and for a grace period of 12 months after account deletion, unless you request immediate deletion (see rights below).</p>
            <p>Anonymous site analytics are retained for 14 months. Cookies — see the <Link className="underline" to="/cookie-policy">Cookie Policy</Link>.</p>
          </>
        ) },
        { id: "rights", title: "Your rights under the DPDP Act", body: (
          <>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate or outdated personal data.</li>
              <li><strong>Erase</strong> your personal data, subject to mandatory retention under tax law.</li>
              <li><strong>Withdraw consent</strong> for marketing communications.</li>
              <li><strong>Data portability</strong> — a copy of your data in a machine-readable format.</li>
              <li><strong>Grievance</strong> — file a complaint with our Grievance Officer, below.</li>
            </ul>
            <p>Write to <a className="underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a> to exercise any of these rights. We respond within 30 days.</p>
          </>
        ) },
        { id: "security", title: "Data security", body: (
          <>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Encryption in transit</strong> — TLS 1.2+ on every API call and page load.</li>
              <li><strong>httpOnly cookies</strong> for session tokens — no JavaScript can read them.</li>
              <li><strong>Bcrypt (cost-12)</strong> password hashing. We never store or see your plaintext password.</li>
              <li><strong>Role-gated admin</strong> — only explicitly-promoted accounts can access order data.</li>
              <li><strong>Audit logs</strong> — every privileged admin action is logged with who, what, when.</li>
            </ul>
          </>
        ) },
        { id: "cookies", title: "Cookies", body: (
          <p>See our dedicated <Link className="underline" to="/cookie-policy">Cookie Policy</Link> for the full list of cookies we use and how to manage them.</p>
        ) },
        { id: "children", title: "Children", body: (
          <p>Our site and products are not directed at children under 18. We do not knowingly collect personal data from anyone under 18. If you believe we have collected data from a minor, write to <a className="underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a> and we will delete it promptly.</p>
        ) },
        { id: "changes", title: "Changes to this policy", body: (
          <p>We may update this policy from time to time. Substantive changes will be announced via email to registered users and posted on this page with a new &ldquo;Last updated&rdquo; date above.</p>
        ) },
        { id: "grievance", title: "Grievance Officer", body: (
          <>
            <p>In accordance with the Consumer Protection Act, 2019 and the DPDP Act, 2023, the contact details of our Grievance Officer are:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Name:</strong> To be appointed (interim: Customer Support Lead)</li>
              <li><strong>Email:</strong> <a className="underline" href="mailto:grievance@karijeeva.in">grievance@karijeeva.in</a></li>
              <li><strong>Address:</strong> {company}, {addr}</li>
              <li><strong>Response timeline:</strong> within 30 days of receipt.</li>
            </ul>
          </>
        ) },
      ]}
    />
  );
}

// ─── Terms of Service ──────────────────────────────────────────────
export function TermsOfService() {
  const settings = useSiteSettings();
  const company = pick(settings, "company_name");
  const legalEmail = pick(settings, "legal_email");
  const supportEmail = pick(settings, "support_email");
  return (
    <PolicyShell
      testid="page-terms"
      kicker="Terms"
      title="Terms of Service"
      seoTitle="Terms of Service — Karijeeva"
      seoDescription="Terms governing your use of karijeeva.in — eligibility, accounts, pricing, orders, payments, shipping, returns, liability, and dispute resolution under Indian law."
      lastUpdated={LAST_UPDATED}
      breadcrumb={[{ name: "Terms", path: "/terms" }]}
      footerNote={<FooterNote />}
      sections={[
        { id: "acceptance", title: "Acceptance", body: (
          <p>By accessing or using karijeeva.in (the &ldquo;Site&rdquo;), you agree to be bound by these Terms of Service and our <Link className="underline" to="/privacy-policy">Privacy Policy</Link>. If you do not agree, please do not use the Site.</p>
        ) },
        { id: "eligibility", title: "Eligibility", body: (
          <p>You must be at least <strong>18 years old</strong> and resident in <strong>India</strong> to create an account, place orders, and receive deliveries. Guest checkout has the same age and location requirements.</p>
        ) },
        { id: "account", title: "Account responsibilities", body: (
          <>
            <p>You are responsible for maintaining the confidentiality of your account credentials. All activity under your account is your responsibility. Notify us at <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> of any suspected unauthorized access without delay.</p>
            <p>We may suspend or terminate accounts involved in fraudulent activity, abuse, or violation of these Terms.</p>
          </>
        ) },
        { id: "products", title: "Products &amp; descriptions", body: (
          <>
            <p>We strive to describe our products, pricing, and availability accurately. <strong>Colours may vary slightly</strong> across displays and monitors; stock counts are real-time but a sold-out-while-you-pay scenario is possible on our tightest variants. In such cases we will refund you in full, with a note.</p>
          </>
        ) },
        { id: "pricing", title: "Pricing", body: (
          <>
            <p>All prices are in <strong>Indian Rupees (INR)</strong> and are inclusive of applicable taxes (including 5% GST on edible oil at the time of writing). Tax rates may change in line with statutory notifications; you pay the rate active at the time of payment.</p>
            <p>We reserve the right to change prices and offers at any time. Prices confirmed on a paid order do not change retroactively.</p>
          </>
        ) },
        { id: "orders", title: "Orders &amp; acceptance", body: (
          <p>Placing an order constitutes a <strong>customer offer to purchase</strong>. A binding contract is formed only when payment has been successfully captured and we have sent an order confirmation. We reserve the right to decline or cancel an order — for example in cases of suspected fraud, pricing errors, or serviceability issues — with a full refund.</p>
        ) },
        { id: "payment", title: "Payment", body: (
          <>
            <p>Payments are processed via <strong>Razorpay</strong>, which is PCI-DSS Level 1 certified. We do <strong>not</strong> receive or store your card number, CVV, PIN, or UPI PIN.</p>
            <p>Order verification uses HMAC-SHA256 signature validation. Tampered or invalid signatures are logged and the order remains un-captured.</p>
          </>
        ) },
        { id: "shipping-returns", title: "Shipping &amp; returns", body: (
          <p>Delivery is governed by our <Link className="underline" to="/shipping-policy">Shipping &amp; Delivery</Link> policy. Returns and refunds are governed by our <Link className="underline" to="/returns-policy">Returns &amp; Refunds</Link> policy. Both are incorporated into these Terms by reference.</p>
        ) },
        { id: "prohibited", title: "Prohibited use", body: (
          <>
            <ul className="list-disc pl-6 space-y-1">
              <li>Reselling Karijeeva products in bulk without a written wholesale agreement.</li>
              <li>Scraping, crawling, or automated harvesting of content or prices.</li>
              <li>Submitting fraudulent reviews, impersonating other customers, or posting defamatory content.</li>
              <li>Any use that violates Indian law or causes reasonable harm to other customers or to us.</li>
            </ul>
          </>
        ) },
        { id: "ip", title: "Intellectual property", body: (
          <p>All brand assets — the Karijeeva name, logo, bottle design, Liquid Gold Noir palette and typography, photography, and editorial copy — are owned by {company} and protected by Indian and international IP law. You may not reproduce, distribute, or imitate them without written permission.</p>
        ) },
        { id: "ugc", title: "User content", body: (
          <p>By submitting reviews, comments, or any other content to the Site, you grant {company} a <strong>non-exclusive, royalty-free, worldwide licence</strong> to display, reproduce, and excerpt that content for the purposes of running and marketing the Site. You keep ownership of your content; we respect copyright takedown requests at <a className="underline" href={`mailto:${legalEmail}`}>{legalEmail}</a>.</p>
        ) },
        { id: "liability", title: "Limitation of liability", body: (
          <p>To the fullest extent permitted by law, the total aggregate liability of {company} for any claim arising out of or relating to an order is <strong>limited to the value of that order</strong>. We are not liable for indirect, incidental, special, or consequential damages.</p>
        ) },
        { id: "indemnification", title: "Indemnification", body: (
          <p>You agree to indemnify and hold harmless {company}, its directors, employees, and partners from any claim arising out of your violation of these Terms or your misuse of the Site.</p>
        ) },
        { id: "law", title: "Governing law &amp; jurisdiction", body: (
          <p>These Terms are governed by the laws of India. Subject to the arbitration clause below, courts at <strong>Bengaluru, Karnataka</strong> have exclusive jurisdiction.</p>
        ) },
        { id: "arbitration", title: "Dispute resolution", body: (
          <p>Disputes that cannot be resolved amicably within 30 days of written notice will be referred to binding arbitration at Bengaluru, conducted under the <strong>Arbitration and Conciliation Act, 1996</strong>, by a sole arbitrator appointed by mutual consent, in English.</p>
        ) },
        { id: "changes", title: "Changes to these Terms", body: (
          <p>We may update these Terms from time to time. Substantive changes will be posted on this page with a new &ldquo;Last updated&rdquo; date. Continued use of the Site after a change constitutes acceptance of the updated Terms.</p>
        ) },
        { id: "contact", title: "Contact", body: (
          <p>Questions about these Terms: <a className="underline" href={`mailto:${legalEmail}`}>{legalEmail}</a>.</p>
        ) },
      ]}
    />
  );
}

// ─── Cookie Policy ─────────────────────────────────────────────────
export function CookiePolicy() {
  const settings = useSiteSettings();
  const privacyEmail = pick(settings, "privacy_email");
  return (
    <PolicyShell
      testid="page-cookie-policy"
      kicker="Cookies"
      title="Cookie Policy"
      seoTitle="Cookie Policy — Karijeeva"
      seoDescription="What cookies Karijeeva uses, what each does, and how to manage them. We respect Do Not Track signals and don't run marketing cookies."
      lastUpdated={LAST_UPDATED}
      breadcrumb={[{ name: "Cookie Policy", path: "/cookie-policy" }]}
      footerNote={<FooterNote />}
      sections={[
        { id: "what", title: "What cookies are", body: (
          <p>Cookies are small text files placed on your device by the websites you visit. They're used to remember you across page loads and sessions, keep you signed in, and — on some sites — track you across the web. Here is how we use them.</p>
        ) },
        { id: "types", title: "Types we use", body: (
          <>
            <p><strong>Strictly necessary (always on).</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>access_token</code> — your signed-in session. httpOnly, Secure, SameSite=Lax.</li>
              <li><code>karijeeva_cart_v1</code> — browser localStorage key holding your in-progress cart.</li>
            </ul>
            <p className="mt-3"><strong>Functional.</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Preferences — recently-viewed products, reduced-motion choice, toast dismissals. These can be cleared from your browser at any time.</li>
            </ul>
            <p className="mt-3"><strong>Analytics — not currently enabled.</strong></p>
            <p>We do not currently run Google Analytics, Meta Pixel, or any third-party tracker. We may introduce a first-party analytics tool (such as Plausible or a self-hosted PostHog) in future. When we do, we will update this policy, show a consent banner, and respect &ldquo;Do Not Track&rdquo; browser headers.</p>
            <p className="mt-3"><strong>Marketing — none.</strong></p>
            <p>We run no retargeting, no advertising, and no third-party marketing cookies. If you see a third-party cookie, it's coming from Razorpay during the checkout flow.</p>
          </>
        ) },
        { id: "third-party", title: "Third-party cookies", body: (
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Razorpay</strong> loads during the payment step at checkout. Razorpay sets its own session cookies, which are strictly necessary for the payment flow.</li>
            <li><strong>Google Fonts</strong> loads web fonts from fonts.gstatic.com — no tracking cookies are set.</li>
          </ul>
        ) },
        { id: "manage", title: "Managing cookies", body: (
          <p>You can clear cookies or block them from your browser settings. If you block strictly-necessary cookies, the Site will not work — you won't stay signed in and your cart will be cleared between pages.</p>
        ) },
        { id: "dnt", title: "Do Not Track", body: (
          <p>If your browser sends a <code>DNT: 1</code> header, we treat it as an opt-out from any future analytics beacons. Right now this is a null-op because we don't run analytics, but we are recording the intent.</p>
        ) },
        { id: "updates", title: "Updates to this policy", body: (
          <>
            <p>We will post substantive changes to this page with a new &ldquo;Last updated&rdquo; date, and — if we start loading new third-party services — will surface a consent banner before doing so.</p>
            <p>Questions about this policy? Write to <a className="underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>
          </>
        ) },
      ]}
    />
  );
}
