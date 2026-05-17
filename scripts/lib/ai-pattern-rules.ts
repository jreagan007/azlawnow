/**
 * AI-Pattern Detection Rules — AZ Law Now
 *
 * Three detection layers:
 *
 *   1. RULES.forbiddenPhrases — AI-signature vocabulary (values-statements,
 *      generative clichés, filler/hedges).
 *   2. AZ_PI_PHRASE_TELLS — AZ-PI-specific phrase tells: "victims", "accident"
 *      (vs crash), em-dash, shocking/alarming/staggering + stat, ER 7.1 guarantee
 *      language, ER 7.3 solicitation markers.
 *   3. STRUCTURAL — shape detectors (bold-label bullet runs, parallel bold
 *      paragraphs, mirror headings, abstract-noun H3 runs).
 *   4. SPECIFICITY — AZ-PI anchor check. Content pages missing ALL concrete AZ-PI
 *      anchors (ARS citation, named AZ road/corridor, ADOT ref, tribal jurisdiction,
 *      named AZ court, comparative-fault %, insurance stat) read as generic AI.
 *
 * Export interface is identical to mesowatchorg/scripts/lib/ai-pattern-rules.ts
 * so the orchestrator import contract is stable.
 */

export interface Issue {
  type: string;
  severity: 'error' | 'warning';
  line?: number;
  match: string;
  message: string;
}

export interface Rule {
  pattern: RegExp;
  reason: string;
  severity?: 'error' | 'warning';
}

// ============================================================================
// PHRASE-LEVEL RULES
// ============================================================================

export const RULES = {
  /**
   * Generic AI-signature phrases. Additive to audit-quality.ts phrase list.
   */
  forbiddenPhrases: [
    // Values-statement AI tells
    { pattern: /\bwe are committed to\b/gi, reason: 'AI values-statement — show, don\'t claim' },
    { pattern: /\bcommitted to (?:providing|delivering|ensuring|maintaining|helping)\b/gi, reason: 'AI values-statement' },
    { pattern: /\bwe strive to\b/gi, reason: 'AI values-statement' },
    { pattern: /\bstrive to (?:provide|deliver|ensure|explain|help|offer)\b/gi, reason: 'AI values-statement' },
    { pattern: /\bwe believe (?:that|in)\b/gi, reason: 'AI values-statement — state the thing directly' },
    { pattern: /\bgenuinely (?:helpful|useful|valuable|care|important)\b/gi, reason: 'AI-sounding intensifier' },
    { pattern: /\bto the best of our knowledge\b/gi, reason: 'AI hedge phrase' },
    { pattern: /\binherent in\b/gi, reason: 'AI-sounding' },
    { pattern: /\btime matters\b/gi, reason: 'AI cliché — cite the actual deadline (ARS 12-542: 2 years)' },
    { pattern: /\b(?:change|changes) everything\b/gi, reason: 'AI cliché' },
    { pattern: /\bdedicated to (?:providing|helping|serving)\b/gi, reason: 'AI values-statement' },
    { pattern: /\bpassionate about\b/gi, reason: 'AI values-statement' },

    // Generative vocabulary (high-confidence AI tells)
    { pattern: /\bit is imperative (?:that|to)\b/gi, reason: 'AI-sounding' },
    { pattern: /\bit is important to note\b/gi, reason: 'AI-sounding' },
    { pattern: /\bit should be noted\b/gi, reason: 'AI-sounding' },
    { pattern: /\bone must be aware\b/gi, reason: 'AI-sounding' },
    { pattern: /\bnavigating the complexities\b/gi, reason: 'AI-sounding' },
    { pattern: /\bwe need to (?:understand|grasp|recognize)\b/gi, reason: 'AI-sounding' },
    { pattern: /\bdelve into\b/gi, reason: 'AI signature — use "examine", "look at"' },
    { pattern: /\bdelving into\b/gi, reason: 'AI signature' },
    { pattern: /\bshed(?:s|ding)? light on\b/gi, reason: 'AI signature — use "explain", "show"' },
    { pattern: /\bplays? a (?:crucial|vital|key|pivotal|significant|major) role\b/gi, reason: 'AI-sounding' },
    { pattern: /\bserves? as a\b/gi, reason: 'AI-sounding — use "is"' },
    { pattern: /\btestament to\b/gi, reason: 'AI signature phrase' },
    { pattern: /\b(?:the )?landscape of\b/gi, reason: 'AI signature phrase' },
    { pattern: /\b(?:the )?(?:changing|evolving|shifting) landscape\b/gi, reason: 'AI signature phrase' },
    { pattern: /\b(?:the )?world of\b/gi, reason: 'AI signature phrase' },
    { pattern: /\bin the ever-(?:evolving|changing|shifting|expanding)\b/gi, reason: 'AI signature phrase' },
    { pattern: /\bmyriad (?:of )?\b/gi, reason: 'AI-sounding — use a number' },
    { pattern: /\bplethora of\b/gi, reason: 'AI-sounding — use a number' },
    { pattern: /\btapestry of\b/gi, reason: 'AI signature phrase' },
    { pattern: /\bunprecedented\b/gi, reason: 'AI overused modifier', severity: 'warning' as const },
    { pattern: /\bharness(?:ing)?\b/gi, reason: 'AI business-speak — use "use"' },
    { pattern: /\bunlock(?:s|ing)?\b/gi, reason: 'AI marketing cliché' },
    { pattern: /\bempower(?:s|ing|ed)?\b/gi, reason: 'AI marketing cliché' },
    { pattern: /\bfoster(?:s|ing)? (?:a |an |the |greater |better )?(?:environment|culture|understanding|community|relationship)\b/gi, reason: 'AI-sounding — use "build"' },
    { pattern: /\bparadigm shift\b/gi, reason: 'AI business-speak' },
    { pattern: /\bholistic (?:approach|view|perspective)\b/gi, reason: 'AI-sounding' },
    { pattern: /\bsynergy\b/gi, reason: 'AI business-speak' },
    { pattern: /\bat the forefront of\b/gi, reason: 'AI-sounding' },
    { pattern: /\bcrucial to (?:understand|note|remember|recognize)\b/gi, reason: 'AI-sounding' },

    // Filler/hedge
    { pattern: /\bin the realm of\b/gi, reason: 'AI-sounding' },
    { pattern: /\bmoving forward\b/gi, reason: 'AI-sounding' },
    { pattern: /\bat the end of the day\b/gi, reason: 'AI-sounding' },
    { pattern: /\bwhen all is said and done\b/gi, reason: 'AI-sounding' },
  ] as Rule[],

  /**
   * En-dash detection (em-dash hard-blocked by audit-quality.ts).
   */
  enDashes: [
    { pattern: /–/g, reason: 'en-dash (U+2013) — use hyphen or rewrite' },
  ] as Rule[],
};

// ============================================================================
// AZ-PI PHRASE TELLS
// ============================================================================
//
// Voice-rules violations specific to AZ personal-injury editorial.
// These layer on top of the generic forbidden phrases.

export const AZ_PI_PHRASE_TELLS: Rule[] = [
  // Brand voice: "crash" not "accident" (except in direct quotes or proper names)
  {
    pattern: /\b(?:car|auto|vehicle|truck|motorcycle|bicycle|pedestrian|bus|fatal)\s+accident\b/gi,
    reason: 'Voice rule: use "crash" not "accident" — CLAUDE.md §Universal Voice Rules',
    severity: 'error',
  },
  {
    pattern: /\baccidents?\s+(?:happen|occur|cause|result|that|on|along|near|in|at)\b/gi,
    reason: 'Voice rule: use "crashes" not "accidents"',
    severity: 'error',
  },

  // "victims" — use "families", "the driver", "the child" per voice rules
  {
    pattern: /\b(?:crash|accident|injury|accident)\s+victims?\b/gi,
    reason: 'Voice rule: avoid "victims" — use "families", "the driver", "injured person"',
    severity: 'error',
  },
  {
    pattern: /\bvictims?\s+of\s+(?:the|a|an|this|that|these)\s+(?:crash|accident|collision|wreck|incident)\b/gi,
    reason: 'Voice rule: avoid "victims" — use "people hurt in the crash"',
    severity: 'error',
  },

  // ER 7.1 guarantee language
  {
    pattern: /\b(?:guarantee(?:s|d)?|we will win|you will (?:win|recover|receive)|assured of (?:winning|recovery|compensation))\b/gi,
    reason: 'ER 7.1 violation: unverified guarantee — remove or add required context',
    severity: 'error',
  },
  {
    pattern: /\b(?:best|top|number one|#1|leading|premier|superior)\s+(?:injury\s+)?(?:attorney|lawyer|firm|law\s+firm)\b/gi,
    reason: 'ER 7.1 violation: unverified superlative — remove or verify with citation',
    severity: 'error',
  },

  // ER 7.3 solicitation language
  {
    pattern: /\b(?:call us (?:now|today|immediately)|contact us (?:now|immediately)|reach out (?:now|today|immediately)) (?:if you|after|following|about your)\b/gi,
    reason: 'ER 7.3: review solicitation framing — must not target specific incident survivors',
    severity: 'warning',
  },

  // "shocking/alarming/staggering" before stats — AI sensationalism
  {
    pattern: /\b(?:shocking|alarming|staggering|astonishing|startling)\b[^.!?]{0,80}\b\d+(?:\.\d+)?(?:\s*%|\s*(?:people|crashes|deaths|injuries|fatalities))/gi,
    reason: 'AI sensationalism: stat introduced with alarming adjective — lead with the number',
    severity: 'warning',
  },

  // "fight for justice" — AI litigation cliché
  {
    pattern: /\bfight(?:ing)? for (?:justice|compensation|you|your rights|the injured)\b/gi,
    reason: 'AI litigation cliché: "fight for justice" — use specific outcome language',
    severity: 'warning',
  },

  // Em-dash in prose (audit-quality hard-blocks it, but also flag here for the ai-patterns report)
  {
    pattern: /—/g,
    reason: 'Em-dash (U+2014) hard-blocked by voice rules — rewrite the sentence',
    severity: 'error',
  },
];

// ============================================================================
// STRUCTURAL AI-PATTERN DETECTION
// ============================================================================

const BOLD_HTML_OPEN = /<strong>([^<]{1,80})<\/strong>/;
const BOLD_MD = /\*\*([^*\n]{1,80})\*\*/;

export const STRUCTURAL = {
  /**
   * 3+ consecutive list items opening with a bold-label + punctuator.
   */
  boldLabelBulletRun(content: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    const isBoldLabelLine = (line: string): boolean => {
      const trimmed = line.trim();
      if (/^(?:[-*+]|\d+\.)\s+\*\*[^*\n]{1,60}\*\*\s*[:—–\-]/.test(trimmed)) return true;
      if (/^<li[^>]*>\s*<strong>[^<]{1,60}<\/strong>\s*[:—–\-]/.test(trimmed)) return true;
      return false;
    };

    const isListItem = (line: string): boolean => {
      const trimmed = line.trim();
      return /^(?:[-*+]|\d+\.)\s/.test(trimmed) || /^<li[^>]*>/.test(trimmed);
    };

    let runStart = -1;
    let runCount = 0;
    let lastWasBoldLabel = false;
    let lastListLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      if (isListItem(line)) {
        if (isBoldLabelLine(line)) {
          if (runCount === 0 || i - lastListLine <= 3) {
            if (runCount === 0) runStart = i;
            runCount++;
          } else {
            if (runCount >= 3) {
              issues.push({
                type: 'ai-bold-label-run',
                severity: 'warning',
                line: runStart + 1,
                match: `${runCount} consecutive bold-label bullets`,
                message: `${runCount} consecutive bold-label bullets — vary list format (prose, short bullets, table) to break AI-signature rhythm`,
              });
            }
            runStart = i;
            runCount = 1;
          }
          lastWasBoldLabel = true;
        } else {
          if (runCount >= 3) {
            issues.push({
              type: 'ai-bold-label-run',
              severity: 'warning',
              line: runStart + 1,
              match: `${runCount} consecutive bold-label bullets`,
              message: `${runCount} consecutive bold-label bullets — vary list format`,
            });
          }
          runCount = 0;
          lastWasBoldLabel = false;
        }
        lastListLine = i;
      } else if (lastWasBoldLabel && i - lastListLine > 2) {
        if (runCount >= 3) {
          issues.push({
            type: 'ai-bold-label-run',
            severity: 'warning',
            line: runStart + 1,
            match: `${runCount} consecutive bold-label bullets`,
            message: `${runCount} consecutive bold-label bullets — vary list format`,
          });
        }
        runCount = 0;
        lastWasBoldLabel = false;
      }
    }

    if (runCount >= 3) {
      issues.push({
        type: 'ai-bold-label-run',
        severity: 'warning',
        line: runStart + 1,
        match: `${runCount} consecutive bold-label bullets`,
        message: `${runCount} consecutive bold-label bullets — vary list format`,
      });
    }
    return issues;
  },

  /**
   * 3+ consecutive paragraphs each beginning with a bold lead.
   */
  parallelBoldParagraphs(content: string): Issue[] {
    const issues: Issue[] = [];
    const matches: number[] = [];

    const htmlPattern = /<p[^>]*>\s*<strong>[^<]{1,80}<\/strong>/gi;
    let m;
    while ((m = htmlPattern.exec(content)) !== null) matches.push(m.index);

    const lines = content.split('\n');
    let offset = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        /^\*\*[^*\n]{1,80}\*\*\s+\S/.test(trimmed) &&
        !/^(?:[-*+]|\d+\.)\s/.test(trimmed) &&
        !trimmed.startsWith('#')
      ) {
        matches.push(offset);
      }
      offset += line.length + 1;
    }

    matches.sort((a, b) => a - b);

    let run: number[] = [];
    for (let i = 0; i < matches.length; i++) {
      const adjacent = run.length === 0 || matches[i] - run[run.length - 1] < 1200;
      if (adjacent) run.push(matches[i]);
      else {
        if (run.length >= 3) {
          issues.push({
            type: 'ai-parallel-bold-paragraphs',
            severity: 'warning',
            line: lineNumberAt(content, run[0]),
            match: `${run.length} parallel bold-lead paragraphs`,
            message: `${run.length} consecutive paragraphs opening with bold lead — AI-signature structure. Rewrite as flowing prose or collapse to a list.`,
          });
        }
        run = [matches[i]];
      }
    }
    if (run.length >= 3) {
      issues.push({
        type: 'ai-parallel-bold-paragraphs',
        severity: 'warning',
        line: lineNumberAt(content, run[0]),
        match: `${run.length} parallel bold-lead paragraphs`,
        message: `${run.length} consecutive paragraphs opening with bold lead`,
      });
    }
    return issues;
  },

  /**
   * Symmetric positive/negative heading pairs ("What We X" / "What We Don't X").
   */
  symmetricMirrorHeadings(content: string): Issue[] {
    const issues: Issue[] = [];
    const headings: { text: string; index: number }[] = [];

    const htmlH = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi;
    let m;
    while ((m = htmlH.exec(content)) !== null) {
      headings.push({ text: m[1].trim(), index: m.index });
    }

    const lines = content.split('\n');
    let offset = 0;
    for (const line of lines) {
      const mdH = /^(#{2,4})\s+(.+)$/.exec(line);
      if (mdH) headings.push({ text: mdH[2].trim(), index: offset });
      offset += line.length + 1;
    }

    const seen = new Set<string>();
    for (let i = 0; i < headings.length; i++) {
      for (let j = i + 1; j < headings.length; j++) {
        const a = headings[i].text.toLowerCase();
        const b = headings[j].text.toLowerCase();
        const pair = `${i}-${j}`;
        if (seen.has(pair)) continue;

        const negationPair =
          (a.startsWith('what we ') && b.startsWith('what we don\'t ')) ||
          (a.startsWith('what we don\'t ') && b.startsWith('what we ')) ||
          (a.startsWith('what you should ') && b.startsWith('what you shouldn\'t ')) ||
          (a.startsWith('what you shouldn\'t ') && b.startsWith('what you should ')) ||
          (a.startsWith('do\'s') && b.startsWith('don\'t')) ||
          (a.startsWith('myths') && b.startsWith('facts')) ||
          (a.startsWith('facts') && b.startsWith('myths'));

        if (negationPair) {
          issues.push({
            type: 'ai-mirror-headings',
            severity: 'warning',
            line: lineNumberAt(content, headings[i].index),
            match: `"${headings[i].text}" / "${headings[j].text}"`,
            message: 'Symmetric positive/negative headings — AI-signature structure. Merge or restructure.',
          });
          seen.add(pair);
          break;
        }
      }
    }
    return issues;
  },

  /**
   * 3+ consecutive single- or two-word abstract-noun H3s.
   */
  abstractNounHeadingRun(content: string): Issue[] {
    const issues: Issue[] = [];
    const h3s: { text: string; index: number }[] = [];

    const htmlH3 = /<h3[^>]*>([^<]+)<\/h3>/gi;
    let m;
    while ((m = htmlH3.exec(content)) !== null) {
      h3s.push({ text: m[1].trim(), index: m.index });
    }

    const lines = content.split('\n');
    let offset = 0;
    for (const line of lines) {
      const mdH3 = /^###\s+(.+)$/.exec(line);
      if (mdH3) h3s.push({ text: mdH3[1].trim(), index: offset });
      offset += line.length + 1;
    }

    h3s.sort((a, b) => a.index - b.index);

    const isAbstractNoun = (t: string): boolean => {
      const words = t.split(/\s+/);
      if (words.length > 2) return false;
      if (/\d/.test(t)) return false;
      if (/[:?(]/.test(t)) return false;
      if (t.length <= 2) return false;
      return true;
    };

    let run: typeof h3s = [];
    for (let i = 0; i < h3s.length; i++) {
      if (isAbstractNoun(h3s[i].text)) run.push(h3s[i]);
      else {
        if (run.length >= 3) {
          issues.push({
            type: 'ai-abstract-heading-run',
            severity: 'warning',
            line: lineNumberAt(content, run[0].index),
            match: run.map(r => r.text).join(' / '),
            message: `${run.length} consecutive abstract-noun H3s (${run.map(r => r.text).join(', ')}) — AI values-statement structure`,
          });
        }
        run = [];
      }
    }
    if (run.length >= 3) {
      issues.push({
        type: 'ai-abstract-heading-run',
        severity: 'warning',
        line: lineNumberAt(content, run[0].index),
        match: run.map(r => r.text).join(' / '),
        message: `${run.length} consecutive abstract-noun H3s (${run.map(r => r.text).join(', ')})`,
      });
    }
    return issues;
  },
};

// ============================================================================
// AZ-PI SPECIFICITY ANCHORS
// ============================================================================
//
// Pages that hit ZERO AZ-PI concrete anchors read as generic AI.
// At least ONE anchor is required for substantive content pages.
//
// AZ-PI anchors (from BUILD-SPEC.md §D):
//   - ARS citation (A.R.S. § or ARS \d+-\d+)
//   - Named AZ road/corridor (I-10, I-17, SR-347, SR-303, Loop 101/202)
//   - ADOT reference
//   - Tribal jurisdiction (Navajo, Tohono O'odham, Fort McDowell, SRPMIC, Ak-Chin)
//   - Named AZ court
//   - Comparative-fault percentage (ARS 12-2505)
//   - Arizona insurance stat (uninsured rate, min limits)

export const SPECIFICITY = {
  /**
   * File path patterns that REQUIRE minimum AZ-PI specificity.
   * Excludes utility/legal/contact pages.
   */
  contentPathPatterns: [
    /\/content\/investigations\//,
    /\/content\/legal-guides\//,
    /\/content\/client-guides\//,
    /\/content\/practice-areas\//,
    /\/pages\/(?!404|sitemap|contact|privacy|terms|disclaimer|methodology|index|thank-you)/,
  ],

  /**
   * Any ONE signal counts as an AZ-PI anchor.
   */
  anchors: {
    // ARS citation: "ARS 12-542", "A.R.S. § 28-672", "ARS § 12-2506"
    arsCitation: /\bA\.?R\.?S\.?\s*(?:§\s*)?\d{1,2}-\d{3,4}\b|\bARS\s+(?:§\s*)?\d{1,2}-\d{3,4}\b/i,

    // Named AZ roads / corridors (BUILD-SPEC.md AZ-PI SPECIFICITY anchors)
    azRoadCorridor: /\b(?:I-10|I-17|I-19|I-40|I-8|SR-347|SR-303|SR-87|SR-60|SR-202|Loop\s+101|Loop\s+202|Loop\s+303|US-60|US-89|US-93|Grand\s+Avenue|Buckeye\s+Road|Van\s+Buren\s+Street|Superstition\s+Freeway|Papago\s+Freeway|Maricopa\s+Freeway|Piestewa\s+Freeway|Black\s+Canyon\s+Highway|Price\s+Freeway|Red\s+Mountain\s+Freeway)\b/i,

    // ADOT reference
    adotRef: /\bADOT\b|\bArizona\s+Department\s+of\s+Transportation\b/i,

    // Tribal jurisdiction names (BUILD-SPEC.md §B.1)
    tribalJurisdiction: /\b(?:Navajo\s+Nation|Tohono\s+O'odham|Fort\s+McDowell|SRPMIC|Salt\s+River\s+Pima|Ak-Chin|Gila\s+River|Colorado\s+River\s+Indian|White\s+Mountain\s+Apache|Hopi\s+Tribe)\b/i,

    // Named AZ court
    azCourt: /\b(?:Maricopa|Pima|Yavapai|Pinal|Coconino|Mohave|Yuma|Navajo|Apache|Graham|Greenlee|La\s+Paz|Santa\s+Cruz)\s+County\s+Superior\s+Court\b|\bArizona\s+Court\s+of\s+Appeals\b|\bArizona\s+Supreme\s+Court\b|\bPhoenix\s+Municipal\s+Court\b|\bTucson\s+City\s+Court\b/i,

    // Comparative-fault percentage (signals ARS 12-2505 pure comparative context)
    comparativeFaultPct: /\b\d{1,3}(?:\.\d+)?\s*%\s*(?:at\s+fault|fault|liable|negligent|comparative|contributory)\b|\b(?:comparative|contributory)\s+(?:fault|negligence)\s+of\s+\d{1,3}(?:\.\d+)?\s*%/i,

    // Arizona insurance stat reference
    azInsuranceStat: /\b(?:25\/50\/15|uninsured\s+(?:motorist|driver)|underinsured\s+(?:motorist|driver)|UM\/UIM|Arizona\s+minimum\s+(?:coverage|limits|insurance))\b/i,

    // Dollar figure tied to a case/outcome
    dollarFigure: /\$\s?\d[\d,]*(?:\s?(?:million|thousand|k|m)\b)?/i,

    // Named AZ city tied to case/location (geographic specificity)
    azCity: /\b(?:Phoenix|Tucson|Mesa|Chandler|Scottsdale|Gilbert|Glendale|Peoria|Tempe|Surprise|Avondale|Goodyear|Buckeye|Maricopa|Flagstaff|Prescott|Yuma|Kingman|Lake\s+Havasu|Sierra\s+Vista|Casa\s+Grande|Bullhead\s+City|Apache\s+Junction|El\s+Mirage|Tolleson|Wickenburg|Sedona|Fountain\s+Hills)\b/i,
  },

  requires(filePath: string): boolean {
    return this.contentPathPatterns.some(p => p.test(filePath));
  },

  findAnchors(content: string): string[] {
    const found: string[] = [];
    for (const [name, pattern] of Object.entries(this.anchors)) {
      if (pattern.test(content)) found.push(name);
    }
    return found;
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function lineNumberAt(content: string, index: number): number {
  return (content.substring(0, index).match(/\n/g) || []).length + 1;
}

/**
 * Run all phrase rules + AZ-PI phrase tells against a text string.
 */
export function validatePhrases(text: string): Issue[] {
  const issues: Issue[] = [];

  for (const rule of RULES.forbiddenPhrases) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      issues.push({
        type: 'forbidden-phrase',
        severity: rule.severity || 'error',
        line: lineNumberAt(text, m.index),
        match: m[0],
        message: `Forbidden phrase: ${rule.reason}`,
      });
      if (!rule.pattern.global) break;
    }
  }

  for (const rule of RULES.enDashes) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      issues.push({
        type: 'en-dash',
        severity: 'warning',
        line: lineNumberAt(text, m.index),
        match: m[0],
        message: rule.reason,
      });
      if (!rule.pattern.global) break;
    }
  }

  for (const rule of AZ_PI_PHRASE_TELLS) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      issues.push({
        type: 'az-pi-phrase-tell',
        severity: rule.severity || 'warning',
        line: lineNumberAt(text, m.index),
        match: m[0],
        message: rule.reason,
      });
      if (!rule.pattern.global) break;
    }
  }

  return issues;
}

/**
 * Run all structural checks against raw file content.
 */
export function validateStructure(content: string): Issue[] {
  return [
    ...STRUCTURAL.boldLabelBulletRun(content),
    ...STRUCTURAL.parallelBoldParagraphs(content),
    ...STRUCTURAL.symmetricMirrorHeadings(content),
    ...STRUCTURAL.abstractNounHeadingRun(content),
  ];
}

/**
 * Run AZ-PI specificity check for a content file.
 * Returns an Issue if required and missing all anchors.
 */
export function validateSpecificity(filePath: string, content: string): Issue | null {
  if (!SPECIFICITY.requires(filePath)) return null;
  const anchors = SPECIFICITY.findAnchors(content);
  if (anchors.length === 0) {
    return {
      type: 'missing-specificity',
      severity: 'warning',
      match: '0 AZ-PI anchors',
      message:
        'Page has ZERO AZ-PI specificity anchors (no ARS cite, AZ road/corridor, ADOT ref, tribal jurisdiction, AZ court, comparative-fault %, AZ insurance stat, or $ figure). Reads as generic AI content.',
    };
  }
  return null;
}
