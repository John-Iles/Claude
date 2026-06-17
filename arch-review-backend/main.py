# main.py — Architecture Review research backend
import os
import re
import asyncio
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Architecture Review Research Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PAGESPEED_KEY = os.environ.get("PAGESPEED_API_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

SIGNATURES = [
    {"category": "Commerce platform", "tech": "Shopify", "confidence": "high",
     "patterns": [r"cdn\.shopify\.com", r"x-shopify-stage", r"Shopify\.theme"]},
    {"category": "Commerce platform", "tech": "Salesforce Commerce Cloud (Demandware)", "confidence": "high",
     "patterns": [r"demandware\.static", r"/on/demandware\.store/", r"dwcdn\.net"]},
    {"category": "Commerce platform", "tech": "SAP Commerce Cloud (Hybris)", "confidence": "medium",
     "patterns": [r"_eu2d", r"yacceleratorstorefront", r"/_ui/responsive/"]},
    {"category": "Commerce platform", "tech": "Adobe Commerce (Magento)", "confidence": "high",
     "patterns": [r"/static/version\d+", r"Magento_", r"mage/cookies"]},
    {"category": "Commerce platform", "tech": "BigCommerce", "confidence": "high",
     "patterns": [r"cdn\d*\.bigcommerce\.com"]},
    {"category": "Commerce platform", "tech": "commercetools (likely headless)", "confidence": "low",
     "patterns": [r"commercetools"]},
    {"category": "CDN / edge", "tech": "Cloudflare", "confidence": "high",
     "patterns": [r"cf-ray", r"__cf_bm", r"cloudflare"]},
    {"category": "CDN / edge", "tech": "Akamai", "confidence": "high",
     "patterns": [r"akamai", r"x-akamai", r"akamaiedge"]},
    {"category": "CDN / edge", "tech": "Fastly", "confidence": "high",
     "patterns": [r"fastly", r"x-served-by:.*cache"]},
    {"category": "CDN / edge", "tech": "Amazon CloudFront", "confidence": "high",
     "patterns": [r"cloudfront\.net", r"x-amz-cf-id"]},
    {"category": "DAM / media", "tech": "Amplience", "confidence": "high",
     "patterns": [r"cdn\.media\.amplience\.net", r"amplience"]},
    {"category": "DAM / media", "tech": "Cloudinary", "confidence": "high",
     "patterns": [r"res\.cloudinary\.com"]},
    {"category": "DAM / media", "tech": "Scene7 (Adobe)", "confidence": "high",
     "patterns": [r"scene7\.com"]},
    {"category": "CMS", "tech": "Contentful", "confidence": "high",
     "patterns": [r"ctfassets\.net", r"contentful"]},
    {"category": "CMS", "tech": "Contentstack", "confidence": "high",
     "patterns": [r"contentstack"]},
    {"category": "Search", "tech": "Algolia", "confidence": "high",
     "patterns": [r"algolia", r"algolianet\.com"]},
    {"category": "Search", "tech": "Coveo", "confidence": "high",
     "patterns": [r"coveo"]},
    {"category": "Search", "tech": "Klevu", "confidence": "high",
     "patterns": [r"klevu"]},
    {"category": "Search", "tech": "Searchspring", "confidence": "high",
     "patterns": [r"searchspring"]},
    {"category": "Search", "tech": "Bloomreach", "confidence": "high",
     "patterns": [r"bloomreach", r"brapi"]},
    {"category": "Analytics / tags", "tech": "Google Analytics / GA4", "confidence": "high",
     "patterns": [r"google-analytics\.com", r"gtag\(", r"googletagmanager\.com"]},
    {"category": "Analytics / tags", "tech": "Segment", "confidence": "high",
     "patterns": [r"cdn\.segment\.com", r"analytics\.js"]},
    {"category": "Analytics / tags", "tech": "Tealium", "confidence": "high",
     "patterns": [r"tags\.tiqcdn\.com", r"tealium"]},
    {"category": "Analytics / tags", "tech": "Adobe Experience Cloud", "confidence": "high",
     "patterns": [r"adobedtm\.com", r"omtrdc\.net", r"demdex\.net"]},
    {"category": "Marketing", "tech": "Klaviyo", "confidence": "high",
     "patterns": [r"klaviyo"]},
    {"category": "Marketing", "tech": "Dynamic Yield", "confidence": "high",
     "patterns": [r"dynamicyield", r"dy-api"]},
    {"category": "Marketing", "tech": "Nosto", "confidence": "high",
     "patterns": [r"nosto"]},
    {"category": "Payments", "tech": "Stripe", "confidence": "high",
     "patterns": [r"js\.stripe\.com"]},
    {"category": "Payments", "tech": "Adyen", "confidence": "high",
     "patterns": [r"adyen"]},
    {"category": "Payments", "tech": "PayPal / Braintree", "confidence": "high",
     "patterns": [r"paypal\.com/sdk", r"braintreegateway"]},
    {"category": "Payments", "tech": "Klarna", "confidence": "high",
     "patterns": [r"klarna"]},
]


class ResearchRequest(BaseModel):
    url: str


class AnalyzeRequest(BaseModel):
    system: str
    user: str


def normalise_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


async def fetch_site(url: str):
    async with httpx.AsyncClient(follow_redirects=True, timeout=20.0,
                                 headers={"User-Agent": USER_AGENT}) as client:
        r = await client.get(url)
        return str(r.url), r.status_code, dict(r.headers), r.text


def fingerprint(final_url: str, headers: dict, html: str):
    header_blob = " ".join(f"{k}: {v}" for k, v in headers.items())
    corpus = f"{final_url}\n{header_blob}\n{html[:600000]}"
    detections = []
    for sig in SIGNATURES:
        for pat in sig["patterns"]:
            m = re.search(pat, corpus, re.IGNORECASE)
            if m:
                snippet = m.group(0)[:80]
                count = len(re.findall(pat, corpus, re.IGNORECASE))
                detections.append({
                    "category": sig["category"],
                    "technology": sig["tech"],
                    "confidence": sig["confidence"],
                    "evidence": snippet,
                    "match_count": count,
                    "rationale": f"Pattern '{snippet}' found {count}x in HTML/headers/URL",
                })
                break
    return detections


def extract_crux_metric(metrics: dict, key: str):
    m = metrics.get(key)
    if not m:
        return None
    return {"percentile": m.get("percentile"), "category": m.get("category")}


async def fetch_pagespeed(url: str, strategy: str):
    if not PAGESPEED_KEY:
        return {"error": "PAGESPEED_API_KEY not set on the server."}
    endpoint = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    params = {"url": url, "strategy": strategy, "category": "performance", "key": PAGESPEED_KEY}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(endpoint, params=params)
        if r.status_code != 200:
            return {"error": f"PageSpeed API returned {r.status_code}", "detail": r.text[:300]}
        data = r.json()
    out = {"strategy": strategy, "field_data": None, "lab_data": None}
    le = data.get("loadingExperience", {})
    if le.get("metrics"):
        mt = le["metrics"]
        out["field_data"] = {
            "overall_category": le.get("overall_category"),
            "LCP": extract_crux_metric(mt, "LARGEST_CONTENTFUL_PAINT_MS"),
            "INP": extract_crux_metric(mt, "INTERACTION_TO_NEXT_PAINT"),
            "CLS": extract_crux_metric(mt, "CUMULATIVE_LAYOUT_SHIFT_SCORE"),
            "FCP": extract_crux_metric(mt, "FIRST_CONTENTFUL_PAINT_MS"),
            "TTFB": extract_crux_metric(mt, "EXPERIMENTAL_TIME_TO_FIRST_BYTE"),
        }
    else:
        out["field_note"] = "No CrUX field data for this URL (likely insufficient real-user traffic)."
    lh = data.get("lighthouseResult", {})
    audits = lh.get("audits", {})
    cats = lh.get("categories", {})

    def audit_val(key):
        a = audits.get(key, {})
        return {"display": a.get("displayValue"), "score": a.get("score")}

    out["lab_data"] = {
        "performance_score": (cats.get("performance", {}) or {}).get("score"),
        "LCP": audit_val("largest-contentful-paint"),
        "TBT": audit_val("total-blocking-time"),
        "CLS": audit_val("cumulative-layout-shift"),
        "FCP": audit_val("first-contentful-paint"),
        "speed_index": audit_val("speed-index"),
    }
    return out


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if not ANTHROPIC_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not set on the server.")
    payload = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 1500,
        "system": req.system,
        "messages": [{"role": "user", "content": req.user}],
    }
    headers = {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Anthropic API error {r.status_code}: {r.text[:300]}")
    data = r.json()
    text = data["content"][0]["text"]
    return {"text": text}


@app.get("/health")
async def health():
    return {"status": "ok", "pagespeed_key_set": bool(PAGESPEED_KEY)}


@app.post("/research")
async def research(req: ResearchRequest):
    url = normalise_url(req.url)
    try:
        final_url, status, headers, html = await fetch_site(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch site: {e}")
    fetch_block_note = None
    if status >= 400:
        fetch_block_note = (
            f"Site returned HTTP {status} to a server-side request — it may block bots. "
            f"Tech detection below is based only on what was returned."
        )
    detections = fingerprint(final_url, headers, html)
    mobile, desktop = await asyncio.gather(
        fetch_pagespeed(final_url, "mobile"),
        fetch_pagespeed(final_url, "desktop"),
    )
    return {
        "requested_url": req.url,
        "final_url": final_url,
        "http_status": status,
        "fetch_block_note": fetch_block_note,
        "server_header": headers.get("server"),
        "tech_detections": detections,
        "tech_detection_note": (
            "Absence of a technology here means no signature was found in the fetched HTML/headers, "
            "NOT that it is absent from the stack. Server-side systems (OMS, ERP, PIM) are usually invisible to a page fetch."
        ),
        "core_web_vitals": {"mobile": mobile, "desktop": desktop},
    }
