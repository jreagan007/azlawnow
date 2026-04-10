/**
 * Generate Arizona legal glossary entries
 * 60+ terms covering liability, damages, procedure, insurance, AZ statutes, practice-specific
 *
 * Usage: npx tsx scripts/generate-glossary.ts
 */

import { writeFileSync, mkdirSync } from 'fs';

const OUT_DIR = 'src/content/glossary';
mkdirSync(OUT_DIR, { recursive: true });

interface GlossaryEntry {
  slug: string;
  term: string;
  category:
    | 'liability'
    | 'damages'
    | 'procedure'
    | 'insurance'
    | 'arizona-statute'
    | 'practice-specific';
  definition: string;
  arizonaContext?: string;
  alsoKnownAs?: string[];
  relatedTerms?: string[];
  relatedPracticeAreas?: string[];
  arsReference?: string;
  arsUrl?: string;
}

const entries: GlossaryEntry[] = [
  // ── Liability (15) ──
  {
    slug: 'negligence',
    term: 'Negligence',
    category: 'liability',
    definition: "Negligence is the failure to act with the level of care that a reasonable person would use in the same situation. To prove negligence in Arizona, you must show duty, breach, causation, and damages.",
    arizonaContext: "Arizona uses a duty-breach-causation-damages framework for negligence claims. The plaintiff must prove the defendant owed a duty of care, breached that duty, and the breach caused harm.",
    relatedTerms: ['duty-of-care', 'breach-of-duty', 'proximate-cause', 'comparative-fault'],
    relatedPracticeAreas: ['car-accidents', 'slip-and-fall', 'medical-negligence'],
  },
  {
    slug: 'duty-of-care',
    term: 'Duty of Care',
    category: 'liability',
    definition: "A legal obligation requiring people to act with reasonable care to avoid causing harm to others. The first element of any negligence claim.",
    arizonaContext: "Arizona courts determine duty by looking at the relationship between the parties, the foreseeability of harm, and public policy. Some duties are codified by statute (drivers, healthcare providers), others are common law.",
    relatedTerms: ['negligence', 'breach-of-duty', 'standard-of-care'],
    relatedPracticeAreas: ['medical-negligence', 'premises-liability'],
  },
  {
    slug: 'breach-of-duty',
    term: 'Breach of Duty',
    category: 'liability',
    definition: "A failure to meet the standard of care required by a duty. This is the second element of negligence: showing that the defendant did not act as a reasonable person would have.",
    arizonaContext: "In Arizona, breach is typically a question of fact for the jury. Expert testimony is often required in medical or professional negligence cases to establish what the standard of care required.",
    relatedTerms: ['duty-of-care', 'standard-of-care', 'negligence'],
  },
  {
    slug: 'standard-of-care',
    term: 'Standard of Care',
    category: 'liability',
    definition: "The level of care a reasonably prudent person or professional would exercise in the same situation. The benchmark used to judge whether a defendant breached their duty.",
    arizonaContext: "For medical professionals in Arizona, the standard of care is what a reasonably competent practitioner in the same specialty would do under similar circumstances. Expert testimony is required.",
    relatedTerms: ['duty-of-care', 'breach-of-duty', 'medical-negligence'],
    relatedPracticeAreas: ['medical-negligence'],
  },
  {
    slug: 'proximate-cause',
    term: 'Proximate Cause',
    category: 'liability',
    definition: "The legal cause of an injury. Not just any cause-in-fact, but a cause whose connection to the harm is direct and foreseeable enough to assign legal responsibility.",
    arizonaContext: "Arizona uses a 'substantial factor' test for proximate cause. The defendant's conduct must have been a substantial factor in producing the injury, not just a remote contributor.",
    alsoKnownAs: ['legal cause'],
    relatedTerms: ['but-for-causation', 'negligence'],
  },
  {
    slug: 'but-for-causation',
    term: 'But-For Causation',
    category: 'liability',
    definition: "Cause-in-fact: would the injury have occurred 'but for' the defendant's actions? If the harm would have happened anyway, but-for causation isn't established.",
    relatedTerms: ['proximate-cause', 'negligence'],
  },
  {
    slug: 'comparative-fault',
    term: 'Comparative Fault',
    category: 'liability',
    definition: "A system that reduces a plaintiff's recovery in proportion to their share of fault for the injury. Arizona is a 'pure comparative fault' state.",
    arizonaContext: "Arizona allows recovery even if the plaintiff is 99% at fault. Damages are reduced by the plaintiff's percentage of fault. Codified in ARS 12-2505.",
    alsoKnownAs: ['comparative negligence'],
    relatedTerms: ['negligence', 'pure-comparative-fault'],
    arsReference: 'ARS 12-2505',
    arsUrl: 'https://www.azleg.gov/ars/12/02505.htm',
  },
  {
    slug: 'pure-comparative-fault',
    term: 'Pure Comparative Fault',
    category: 'liability',
    definition: "The Arizona rule that allows an injured plaintiff to recover damages even if they were more than 50% at fault. The recovery is simply reduced by the plaintiff's percentage of fault.",
    arizonaContext: "Most states use a 'modified comparative fault' rule that bars recovery if the plaintiff is 50% or 51% at fault. Arizona is one of about a dozen pure comparative fault states.",
    relatedTerms: ['comparative-fault'],
    arsReference: 'ARS 12-2505',
    arsUrl: 'https://www.azleg.gov/ars/12/02505.htm',
  },
  {
    slug: 'strict-liability',
    term: 'Strict Liability',
    category: 'liability',
    definition: "Legal responsibility for damages regardless of fault or intent. The plaintiff doesn't have to prove negligence, only that the defendant's action caused the harm.",
    arizonaContext: "Arizona applies strict liability to dog bites (ARS 11-1025), product defects, and abnormally dangerous activities. The owner of a dog is liable for bites regardless of the dog's history.",
    relatedTerms: ['negligence', 'product-liability'],
    relatedPracticeAreas: ['dog-bite'],
    arsReference: 'ARS 11-1025',
    arsUrl: 'https://www.azleg.gov/ars/11/01025.htm',
  },
  {
    slug: 'negligence-per-se',
    term: 'Negligence Per Se',
    category: 'liability',
    definition: "When a defendant violates a safety statute and that violation causes the injury the statute was designed to prevent, negligence is presumed without needing to argue what a reasonable person would do.",
    arizonaContext: "Arizona courts apply negligence per se when a statute imposes a specific duty for the protection of a class of persons that includes the plaintiff, and the defendant violated it.",
    relatedTerms: ['negligence', 'standard-of-care'],
  },
  {
    slug: 'vicarious-liability',
    term: 'Vicarious Liability',
    category: 'liability',
    definition: "Holding one party legally responsible for the wrongful actions of another based on their relationship. Most often: employers for employees acting within the scope of employment.",
    alsoKnownAs: ['imputed liability'],
    relatedTerms: ['respondeat-superior'],
    relatedPracticeAreas: ['truck-accidents', 'rideshare-accidents'],
  },
  {
    slug: 'respondeat-superior',
    term: 'Respondeat Superior',
    category: 'liability',
    definition: "Latin for 'let the master answer.' The legal doctrine that holds employers responsible for the negligent acts of employees performed within the scope of their job.",
    arizonaContext: "Arizona applies respondeat superior in commercial vehicle cases. Trucking companies can be held liable for crashes caused by their drivers, even if the company itself wasn't negligent.",
    relatedTerms: ['vicarious-liability'],
    relatedPracticeAreas: ['truck-accidents'],
  },
  {
    slug: 'joint-and-several-liability',
    term: 'Joint and Several Liability',
    category: 'liability',
    definition: "A doctrine that allows an injured plaintiff to recover the entire judgment from any one defendant, even if multiple defendants share fault. Arizona has largely abolished this rule.",
    arizonaContext: "Arizona abolished traditional joint and several liability in 1987. Under ARS 12-2506, defendants are generally only liable for their own percentage share of fault, with limited exceptions for intentional torts and hazardous waste.",
    relatedTerms: ['comparative-fault', 'allocation-of-fault'],
    arsReference: 'ARS 12-2506',
    arsUrl: 'https://www.azleg.gov/ars/12/02506.htm',
  },
  {
    slug: 'allocation-of-fault',
    term: 'Allocation of Fault',
    category: 'liability',
    definition: "The process of dividing responsibility among all parties whose conduct contributed to an injury, expressed as percentages that must total 100%. Each defendant pays their share.",
    arizonaContext: "Arizona juries assign fault percentages to all parties, including the plaintiff and any non-parties who contributed to the harm. Each defendant pays only their share, per ARS 12-2506.",
    relatedTerms: ['comparative-fault', 'joint-and-several-liability'],
    arsReference: 'ARS 12-2506',
    arsUrl: 'https://www.azleg.gov/ars/12/02506.htm',
  },
  {
    slug: 'premises-liability',
    term: 'Premises Liability',
    category: 'liability',
    definition: "The legal responsibility property owners have to keep their premises reasonably safe for visitors. The duty owed depends on whether the visitor is an invitee, licensee, or trespasser.",
    arizonaContext: "Arizona follows the traditional three-tier system. Business invitees get the highest duty of care, social guests (licensees) get a lesser duty, and trespassers get the least. Children may be owed a higher duty under the attractive nuisance doctrine.",
    relatedTerms: ['invitee', 'licensee', 'trespasser', 'attractive-nuisance'],
    relatedPracticeAreas: ['slip-and-fall', 'premises-liability'],
  },

  // ── Damages (15) ──
  {
    slug: 'compensatory-damages',
    term: 'Compensatory Damages',
    category: 'damages',
    definition: "Money awarded to make an injured person 'whole.' Includes both economic losses (medical bills, lost wages) and non-economic losses (pain, suffering, loss of enjoyment).",
    relatedTerms: ['economic-damages', 'non-economic-damages', 'punitive-damages'],
  },
  {
    slug: 'economic-damages',
    term: 'Economic Damages',
    category: 'damages',
    definition: "Quantifiable monetary losses caused by an injury. Includes medical expenses (past and future), lost wages, lost earning capacity, and out-of-pocket costs.",
    alsoKnownAs: ['special damages'],
    relatedTerms: ['compensatory-damages', 'non-economic-damages', 'loss-of-earning-capacity'],
  },
  {
    slug: 'non-economic-damages',
    term: 'Non-Economic Damages',
    category: 'damages',
    definition: "Subjective losses that don't have a clear dollar value. Includes pain and suffering, mental anguish, loss of enjoyment of life, disfigurement, and loss of consortium.",
    alsoKnownAs: ['general damages'],
    arizonaContext: "Arizona has no cap on non-economic damages in most personal injury cases. The state constitution prohibits caps on damages for death or injury (Arizona Constitution, Article II, Section 31).",
    relatedTerms: ['compensatory-damages', 'pain-and-suffering', 'loss-of-consortium'],
  },
  {
    slug: 'pain-and-suffering',
    term: 'Pain and Suffering',
    category: 'damages',
    definition: "Compensation for the physical pain and emotional distress caused by an injury. Both past pain and reasonably anticipated future pain are compensable.",
    arizonaContext: "Arizona juries determine pain and suffering damages based on the evidence. There is no statutory formula. The damages are not capped in most cases.",
    relatedTerms: ['non-economic-damages', 'mental-anguish'],
  },
  {
    slug: 'punitive-damages',
    term: 'Punitive Damages',
    category: 'damages',
    definition: "Damages awarded to punish a defendant for especially harmful behavior and to deter similar conduct. Available only when the defendant acted with malice, fraud, or gross negligence.",
    arizonaContext: "Arizona requires clear and convincing evidence of an 'evil mind' to support punitive damages. Routine negligence isn't enough. The conduct must show conscious disregard for the rights of others.",
    relatedTerms: ['compensatory-damages'],
  },
  {
    slug: 'loss-of-consortium',
    term: 'Loss of Consortium',
    category: 'damages',
    definition: "Damages for the loss of companionship, affection, sexual relations, and household services suffered by the spouse of an injured person.",
    arizonaContext: "Arizona recognizes loss of consortium claims for spouses. The claim is derivative of the injured spouse's underlying claim and may be reduced by the injured spouse's comparative fault.",
    relatedTerms: ['non-economic-damages', 'wrongful-death'],
  },
  {
    slug: 'loss-of-earning-capacity',
    term: 'Loss of Earning Capacity',
    category: 'damages',
    definition: "Damages for the reduction in a person's ability to earn money in the future, separate from actual lost wages already incurred.",
    arizonaContext: "Arizona allows recovery for both past lost wages and future loss of earning capacity. Future earnings are typically reduced to present value using expert economic testimony.",
    relatedTerms: ['economic-damages', 'present-value'],
  },
  {
    slug: 'future-medical-expenses',
    term: 'Future Medical Expenses',
    category: 'damages',
    definition: "Reasonably anticipated medical costs related to the injury. Requires expert testimony from a treating physician or life care planner.",
    arizonaContext: "Arizona allows recovery of future medical expenses if proven by reasonable medical probability. The amounts are typically reduced to present value.",
    relatedTerms: ['economic-damages', 'present-value', 'compensatory-damages'],
  },
  {
    slug: 'present-value',
    term: 'Present Value',
    category: 'damages',
    definition: "The current worth of a future sum of money, calculated by discounting future amounts to account for the time value of money. Used to value future damages in personal injury cases.",
    arizonaContext: "Arizona requires future damages (medical, earning capacity) to be reduced to present value before being awarded. Economists typically testify about appropriate discount rates.",
    relatedTerms: ['future-medical-expenses', 'loss-of-earning-capacity'],
  },
  {
    slug: 'eggshell-plaintiff',
    term: 'Eggshell Plaintiff',
    category: 'damages',
    definition: "The legal rule that a defendant takes the plaintiff as they find them. If a plaintiff has a pre-existing vulnerability that makes injuries worse, the defendant is still liable for the full extent of the harm.",
    arizonaContext: "Arizona follows the eggshell plaintiff rule. A defendant can't reduce damages by arguing the plaintiff was unusually fragile or had a pre-existing condition.",
    alsoKnownAs: ['thin skull rule'],
    relatedTerms: ['pre-existing-condition'],
  },
  {
    slug: 'pre-existing-condition',
    term: 'Pre-Existing Condition',
    category: 'damages',
    definition: "A medical condition or injury that existed before the incident at issue. Defendants often try to use pre-existing conditions to reduce damages, but the eggshell plaintiff rule limits this.",
    arizonaContext: "In Arizona, a defendant is liable for any aggravation of a pre-existing condition caused by the incident. The defendant takes the plaintiff in the condition they were already in.",
    relatedTerms: ['eggshell-plaintiff'],
  },
  {
    slug: 'subrogation',
    term: 'Subrogation',
    category: 'damages',
    definition: "The right of an insurance company that paid for medical care to recover those payments from the at-fault party or their insurance. Health insurers often have subrogation rights.",
    arizonaContext: "Arizona recognizes subrogation rights for health insurers, workers' compensation carriers, and Medicare. Settlement negotiations often involve resolving these liens.",
    relatedTerms: ['medical-lien'],
  },
  {
    slug: 'medical-lien',
    term: 'Medical Lien',
    category: 'damages',
    definition: "A legal claim by a healthcare provider against the proceeds of a personal injury settlement to recover the cost of treatment provided to the injured person.",
    arizonaContext: "Arizona healthcare providers can file medical liens to secure payment from settlement proceeds. Hospitals have statutory liens under ARS 33-931. These must be resolved before final settlement distribution.",
    relatedTerms: ['subrogation', 'letter-of-protection'],
    arsReference: 'ARS 33-931',
    arsUrl: 'https://www.azleg.gov/ars/33/00931.htm',
  },
  {
    slug: 'letter-of-protection',
    term: 'Letter of Protection',
    category: 'damages',
    definition: "A written agreement where a healthcare provider agrees to treat an injured patient and wait for payment from the eventual settlement, in exchange for a lien on the recovery.",
    relatedTerms: ['medical-lien', 'subrogation'],
  },
  {
    slug: 'collateral-source-rule',
    term: 'Collateral Source Rule',
    category: 'damages',
    definition: "A common law rule that prevents defendants from reducing damages by the amount of money the plaintiff received from independent sources (insurance, government benefits, etc.).",
    arizonaContext: "Arizona retains the collateral source rule with some limitations. Generally, evidence of insurance payments or other collateral sources is not admissible to reduce damages.",
  },

  // ── Procedure (12) ──
  {
    slug: 'statute-of-limitations',
    term: 'Statute of Limitations',
    category: 'procedure',
    definition: "The legal deadline for filing a lawsuit. Once the deadline passes, the right to sue is generally lost forever, regardless of the merits of the claim.",
    arizonaContext: "Arizona's statute of limitations for personal injury is two years from the date of injury (ARS 12-542). Different deadlines apply to claims against government entities (180 days notice, 1 year to sue) and minors (clock starts at age 18).",
    relatedTerms: ['notice-of-claim', 'minority-tolling'],
    arsReference: 'ARS 12-542',
    arsUrl: 'https://www.azleg.gov/ars/12/00542.htm',
  },
  {
    slug: 'minority-tolling',
    term: 'Minority Tolling',
    category: 'procedure',
    definition: "A rule that pauses ('tolls') the statute of limitations for minors. The clock doesn't start running until the minor turns 18.",
    arizonaContext: "Under ARS 12-502, if a person entitled to sue is under 18 when the cause of action accrues, the statute of limitations doesn't run during the disability. Children injured at age 8 typically have until age 20 to file.",
    relatedTerms: ['statute-of-limitations'],
    arsReference: 'ARS 12-502',
    arsUrl: 'https://www.azleg.gov/ars/12/00502.htm',
  },
  {
    slug: 'notice-of-claim',
    term: 'Notice of Claim',
    category: 'procedure',
    definition: "A formal written notice required before suing a government entity. Must include facts establishing liability and a specific settlement demand. Arizona requires this within 180 days of the injury.",
    arizonaContext: "Under ARS 12-821.01, a Notice of Claim must be filed with the public entity within 180 days of when the cause of action accrues. The lawsuit itself must then be filed within one year. Failure to file the notice on time bars the claim entirely.",
    relatedTerms: ['statute-of-limitations'],
    arsReference: 'ARS 12-821.01',
    arsUrl: 'https://www.azleg.gov/ars/12/00821-01.htm',
    relatedPracticeAreas: ['school-abuse'],
  },
  {
    slug: 'discovery',
    term: 'Discovery',
    category: 'procedure',
    definition: "The pre-trial phase where parties exchange information, take depositions, request documents, and serve interrogatories. Discovery is governed by court rules and can take months or years.",
    relatedTerms: ['deposition', 'interrogatories', 'request-for-production'],
  },
  {
    slug: 'deposition',
    term: 'Deposition',
    category: 'procedure',
    definition: "A pre-trial sworn testimony taken outside of court, in the presence of a court reporter. Used to discover what witnesses know and to preserve their testimony for trial.",
    relatedTerms: ['discovery'],
  },
  {
    slug: 'interrogatories',
    term: 'Interrogatories',
    category: 'procedure',
    definition: "Written questions sent from one party to another that must be answered in writing under oath. A core discovery tool.",
    relatedTerms: ['discovery'],
  },
  {
    slug: 'mediation',
    term: 'Mediation',
    category: 'procedure',
    definition: "A voluntary settlement process where a neutral third party (mediator) helps both sides try to reach an agreement. The mediator doesn't decide the case; the parties do.",
    arizonaContext: "Arizona courts often order mediation before trial. Most personal injury cases settle through mediation before reaching a jury. The mediator is typically a retired judge or experienced attorney.",
    relatedTerms: ['arbitration', 'settlement'],
  },
  {
    slug: 'arbitration',
    term: 'Arbitration',
    category: 'procedure',
    definition: "A dispute resolution process where a neutral arbitrator hears evidence and issues a binding decision. Faster and less formal than trial, but limits appeal rights.",
    arizonaContext: "Arizona's Rules of Civil Procedure require mandatory arbitration for cases under a certain dollar threshold (varies by county). Either party can appeal the arbitration result and request a new trial.",
    relatedTerms: ['mediation'],
  },
  {
    slug: 'summary-judgment',
    term: 'Summary Judgment',
    category: 'procedure',
    definition: "A court ruling that decides a case (or parts of it) without a trial because there are no genuine disputes of material fact. The losing party can appeal.",
    relatedTerms: ['discovery'],
  },
  {
    slug: 'demand-letter',
    term: 'Demand Letter',
    category: 'procedure',
    definition: "A formal letter sent to an at-fault party (or their insurance) demanding compensation for injuries. Usually the first step in settlement negotiations.",
    relatedTerms: ['settlement'],
  },
  {
    slug: 'settlement',
    term: 'Settlement',
    category: 'procedure',
    definition: "An agreement to resolve a legal claim without going to trial, typically involving payment in exchange for a release of all claims. Most personal injury cases settle.",
    relatedTerms: ['demand-letter', 'mediation'],
  },
  {
    slug: 'contingency-fee',
    term: 'Contingency Fee',
    category: 'procedure',
    definition: "An attorney fee arrangement where the lawyer gets paid only if the client recovers money. The fee is a percentage of the recovery, typically 33-40% in personal injury cases.",
    arizonaContext: "Arizona allows contingency fees in personal injury cases. The standard rate is 33.3% of pre-litigation settlements and 40% if the case goes into litigation. The agreement must be in writing.",
    alsoKnownAs: ['no fee unless we win'],
  },

  // ── Insurance (10) ──
  {
    slug: 'uninsured-motorist',
    term: 'Uninsured Motorist (UM) Coverage',
    category: 'insurance',
    definition: "An optional auto insurance coverage that pays for your injuries if you're hit by a driver who has no insurance. Required to be offered in Arizona but can be rejected in writing.",
    arizonaContext: "Arizona requires insurers to offer UM coverage, but drivers can reject it in writing. Arizona's mandatory liability minimums are 25/50/15, but many drivers carry only the minimum or drive uninsured.",
    relatedTerms: ['underinsured-motorist', 'liability-insurance'],
  },
  {
    slug: 'underinsured-motorist',
    term: 'Underinsured Motorist (UIM) Coverage',
    category: 'insurance',
    definition: "Optional auto insurance that pays the gap when an at-fault driver's liability limits are too low to cover your damages. Critical when injuries exceed the at-fault driver's coverage.",
    arizonaContext: "Arizona's minimum liability limits (25/50/15) often aren't enough to cover serious injuries. UIM coverage from your own policy fills the gap up to your UIM limits.",
    relatedTerms: ['uninsured-motorist', 'liability-insurance'],
  },
  {
    slug: 'liability-insurance',
    term: 'Liability Insurance',
    category: 'insurance',
    definition: "Insurance that covers damages an insured person becomes legally responsible for paying to another person. The core protection in any auto, business, or homeowner's policy.",
    arizonaContext: "Arizona requires drivers to carry minimum liability coverage of $25,000 per person, $50,000 per accident, and $15,000 property damage (25/50/15) under ARS 28-4135.",
    relatedTerms: ['uninsured-motorist', 'underinsured-motorist'],
    arsReference: 'ARS 28-4135',
    arsUrl: 'https://www.azleg.gov/ars/28/04135.htm',
  },
  {
    slug: 'med-pay',
    term: 'Medical Payments Coverage (Med Pay)',
    category: 'insurance',
    definition: "Optional auto insurance coverage that pays medical bills for you and your passengers regardless of who caused the crash. Typically $1,000 to $10,000 limits.",
    arizonaContext: "Arizona doesn't require Med Pay. It's optional add-on coverage. It can be useful for covering immediate medical expenses while liability claims are pending.",
    relatedTerms: ['liability-insurance'],
  },
  {
    slug: 'pip',
    term: 'Personal Injury Protection (PIP)',
    category: 'insurance',
    definition: "No-fault auto insurance coverage that pays medical bills, lost wages, and related expenses regardless of fault. Required in some states but not Arizona.",
    arizonaContext: "Arizona is NOT a no-fault state. PIP is not required and not commonly sold. Arizona drivers rely on liability, UM/UIM, and Med Pay coverage.",
    relatedTerms: ['med-pay', 'liability-insurance'],
  },
  {
    slug: 'policy-limits',
    term: 'Policy Limits',
    category: 'insurance',
    definition: "The maximum amount an insurance policy will pay for a covered claim. Once the limit is reached, the insurer won't pay more, even if the damages exceed it.",
    relatedTerms: ['liability-insurance', 'underinsured-motorist'],
  },
  {
    slug: 'bad-faith',
    term: 'Bad Faith',
    category: 'insurance',
    definition: "An insurance company's unreasonable denial, delay, or undervaluation of a valid claim. Arizona allows separate bad faith lawsuits against insurers who fail to meet their duty of good faith.",
    arizonaContext: "Arizona recognizes bad faith claims against first-party insurers (your own insurance) and limited bad faith claims against third-party insurers. Damages can include the original claim plus attorney fees and punitive damages.",
  },
  {
    slug: 'first-party-claim',
    term: 'First-Party Claim',
    category: 'insurance',
    definition: "An insurance claim filed by the policyholder against their own insurance company. Examples include UM/UIM claims, Med Pay, and collision coverage.",
    relatedTerms: ['third-party-claim', 'bad-faith'],
  },
  {
    slug: 'third-party-claim',
    term: 'Third-Party Claim',
    category: 'insurance',
    definition: "An insurance claim filed against another person's insurance company for damages they caused. The standard liability claim after most car crashes.",
    relatedTerms: ['first-party-claim', 'liability-insurance'],
  },
  {
    slug: 'insurance-bad-faith-arizona',
    term: 'Insurance Bad Faith (Arizona Standard)',
    category: 'insurance',
    definition: "Arizona allows policyholders to sue their own insurer for unreasonable handling of a claim. The standard requires showing the insurer acted unreasonably and knew or recklessly disregarded the unreasonableness.",
    arizonaContext: "Established in Noble v. National American Life Insurance Co., 128 Ariz. 188 (1981). Arizona is a leading state for first-party bad faith law.",
    relatedTerms: ['bad-faith', 'first-party-claim'],
  },

  // ── Arizona Statutes (15) ──
  {
    slug: 'ars-12-542',
    term: 'ARS 12-542',
    category: 'arizona-statute',
    definition: "Arizona's two-year statute of limitations for personal injury, wrongful death, and medical malpractice claims. The clock generally starts on the date of injury.",
    arsReference: 'ARS 12-542',
    arsUrl: 'https://www.azleg.gov/ars/12/00542.htm',
    relatedTerms: ['statute-of-limitations', 'minority-tolling'],
  },
  {
    slug: 'ars-12-502',
    term: 'ARS 12-502 (Minority Tolling)',
    category: 'arizona-statute',
    definition: "Arizona statute that pauses the statute of limitations for minors and people of unsound mind. The clock starts when the disability ends (age 18 for minors).",
    arsReference: 'ARS 12-502',
    arsUrl: 'https://www.azleg.gov/ars/12/00502.htm',
    relatedTerms: ['minority-tolling', 'statute-of-limitations'],
  },
  {
    slug: 'ars-12-2505',
    term: 'ARS 12-2505',
    category: 'arizona-statute',
    definition: "Arizona's pure comparative fault statute. Reduces damages by the plaintiff's percentage of fault but allows recovery even if the plaintiff is more than 50% at fault.",
    arsReference: 'ARS 12-2505',
    arsUrl: 'https://www.azleg.gov/ars/12/02505.htm',
    relatedTerms: ['comparative-fault', 'pure-comparative-fault'],
  },
  {
    slug: 'ars-12-2506',
    term: 'ARS 12-2506',
    category: 'arizona-statute',
    definition: "Arizona's several liability statute. Generally limits each defendant's liability to their own percentage share of fault, abolishing traditional joint and several liability with limited exceptions.",
    arsReference: 'ARS 12-2506',
    arsUrl: 'https://www.azleg.gov/ars/12/02506.htm',
    relatedTerms: ['joint-and-several-liability', 'allocation-of-fault'],
  },
  {
    slug: 'ars-12-611',
    term: 'ARS 12-611 (Wrongful Death Liability)',
    category: 'arizona-statute',
    definition: "Establishes Arizona's wrongful death cause of action. When a person dies due to wrongful conduct, the responsible party is liable for damages just as they would have been to the deceased.",
    arsReference: 'ARS 12-611',
    arsUrl: 'https://www.azleg.gov/ars/12/00611.htm',
    relatedTerms: ['wrongful-death'],
    relatedPracticeAreas: ['wrongful-death'],
  },
  {
    slug: 'ars-12-612',
    term: 'ARS 12-612 (Wrongful Death Beneficiaries)',
    category: 'arizona-statute',
    definition: "Identifies who can bring an Arizona wrongful death action: surviving spouse, child, parent, guardian, or personal representative of the estate.",
    arsReference: 'ARS 12-612',
    arsUrl: 'https://www.azleg.gov/ars/12/00612.htm',
    relatedTerms: ['wrongful-death'],
    relatedPracticeAreas: ['wrongful-death'],
  },
  {
    slug: 'ars-12-820',
    term: 'ARS 12-820 (Public Entity Definitions)',
    category: 'arizona-statute',
    definition: "Defines key terms for Arizona's public entity liability framework. Establishes what counts as a public entity and a public employee.",
    arsReference: 'ARS 12-820',
    arsUrl: 'https://www.azleg.gov/ars/12/00820.htm',
    relatedTerms: ['notice-of-claim'],
  },
  {
    slug: 'ars-12-821',
    term: 'ARS 12-821 (Public Entity Statute of Limitations)',
    category: 'arizona-statute',
    definition: "Arizona's one-year statute of limitations for actions against public entities and employees. Shorter than the standard two-year personal injury deadline.",
    arsReference: 'ARS 12-821',
    arsUrl: 'https://www.azleg.gov/ars/12/00821.htm',
    relatedTerms: ['statute-of-limitations', 'notice-of-claim'],
    relatedPracticeAreas: ['school-abuse'],
  },
  {
    slug: 'ars-12-821-01',
    term: 'ARS 12-821.01 (Notice of Claim)',
    category: 'arizona-statute',
    definition: "Requires a written notice of claim to be filed with a public entity within 180 days of when the cause of action accrues. Failure to file on time bars the claim entirely.",
    arsReference: 'ARS 12-821.01',
    arsUrl: 'https://www.azleg.gov/ars/12/00821-01.htm',
    relatedTerms: ['notice-of-claim', 'statute-of-limitations'],
    relatedPracticeAreas: ['school-abuse'],
  },
  {
    slug: 'ars-46-451',
    term: 'ARS 46-451 (Adult Protective Services Definitions)',
    category: 'arizona-statute',
    definition: "Defines abuse, neglect, exploitation, and 'vulnerable adult' under Arizona's Adult Protective Services framework. The foundation statute for elder abuse cases.",
    arsReference: 'ARS 46-451',
    arsUrl: 'https://www.azleg.gov/ars/46/00451.htm',
    relatedTerms: ['vulnerable-adult', 'mandatory-reporter'],
    relatedPracticeAreas: ['elder-abuse', 'nursing-home-abuse'],
  },
  {
    slug: 'ars-46-454',
    term: 'ARS 46-454 (Mandatory Vulnerable Adult Reporting)',
    category: 'arizona-statute',
    definition: "Requires certain professionals to report suspected abuse, neglect, or exploitation of vulnerable adults. Failure to report is a criminal offense.",
    arsReference: 'ARS 46-454',
    arsUrl: 'https://www.azleg.gov/ars/46/00454.htm',
    relatedTerms: ['mandatory-reporter', 'vulnerable-adult'],
    relatedPracticeAreas: ['elder-abuse', 'nursing-home-abuse'],
  },
  {
    slug: 'ars-13-3620',
    term: 'ARS 13-3620 (Mandatory Child Abuse Reporting)',
    category: 'arizona-statute',
    definition: "Arizona's mandatory child abuse reporting statute. Requires anyone who reasonably believes a minor is being abused or neglected to report it. Failure to report can be a criminal offense.",
    arsReference: 'ARS 13-3620',
    arsUrl: 'https://www.azleg.gov/ars/13/03620.htm',
    relatedTerms: ['mandatory-reporter'],
    relatedPracticeAreas: ['child-abuse', 'school-abuse', 'daycare-negligence'],
  },
  {
    slug: 'ars-11-1025',
    term: 'ARS 11-1025 (Strict Liability for Dog Bites)',
    category: 'arizona-statute',
    definition: "Arizona's dog bite statute. Imposes strict liability on dog owners for bites that occur in public places or when the victim is lawfully on private property. The owner is liable regardless of the dog's history.",
    arsReference: 'ARS 11-1025',
    arsUrl: 'https://www.azleg.gov/ars/11/01025.htm',
    relatedTerms: ['strict-liability'],
    relatedPracticeAreas: ['dog-bite'],
  },
  {
    slug: 'ars-28-4135',
    term: 'ARS 28-4135 (Mandatory Auto Insurance)',
    category: 'arizona-statute',
    definition: "Arizona's mandatory auto insurance statute. Requires drivers to carry minimum liability coverage of 25/50/15 (bodily injury per person/per accident, and property damage).",
    arsReference: 'ARS 28-4135',
    arsUrl: 'https://www.azleg.gov/ars/28/04135.htm',
    relatedTerms: ['liability-insurance'],
  },
  {
    slug: 'ars-28-964',
    term: 'ARS 28-964 (Motorcycle Helmet Law)',
    category: 'arizona-statute',
    definition: "Arizona's motorcycle helmet statute. Requires riders and passengers under 18 to wear a DOT-approved helmet. Adults over 18 are not required to wear a helmet but may choose to.",
    arsReference: 'ARS 28-964',
    arsUrl: 'https://www.azleg.gov/ars/28/00964.htm',
    relatedPracticeAreas: ['motorcycle-accidents'],
  },

  // ── Practice-specific (10) ──
  {
    slug: 'vulnerable-adult',
    term: 'Vulnerable Adult',
    category: 'practice-specific',
    definition: "Under Arizona law, a person 18 or older who is unable to protect themselves from abuse, neglect, or exploitation due to a physical or mental impairment.",
    arizonaContext: "Defined in ARS 46-451. The vulnerable adult designation triggers mandatory reporting duties and enhanced penalties for abuse.",
    relatedTerms: ['ars-46-451', 'mandatory-reporter'],
    relatedPracticeAreas: ['elder-abuse', 'nursing-home-abuse'],
    arsReference: 'ARS 46-451',
    arsUrl: 'https://www.azleg.gov/ars/46/00451.htm',
  },
  {
    slug: 'mandatory-reporter',
    term: 'Mandatory Reporter',
    category: 'practice-specific',
    definition: "A person required by law to report suspected abuse, neglect, or exploitation of children or vulnerable adults. Includes teachers, healthcare workers, social workers, and clergy.",
    arizonaContext: "Arizona's mandatory reporting laws are in ARS 13-3620 (children) and ARS 46-454 (vulnerable adults). Failure to report is a class 1 misdemeanor and can rise to a class 6 felony.",
    relatedTerms: ['ars-13-3620', 'ars-46-454'],
    relatedPracticeAreas: ['child-abuse', 'elder-abuse'],
  },
  {
    slug: 'dram-shop-liability',
    term: 'Dram Shop Liability',
    category: 'practice-specific',
    definition: "Legal responsibility of bars, restaurants, and other alcohol vendors for injuries caused by patrons they served while obviously intoxicated.",
    arizonaContext: "Arizona's dram shop statute is ARS 4-311. A licensee can be liable if they served alcohol to an obviously intoxicated person or a person under 21, and the consumption was a proximate cause of the injury.",
    relatedTerms: ['social-host-liability'],
    arsReference: 'ARS 4-311',
    arsUrl: 'https://www.azleg.gov/ars/4/00311.htm',
  },
  {
    slug: 'social-host-liability',
    term: 'Social Host Liability',
    category: 'practice-specific',
    definition: "Civil liability of a private host (not a licensed alcohol vendor) for serving alcohol to a guest who later causes harm. More limited than dram shop liability.",
    arizonaContext: "Arizona generally does not impose social host liability on adults serving alcohol to other adults. Liability is more likely when an adult serves alcohol to a minor.",
    relatedTerms: ['dram-shop-liability'],
  },
  {
    slug: 'attractive-nuisance',
    term: 'Attractive Nuisance',
    category: 'practice-specific',
    definition: "A doctrine that holds property owners liable for injuries to children attracted onto the property by a dangerous condition (pool, abandoned car, machinery), even if the children were technically trespassing.",
    arizonaContext: "Arizona recognizes the attractive nuisance doctrine. Property owners must take reasonable steps to protect children from foreseeable dangers, especially when the condition is one that would attract young children.",
    relatedTerms: ['premises-liability', 'trespasser'],
  },
  {
    slug: 'invitee',
    term: 'Invitee',
    category: 'practice-specific',
    definition: "A person on someone's property for a business purpose that benefits the property owner (a customer at a store, a guest at a hotel). Owed the highest duty of care.",
    relatedTerms: ['licensee', 'trespasser', 'premises-liability'],
  },
  {
    slug: 'licensee',
    term: 'Licensee',
    category: 'practice-specific',
    definition: "A person on someone's property with permission for their own purposes (a social guest, a door-to-door salesperson). Owed a lesser duty than an invitee.",
    relatedTerms: ['invitee', 'trespasser', 'premises-liability'],
  },
  {
    slug: 'trespasser',
    term: 'Trespasser',
    category: 'practice-specific',
    definition: "A person on property without permission. Generally owed the lowest duty of care, though attractive nuisance and other exceptions can apply, especially for children.",
    relatedTerms: ['invitee', 'licensee', 'premises-liability', 'attractive-nuisance'],
  },
  {
    slug: 'wrongful-death-arizona',
    term: 'Wrongful Death (Arizona)',
    category: 'practice-specific',
    definition: "A civil action brought by certain family members when a person dies due to another's wrongful conduct. Damages compensate the survivors for their losses.",
    arizonaContext: "Arizona's wrongful death statutes are ARS 12-611 through 12-613. Surviving spouses, children, parents, and personal representatives can bring claims. There is no cap on damages.",
    relatedTerms: ['ars-12-611', 'ars-12-612', 'loss-of-consortium'],
    relatedPracticeAreas: ['wrongful-death'],
  },
  {
    slug: 'maximum-medical-improvement',
    term: 'Maximum Medical Improvement (MMI)',
    category: 'practice-specific',
    definition: "The point at which an injured person's medical condition has stabilized and is unlikely to improve further with additional treatment. MMI marks when permanent damages can be assessed.",
    arizonaContext: "Reaching MMI is typically a key milestone before settlement. Doctors document MMI in the medical record. Future damages are calculated based on the MMI condition and any permanent impairment.",
    relatedTerms: ['future-medical-expenses', 'loss-of-earning-capacity'],
  },
];

function buildMdx(entry: GlossaryEntry): string {
  const yaml = [
    '---',
    `term: "${entry.term.replace(/"/g, '\\"')}"`,
    `category: "${entry.category}"`,
    `definition: "${entry.definition.replace(/"/g, '\\"')}"`,
  ];
  if (entry.arizonaContext) yaml.push(`arizonaContext: "${entry.arizonaContext.replace(/"/g, '\\"')}"`);
  if (entry.alsoKnownAs && entry.alsoKnownAs.length) {
    yaml.push('alsoKnownAs:');
    entry.alsoKnownAs.forEach(t => yaml.push(`  - "${t}"`));
  }
  if (entry.relatedTerms && entry.relatedTerms.length) {
    yaml.push('relatedTerms:');
    entry.relatedTerms.forEach(t => yaml.push(`  - "${t}"`));
  }
  if (entry.relatedPracticeAreas && entry.relatedPracticeAreas.length) {
    yaml.push('relatedPracticeAreas:');
    entry.relatedPracticeAreas.forEach(t => yaml.push(`  - "${t}"`));
  }
  if (entry.arsReference) yaml.push(`arsReference: "${entry.arsReference}"`);
  if (entry.arsUrl) yaml.push(`arsUrl: "${entry.arsUrl}"`);
  yaml.push('---', '');

  // Body content
  const body = [
    `## What it means`,
    '',
    entry.definition,
    '',
  ];
  if (entry.arizonaContext) {
    body.push('## Arizona context', '', entry.arizonaContext, '');
  }
  if (entry.arsReference && entry.arsUrl) {
    body.push('## Statute reference', '', `[${entry.arsReference}](${entry.arsUrl})`, '');
  }

  return yaml.join('\n') + body.join('\n');
}

let written = 0;
for (const entry of entries) {
  const path = `${OUT_DIR}/${entry.slug}.mdx`;
  writeFileSync(path, buildMdx(entry));
  written++;
}

console.log(`✓ Wrote ${written} glossary entries to ${OUT_DIR}/`);
