// Generic stage component: shows editable user prompt, calls /analyze, shows parsed result.
import { useState } from "react";
import { analyze, parseJSON } from "../api";

const CONF_COLORS = {
  high: "text-green-700",
  medium: "text-amber-600",
  low: "text-red-600",
};

function ConfTag({ level }) {
  return (
    <span className={`text-xs font-semibold uppercase ${CONF_COLORS[level] || "text-slate-500"}`}>
      [{level}]
    </span>
  );
}

function RenderResult({ data, stage }) {
  if (!data) return null;

  if (stage === "intake") {
    return (
      <div className="space-y-3 text-sm">
        <Row label="Client / URL" value={`${data.client_name || "—"} — ${data.url || "—"}`} />
        <Row label="Primary goal" value={data.primary_goal} />
        <Row
          label="Platform"
          value={
            <>
              {data.confirmed_platform || "Unknown"}{" "}
              <ConfTag level={data.platform_confidence} />
              <span className="text-slate-500 ml-1">— {data.platform_rationale}</span>
            </>
          }
        />
        {data.known_pain_points?.length > 0 && (
          <div>
            <div className="font-medium text-slate-600 mb-1">Pain points</div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
              {data.known_pain_points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        <Row label="Brief narrative" value={data.brief_narrative} />
      </div>
    );
  }

  if (stage === "platform") {
    return (
      <div className="space-y-3 text-sm">
        <Row
          label="Platform"
          value={<>{data.platform} <ConfTag level={data.platform_confidence} /></>}
        />
        <Row
          label="Maturity score"
          value={<>{data.maturity_score}/5 <ConfTag level={data.maturity_confidence} /> <span className="text-slate-500">— {data.maturity_rationale}</span></>}
        />
        <Row label="Performance" value={<>{data.performance_summary} <ConfTag level={data.performance_confidence} /></>} />
        {data.strengths?.length > 0 && (
          <div>
            <div className="font-medium text-slate-600 mb-1">Strengths</div>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="text-green-600 font-bold">+</span>
                  <span>{s.finding} <ConfTag level={s.confidence} /></span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.risks?.length > 0 && (
          <div>
            <div className="font-medium text-slate-600 mb-1">Risks</div>
            <ul className="space-y-1">
              {data.risks.map((r, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className={`font-bold ${r.severity === "high" ? "text-red-500" : r.severity === "medium" ? "text-amber-500" : "text-slate-400"}`}>!</span>
                  <span>{r.finding} <ConfTag level={r.confidence} /></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (stage === "ecosystem") {
    return (
      <div className="space-y-3 text-sm">
        <Row label="Ecosystem maturity" value={<>{data.ecosystem_maturity_score}/5 <ConfTag level={data.ecosystem_confidence} /></>} />
        {data.components?.length > 0 && (
          <div>
            <div className="font-medium text-slate-600 mb-2">Components</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.components.map((c, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-800">{c.technology}</span>
                    <ConfTag level={c.confidence} />
                  </div>
                  <div className="text-xs text-slate-500 mb-1">{c.category}</div>
                  <div className="text-xs text-slate-700">{c.assessment}</div>
                  {c.recommendation && <div className="text-xs text-indigo-700 mt-1">→ {c.recommendation}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {data.strategic_gaps?.length > 0 && (
          <div>
            <div className="font-medium text-slate-600 mb-1">Strategic gaps</div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
              {data.strategic_gaps.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
        )}
        {data.quick_wins?.length > 0 && (
          <div>
            <div className="font-medium text-slate-600 mb-1">Quick wins</div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
              {data.quick_wins.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (stage === "report") {
    return (
      <div className="space-y-4 text-sm">
        <h3 className="text-lg font-bold text-slate-900">{data.headline}</h3>
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">{data.executive_summary}</div>
        {data.key_findings?.length > 0 && (
          <div>
            <div className="font-semibold text-slate-700 mb-2">Key findings</div>
            <ul className="space-y-2">
              {data.key_findings.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span className="text-slate-700">{f.finding} <ConfTag level={f.confidence} /></span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.recommended_actions?.length > 0 && (
          <div>
            <div className="font-semibold text-slate-700 mb-2">Recommended actions</div>
            <div className="space-y-2">
              {data.recommended_actions.map((a, i) => (
                <div key={i} className="border-l-4 border-indigo-300 pl-3 py-1">
                  <div className="font-medium text-slate-800">{a.action} <ConfTag level={a.confidence} /></div>
                  <div className="text-xs text-slate-500">{a.priority} — {a.rationale}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.confidence_caveats && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 italic">
            {data.confidence_caveats}
          </div>
        )}
      </div>
    );
  }

  return <pre className="text-xs text-slate-600 bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}

function Row({ label, value }) {
  return (
    <div>
      <div className="font-medium text-slate-600 text-xs uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-slate-800">{value || "—"}</div>
    </div>
  );
}

export default function AgentStage({ stage, title, systemPrompt, initialUserPrompt, onComplete, onBack }) {
  const [userPrompt, setUserPrompt] = useState(initialUserPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawText, setRawText] = useState(null);
  const [parsed, setParsed] = useState(null);

  async function run() {
    setLoading(true);
    setError(null);
    setRawText(null);
    setParsed(null);
    try {
      const text = await analyze(systemPrompt, userPrompt);
      setRawText(text);
      const data = parseJSON(text);
      setParsed(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Edit brief before sending to agent
        </label>
        <textarea
          className="w-full border border-slate-300 rounded-lg p-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
          rows={8}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          ← Back
        </button>
        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Running agent…" : `Run ${title} agent`}
        </button>
      </div>

      {loading && (
        <div className="text-sm text-slate-500 animate-pulse">Calling Claude…</div>
      )}

      {parsed && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">{title} analysis</h3>
            <button
              onClick={run}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Re-run
            </button>
          </div>
          <RenderResult data={parsed} stage={stage} />

          <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => onComplete(parsed)}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Accept & continue →
            </button>
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-slate-600">Show raw JSON</summary>
              <pre className="mt-2 p-2 bg-slate-50 rounded text-xs overflow-auto text-slate-600">{rawText}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
