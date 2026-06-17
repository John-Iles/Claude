export function buildMarkdown({ research, intake, platform, ecosystem, report }) {
  const url = research?.final_url || research?.requested_url || "";
  const lines = [];

  lines.push(`# Architecture Review — ${intake?.client_name || url}`);
  lines.push(`\n_Generated ${new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}_\n`);

  if (report?.headline) lines.push(`## ${report.headline}\n`);
  if (report?.executive_summary) lines.push(`${report.executive_summary}\n`);

  // Key findings
  if (report?.key_findings?.length) {
    lines.push("## Key Findings\n");
    report.key_findings.forEach((f) => {
      lines.push(`- **[${f.confidence?.toUpperCase()}]** ${f.finding}  \n  _${f.rationale}_`);
    });
    lines.push("");
  }

  // Platform
  if (platform) {
    lines.push("## Platform Assessment\n");
    lines.push(`**Platform:** ${platform.platform} [${platform.platform_confidence}]  `);
    lines.push(`**Maturity:** ${platform.maturity_score}/5 [${platform.maturity_confidence}] — ${platform.maturity_rationale}  `);
    lines.push(`**Performance:** ${platform.performance_summary} [${platform.performance_confidence}]\n`);
    if (platform.strengths?.length) {
      lines.push("**Strengths:**");
      platform.strengths.forEach((s) => lines.push(`- ${s.finding} [${s.confidence}]`));
    }
    if (platform.risks?.length) {
      lines.push("\n**Risks:**");
      platform.risks.forEach((r) => lines.push(`- [${r.severity?.toUpperCase()} risk] ${r.finding} [${r.confidence}]`));
    }
    lines.push("");
  }

  // Ecosystem
  if (ecosystem?.components?.length) {
    lines.push("## Ecosystem\n");
    ecosystem.components.forEach((c) => {
      lines.push(`### ${c.category}: ${c.technology} [${c.confidence}]`);
      lines.push(`${c.assessment}  \n_Recommendation: ${c.recommendation}_\n`);
    });
    if (ecosystem.strategic_gaps?.length) {
      lines.push("**Strategic gaps:**");
      ecosystem.strategic_gaps.forEach((g) => lines.push(`- ${g}`));
      lines.push("");
    }
  }

  // Actions
  if (report?.recommended_actions?.length) {
    lines.push("## Recommended Actions\n");
    report.recommended_actions.forEach((a) => {
      lines.push(`- **[${a.priority?.toUpperCase()}]** ${a.action} [${a.confidence}]  \n  _${a.rationale}_`);
    });
    lines.push("");
  }

  // CWV
  if (research?.core_web_vitals) {
    const cwv = research.core_web_vitals;
    const mf = cwv.mobile?.field_data;
    const df = cwv.desktop?.field_data;
    lines.push("## Core Web Vitals (field data, high confidence)\n");
    lines.push("| Metric | Mobile | Desktop |");
    lines.push("|--------|--------|---------|");
    ["LCP", "INP", "CLS", "FCP", "TTFB"].forEach((k) => {
      const mv = mf?.[k];
      const dv = df?.[k];
      lines.push(`| ${k} | ${mv ? `${mv.percentile} ${mv.category}` : "—"} | ${dv ? `${dv.percentile} ${dv.category}` : "—"} |`);
    });
    lines.push("");
  }

  if (report?.confidence_caveats) {
    lines.push("---\n");
    lines.push(`_${report.confidence_caveats}_`);
  }

  return lines.join("\n");
}

export default function ExportReport({ data }) {
  function download() {
    const md = buildMarkdown(data);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `arch-review-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }

  return (
    <button
      onClick={download}
      className="px-5 py-2 bg-slate-800 text-white text-sm rounded-lg font-medium hover:bg-slate-900"
    >
      Export Markdown report
    </button>
  );
}
