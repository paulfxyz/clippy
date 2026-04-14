# 📎 Clippy — AI Contract Analyzer

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    📎  C L I P P Y                                           ║
║        your contract analyst                                  ║
║                                                               ║
║    "It looks like you're signing a contract.                 ║
║     Would you like help checking for nasty clauses?"         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

[![Version](https://img.shields.io/badge/version-3.0.2-F5D000?style=flat-square&labelColor=1a1a2e)](https://github.com/paulfxyz/clippy/releases/tag/v3.0.2)
[![License: MIT](https://img.shields.io/badge/license-MIT-000000?style=flat-square)](https://github.com/paulfxyz/clippy/blob/main/LICENSE)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white&labelColor=20232a)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-7c3aed?style=flat-square)](https://openrouter.ai)
[![Zero Backend](https://img.shields.io/badge/backend-zero-22c55e?style=flat-square)](https://clippy.legal)
[![Status](https://img.shields.io/badge/status-live-22c55e?style=flat-square)](https://clippy.legal)
[![i18n](https://img.shields.io/badge/i18n-17%20languages-F5D000?style=flat-square)](https://clippy.legal)

![Clippy — your contract analyst](https://clippy.legal/img/logo.jpg?v=2)

**Open-source, browser-only AI contract analyzer. Multi-model. Zero storage. No server. Just truth.**

[Live App](https://clippy.legal) · [GitHub](https://github.com/paulfxyz/clippy) · [Report Bug](https://github.com/paulfxyz/clippy/issues) · [Request Feature](https://github.com/paulfxyz/clippy/issues)

</div>

---

## What Clippy Does

Clippy lets you upload any contract — PDF, DOCX, TXT, or Markdown — and have multiple AI models simultaneously analyze it for risky, abusive, or deceptive clauses. It runs entirely in your browser: your contract text is sent directly from your browser to [OpenRouter](https://openrouter.ai) using your own API key. No file ever touches a third-party server. No data is stored. No account required.

You choose which AI models to run. You choose which analysis objectives matter (GDPR compliance? non-compete enforceability? hidden fees?). The models run in parallel. Results appear live. You can download a PDF or Markdown report, or generate a shareable URL that encodes the full results for a colleague to review.

## Screenshots

![Step 1 — Upload your contract and configure models](https://clippy.legal/img/screenshot-step1.jpg)
*Step 1 — Upload your contract (PDF, DOCX, TXT), paste your OpenRouter key, select AI models*

![Step 2 — Choose analysis objectives](https://clippy.legal/img/screenshot-step2.jpg)
*Step 2 — Toggle analysis objectives: GDPR, non-compete, IP assignment, financial risk, and more*

![Step 3 — Results dashboard with trust score and flags](https://clippy.legal/img/screenshot-step3.jpg)
*Step 3 — Trust score, dimension breakdown, and annotated clause flags with severity ratings*

---

### Why it exists

Legal contracts are designed to be long, dense, and deliberately hard to parse. Lawyers are expensive and unavailable to most people at the moment they need them most — which is when they're about to sign something. Most people sign contracts without reading them. Those who do read them often lack the legal background to identify what's actually dangerous vs. what's just standard boilerplate.

Clippy bridges that gap. It doesn't replace a lawyer. It doesn't give legal advice. But it gives you, at almost zero cost, the same first-pass analysis a first-year law associate would do: flag the clauses that look unusual, one-sided, or potentially abusive, and explain why in plain language.

### The mascot

Clippy is named after [Microsoft's Office Assistant](https://en.wikipedia.org/wiki/Office_Assistant) — the animated paperclip introduced in Microsoft Office 97. Love it or hate it, Clippy was trying to help. So is this one. The design pays homage to the original: golden paperclip body, expressive eyes, speech bubble. The same energy, a very different mission.

---

## What's New in v3.0.2

**Locale-aware analysis output.** When you use Clippy in French, Spanish, German, Japanese, Arabic, or any of the 17 supported languages, the AI models now respond entirely in that language — flag titles, descriptions, summaries, and dimension notes are all localised. Contract quotes remain verbatim in their original language. A `LANGUAGE INSTRUCTION` directive is dynamically prepended to the system prompt, with a belt-and-suspenders reminder in the user message.


Version 3.0.1 is a quality patch focused on depth: deeply improved analysis prompts that cite specific laws and legal concepts, a richer system prompt with better severity calibration, hardened error handling, improved code comments throughout, and a massively expanded README.

- **Legally grounded prompts** — each of the 10 analysis objectives now cites specific EU Directives, GDPR Articles, US case law (e.g. *AT&T Mobility v. Concepcion*), UK Acts, and French consumer law statutes
- **Improved SYSTEM_PROMPT** — richer severity definitions with legal examples, cleaner JSON schema guidance, better instruction architecture
- **Hardened `openrouter.ts`** — additional JSON parsing fallbacks, more informative error messages for 401/402/429/503
- **Improved `fileParser.ts`** — file size limit check (10MB), explicit scanned-PDF detection, better error messages for password-protected files
- **Legal disclaimer footer** in PDF export
- **JSDoc comments** improved across all `lib/` files
- README: full legal theory context, EU/US/UK/FR jurisprudence, threat model, contract law background

---

## What's New in v3.0.0

Version 3.0.0 brings full internationalisation (i18n) to Clippy. The entire UI — every label, button, toast, speech bubble, and disclaimer — is now translated into 17 languages, with full RTL layout support for Arabic and Hebrew. No external i18n library is used: the system is a purpose-built, zero-dependency implementation in plain TypeScript.

### 17 Languages

| Language | Code | Flag | RTL? |
|----------|------|------|------|
| English | `en` | 🇬🇧 | — |
| French | `fr` | 🇫🇷 | — |
| Spanish | `es` | 🇪🇸 | — |
| Portuguese | `pt` | 🇵🇹 | — |
| German | `de` | 🇩🇪 | — |
| Dutch | `nl` | 🇳🇱 | — |
| Italian | `it` | 🇮🇹 | — |
| Chinese (Simplified) | `zh` | 🇨🇳 | — |
| Russian | `ru` | 🇷🇺 | — |
| Hindi | `hi` | 🇮🇳 | — |
| Bulgarian | `bg` | 🇧🇬 | — |
| Polish | `pl` | 🇵🇱 | — |
| Danish | `da` | 🇩🇰 | — |
| Japanese | `ja` | 🇯🇵 | — |
| Korean | `ko` | 🇰🇷 | — |
| Hebrew | `he` | 🇮🇱 | ✅ |
| Arabic | `ar` | 🇸🇦 | ✅ |

### The i18n Architecture

All translation logic lives in a single file: `client/src/lib/i18n.ts`. Here's how it works:

**Translation dictionaries** — Each locale is a flat TypeScript object (`Record<string, string>`) keyed by dot-separated strings like `"step1.title"`, `"clippy.setup"`, or `"toast.pdf_downloaded"`. English is the canonical source; all other locales are its translations.

**`t(key, vars?)` helper** — The core translation function. Takes a key and an optional variable map, returns the translated string for the current locale. Falls back to English for any missing key — no crashes, ever.

**`I18nProvider`** — A React context provider wrapping the entire app. Detects locale on mount, applies RTL direction on `<html>` if needed.

**`detectLocale()`** — Priority order: localStorage → navigator.language → `"en"` fallback.

---

## What's New in v2.0.0

Version 2.0.0 is a major feature release: 3-step wizard flow, modular prompt library (10 objectives, 5 categories), AES-GCM API key encryption, PDF/Markdown export, shareable result URLs, and duration tracking.

---

## The Legal Context — Why Contract Clauses Matter

This section explains the legal landscape that Clippy's analysis objectives are built on. Understanding the underlying law helps you interpret the flags Clippy raises.

### The Problem with Standard Form Contracts

Most contracts you'll encounter in daily life are **contracts of adhesion** (in French: *contrats d'adhésion*) — pre-drafted by the stronger party, presented on a take-it-or-leave-it basis, with no possibility of negotiation. Courts across the world have long struggled with how to protect consumers and weaker parties in these situations.

The core legal tension is between two principles:

1. **Freedom of contract** (*pacta sunt servanda*) — parties who freely agree to terms should be bound by them
2. **Substantive fairness** — courts should not enforce contracts that are unconscionable, abusive, or the product of unequal bargaining power

Different jurisdictions resolve this tension differently. The EU leans heavily toward consumer protection. The US leans toward freedom of contract, though with important carve-outs. Understanding which law applies to your contract — and what protections it gives you — is why Clippy's "Governing Law & Jurisdiction" prompt exists.

---

### EU Law: The Directive on Unfair Contract Terms (93/13/EEC)

The **Council Directive 93/13/EEC** of 5 April 1993 on unfair terms in consumer contracts is the foundational EU framework for contract fairness. It applies across all 27 EU member states and has been implemented into national law (e.g., France's *Code de la consommation* Art. L. 212-1 et seq., Germany's *BGB* §§ 307–309, Spain's *LGDCU*).

**Key provisions:**

- **Article 3(1)** defines an unfair term as one that, "contrary to the requirement of good faith, causes a significant imbalance in the parties' rights and obligations arising under the contract, to the detriment of the consumer."
- **Article 5** requires that terms be drafted in **plain, intelligible language**. Where a term is ambiguous, the interpretation most favourable to the consumer applies (*contra proferentem* rule).
- **Article 6(1)** provides that unfair terms are **not binding on the consumer**. The contract remains binding if it can survive without the unfair terms.
- **Annex** (the "Grey List") contains an indicative list of terms that may be considered unfair, including:
  - Terms allowing the seller to alter the contract unilaterally
  - Terms giving the seller the exclusive right to interpret the contract
  - Terms excluding liability for death or personal injury caused by the seller
  - Terms automatically extending a contract if the consumer does not cancel within an unreasonably short notice period
  - Terms requiring the consumer to pay disproportionately high sums as compensation for non-performance

**Key CJEU jurisprudence:**

- **Océano Grupo Editorial SA v. Roció Murciano Quintero (C-240/98)** — The Court of Justice of the EU held that national courts can, of their own motion, examine whether a contractual term is unfair. Consumers do not have to raise it themselves. This massively expanded the scope of judicial protection.
- **Aziz v. Caixa d'Estalvis de Catalunya (C-415/11)** — Clarified the "significant imbalance" test: courts must assess whether the seller could reasonably expect the consumer to agree to the term in individual negotiations. If not, the term is unfair.
- **RWE Vertrieb AG v. Verbraucherzentrale Nordrhein-Westfalen (C-92/11)** — On unilateral price variation clauses: a clause allowing a gas supplier to change prices without transparency about the reasons and mechanism was held unfair.

**What this means for Clippy:** When the "Unfair & Abusive Clauses" prompt fires a CRITICAL flag for a unilateral modification clause, it is flagging something that EU law has repeatedly held to be unfair under Directive 93/13/EEC.

---

### GDPR — The General Data Protection Regulation (2016/679)

The **General Data Protection Regulation** came into force on 25 May 2018 and applies to any organisation processing personal data of EU residents, regardless of where the organisation is based. It is the most comprehensive data protection framework in the world and has heavily influenced legislation globally (California's CCPA, Brazil's LGPD, India's PDPB).

**Key Articles relevant to contract review:**

| Article | Topic | What to check in contracts |
|---------|-------|---------------------------|
| **Art. 5** | Principles of processing | Data must be collected for specified, explicit purposes; not processed beyond those purposes; stored no longer than necessary |
| **Art. 6** | Lawful basis | Processing must have a legal basis: consent, contract necessity, legal obligation, vital interests, public task, or legitimate interests. Contracts often misstate the lawful basis |
| **Art. 7** | Conditions for consent | Consent must be freely given, specific, informed, and unambiguous. Bundling consent with contract acceptance (pre-ticked boxes, all-or-nothing consent) violates Art. 7(4) |
| **Art. 13** | Transparency at data collection | Controller must inform the data subject at collection time: identity of controller, purposes, legal basis, recipients, retention period, and rights |
| **Art. 17** | Right to erasure ("right to be forgotten") | Data subject can request erasure when data is no longer necessary, consent is withdrawn, or processing is unlawful |
| **Art. 20** | Data portability | Data subjects have the right to receive their personal data in a structured, machine-readable format |
| **Art. 25** | Data protection by design and by default | Controllers must implement appropriate technical and organisational measures to protect data by default |
| **Art. 28** | Processor agreements | When a controller engages a processor, a formal Data Processing Agreement (DPA) is mandatory, with minimum clauses specified |
| **Art. 44-49** | International transfers | Personal data may only be transferred outside the EU/EEA if the destination country has an adequacy decision (e.g., UK, Canada, Japan), or if the transfer uses Standard Contractual Clauses (SCCs) or Binding Corporate Rules |

**Key enforcement decisions:**

- **CNIL (France) v. Google LLC (2019, €50M fine)** — Google's consent mechanism was held to violate Art. 7: the legal bases were not presented clearly, and consent was bundled with service activation
- **CNIL v. Facebook/Meta (2022)** — Forced acceptance of cookies without genuine choice violated the freely-given consent requirement
- **DPC (Ireland) v. WhatsApp Ireland (2021, €225M fine)** — Failure to provide adequate Art. 13/14 transparency information to EU users
- **Schrems II (Data Protection Commissioner v. Facebook Ireland, C-311/18)** — Invalidated the EU-US Privacy Shield framework. Standard Contractual Clauses remain valid but require a Transfer Impact Assessment

**What this means for Clippy:** The GDPR prompt specifically looks for: stated lawful bases (are they valid?), consent bundling, data sharing with "third parties" (are these processors or joint controllers?), data retention after termination, international transfer mechanisms, and absence of user rights information.

---

### US Law: Unconscionability and Arbitration

US contract law has no single federal statute equivalent to EU Directive 93/13/EEC. Instead, protection against abusive contracts comes from:

**1. The Unconscionability Doctrine (UCC § 2-302, Restatement Second of Contracts § 208)**

A contract or clause may be void as unconscionable if it has both:
- **Procedural unconscionability** — oppressive circumstances at formation (surprise, unequal bargaining power, no meaningful choice)
- **Substantive unconscionability** — oppressively one-sided terms

Courts weigh these factors together; extreme substantive unfairness may compensate for lower procedural unconscionability. State approaches vary significantly: California courts are more willing to void terms; New York courts apply unconscionability sparingly.

**2. Mandatory Arbitration and the Federal Arbitration Act (FAA, 9 U.S.C. § 1 et seq.)**

The FAA strongly favours the enforcement of arbitration agreements. However, landmark SCOTUS decisions have shaped the landscape:

- **AT&T Mobility LLC v. Concepcion (2011, 563 U.S. 333)** — The Court held that the FAA preempts state laws that categorically invalidate class arbitration waivers. This decision effectively enabled companies to include class-action waivers in consumer arbitration clauses, eliminating collective redress for consumers in many disputes.
- **American Express Co. v. Italian Colors Restaurant (2013)** — Extended *Concepcion*: even where individual arbitration costs exceed potential recovery (making it economically irrational to proceed), class arbitration waivers are enforceable.
- **Viking River Cruises v. Moriana (2022)** — Limited the scope of PAGA (California's Private Attorneys General Act) in the arbitration context — California cannot categorically exempt PAGA claims from arbitration.

The practical effect: a mandatory arbitration clause with a class-action waiver in a US consumer contract can eliminate your practical ability to pursue small-value claims at all. Clippy flags these as CRITICAL.

**3. The Electronic Communications Privacy Act and Monitoring**

Employer monitoring of electronic communications is governed by the ECPA (18 U.S.C. § 2510 et seq.). Employees who consent — which most employment contracts require — generally have reduced privacy expectations on company equipment and networks. Clippy's monitoring prompt flags clauses that extend surveillance to personal devices, personal communications, or that require consent without specifying what is being monitored.

**4. Non-Compete Enforceability in the US**

Non-compete law is almost entirely state law and varies dramatically:

| Jurisdiction | Enforceability | Key Rule |
|--------------|---------------|----------|
| **California** | Near-total ban | Cal. Bus. & Prof. Code § 16600: non-competes are void as a matter of public policy (with narrow exceptions for business sale). Courts will not "blue-pencil" (rewrite) them |
| **Minnesota** | Banned since 2023 | Minn. Stat. § 181.988: non-competes signed after Jan 1, 2023 are void |
| **North Dakota** | Banned | ND Cent. Code § 9-08-06 |
| **Oklahoma** | Largely unenforceable | 15 Okla. Stat. § 219A |
| **Florida** | Strongly enforced | Fla. Stat. § 542.335: courts may enforce and modify. Presumption in favour of enforcement |
| **New York** | Moderate | "Reasonable" test — must be limited in time, geography, and scope; employer must have legitimate business interest |
| **UK** | Reasonable test | Must protect a legitimate interest; must be no wider than reasonably necessary |
| **France** | Must be compensated | Clause de non-concurrence requires compensation during restriction period (Cass. Soc., 10 juillet 2002) |

**Federal FTC rule (2024):** The FTC issued a final rule in April 2024 seeking to ban most non-compete clauses for workers — though this rule faced immediate legal challenges and its status should be verified. The trajectory at federal level is toward restriction.

**What this means for Clippy:** The non-compete prompt flags the clause, then notes whether compensation is specified and whether the jurisdiction and scope appear reasonable — which varies enormously by the governing law.

---

### UK Law: Consumer Rights Act 2015 and UCTA

**The Consumer Rights Act 2015 (CRA)** consolidated and modernised UK consumer contract law (replacing UCTA 1977 and UTCCR 1999 for consumer contracts):

- **Section 62** — A term is unfair if it causes a significant imbalance in the parties' rights and obligations to the detriment of the consumer, contrary to good faith
- **Section 64** — Core terms (the main subject matter, the price) are not subject to fairness assessment if they are **transparent and prominent**
- **Section 65** — A trader cannot exclude liability for death or personal injury caused by negligence. Period.
- **Section 67** — An unfair term is not binding on the consumer, but the contract continues in existence if capable of existing without the term
- **Schedule 2** — "Grey list" of terms that may be unfair (mirroring the EU Directive's Annex, with UK-specific additions)

**Unfair Contract Terms Act 1977 (UCTA)** — Still applies to B2B contracts (business-to-business). Section 11 sets a "reasonableness" test for exclusion clauses; Schedule 2 provides guidelines.

**Key cases:**
- **Director General of Fair Trading v. First National Bank plc [2001] UKHL 52** — House of Lords clarified that the "significant imbalance" test requires examining the overall contractual position, not just the individual clause
- **Office of Fair Trading v. Abbey National plc [2009] UKSC 6** — Bank charges for overdrafts were "core terms" and exempt from the fairness test, as they related to the price

---

### French Consumer Law: Loi Hamon and Loi Châtel

France has some of the most protective consumer contract law in the world, built on the *Code de la consommation* (Consumer Code):

**Loi Châtel (2008)** reformed the rules on tacit renewal (reconduction tacite):
- Art. L. 215-1: Suppliers with annual auto-renewal must notify the consumer of their right to opt out 1–3 months before the opt-out deadline
- If this notice is not given, the consumer may terminate at any time and is only required to pay for services received

**Loi Hamon (2014)** went further:
- Extended mandatory cooling-off periods (14 days for most distance contracts)
- Required clearer presentation of mandatory information before contract formation
- Strengthened the prohibition on abusive clauses under what is now Art. L. 212-1

**Clauses abusives (abusive clauses)** in France are defined and regulated by:
- **Art. L. 212-1 Code de la consommation** — A clause is abusive if it creates, to the consumer's detriment, a significant imbalance between the parties' rights and obligations arising under the contract
- **Décret n° 2009-302** — Establishes an indicative list of presumed abusive clauses and an irrebuttable "black list" of clauses that are always abusive (e.g., clauses excluding or limiting the professional's liability for bodily injury; clauses allowing price increases without a right of withdrawal)
- **Commission des clauses abusives (CCA)** — Publishes recommendations on clauses in standard-form contracts across various sectors. Its recommendations, while not legally binding, are highly influential

---

### Arbitration Clauses: The Global Picture

Mandatory arbitration has been one of the most litigated areas of contract law in the past two decades. The key issues:

**What makes an arbitration clause problematic:**
1. **Mandatory** (no choice but to arbitrate)
2. **Class-action waiver** (cannot join with others who have the same claim)
3. **Inconvenient seat** (arbitration must be held in a city far from the consumer)
4. **Cost allocation** (consumer must bear arbitration filing fees, which may be $1,500+)
5. **Confidentiality** (results are secret — prevents public accountability)

**EU position:** Mandatory pre-dispute arbitration clauses in consumer contracts are generally considered unfair under Directive 93/13/EEC because they deprive consumers of access to the courts guaranteed by Art. 47 of the EU Charter of Fundamental Rights. The CJEU has repeatedly confirmed that national courts must examine arbitration clauses of their own motion.

**US position:** Post-*Concepcion*, mandatory arbitration + class waiver is generally enforceable in consumer contracts. Notable exceptions: statutory claims under some federal laws (e.g., sexual harassment claims are excluded by the Ending Forced Arbitration of Sexual Assault and Sexual Harassment Act of 2022), NLRA § 7 rights (debated), and judicial review of arbitrator jurisdiction.

**UK post-Brexit position:** UK courts are not bound by CJEU rulings since January 2021. The Consumer Rights Act 2015 s.91 renders arbitration clauses in consumer contracts unfair to the extent that the consumer is required to submit to arbitration for claims below £5,000, without preserving the right to go to court.

---

### IP Assignment: The "We Own Everything You Create" Clause

Intellectual property assignment clauses in employment and freelance contracts deserve special scrutiny. The default rules differ sharply by jurisdiction:

**UK:** Under the Patents Act 1977 (s.39) and Copyright, Designs and Patents Act 1988 (s.11), work created by an employee in the course of employment vests in the employer. However, "course of employment" is narrowly construed — work done on personal time, with personal equipment, on a topic unrelated to the job is generally not employer property.

**US:** The "work made for hire" doctrine (17 U.S.C. § 101) is extremely broad for employees. But many employment contracts include assignment clauses that purport to go even further — assigning all inventions, even personal ones. California has a statutory carve-out (Cal. Lab. Code § 2870): an employment agreement cannot require an employee to assign rights to an invention developed entirely on the employee's own time, without using the employer's equipment, supplies, facilities, or trade secret information, unless it relates to the employer's business or results from the employee's work. Several other states have similar provisions.

**France:** Under French law (Code de la Propriété Intellectuelle), copyright vests originally in the author (the employee). An employer's right to works created in the course of employment is more limited than in the US or UK. Specific written assignments are required for copyright. Moral rights (*droit moral*) cannot be waived under French law — they are inalienable.

**What Clippy looks for:** Blanket "assign all inventions" clauses that include no carve-outs for personal work; waivers of moral rights; clauses that extend beyond employment ("any invention I create for 1 year after termination"); absence of specific compensation for IP assignment beyond base salary.

---

### Liability Caps and Indemnification

Limitation of liability clauses are standard — but the devil is in the carve-outs:

**Typical structure:**
```
Limitation: Total liability shall not exceed the fees paid in the 12 months preceding the claim.
Carve-outs: The limitation shall not apply to [death/personal injury] [fraud] [wilful misconduct] [IP infringement] [data breach] [indemnification obligations].
```

The carve-outs are where the exposure lies. If a vendor's liability cap is $1,000 but there's a carve-out for "any breach of the IP warranties" that could expose you to third-party infringement claims, the cap is largely illusory.

**Indemnification:** An indemnification clause requires one party to defend and/or reimburse the other for claims by third parties. Watch for:
- **Broad triggers:** "any claim arising from or relating to your use of the service" is effectively unlimited
- **Defense control:** Who controls the defense? If the indemnifying party controls it, they may settle on terms that bind you
- **IP indemnification from vendors:** If a SaaS vendor's software infringes a third-party patent and you get sued, are you covered?
- **User content indemnification:** Many ToS require users to indemnify the platform for any claims arising from user-generated content — this can be extremely broad

**EU rules:** Directive 93/13/EEC Annex items (a) and (b) prohibit clauses excluding/limiting liability for death or personal injury, and clauses excluding liability for loss caused by the seller's negligence. These are in the "black list" — automatically unfair.

---

### Governing Law and Forum Selection

The governing law clause is often the most consequential clause in a cross-border contract, because it determines which country's consumer protection laws apply — and what protections you have.

**Key principles:**

1. **EU Rome I Regulation (593/2008):** For consumer contracts, the chosen law cannot deprive the consumer of protections afforded by the mandatory rules of their country of habitual residence. So an American company's ToS saying "governed by Delaware law" still cannot deprive an EU consumer of their rights under Directive 93/13/EEC and GDPR.

2. **Brussels I Recast Regulation (1215/2012):** For consumer contracts, the consumer may sue in the courts of their own member state, regardless of any exclusive jurisdiction clause in favour of another jurisdiction.

3. **US approach:** Courts generally enforce forum selection clauses (e.g., *The Bremen v. Zapata Off-Shore Co.*, 407 U.S. 1 (1972)), even for consumers, though some state laws protect consumers (e.g., California has been reluctant to enforce outbound forum selection clauses against California consumers). Class-action waivers and mandatory arbitration compound the problem.

4. **"Mandatory arbitration in San Francisco"** is a common pattern in US tech ToS. For a user in France, Germany, or India, this means: if you want to pursue a $200 claim, you must fly to California and participate in arbitration under California law. In practice, this eliminates all consumer recourse.

**What Clippy looks for:** Jurisdiction clauses that require dispute resolution in a location inconvenient for the user; exclusive jurisdiction in courts of the vendor's home state; class-action waivers; choice-of-law clauses that could strip EU consumers of statutory protections.

---

### The "Small Print" Problem

The premise of Clippy — and the problem it addresses — is best summarised by the *small print* phenomenon:

**Cognitive overload:** The average Terms of Service document is 7,000–10,000 words. Reading every ToS you encounter would require approximately 76 working days per year. No one reads them. This is not laziness; it's a rational response to impossibly dense legalese produced by specialists for non-specialists.

**Information asymmetry:** The drafting party (vendor, employer, landlord) employs lawyers who have optimised the contract over years of litigation. The signing party has no legal background and no time. This structural imbalance is why courts intervene with doctrines like unconscionability and the unfair terms legislation.

**Contract length as a strategy:** Research suggests that longer, more complex contracts increase the probability that problematic clauses go unnoticed. Placing a class-action waiver in paragraph 47 of a 50-page ToS is not an accident.

**AI as a leveller:** This is the core proposition of Clippy. For under $0.15, you can have the same first-pass review that a paralegal would charge $150 for — instantaneous, parallel across 8 models, with specific clause quotation and severity tagging.

---

### Limitations of AI Contract Analysis

Clippy is honest about what it can and cannot do.

**What Clippy does well:**
- Identifying structurally unusual or one-sided clauses
- Flagging clauses that match known patterns of abuse (mandatory arbitration, auto-renewal, unlimited indemnification)
- Summarising the overall risk profile of a contract
- Running the same analysis across 8 different models for a second (and third, and fourth) opinion

**What Clippy cannot do:**
- Provide legal advice (it is not a lawyer, and you should consult one for significant contracts)
- Assess context (a non-compete that's abusive for an entry-level employee may be reasonable for a C-suite executive)
- Know the latest case law (models have training cutoffs and may not reflect recent court decisions)
- Analyse scanned PDFs (text must be extractable; OCR is not implemented)
- Guarantee completeness (AI can miss clauses; human review remains essential for high-stakes agreements)

**Threat model:**
- Your contract text is sent to OpenRouter and from there to the chosen AI providers. Treat this as "read by the AI provider's infrastructure." Do not upload contracts containing national security secrets, privileged attorney-client communications, or highly sensitive personal data of third parties
- Your OpenRouter API key is encrypted in browser memory using AES-GCM 256-bit. It is not stored to disk. It is never sent to Clippy's servers (there are none). It is sent to OpenRouter's API over TLS. The encryption is defence-in-depth against trivial key extraction, not against a capable browser-level adversary
- Shareable URLs encode results in the URL hash fragment (base64). The analysis results (including flagged clause quotes) become public if you share the URL

---

## Features

### Core (v1 + v2)
- **Multi-model analysis** — Run 8+ AI models simultaneously (Claude, GPT-4o, Gemini, Mistral, Llama, DeepSeek, and more)
- **Parallel execution** — All selected models run at the same time, not sequentially
- **Trust Score** — A 0–100 score representing overall contract fairness, with a visual animated ring
- **5 Dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom — each scored independently
- **Severity flags** — CRITICAL, SUSPECT, MINOR — each flag includes a title, explanation, and a verbatim quote from the contract
- **Model comparison** — Results are shown per-model in tabs, so you can compare what Claude found vs. what GPT-4o found
- **Jurisdiction detection** — Models attempt to identify the applicable legal jurisdiction

### New in v2.0.0
- **3-step wizard** — Structured flow: Setup → Objectives → Results
- **Prompt library** — 10 curated analysis objectives across 5 categories (General, Financial, Privacy, Employment, IP)
- **Prompt customization** — Toggle, edit, and add objectives inline
- **AES-GCM key encryption** — API key is encrypted in-browser before being stored in state
- **PDF export** — Formatted multi-page report via jsPDF
- **Markdown export** — GitHub-compatible `.md` report
- **Share URLs** — Base64-encoded results in URL hash fragment, rendered by ShareView page
- **Duration tracking** — Wall-clock API call time per model, shown in results

### New in v3.0.0
- **Full i18n** — 17 languages, RTL support, locale detection, language switcher
- **Logo tagline** — "your contract analyst" on every page

### New in v3.0.1
- **Legally grounded prompts** — All 10 prompts cite specific statutes and case law
- **Improved system prompt** — Richer severity calibration with legal examples
- **Hardened error handling** — More informative API error messages
- **File size validation** — 10MB limit check with clear user message
- **Scanned PDF detection** — Warning when extracted text is suspiciously short
- **Legal disclaimer in PDF export** footer

### Privacy & Architecture
- **Zero backend** — The Express server included in this repo is a thin dev scaffold. The core app is 100% static
- **No file storage** — Contract text lives in React state, never written to disk or database
- **No analytics** — No tracking, no cookies, no session logging
- **Your API key, your costs** — OpenRouter API key is entered at runtime, never stored (not localStorage, not cookies)
- **Client-side extraction** — PDF parsing via `pdf.js`, DOCX parsing via `mammoth` — both run in the browser, no server upload

### Supported File Formats
| Format | Library | Notes |
|--------|---------|-------|
| `.pdf` | `pdfjs-dist` | All text layers extracted per-page. Scanned PDFs (image-only) will return empty text — OCR not supported |
| `.docx` | `mammoth` | Raw text extraction, ignores styles |
| `.txt` | Native `File.text()` | Direct UTF-8 read |
| `.md` | Native `File.text()` | Treated as plain text |

---

## Supported Models (via OpenRouter)

| Model | Provider | Context | Best for |
|-------|----------|---------|---------|
| Claude 3.5 Sonnet | Anthropic | 200k | Nuanced legal reasoning; best at identifying indirect and implied risks |
| Claude 3 Haiku | Anthropic | 200k | Fast, affordable first-pass analysis |
| GPT-4o | OpenAI | 128k | Reliable JSON output; strong at financial risk clauses |
| GPT-4o Mini | OpenAI | 128k | Cost-effective second opinion |
| Gemini Pro 1.5 | Google | 1M | Very long contracts — handles 200+ page documents |
| Mistral Large | Mistral AI | 128k | EU legal context; particularly strong on GDPR, French law |
| Llama 3.1 70B | Meta | 128k | Open-source; useful for comparison against closed-source models |
| DeepSeek R1 | DeepSeek | 64k | Multi-step legal logic chains; inconsistency detection |

All models are accessed through [OpenRouter](https://openrouter.ai). You can add any model by editing `AVAILABLE_MODELS` in `client/src/lib/openrouter.ts`.

---

## Quick Start

### Prerequisites
- Node.js >= 18
- An [OpenRouter API key](https://openrouter.ai/keys) (free to create, pay per token)

### Running Locally

```bash
# Clone the repository
git clone https://github.com/paulfxyz/clippy.git
cd clippy

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5000`.

No environment variables required. The OpenRouter API key is entered in the UI at runtime.

### Building for Production (Static Deploy)

```bash
npm run build
```

This outputs to `dist/public/`. The result is a completely static site — just HTML, CSS, and JavaScript. No server required. Deploy to any static host: Cloudflare Pages, Vercel, Netlify, GitHub Pages, an S3 bucket, or any FTP server.

See [INSTALL.md](./INSTALL.md) for full deployment instructions.

---

## Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React App (Vite + TypeScript)            │   │
│  │                                                       │   │
│  │  Step 1: Setup                                        │   │
│  │    ├── File Upload → pdf.js / mammoth → plain text    │   │
│  │    ├── API Key → AES-GCM encrypt → state blob         │   │
│  │    └── Model Selection → selectedModels[]             │   │
│  │                                                       │   │
│  │  Step 2: Objectives                                   │   │
│  │    ├── Toggle/edit 10 built-in prompts               │   │
│  │    └── Add custom objectives                          │   │
│  │                                                       │   │
│  │  Step 3: Results                                      │   │
│  │    ├── Decrypt API key (AES-GCM)                      │   │
│  │    ├── assemblePromptInstructions(prompts[])           │   │
│  │    ├── fetch() × N models (parallel)                  │   │
│  │    │         │                                        │   │
│  │    │         ▼                                        │   │
│  │    │   OpenRouter API ──► Claude                      │   │
│  │    │   (direct from    ──► GPT-4o                     │   │
│  │    │    browser)       ──► Gemini                     │   │
│  │    │                   ──► ...                        │   │
│  │    │                                                   │   │
│  │    ├── Trust Score + Dimensions + Flags               │   │
│  │    ├── Export as PDF / Markdown                       │   │
│  │    └── Generate shareable URL                        │   │
│  │                                                       │   │
│  │  ShareView (/share/:payload)                          │   │
│  │    └── base64 decode → render read-only results       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Why No Backend?

The Express server in this repo (`server/`) is a **development scaffold** only — it serves the Vite dev server in development mode. In production, the build output is a purely static bundle.

All AI calls go directly from the user's browser to `https://openrouter.ai/api/v1/chat/completions`. OpenRouter's CORS policy allows this. This design means:

1. **Zero infrastructure cost** — no server to maintain, no database, no scaling concerns
2. **Zero data liability** — we literally cannot store your contract because we never receive it
3. **Transparent cost model** — users pay OpenRouter directly for their own API usage

### API Key Security Model

```
User types key in <input>
         │
         ▼
encryptKey(rawKey)   — AES-GCM 256-bit, browser crypto.subtle
         │
         ▼
apiKeyEncrypted  ←  stored in React state (base64 blob)
rawKey           ←  cleared from state immediately

... later, at analysis time ...

decryptKey(apiKeyEncrypted)  →  rawKey (passed to fetch, not stored)
```

The raw key is never written to localStorage, sessionStorage, IndexedDB, cookies, or any server. The encryption is defence-in-depth — see `client/src/lib/encryption.ts` for the full technical rationale and honest caveats.

### Prompt Assembly Pipeline

```
DEFAULT_PROMPTS (prompts.ts)         ← 10 curated objectives
         │
         ├── User toggles on/off
         ├── User edits prompt text
         └── User adds custom objectives
         │
         ▼
assemblePromptInstructions(prompts[])
         │
         ▼  (example output)
"In addition to the general analysis, pay special attention to:

### Unfair & Abusive Clauses (EU Directive 93/13/EEC)
Identify clauses that are heavily one-sided...

### Data Privacy & GDPR (Regulation 2016/679)
Analyse all personal data clauses under GDPR..."
         │
         ▼
Prepended to contract text in user message → OpenRouter API
```

### Share URL Encoding

```
SharePayload (JSON)
    ├── version: "3.0.2"
    ├── fileName: "contract.pdf"
    ├── analyzedAt: "2026-04-14T..."
    ├── prompts: ["Unfair & Abusive Clauses", ...]
    └── results: [{ modelId, trustScore, flags, ... }]
         │
         ▼
JSON.stringify  →  encodeURIComponent  →  btoa (base64)
         │
         ▼
https://clippy.legal/#/share/BASE64_HERE

(ShareView.tsx decodes: atob → decodeURIComponent → JSON.parse)
```

The API key is explicitly **never included** in the SharePayload.

### File Extraction Pipeline

```
User drops file (max 10MB)
     │
     ▼
extractTextFromFile(file)  —  client/src/lib/fileParser.ts
     │
     ├── .pdf  ──► pdfjs-dist.getDocument() → iterate pages → getTextContent() → join strings
     │                (pdf.js worker loaded from cdnjs CDN to avoid bundling the 2MB worker)
     │                (scanned-PDF detection: warns if extracted text < 100 chars across all pages)
     │
     ├── .docx ──► mammoth.extractRawText({ arrayBuffer }) → .value
     │
     └── .txt/.md ──► File.text() (native Web API)
     │
     ▼
string stored in React state (fileText)
     │
     ▼
Sent in OpenRouter API body as user message content
```

### State Machine

The app uses a single `AppState` object with a `step` discriminator:

```typescript
type AppStep = "setup" | "prompts" | "results";

// setup → prompts → results
//   ↑____________________|  (reset button)
```

### Model Results Lifecycle

```typescript
// Initial state when analysis starts
{ modelId, modelName, status: "loading", ... }

// On success (fires as each parallel request completes)
{ modelId, modelName, status: "done", trustScore, summary, flags, dimensions, durationMs }

// On error (does not block other models)
{ modelId, modelName, status: "error", error: "human-readable message" }
```

---

## Under the Hood

### Analysis Dimensions

Clippy uses five dimensions to score contract fairness, each on a 0–100 scale. These dimensions were chosen to cover the most common contract failure modes that affect ordinary users:

| Dimension | What it measures | Low score means |
|-----------|-----------------|-----------------|
| **Transparency** | Are terms written in plain, accessible language? Are limitations disclosed clearly? | Buried definitions, dense legalese, obligations hidden in cross-references |
| **Balance** | Are rights and obligations roughly symmetrical between parties? | One party has broad unilateral rights; the other has few or none |
| **Legal Compliance** | Does the contract conform to applicable law? Are clauses that would be unlawful in common jurisdictions present? | Terms that violate GDPR, consumer protection law, or employment law |
| **Financial Risk** | Are the financial obligations clear and proportionate? | Hidden fees, unlimited indemnification, disproportionate penalties |
| **Exit Freedom** | How easily can the weaker party exit? Are exit costs proportionate? | Long notice periods, heavy termination fees, obligations that survive termination |

### Severity Calibration

CRITICAL / SUSPECT / MINOR severity is calibrated to legal standards:

| Severity | Legal threshold | Example |
|----------|----------------|---------|
| **CRITICAL** | Clause is likely unlawful, clearly abusive, or severely harmful | Mandatory arbitration + class waiver (post-*Concepcion*); GDPR Art. 6 lawful basis missing; auto-renewal with no cancellation right; unlimited liability exposure |
| **SUSPECT** | Clause is unusual, one-sided, or potentially enforceable but outside market norms | 90-day notice period for termination; non-compete with no compensation; jurisdiction clause requiring arbitration in an inconvenient city |
| **MINOR** | Clause is worth noting but common and generally accepted | Standard limitation of liability; 30-day payment terms; governing law of the vendor's home state |

### JSON Mode and Fallback Parsing

OpenRouter forwards `response_format: { type: "json_object" }` to models that support it (primarily OpenAI-compatible models). For models that don't (Llama, Mistral, etc.), JSON mode is ignored. The fallback parser in `analyzeWithModel()`:

```typescript
const cleaned = content
  .replace(/^```json?\n?/, "")   // strip opening code fence
  .replace(/\n?```$/, "")        // strip closing code fence
  .trim();
parsed = JSON.parse(cleaned);
```

This handles the common pattern where models wrap their JSON output in a Markdown code block even when instructed not to.

### Temperature at 0.1

Contract analysis benefits from very low temperature. We want deterministic legal assessment, not creative interpretation. `temperature: 0.1` gives consistent results across runs while leaving just enough flexibility for the model to adapt phrasing naturally.

### jsPDF Export Strategy

The PDF export uses jsPDF's text/table API rather than html2canvas because:
- Screenshots capture screen-resolution artifacts (CSS shadows, pixel offsets)
- jsPDF text is searchable, copy-pasteable, and accessible
- Smaller file size (50–200KB vs. 1–5MB for screenshots)
- Works offline — no browser paint cycle needed

### Share URL Length

A typical 2–3 model analysis SharePayload JSON is ~5–15KB. After `encodeURIComponent` + `btoa`, the base64 string is ~7–20KB. Modern browsers support URLs up to 2MB. However, some email clients and URL shorteners truncate at ~2000 chars. Prefer direct copy-paste for sharing very long analysis results.

### pdfjs-dist Worker Strategy

`pdf.js` requires a Web Worker for the actual PDF parsing. We load the worker from `cdnjs.cloudflare.com` rather than bundling it — the worker is ~400KB and is only loaded when a PDF is dropped. The trade-off is a one-time network request for PDF users.

### Trust Score Color Thresholds

| Score | Color | Label |
|-------|-------|-------|
| 75–100 | Green (#22c55e) | Fair |
| 50–74 | Yellow (#eab308) | Caution |
| 30–49 | Orange (#f97316) | Risky |
| 0–29 | Red (#ef4444) | Abusive |

These thresholds are calibrated against typical outputs from Claude and GPT-4o during development. A "100" would be an unusually fair, balanced, plain-language contract. Most real-world contracts land in the 55–75 range.

---

## Project Structure

```
clippy/
├── client/                          # Frontend React application
│   ├── index.html                   # Vite entry point + font preloads + favicon
│   └── src/
│       ├── App.tsx                  # Root component, router (/, /share/:payload)
│       ├── index.css                # Global styles, CSS variables, animations
│       ├── components/
│       │   ├── ClippyCharacter.tsx  # Animated paperclip SVG mascot
│       │   ├── TrustScoreRing.tsx   # Animated SVG ring for trust score
│       │   └── LanguageSwitcher.tsx # Flag grid dropdown for i18n
│       ├── lib/
│       │   ├── openrouter.ts        # OpenRouter API client, model registry, system prompt
│       │   ├── fileParser.ts        # Client-side file text extraction (PDF/DOCX/TXT)
│       │   ├── encryption.ts        # AES-GCM browser-native API key encryption
│       │   ├── prompts.ts           # Curated prompt library (10 objectives, 5 categories)
│       │   ├── export.ts            # PDF (jsPDF) + Markdown download
│       │   ├── share.ts             # URL hash encode/decode for SharePayload
│       │   ├── i18n.ts              # i18n system: 17 locales, t(), I18nProvider, useI18n()
│       │   ├── queryClient.ts       # TanStack Query config
│       │   └── utils.ts             # Tailwind merge utility
│       └── pages/
│           ├── Home.tsx             # Main 3-step wizard (Setup → Objectives → Results)
│           ├── ShareView.tsx        # Read-only shared results viewer
│           └── not-found.tsx        # 404 page
├── server/                          # Dev scaffold only (not used in production)
│   ├── index.ts                     # Express + Vite dev server setup
│   ├── routes.ts                    # Health check route
│   ├── storage.ts                   # No-op storage interface
│   └── vite.ts                      # Vite middleware for dev
├── shared/
│   └── schema.ts                    # TypeScript types: AnalysisPrompt, AppState, SharePayload
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── README.md
├── INSTALL.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

---

## Adding a New Model

1. Open `client/src/lib/openrouter.ts`
2. Add an entry to the `AVAILABLE_MODELS` array:

```typescript
{
  id: "provider/model-name",    // OpenRouter model ID (from openrouter.ai/models)
  name: "Display Name",         // Shown in UI
  provider: "Provider Name",    // Provider label
  description: "Short desc",    // Tooltip / card description
  icon: "P",                    // Single letter avatar fallback
}
```

3. That's it. The model will appear in the model selection grid automatically.

Find model IDs at [openrouter.ai/models](https://openrouter.ai/models).

---

## Customizing Analysis Objectives

### Editing the Built-in Library

The prompt library is in `client/src/lib/prompts.ts` as `DEFAULT_PROMPTS`. Each prompt:

```typescript
{
  id: "unique-id",
  title: "Short display title",
  description: "One-line description shown to users",
  prompt: `The actual instruction text sent to the model...`,
  category: "general" | "privacy" | "financial" | "employment" | "ip" | "custom",
  enabled: boolean,    // true = on by default
  isDefault: boolean,  // true = part of the shipped library
  isCustom: boolean,   // true = user-created (can be deleted)
}
```

### Modifying the Core System Prompt

The core instruction set (JSON format, severity definitions, 5 dimensions) is `SYSTEM_PROMPT` in `client/src/lib/openrouter.ts`. If you add new JSON output fields, update the relevant types in `shared/schema.ts` and the export formatters in `client/src/lib/export.ts`.

---

## Cost Estimates

Approximate costs for a typical 5,000-word contract analyzed by a single model (with 3 default prompts enabled):

| Model | Input (~8k tokens) | Output (~1.5k tokens) | Estimated cost |
|-------|-------------------|-----------------------|----------------|
| Claude 3 Haiku | $0.001 | $0.001 | ~$0.002 |
| GPT-4o Mini | $0.001 | $0.001 | ~$0.002 |
| Gemini Pro 1.5 | $0.006 | $0.003 | ~$0.009 |
| GPT-4o | $0.020 | $0.015 | ~$0.035 |
| Claude 3.5 Sonnet | $0.024 | $0.018 | ~$0.042 |

Running all 8 models on a 5,000-word contract costs roughly **$0.10–0.15** total. The two cheapest models (Haiku + GPT-4o Mini) together cost under $0.01. Enabling additional analysis objectives (Step 2) increases input token count proportionally.

---

## Roadmap

### Done
- [x] v1.0.0 — Multi-model AI analysis, trust score, 5 dimensions, severity flags
- [x] v2.0.0 — 3-step wizard, modular prompt library, AES-GCM encryption, PDF/MD export, share URLs
- [x] v3.0.0 — Full i18n (17 languages), RTL support, logo tagline
- [x] v3.0.1 — Legally grounded prompts, improved system prompt, hardened code, expanded README
- [x] v3.0.2 — Locale-aware AI output: analysis results in the active UI language

### Planned
- [ ] **v3.1.0** — Side-by-side diff view between model results
- [ ] **v3.2.0** — Clause-by-clause highlighting (map flagged clauses back to source text)
- [ ] **v3.3.0** — Template prompt sets (SaaS ToS, employment, real estate, NDA)
- [ ] **v4.0.0** — Optional self-hosted backend with persistent analysis history

---

## Self-Hosting

After `npm run build`, the `dist/public/` folder is a fully self-contained static site:

- **Cloudflare Pages** — Free, global CDN, automatic deploys from GitHub
- **Vercel / Netlify** — One-click deploy, free tier
- **GitHub Pages** — Push `dist/public/` to a `gh-pages` branch
- **Any FTP server** — Upload `dist/public/` contents to your webroot
- **S3 / R2 bucket** — Enable static website hosting, upload contents

See [INSTALL.md](./INSTALL.md) for step-by-step guides.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Areas where help is especially useful:
- Adding more OpenRouter model presets
- Improving the prompt library for specific contract types (real estate, SaaS, employment by jurisdiction)
- Additional translations or translation corrections
- Accessibility improvements
- Testing with edge-case contracts (different languages, unusual formats)

---

## Security

Found a security issue? See [SECURITY.md](./SECURITY.md) for responsible disclosure.

Since Clippy runs entirely client-side and stores no data, the attack surface is minimal. The main security consideration is ensuring the OpenRouter API key is never persisted in ways readable by other scripts. In v2+, the key is AES-GCM encrypted in browser memory — see `client/src/lib/encryption.ts` for full technical details and honest caveats about the limitations of this approach.

---

## License

MIT — see [LICENSE](./LICENSE).

Fork it. Hack it. Make it better. That's the point.

---

## Credits & References

- **Inspired by** [small-print.ai](https://small-print.ai/) — the concept of AI-powered small-print analysis
- **Namesake** [Clippy the Office Assistant](https://en.wikipedia.org/wiki/Office_Assistant), Microsoft Office 97–2003
- **AI routing** [OpenRouter](https://openrouter.ai)
- **PDF parsing** [pdf.js](https://mozilla.github.io/pdf.js/) by Mozilla
- **DOCX parsing** [mammoth.js](https://github.com/mwilliamson/mammoth.js) by Mike Williamson
- **PDF export** [jsPDF](https://github.com/parallax/jsPDF)
- **UI** [React](https://react.dev) + [Vite](https://vitejs.dev) + [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)

### Legal References

- EU Directive 93/13/EEC on unfair terms in consumer contracts — [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A31993L0013)
- General Data Protection Regulation (GDPR) 2016/679 — [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- California Consumer Privacy Act (CCPA) — [California AG](https://oag.ca.gov/privacy/ccpa)
- UK Consumer Rights Act 2015 — [legislation.gov.uk](https://www.legislation.gov.uk/ukpga/2015/15/contents/enacted)
- Federal Arbitration Act (9 U.S.C.) — [Cornell LII](https://www.law.cornell.edu/uscode/text/9)
- AT&T Mobility LLC v. Concepcion, 563 U.S. 333 (2011) — [Supreme Court](https://www.supremecourt.gov/opinions/10pdf/09-893.pdf)
- Rome I Regulation (EC No 593/2008) — [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008R0593)
- California Labor Code § 2870 (IP assignment carve-out) — [California Legislature](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=2870.&lawCode=LAB)
- French Code de la consommation (consumer law) — [Légifrance](https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069565/)

---

## 🤙 A Note on Vibe Coding

> This project is **100% vibe coding**.
>
> I am not a software engineer. I have no CS degree, no MSc, would not pass a LeetCode interview, and I'm not pretending otherwise. I'm a French entrepreneur — a former hacker turned product person — who has always had a healthy obsession with technology and a very good working relationship with AI tools like Claude and Perplexity Computer.
>
> Every line of TypeScript in this repository was written by an AI. Every architecture decision was a conversation. Every bug fix was describing what was broken and letting the model figure out why. The encryption model, the prompt library, the share URL design, the jsPDF export pipeline — all of it emerged from iteration, not from a textbook.
>
> **What I brought:** product taste, legal instinct (this is a contract analyser after all), debugging patience, context management, and the conviction that "AI should read the small print so you don't have to."
>
> **What I didn't bring:** knowledge of AES-GCM internals, TypeScript conditional types, Vite chunk splitting, or how `SubtleCrypto` handles key derivation across browser contexts. I learned those things *during* the build, not before it.
>
> The barrier between *"I have an idea"* and *"the thing exists"* has collapsed. Clippy is proof of that.
>
> Vibe coding is not a replacement for engineering depth. It is a way for people with domain expertise, product instinct, and taste to build things that previously required a team. I think that's worth celebrating — and worth being honest about.

---

<div align="center">

Built by [paulfxyz](https://github.com/paulfxyz) · MIT License · [clippy.legal](https://clippy.legal)

*"It looks like you're signing a contract. Would you like help checking for nasty clauses?"*

</div>
