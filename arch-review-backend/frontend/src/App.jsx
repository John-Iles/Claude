import { useState } from "react";
import { researchSite } from "./api";
import {
  intakeSystemPrompt,
  platformSystemPrompt,
  ecosystemSystemPrompt,
  reportSystemPrompt,
  buildEvidenceSummary,
} from "./prompts";
import Stepper from "./components/Stepper";
import EvidencePack from "./components/EvidencePack";
import AgentStage from "./components/AgentStage";
import ExportReport from "./components/ExportReport";

const STAGE = { RESEARCH: 0, INTAKE: 1, PLATFORM: 2, ECOSYSTEM: 3, REPORT: 4 };

function buildIntakePrompt(research, url) {
  const summary = buildEvidenceSummary(research);
  return `You are starting an architecture review for: ${url}

Here is the automated evidence pack gathered from the site:

${summary}

Based on this evidence, populate the intake brief. For any field where the evidence is insufficient, note the gap and use low confidence. Do not invent facts.`;
}

function buildPlatformPrompt(research, intake) {
  const summary = buildEvidenceSummary(research);
  return `Architecture review — Platform assessment stage.

Client: ${intake?.client_name || "Unknown"} (${intake?.url || ""})
Primary goal: ${intake?.primary_goal || "Not specified"}
Known pain points: ${intake?.known_pain_points?.join(", ") || "None stated"}

Evidence pack:
${summary}

Confirmed platform (from intake): ${intake?.confirmed_platform || "Unknown"} [${intake?.platform_confidence || "low"}]
Platform rationale: ${intake?.platform_rationale || "Not stated"}

Assess the platform's maturity, strengths, and risks.`;
}

function buildEcosystemPrompt(research, intake, platform) {
  const summary = buildEvidenceSummary(research);
  return `Architecture review — Ecosystem assessment stage.

Client: ${intake?.client_name || "Unknown"}
Platform: ${platform?.platform || "Unknown"} (maturity: ${platform?.maturity_score || "?"}/5)

Evidence pack:
${summary}

Platform risks identified: ${platform?.risks?.map((r) => r.finding).join("; ") || "None"}

Assess each technology ecosystem component. For any category where no tech was detected, explicitly note "unknown — no signal" and explain why.`;
}

function buildReportPrompt(research, intake, platform, ecosystem) {
  const summary = buildEvidenceSummary(research);
  return `Architecture review — Final report stage.

Client: ${intake?.client_name || "Unknown"}
Brief: ${intake?.brief_narrative || ""}

Platform: ${platform?.platform || "Unknown"}, maturity ${platform?.maturity_score}/5
Performance: ${platform?.performance_summary || ""}

Ecosystem maturity: ${ecosystem?.ecosystem_maturity_score}/5
Strategic gaps: ${ecosystem?.strategic_gaps?.join("; ") || "None identified"}

Key risks: ${[...(platform?.risks || []), ...(ecosystem?.integration_risks || [])].map((r) => r.finding || r.risk).join("; ")}

Evidence pack:
${summary}

Write the executive summary and recommended actions. Be specific and cite confidence levels. Do not soften findings.`;
}

export default function App() {
  const [stage, setStage] = useState(STAGE.RESEARCH);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [research, setResearch] = useState(null);
  const [intake, setIntake] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [ecosystem, setEcosystem] = useState(null);
  const [report, setReport] = useState(null);

  async function handleResearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResearch(null);
    try {
      const data = await researchSite(url);
      setResearch(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Architecture Review</h1>
          <p className="text-slate-500 text-sm mt-1">Ecommerce platform & ecosystem analysis pipeline</p>
        </div>

        <Stepper current={stage} />

        {/* Stage 0: Research */}
        {stage === STAGE.RESEARCH && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Research a site</h2>
              <form onSubmit={handleResearch} className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? "Researching…" : "Research site"}
                </button>
              </form>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}
            </div>

            {research && (
              <>
                {/* Status bar */}
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-sm flex gap-4 text-slate-600">
                  <span>
                    <span className="font-medium">Final URL:</span> {research.final_url}
                  </span>
                  <span>
                    <span className="font-medium">HTTP:</span>{" "}
                    <span className={research.http_status >= 400 ? "text-amber-600 font-semibold" : "text-green-700 font-semibold"}>
                      {research.http_status}
                    </span>
                  </span>
                  {research.server_header && (
                    <span><span className="font-medium">Server:</span> {research.server_header}</span>
                  )}
                </div>

                <EvidencePack research={research} />

                <div className="flex justify-end">
                  <button
                    onClick={() => setStage(STAGE.INTAKE)}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Use this evidence → continue to Intake
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stage 1: Intake */}
        {stage === STAGE.INTAKE && research && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Intake brief</h2>
            <AgentStage
              stage="intake"
              title="Intake"
              systemPrompt={intakeSystemPrompt()}
              initialUserPrompt={buildIntakePrompt(research, url)}
              onComplete={(data) => { setIntake(data); setStage(STAGE.PLATFORM); }}
              onBack={() => setStage(STAGE.RESEARCH)}
            />
          </div>
        )}

        {/* Stage 2: Platform */}
        {stage === STAGE.PLATFORM && research && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Platform assessment</h2>
            <AgentStage
              stage="platform"
              title="Platform"
              systemPrompt={platformSystemPrompt()}
              initialUserPrompt={buildPlatformPrompt(research, intake)}
              onComplete={(data) => { setPlatform(data); setStage(STAGE.ECOSYSTEM); }}
              onBack={() => setStage(STAGE.INTAKE)}
            />
          </div>
        )}

        {/* Stage 3: Ecosystem */}
        {stage === STAGE.ECOSYSTEM && research && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Ecosystem assessment</h2>
            <AgentStage
              stage="ecosystem"
              title="Ecosystem"
              systemPrompt={ecosystemSystemPrompt()}
              initialUserPrompt={buildEcosystemPrompt(research, intake, platform)}
              onComplete={(data) => { setEcosystem(data); setStage(STAGE.REPORT); }}
              onBack={() => setStage(STAGE.PLATFORM)}
            />
          </div>
        )}

        {/* Stage 4: Report */}
        {stage === STAGE.REPORT && research && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Final report</h2>
            <AgentStage
              stage="report"
              title="Report"
              systemPrompt={reportSystemPrompt()}
              initialUserPrompt={buildReportPrompt(research, intake, platform, ecosystem)}
              onComplete={(data) => {
                setReport(data);
              }}
              onBack={() => setStage(STAGE.ECOSYSTEM)}
            />
            {report && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <ExportReport data={{ research, intake, platform, ecosystem, report }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
