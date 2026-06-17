const CONF_BADGE = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

const CWV_COLOR = {
  FAST: "text-green-700 font-semibold",
  AVERAGE: "text-amber-600 font-semibold",
  SLOW: "text-red-600 font-semibold",
  NEEDS_IMPROVEMENT: "text-amber-600 font-semibold",
};

function ConfBadge({ level }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-wide ${CONF_BADGE[level] || CONF_BADGE.low}`}
    >
      {level}
    </span>
  );
}

function CwvCell({ value }) {
  if (!value) return <td className="px-3 py-2 text-slate-400 text-sm">—</td>;
  const { percentile, category } = value;
  const cls = CWV_COLOR[category] || "text-slate-600";
  return (
    <td className="px-3 py-2 text-sm">
      <span>{percentile != null ? `${percentile}${category?.includes("LAYOUT") ? "" : "ms"}` : "—"}</span>
      {" "}
      <span className={cls}>{category}</span>
    </td>
  );
}

function CwvTable({ cwv }) {
  const rows = ["LCP", "INP", "CLS", "FCP", "TTFB"];
  const mField = cwv.mobile?.field_data;
  const dField = cwv.desktop?.field_data;
  const mLab = cwv.mobile?.lab_data;
  const dLab = cwv.desktop?.lab_data;

  const mPerfScore = mLab?.performance_score;
  const dPerfScore = dLab?.performance_score;

  // Detect field/lab gap: field LCP fast but lab perf < 0.5
  const mGap = mField?.LCP?.category === "FAST" && mPerfScore < 0.5;
  const dGap = dField?.LCP?.category === "FAST" && dPerfScore < 0.5;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 font-semibold text-slate-700">Metric</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Mobile (field)</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Desktop (field)</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Mobile lab</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Desktop lab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((key) => (
              <tr key={key} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-600">{key}</td>
                <CwvCell value={mField?.[key]} />
                <CwvCell value={dField?.[key]} />
                <td className="px-3 py-2 text-sm text-slate-600">{mLab?.[key]?.display || "—"}</td>
                <td className="px-3 py-2 text-sm text-slate-600">{dLab?.[key]?.display || "—"}</td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="px-3 py-2 font-semibold text-slate-700 text-xs">Perf score</td>
              <td className="px-3 py-2 text-sm" colSpan={2}>
                {mField ? (
                  <span className={CWV_COLOR[mField.overall_category] || "text-slate-600"}>
                    Overall {mField.overall_category}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">{cwv.mobile?.field_note || "No field data"}</span>
                )}
              </td>
              <td className="px-3 py-2 text-sm">
                {mPerfScore != null ? (
                  <span className={mPerfScore < 0.5 ? "text-red-600 font-semibold" : mPerfScore < 0.9 ? "text-amber-600 font-semibold" : "text-green-700 font-semibold"}>
                    {Math.round(mPerfScore * 100)}/100
                  </span>
                ) : "—"}
              </td>
              <td className="px-3 py-2 text-sm">
                {dPerfScore != null ? (
                  <span className={dPerfScore < 0.5 ? "text-red-600 font-semibold" : dPerfScore < 0.9 ? "text-amber-600 font-semibold" : "text-green-700 font-semibold"}>
                    {Math.round(dPerfScore * 100)}/100
                  </span>
                ) : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {(mGap || dGap) && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span className="font-semibold">⚠ Field/lab gap</span> — real users see fast LCP (field data, high confidence) but Lighthouse scores are poor ({mGap ? `mobile: ${Math.round(mPerfScore * 100)}/100` : ""}{mGap && dGap ? ", " : ""}{dGap ? `desktop: ${Math.round(dPerfScore * 100)}/100` : ""}). Typical of JS-heavy commerce; performance is fragile on slow devices and non-cached visits.
        </div>
      )}
    </div>
  );
}

export default function EvidencePack({ research }) {
  const { tech_detections, fetch_block_note, core_web_vitals, tech_detection_note } = research;
  const blocked = tech_detections.length === 0 && fetch_block_note;

  // Group detections by category
  const byCategory = tech_detections.reduce((acc, d) => {
    (acc[d.category] = acc[d.category] || []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Tech stack */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Tech stack signals</h3>

        {blocked && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800">
            <span className="font-semibold">⚠ Site blocked server-side fetch</span> — tech stack will be corroborated via web search instead, at medium confidence.
            <div className="mt-1 text-xs text-amber-700">{fetch_block_note}</div>
          </div>
        )}

        {tech_detections.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((d, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-slate-800 text-sm">{d.technology}</span>
                        <ConfBadge level={d.confidence} />
                      </div>
                      <div className="text-xs text-slate-500">
                        Basis: <span className="text-slate-700">{d.rationale}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !blocked && <p className="text-sm text-slate-500">No technology signatures matched.</p>
        )}

        <p className="mt-3 text-xs text-slate-400 italic">{tech_detection_note}</p>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Core Web Vitals</h3>
        <p className="text-xs text-slate-500 mb-3">Field data = real-user CrUX percentiles (high confidence). Lab data = Lighthouse simulation (medium confidence).</p>
        <CwvTable cwv={core_web_vitals} />
      </div>
    </div>
  );
}
