/**
 * @file prompts.ts
 * @description Curated library of analysis objectives for Clippy v3.0.1.
 *
 * OVERVIEW
 * --------
 * In v1.0.0, there was a single combined system prompt. From v2.0.0 onwards,
 * analysis objectives are modular: each objective is a named, categorised prompt
 * that the user can toggle on/off, edit, or extend with their own custom prompts.
 *
 * All enabled prompts are assembled into a single instruction block that is
 * prepended to the contract text before sending to the model. This lets users
 * focus the AI on what matters to them (e.g. "only check GDPR" for a SaaS
 * agreement, or "focus on IP ownership" for an employment contract).
 *
 * WHAT'S NEW IN v3.0.1
 * --------------------
 * Each of the 10 built-in prompts now includes:
 *   - Specific references to applicable laws, EU Directives, GDPR Articles,
 *     US statutes, UK Acts, French Code articles, and landmark case law
 *   - More precise instruction language about exactly what to look for
 *   - Jurisdiction-aware analysis guidance (EU vs. US vs. UK vs. FR nuances)
 *   - Explicit severity-tagging guidance tied to legal thresholds
 *
 * PROMPT DESIGN PRINCIPLES
 * ------------------------
 * 1. Each prompt is specific and actionable — it tells the model exactly what
 *    to look for, not just "analyse this area".
 * 2. Prompts are additive — they stack without contradicting each other.
 * 3. Default prompts cover the 80% case (general contract risks). Specialised
 *    prompts (GDPR, IP, employment) are opt-in.
 * 4. Custom prompts are free-form — users write them in plain English.
 * 5. Legal citations ground the model's analysis in real standards, reducing
 *    hallucination and improving the quality of severity judgements.
 *
 * PROMPT ORDERING
 * ---------------
 * The system prompt assembles prompts in this order:
 *   1. Core instruction (always present — defines JSON output format)
 *   2. Enabled library prompts (in display order)
 *   3. Custom user prompts (at the end, highest priority)
 *
 * CATEGORIES
 * ----------
 * - general:    Applies to any contract type. Enabled by default.
 * - financial:  Financial risk, pricing, payment terms.
 * - privacy:    GDPR, data collection, third-party sharing.
 * - employment: Non-compete, IP assignment, termination clauses.
 * - ip:         Intellectual property, licensing, ownership.
 * - custom:     Created by the user at runtime.
 */

import type { AnalysisPrompt } from "@shared/schema";

// ---------------------------------------------------------------------------
// Default prompt library
// ---------------------------------------------------------------------------

/**
 * The built-in prompt library.
 * These are shown in Step 2 (Prompts) of the analysis wizard.
 * Users can toggle, edit, and add to these.
 *
 * Legal references embedded in each prompt:
 * - EU Directive 93/13/EEC (unfair terms in consumer contracts)
 * - GDPR Regulation 2016/679
 * - UK Consumer Rights Act 2015
 * - US Federal Arbitration Act, 9 U.S.C.
 * - AT&T Mobility LLC v. Concepcion, 563 U.S. 333 (2011)
 * - California Labor Code § 2870 (IP assignment carve-out)
 * - French Code de la consommation Art. L. 212-1
 * - California Business & Professions Code § 16600 (non-compete ban)
 */
export const DEFAULT_PROMPTS: AnalysisPrompt[] = [
  // ---- GENERAL (default on) ------------------------------------------------

  {
    id: "general-red-flags",
    title: "Unfair & Abusive Clauses",
    description: "Detect one-sided, abusive, or legally questionable clauses under EU Directive 93/13/EEC, UK CRA 2015, and general unconscionability doctrine.",
    category: "general",
    enabled: true,
    isDefault: true,
    isCustom: false,
    prompt: `Identify clauses that are heavily one-sided, abusive, or potentially unlawful. Apply the legal standards of:

EU DIRECTIVE 93/13/EEC (applies to all EU consumer contracts):
- A clause is unfair if it "causes a significant imbalance in the parties' rights and obligations to the detriment of the consumer" (Art. 3(1))
- Look for clauses on the Directive's "grey list" (Annex): unilateral modification rights, exclusive interpretation rights, automatic renewal with short cancellation windows, unlimited indemnification on the consumer's side
- The "contra proferentem" rule: any ambiguous term must be interpreted against the drafter (Art. 5)

UK CONSUMER RIGHTS ACT 2015 (for UK contracts):
- Section 62: same significant-imbalance + good-faith test as EU Directive
- Section 65: no clause can exclude liability for death or personal injury — flag any that attempt to

US UNCONSCIONABILITY DOCTRINE (for US contracts):
- Look for both procedural unconscionability (surprise, no meaningful choice) and substantive unconscionability (oppressively one-sided terms)
- Courts require both elements, though extreme substantive terms may compensate for lower procedural unconscionability

FRENCH CODE DE LA CONSOMMATION Art. L. 212-1 (for French law contracts):
- The French "black list" (Décret 2009-302) includes clauses that are irrebuttably abusive — particularly clauses excluding professional liability, and clauses allowing unilateral price increases without a right of withdrawal

FLAG as CRITICAL:
- Unilateral modification rights with no meaningful notice or opt-out
- Clauses that exclude liability for negligence, death, or personal injury
- Clauses eliminating all consumer remedies (mandatory arbitration + class-action waiver combined)
- Automatic renewal with less than 30 days cancellation notice (may violate Loi Châtel in France)
- Unlimited damage or indemnification obligations on the user's/consumer's side with no reciprocal cap

FLAG as SUSPECT:
- Unilateral modification with notice but no opt-out or exit right
- Very broad "as permitted by law" exclusion clauses
- Clauses giving one party exclusive right to interpret the contract
- Provisions that appear in all-caps but are still substantively abusive`,
  },

  {
    id: "general-termination",
    title: "Termination & Exit Rights",
    description: "Analyse termination, cancellation, and auto-renewal clauses — including compliance with Loi Châtel (France) and EU consumer law.",
    category: "general",
    enabled: true,
    isDefault: true,
    isCustom: false,
    prompt: `Examine all termination, cancellation, auto-renewal, and exit clauses. Apply the following legal framework:

AUTO-RENEWAL (Reconduction tacite):
- FRANCE (Loi Châtel, Art. L. 215-1 Code de la consommation): For contracts with annual auto-renewal, the supplier must notify the consumer 1–3 months before the opt-out deadline. If this notice is not given, the consumer may terminate at any time and owes only for services received. Flag contracts that have automatic renewal without mandatory advance notification.
- EU: Automatic renewal clauses with very short cancellation windows appear on the Annex "grey list" of Directive 93/13/EEC as presumptively unfair
- UK: Under Consumer Contracts Regulations 2013, consumers must be clearly informed of renewal terms before the contract is made

TERMINATION FOR CAUSE vs. CONVENIENCE:
- Can either party terminate for convenience, or only "for cause"? One-sided termination rights heavily favour the vendor
- What constitutes "cause"? Vague definitions of "material breach" with no cure period are suspicious
- How many days notice is required? 30 days is standard consumer-level notice; 90+ days is unusual and potentially oppressive

POST-TERMINATION OBLIGATIONS:
- What obligations survive termination? (Non-compete, confidentiality, IP assignment, data retention, payment obligations)
- Survival clauses that keep obligations alive "indefinitely" without a time limit warrant SUSPECT or CRITICAL flags
- Under GDPR Art. 17, continued data retention after termination may be unlawful

EARLY TERMINATION PENALTIES:
- Are financial penalties for early termination proportionate to the actual loss? Under Directive 93/13/EEC, disproportionate penalties appear on the grey list as potentially unfair
- Is there a right to exit if the other party materially changes the terms? Absence of a change-of-terms exit right is a red flag

FLAG as CRITICAL:
- Auto-renewal with no advance notice obligation and no right to exit at reasonable notice
- Termination penalties that appear to punish rather than compensate (punitive, not restorative)
- Post-termination obligations that are indefinite and uncapped in scope
- No right to terminate for convenience at any reasonable notice period

FLAG as SUSPECT:
- Termination for convenience available to one party but not the other
- Vague "material breach" definitions with no opportunity to cure
- Non-compete or non-solicitation obligations surviving termination with no stated time limit`,
  },

  {
    id: "general-governing-law",
    title: "Governing Law & Jurisdiction",
    description: "Check where disputes must be resolved — and whether choice-of-law clauses strip EU/UK consumers of statutory protections under Rome I Regulation.",
    category: "general",
    enabled: true,
    isDefault: true,
    isCustom: false,
    prompt: `Analyse the governing law and dispute resolution clauses in detail. Apply these legal frameworks:

CHOICE OF LAW — CONSUMER PROTECTION LIMITS:
- EU ROME I REGULATION (Reg. 593/2008 Art. 6): For consumer contracts, the chosen law CANNOT deprive the consumer of the protections afforded by the mandatory rules of their country of habitual residence. A US company's ToS saying "governed by Delaware law" cannot strip an EU consumer of their rights under Directive 93/13/EEC or GDPR.
- UK: Post-Brexit, the UK Rome I equivalent (retained in UK law) preserves similar consumer protections
- Identify if the contract appears to be consumer-facing and whether the governing law choice would deprive the consumer of statutory protections

MANDATORY ARBITRATION:
- US FEDERAL ARBITRATION ACT (9 U.S.C.): The FAA strongly favours arbitration. Post AT&T Mobility v. Concepcion (563 U.S. 333, 2011), mandatory arbitration + class-action waiver clauses are generally enforceable against US consumers — meaning consumers lose access to class actions and small-claims courts for many disputes
- EU: Mandatory pre-dispute arbitration clauses in consumer contracts are generally considered unfair under Directive 93/13/EEC (violates EU Charter Art. 47 right to an effective remedy). EU courts can examine such clauses of their own motion (Océano Grupo v. Quintero, C-240/98)
- UK CRA 2015 s.91: Arbitration clauses in consumer contracts are unfair to the extent they require arbitration for claims under £5,000 without preserving court access

CLASS-ACTION WAIVERS:
- Post-Concepcion and American Express v. Italian Colors (2013), class waivers are broadly enforceable in the US even when individual claims are economically unviable
- Flag: Does the contract include a class-action waiver? This effectively eliminates collective redress for low-value claims
- Exception: Some claims (e.g., sexual harassment under the 2022 Ending Forced Arbitration Act) cannot be compelled to arbitration

FORUM SELECTION:
- Is mandatory dispute resolution in a city far from where the consumer is likely to be?
- Is the forum the vendor's home jurisdiction, with no reciprocal option for the user?
- Under Brussels I Recast Regulation (EU 1215/2012 Art. 17-19): EU consumers have the right to sue in their own member state regardless of any exclusive jurisdiction clause

FLAG as CRITICAL:
- Mandatory arbitration + class-action waiver in a consumer-facing contract (eliminates practical redress for most users)
- Choice-of-law clause that would strip EU/UK consumers of mandatory statutory protections
- Exclusive jurisdiction requiring disputes in a jurisdiction with no practical access for the other party

FLAG as SUSPECT:
- Governing law of the vendor's home state in a clearly cross-border contract
- Arbitration clause without an option to use small-claims court for low-value disputes
- Unilateral right to seek injunctive relief in court while requiring the user to arbitrate all claims`,
  },

  // ---- FINANCIAL (default off) ---------------------------------------------

  {
    id: "financial-pricing",
    title: "Pricing & Payment Risks",
    description: "Find hidden fees, automatic price increases, and unfair payment terms — including analysis under EU consumer protection and Directive 93/13/EEC Annex.",
    category: "financial",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Scrutinise all financial clauses, pricing terms, and payment conditions. Apply these standards:

AUTOMATIC PRICE INCREASES:
- Under EU Directive 93/13/EEC Annex item (l): clauses allowing the seller to alter the contract price are presumptively unfair unless the seller is also obliged to inform the consumer, who has the right to cancel
- Identify: "prices may increase by up to X% annually" with no opt-out right → CRITICAL
- Identify: CPI/index-linked adjustments with no notification obligation → SUSPECT
- French Code de la consommation "black list": unilateral price increase without a correlative withdrawal right is irrebuttably abusive

HIDDEN FEES:
- What fees are not prominently disclosed in the main price? (setup fees, overage charges, support fees, currency conversion fees, early termination fees)
- EU Distance Selling/Consumer Rights Directive: pricing must include all charges before the contract is made. Hidden fees that emerge post-signing may violate pre-contractual information duties
- Are data storage/usage/bandwidth overage charges clearly capped or uncapped?

LATE PAYMENT PENALTIES:
- Are late payment interest rates proportionate? EU Late Payments Directive (2011/7/EU) sets a statutory reference rate; B2B clauses above this are suspicious
- For consumer contracts: disproportionate penalties appear on the Directive 93/13/EEC grey list

REFUND AND PAYMENT OBLIGATIONS:
- Is payment non-refundable once made? Under what conditions?
- For annual prepayments: what is refunded on early termination?
- Who bears transaction costs, taxes (VAT/GST), and currency conversion? Clauses shifting all such costs to the consumer with no cap are suspect

RECURRING CHARGES:
- Subscription auto-charge language: does the user have a right to cancel before the next billing cycle?
- How much advance notice of price changes is given before the next billing date?
- Are there minimum commitment periods, and what are the costs of breaking them?

FLAG as CRITICAL:
- Unilateral price increase with no right to exit the contract
- Uncapped fee escalation tied to metrics the vendor controls
- Non-refundable annual payments with no pro-rata return on early termination
- Hidden fees or charges that are not prominently disclosed before signing

FLAG as SUSPECT:
- Price increases above CPI with notification but no exit right
- Late payment penalties significantly above the statutory reference rate
- All currency conversion costs placed on the user without disclosure of the exchange rate methodology`,
  },

  {
    id: "financial-liability",
    title: "Liability & Indemnification",
    description: "Assess the liability cap structure, indemnification obligations, and warranty disclaimers — including UCTA 1977 and EU mandatory liability rules.",
    category: "financial",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all liability limitation, indemnification, warranty disclaimer, and consequential loss exclusion clauses. Apply these standards:

LIABILITY CAPS:
- What is the total liability cap? Typical B2B SaaS caps: fees paid in the last 3–12 months. Consumer contracts often have lower caps.
- UK UCTA 1977 s.11 "reasonableness test" for B2B contracts: consider relative bargaining power, whether insurance was available, whether the cap was negotiated
- EU/UK: Liability for death or personal injury caused by negligence CANNOT be capped or excluded (UK CRA 2015 s.65; EU Directive 93/13/EEC Annex item (a)). Flag any attempt to do so as CRITICAL.
- French Code civil Art. 1231-3: consequential loss can be excluded in B2B contracts if the exclusion was agreed at the time of contract formation. In consumer contracts, such exclusions are generally void.

CARVE-OUTS TO THE CAP:
- Identify what is excluded from the liability cap — these are your exposure points
- Common carve-outs: IP infringement, death/personal injury (mandatory), fraud, wilful misconduct, confidentiality breaches, data breaches, indemnification obligations
- A liability cap with a broad indemnification carve-out is largely illusory — the indemnification will likely exceed the cap

INDEMNIFICATION:
- Who must indemnify whom, and for what events?
- Broad indemnification triggers: "any claim arising from or relating to your use" is effectively unlimited and should be flagged CRITICAL
- Third-party IP indemnification from the vendor: is there one? If you receive a patent infringement claim for using the vendor's product, are you covered?
- User content indemnification: many ToS require users to indemnify the platform for all claims arising from user content — flag if the scope is not limited to the user's own wrongdoing
- Defense control: does the indemnifying party control the defense? Can they settle without your consent in a way that binds you?

WARRANTY DISCLAIMERS:
- "As-is" + "no warranty of merchantability or fitness for purpose": standard in B2B software, but in consumer contracts may violate implied warranties that cannot be disclaimed
- UK CRA 2015 ss.49-57: for consumer service contracts, there is an implied term that the service will be performed with reasonable care and skill. This cannot be excluded.
- EU Product Liability Directive: cannot be excluded for physical goods

FLAG as CRITICAL:
- Any attempt to exclude liability for death, personal injury, or fraud
- Indemnification obligations triggered by "any claim arising from your use" with no limitation to the user's own negligence
- Liability cap of zero or a nominal amount where the vendor's potential to cause harm is significant
- Broad indemnification carve-out from an otherwise capped liability clause

FLAG as SUSPECT:
- Cap set at less than 3 months' fees in a contract involving significant data or operational risk
- User must indemnify for third-party IP claims arising from the vendor's product
- "As-is" disclaimer in a consumer-facing contract for essential services`,
  },

  // ---- PRIVACY (default off) -----------------------------------------------

  {
    id: "privacy-gdpr",
    title: "Data Privacy & GDPR",
    description: "Check data collection, processing, third-party sharing, retention, and cross-border transfers under GDPR Arts. 5-7, 13, 17, 20, 28, and 44-49.",
    category: "privacy",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all data privacy and personal data clauses under GDPR Regulation 2016/679 and general best practices. Be thorough and specific:

LAWFUL BASIS (GDPR Art. 6):
- What lawful basis is stated for each processing purpose? The six bases are: consent, performance of a contract, compliance with a legal obligation, vital interests, public task, and legitimate interests
- Vague "legitimate interests" claims without specifics are suspect — the controller must identify the specific interest and demonstrate it overrides the data subject's rights
- Is consent being used as the basis where a more appropriate basis (contract performance) applies, or vice versa?
- Flag: consent bundled with service acceptance ("by using this service, you consent to...") — violates GDPR Art. 7(4) (consent must be freely given; bundling with service provision invalidates consent where data processing is not necessary for the service)

TRANSPARENCY OBLIGATIONS (GDPR Art. 13):
- At or before the point of data collection, must the controller disclose: (a) identity and contact details of controller; (b) DPO contact if applicable; (c) purposes and legal basis; (d) recipients or categories of recipients; (e) international transfer information; (f) retention periods; (g) data subject rights; (h) right to withdraw consent; (i) right to lodge a complaint with a supervisory authority
- Does the contract or privacy notice cover all these elements? Missing any of them may constitute a violation

DATA SHARING WITH THIRD PARTIES:
- Are third parties identified, or only described as "trusted partners" or "affiliates"? GDPR requires specificity
- Does the contract allow selling or monetising personal data to third parties? If so, what legal basis is claimed?
- Distinguish processors (act on controller's instructions, require a formal DPA per Art. 28) from joint controllers (share responsibility, require an Art. 26 arrangement)
- GDPR Art. 28 DPA requirements: if a vendor processes personal data on your behalf, a written DPA must specify: subject matter and duration of processing; nature and purpose; type of data; obligations and rights of controller; sub-processor restrictions; return/deletion of data on termination

DATA SUBJECT RIGHTS:
- Are the following rights explicitly acknowledged: access (Art. 15), rectification (Art. 16), erasure (Art. 17 "right to be forgotten"), restriction (Art. 18), portability (Art. 20), objection (Art. 21)?
- Right to erasure: can the user request deletion of their data? What is the response time? (GDPR requires 30-day response)
- Data portability (Art. 20): can users export their data in a machine-readable format?

RETENTION:
- How long is data retained after the relationship ends? "For as long as necessary" without specifics violates Art. 5(1)(e) (storage limitation principle)
- Is there a documented retention schedule, or is data kept indefinitely?

INTERNATIONAL TRANSFERS (GDPR Arts. 44-49):
- Is any data transferred outside the EU/EEA? If so, what mechanism is used?
- Valid mechanisms: adequacy decision (EU → UK, Canada, Japan, etc.); Standard Contractual Clauses (SCCs, updated 2021); Binding Corporate Rules; Article 49 derogations
- Post-Schrems II (C-311/18): EU-US transfers require SCCs + a Transfer Impact Assessment. EU-US Data Privacy Framework (2023) provides a new adequacy mechanism, but its longevity is uncertain

FLAG as CRITICAL:
- Consent bundled with service acceptance (violates Art. 7(4))
- Data sold or monetised to third parties without clearly stated lawful basis
- No right to erasure or data portability acknowledged
- International transfers with no adequacy decision and no mention of SCCs
- Retention of data indefinitely after account closure with no stated purpose

FLAG as SUSPECT:
- "Legitimate interests" stated as lawful basis without specifying what interest
- Third parties described only as "affiliates" or "partners" without specificity
- No explicit DPA terms where the contract involves processing personal data on behalf of a controller
- Response time for data subject requests not stated or exceeds 30 days`,
  },

  {
    id: "privacy-monitoring",
    title: "Monitoring & Surveillance",
    description: "Identify clauses permitting monitoring of communications, devices, or activity — assessed against GDPR, ECPA (US), and employment law standards.",
    category: "privacy",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Look for any clauses permitting surveillance, monitoring, or tracking. Apply these frameworks:

EMPLOYEE MONITORING (employment contracts and workplace policies):
- US ELECTRONIC COMMUNICATIONS PRIVACY ACT (ECPA, 18 U.S.C. § 2510 et seq.): Employers may monitor communications on employer-provided equipment/networks if employees consent. Consent is typically obtained via the employment agreement or a separate policy. Flag: does the contract establish consent to monitoring, and if so, does it clearly specify what is being monitored?
- EU WORKPLACE MONITORING: Under GDPR, employee monitoring must have a lawful basis (typically legitimate interests, Art. 6(1)(f)), be proportionate to the monitoring objective, be transparent, and be the least invasive option available. Covert monitoring is generally unlawful (Article 29 Working Party Opinion 2/2017)
- UK: ICO guidance requires employers to assess privacy impact and inform employees before monitoring starts
- Flag clauses permitting monitoring of personal devices (BYOD) — this is highly sensitive and requires explicit, informed consent
- Flag clauses permitting monitoring of personal (non-work) email accounts or communications

SCOPE OF MONITORING:
- Does the contract allow monitoring of: email, instant messages, internet browsing, physical location/GPS, keystroke logging, screen capture, phone calls?
- Is monitoring continuous, random, or triggered? Continuous monitoring of all communications is disproportionate in most EU/UK contexts
- Biometric data: any clause involving biometric monitoring (facial recognition, fingerprints) triggers GDPR Art. 9 (special category data) requirements — explicit consent or another qualifying basis is required, and additional safeguards apply

AUDIT AND ACCESS RIGHTS:
- Does the contract give the other party the right to inspect your systems, files, or premises?
- Are "audit rights" unlimited in scope, frequency, and timing? Unrestricted audit rights with no notice requirement are invasive and one-sided
- Vendor access to production systems or client data as part of "support" — is the scope defined and limited?

BACKGROUND CHECKS:
- Are background check requirements proportionate to the role?
- What data is collected, who processes it, and how long is it retained? (GDPR applies to background check data)
- Credit checks: are these relevant to the role? In many EU jurisdictions, requiring credit checks from employees is disproportionate except for roles with specific financial responsibility

FLAG as CRITICAL:
- Monitoring of personal (non-work) devices or communications without explicit, informed consent
- Biometric monitoring without GDPR Art. 9-compliant justification
- Covert monitoring with no disclosure to the monitored party
- Unlimited right to inspect personal systems, accounts, or files

FLAG as SUSPECT:
- Monitoring of work communications with no specification of what is monitored or for what purpose
- Audit rights with no advance notice requirement and unlimited scope
- Background check or screening obligations beyond what is proportionate to the position`,
  },

  // ---- EMPLOYMENT (default off) --------------------------------------------

  {
    id: "employment-noncompete",
    title: "Non-Compete & Restrictive Covenants",
    description: "Flag non-compete, non-solicitation, and garden-leave clauses — assessed against California § 16600, UK reasonableness test, and French mandatory compensation.",
    category: "employment",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Examine all post-employment restrictive covenants. Apply the following jurisdiction-specific analysis:

NON-COMPETE ENFORCEABILITY BY JURISDICTION:
- CALIFORNIA (most protective): Cal. Bus. & Prof. Code § 16600: Non-competes are void as a matter of public policy except in connection with the sale of a business. Even if the contract is governed by another state's law, California courts will often apply § 16600 to protect California-resident employees. Courts will NOT "blue-pencil" (rewrite) the clause — the whole clause fails.
- MINNESOTA: Minn. Stat. § 181.988 (effective Jan 1, 2023): Non-competes for employment or independent contractor relationships entered after this date are void and unenforceable.
- NORTH DAKOTA: ND Cent. Code § 9-08-06: Non-competes are void with narrow exceptions.
- FEDERAL FTC RULE (2024): The FTC issued a rule seeking to ban most non-competes for workers. As of mid-2026, its status is subject to ongoing litigation — verify current status.
- NEW YORK: "Reasonableness" test — must protect a legitimate business interest, be limited in time and geography, not impose undue hardship on the employee
- UK: "Reasonableness" test (established since Mason v. Provident Clothing [1913] AC 724) — must protect a legitimate proprietary interest (trade secrets, customer connections, or stable workforce); must be no wider than reasonably necessary in duration, geography, and scope
- FRANCE: Cass. Soc., 10 juillet 2002 — Non-competes in employment contracts are only valid if: (a) the restriction is justified by the employer's specific interests; (b) limited in time and geography; (c) the employee receives financial compensation during the restriction period (typically 30-50% of salary). A non-compete without compensation is null and void.
- GERMANY: HGB §§ 74-75: Non-competes in employment require financial compensation of at least 50% of last earned contractual remuneration

ASSESSMENT CHECKLIST:
- Duration: How long does the restriction last? More than 12 months in the UK or EU raises concern; in California, any duration is void
- Geography: What is the restricted area? "Worldwide" is almost never enforceable as a non-compete (though it may be fine for confidentiality)
- Scope: What activities are restricted? "Competitive" must be defined — overly broad definitions (e.g., "any business that offers software products") are suspect
- Who terminates: Does the non-compete apply even if the employer terminates without cause? Applying a restriction to an employee who was fired without cause is harsh and often unenforceable
- Compensation: Is there financial compensation during the restriction period? (Required in France and Germany; not typically required in UK/US)
- Garden leave: Is there a garden-leave provision? Is the salary during garden leave the same as regular salary?
- Non-solicitation of employees and clients: Are the scope and duration reasonable? "Never solicit any client the company has ever served" is overbroad

FLAG as CRITICAL:
- Non-compete with no compensation where the governing law requires it (France, Germany)
- Worldwide non-compete in an employment contract with no business justification
- Non-compete in a California-governed contract (presumptively void under § 16600)
- Restriction period beyond 2 years in any jurisdiction
- Non-solicitation of clients that includes clients the employee never worked with

FLAG as SUSPECT:
- Non-compete that applies when the employer terminates without cause
- No definition of "competitive activity" — broadly defined to cover unrelated industries
- Garden-leave salary reduced below regular salary
- Non-solicitation of employees that extends beyond 12 months`,
  },

  {
    id: "employment-ip-assignment",
    title: "IP Assignment (Employment)",
    description: "Check who owns work created during or outside employment — analysed under California Labor Code § 2870, CDPA 1988, and French Code de la Propriété Intellectuelle.",
    category: "employment",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all intellectual property assignment and ownership clauses in the employment context. Apply these jurisdiction-specific standards:

DEFAULT IP OWNERSHIP BY JURISDICTION:
- US (work-made-for-hire, 17 U.S.C. § 101): Work created by employees within the scope of employment is "work made for hire" and vests in the employer. Employment agreements typically include additional assignment clauses to capture inventions and IP not covered by the statutory work-for-hire doctrine.
- UK (Patents Act 1977 s.39; CDPA 1988 s.11): Works and inventions created in the course of employment vest in the employer. "Course of employment" is narrowly construed — work done on personal time with personal equipment on unrelated topics is generally not employer property.
- FRANCE (Code de la Propriété Intellectuelle): Copyright vests originally in the author (the employee). Employer rights over copyright works are limited — specific written assignments are required. Moral rights (droit moral) are inalienable and cannot be waived in France.

STATUTORY EMPLOYEE CARVE-OUTS:
- CALIFORNIA (Cal. Lab. Code § 2870): An assignment clause CANNOT require assignment of an invention that: (a) was developed entirely on the employee's own time; (b) without using the employer's equipment, supplies, facilities, or trade secrets; (c) does not relate to the employer's business or its actual or demonstrably anticipated research and development; and (d) does not result from work performed by the employee for the employer. Similar protections exist in Delaware, Illinois, Minnesota, North Carolina, Washington.
- Flag any clause that lacks a § 2870-equivalent carve-out for contracts governed by California law

BLANKET ASSIGNMENT CLAUSES:
- Does the employer claim ownership of ALL inventions, discoveries, or works — even those created entirely on personal time and unrelated to the job?
- Is there an assignment of "future inventions" that the employee may create after the employment ends? How long does this survive?
- Is there a disclosure obligation for ALL inventions, even personal ones? This is a red flag — disclosure requirements that extend to personal projects are invasive and may be unenforceable

MORAL RIGHTS:
- Does the contract include a blanket waiver of moral rights? Under French law, moral rights are inalienable — such a waiver is legally meaningless but worth noting.
- Under UK CDPA 1988 s.78, moral rights can be waived by written agreement. A blanket moral rights waiver in an employment context should be flagged.

POST-EMPLOYMENT IP:
- What happens to IP created after the employment ends? Is there a "last 12 months" provision claiming anything the employee creates after leaving that "relates to the employer's business"?
- How long does the IP assignment clause survive termination?

OPEN SOURCE:
- Does the contract prohibit or restrict the employee from contributing to open-source projects? On personal time? On company time?
- Does it claim ownership of open-source contributions?

FLAG as CRITICAL:
- Blanket assignment of all inventions including those created on personal time with no carve-out (violates Cal. Lab. Code § 2870 for California employees)
- Disclosure obligation for personal inventions unrelated to the employer's business
- Post-employment IP assignment extending more than 12 months after termination
- Moral rights waiver in a French-law employment contract (unenforceable but demonstrates intent)

FLAG as SUSPECT:
- Open-source contribution prohibition without distinguishing personal vs. company time
- Assignment of inventions "relating to the company's business" with no specificity — too broad if the company is in a large, general sector
- No explicit carve-out for pre-existing IP the employee brought to the job`,
  },

  // ---- IP (default off) ----------------------------------------------------

  {
    id: "ip-licensing",
    title: "IP & Licensing Rights",
    description: "Check licensing breadth, royalty terms, ownership, and restrictions on use — including grant-back clauses and broad content licences.",
    category: "ip",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all intellectual property licensing and ownership clauses. Apply these standards:

LICENCE SCOPE ANALYSIS:
- What exactly is being licensed? (Content, data, software, brand, methodology?)
- Is the licence: exclusive or non-exclusive; worldwide or geographically limited; royalty-free or with royalties; sublicensable or not; irrevocable or revocable?
- RED FLAG: An irrevocable, royalty-free, worldwide, sublicensable licence to user content is effectively a transfer of economic rights — common in social media ToS but problematic for business or creative content
- Can the licensor use the licensed material for purposes beyond what's stated? Broadly worded purpose clauses ("for any purpose") grant unlimited use rights

CONTENT LICENCE IN PLATFORM/SAAS AGREEMENTS:
- Many SaaS and platform agreements include a clause like "you grant us a licence to your content to operate and improve our services." Assess: Is "improve our services" being used to justify AI training on user data? Is this adequately disclosed?
- Under GDPR, using personal data to train AI models requires a valid legal basis and transparency (Art. 5(1)(a), 13). An unclear "improve our services" clause may be insufficient.
- Does the platform claim the right to display, redistribute, or monetise user content? To whom?

GRANT-BACK CLAUSES:
- Does the contract require you to licence back to the other party any improvements or derivative works you create based on their technology?
- Grant-backs can be: exclusive (transfers the improvement back entirely) or non-exclusive (licences it while you retain rights). Exclusive grant-backs in technology licences can raise antitrust concerns.
- Is the grant-back royalty-free? Unilateral royalty-free grant-backs significantly undervalue the licensee's contributions

OWNERSHIP OF DELIVERABLES (SERVICES/FREELANCE CONTEXT):
- For service agreements: who owns work created specifically for the client? Is it work-made-for-hire, or does the service provider retain copyright and grant a licence?
- "Work made for hire" in a freelance context (US 17 U.S.C. § 101): only applies if the work falls into one of nine statutory categories AND there is a written work-for-hire agreement. If it's not in those categories, ownership must be explicitly assigned in writing.
- In EU/UK: freelancers own their copyright unless they execute a written assignment. A mere licence to use is not an assignment.

RESTRICTIONS ON COMPETITIVE USE:
- Does the contract prohibit you from using similar technology or platforms from competitors?
- "Most favoured nation" (MFN) clauses: does it require you to offer the same (or better) terms to the other party as you offer to anyone else? MFN clauses in platform agreements can be anticompetitive.
- Non-compete provisions in an IP licence context: are they proportionate to the licensor's actual IP protection interest?

OPEN SOURCE COMPLIANCE:
- Does the contract acknowledge use of open-source components? Are FOSS licences (GPL, LGPL, AGPL) respected?
- GPL and AGPL licences may impose copyleft obligations on derivative works or software-as-a-service — is the vendor complying?

FLAG as CRITICAL:
- Irrevocable, royalty-free, worldwide, sublicensable content licence with no scope limitation (effectively a full economic rights transfer)
- Grant-back clause that is exclusive (transfers improvements back to the licensor, extinguishing your rights)
- Unclear consent to use data/content for AI training without explicit disclosure
- Prohibition on using any competitive product while the contract is in force (without reasonable justification)

FLAG as SUSPECT:
- Sublicensable content licence without limits on who sub-licensees are
- Royalty-free grant-back of improvements where the improvement may have significant independent value
- Broad "derivative works" language that could encompass work built with the other party's product
- Perpetual licence that survives termination without a clear termination mechanism`,
  },
];

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

/**
 * Assembles the enabled prompts into a single instruction string.
 *
 * The resulting string is injected into the OpenRouter request as additional
 * user instructions, after the core system prompt and before the contract text.
 *
 * ASSEMBLY FORMAT
 * ---------------
 * Each enabled prompt is rendered as a level-3 Markdown header followed by its
 * instruction text. The full block is prefixed with a framing sentence to signal
 * to the model that these are layered objectives, not replacements for the core
 * JSON analysis format.
 *
 * The additional objectives go into the USER message (not the system message)
 * so they layer additively on top of the SYSTEM_PROMPT's JSON schema without
 * overriding it. This is important: if objectives were in the system message,
 * models might deprioritise the JSON format instructions.
 *
 * @param prompts - All prompts in the current session state.
 * @returns A formatted instruction string, or empty string if nothing is enabled.
 */
export function assemblePromptInstructions(prompts: AnalysisPrompt[]): string {
  const enabled = prompts.filter(p => p.enabled);
  if (enabled.length === 0) return "";

  const sections = enabled.map(p =>
    `### ${p.title}\n${p.prompt}`
  );

  return [
    "In addition to the general analysis, pay special attention to the following specific objectives.",
    "For each objective, look for clauses that implicate the legal standards described.",
    "Your JSON output (flags, dimensions, trustScore) must reflect findings from ALL objectives below:",
    "",
    ...sections,
  ].join("\n\n");
}

// ---------------------------------------------------------------------------
// Prompt utilities
// ---------------------------------------------------------------------------

/**
 * Creates a new blank custom prompt with a generated ID.
 * Used when the user clicks "Add Custom Objective" in Step 2.
 *
 * The ID uses a timestamp + random suffix to guarantee uniqueness even if
 * multiple prompts are created within the same millisecond.
 *
 * @returns A new AnalysisPrompt in the "custom" category, ready for editing.
 */
export function createCustomPrompt(): AnalysisPrompt {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    description: "",
    prompt: "",
    category: "custom",
    enabled: true,
    isDefault: false,
    isCustom: true,
  };
}

/**
 * Maps a prompt category to a display label and colour class.
 *
 * Colour classes are Tailwind utility classes compatible with both light and
 * dark mode. These appear as small coloured badges next to each prompt card
 * in the Step 2 prompt library interface.
 */
export const CATEGORY_META: Record<AnalysisPrompt["category"], { label: string; color: string }> = {
  general:    { label: "General",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  financial:  { label: "Financial",  color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  privacy:    { label: "Privacy",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  employment: { label: "Employment", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  ip:         { label: "IP",         color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  custom:     { label: "Custom",     color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
};
