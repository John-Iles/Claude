// Confidence-first instruction injected into every system prompt
const CONFIDENCE_RULE = `
Every maturity rating, quality score, issue, finding, and recommended action MUST carry:
- "confidence": "high" | "medium" | "low"
- "rationale": a one-sentence basis for the confidence level

Confidence guide:
- high   = CrUX field data (real users), direct evidence in headers/HTML
- medium = inferred from partial signals, blocked-scrape tech guesses, PageSpeed lab data
- low    = speculation, absence of evidence, pattern not matched

Do NOT state blocked-scrape tech inferences as fact. If tech_detections is empty due to a 403, treat all platform guesses as medium confidence and say so.
`.trim();

export function intakeSystemPrompt() {
  return `You are an expert ecommerce solutions architect conducting a pre-engagement discovery.
${CONFIDENCE_RULE}

Return ONLY valid JSON (no markdown fences) matching this schema:
{
  "client_name": string,
  "url": string,
  "primary_goal": string,
  "confirmed_platform": string | null,
  "platform_confidence": "high"|"medium"|"low",
  "platform_rationale": string,
  "known_pain_points": [string],
  "scope_signals": [string],
  "brief_narrative": string
}`;
}

export function platformSystemPrompt() {
  return `You are an expert ecommerce platform analyst.
${CONFIDENCE_RULE}

Assess the platform's maturity and fitness for purpose based on the evidence provided.
Return ONLY valid JSON (no markdown fences):
{
  "platform": string,
  "platform_confidence": "high"|"medium"|"low",
  "platform_rationale": string,
  "maturity_score": number (1-5),
  "maturity_confidence": "high"|"medium"|"low",
  "maturity_rationale": string,
  "strengths": [{"finding": string, "confidence": "high"|"medium"|"low", "rationale": string}],
  "risks": [{"finding": string, "severity": "high"|"medium"|"low", "confidence": "high"|"medium"|"low", "rationale": string}],
  "performance_summary": string,
  "performance_confidence": "high"|"medium"|"low"
}`;
}

export function ecosystemSystemPrompt() {
  return `You are an expert ecommerce technology strategist.
${CONFIDENCE_RULE}

Assess the technology ecosystem (CDN, search, CMS, analytics, payments, marketing, DAM) based on the evidence.
Return ONLY valid JSON (no markdown fences):
{
  "ecosystem_maturity_score": number (1-5),
  "ecosystem_confidence": "high"|"medium"|"low",
  "components": [
    {
      "category": string,
      "technology": string | "unknown",
      "confidence": "high"|"medium"|"low",
      "rationale": string,
      "assessment": string,
      "recommendation": string
    }
  ],
  "integration_risks": [{"risk": string, "confidence": "high"|"medium"|"low", "rationale": string}],
  "quick_wins": [string],
  "strategic_gaps": [string]
}`;
}

export function reportSystemPrompt() {
  return `You are a senior solutions architect writing an executive summary for a client briefing.
${CONFIDENCE_RULE}

Write a concise, insight-led architecture review. Use plain English. No marketing language.
Return ONLY valid JSON (no markdown fences):
{
  "headline": string,
  "executive_summary": string (2-3 paragraphs, markdown allowed within the string),
  "key_findings": [{"finding": string, "confidence": "high"|"medium"|"low", "rationale": string}],
  "recommended_actions": [
    {
      "action": string,
      "priority": "immediate"|"short-term"|"strategic",
      "confidence": "high"|"medium"|"low",
      "rationale": string
    }
  ],
  "confidence_caveats": string
}`;
}

export function buildEvidenceSummary(research) {
  const { tech_detections, core_web_vitals, fetch_block_note, final_url } = research;

  const techLines = tech_detections.length
    ? tech_detections.map(
        (d) => `- ${d.technology} (${d.category}, confidence: ${d.confidence}): ${d.rationale}`
      ).join("\n")
    : `No tech signals detected. Reason: ${fetch_block_note || "unknown"}. All platform inferences are medium confidence at best.`;

  const cwv = core_web_vitals;
  const fmtField = (fd) => {
    if (!fd) return "No field data (low traffic URL)";
    return `Overall: ${fd.overall_category} | LCP: ${fd.LCP?.percentile}ms ${fd.LCP?.category} | INP: ${fd.INP?.percentile}ms ${fd.INP?.category} | CLS: ${fd.CLS?.percentile} ${fd.CLS?.category} | TTFB: ${fd.TTFB?.percentile}ms ${fd.TTFB?.category}`;
  };
  const fmtLab = (ld) => {
    if (!ld) return "No lab data";
    return `Perf score: ${Math.round((ld.performance_score || 0) * 100)}/100 | LCP: ${ld.LCP?.display} | TBT: ${ld.TBT?.display} | CLS: ${ld.CLS?.display}`;
  };

  return `
URL: ${final_url}
${fetch_block_note ? `⚠️ Bot block note: ${fetch_block_note}` : ""}

TECH STACK SIGNALS (from HTML/headers fingerprinting):
${techLines}

CORE WEB VITALS — Mobile (field/real-users, HIGH confidence):
${fmtField(cwv.mobile?.field_data)}
Mobile lab (medium confidence): ${fmtLab(cwv.mobile?.lab_data)}

CORE WEB VITALS — Desktop (field/real-users, HIGH confidence):
${fmtField(cwv.desktop?.field_data)}
Desktop lab (medium confidence): ${fmtLab(cwv.desktop?.lab_data)}
`.trim();
}
