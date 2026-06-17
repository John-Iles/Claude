const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function researchSite(url) {
  const r = await fetch(`${BASE}/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!r.ok) throw new Error(`Backend error ${r.status}`);
  return r.json();
}

export async function analyze(system, user) {
  const r = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  if (!r.ok) {
    const detail = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(detail.detail || `Analyze error ${r.status}`);
  }
  const data = await r.json();
  return data.text;
}

export function parseJSON(raw) {
  // Strip markdown fences and trailing commas before parsing
  let cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/```\s*$/m, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
  return JSON.parse(cleaned);
}
