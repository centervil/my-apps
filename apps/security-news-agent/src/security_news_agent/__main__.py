# LangGraph × Gemini × Tavily × Marp
# This script creates a security news report using an AI agent.
# Adapted from: https://zenn.dev/microsoft/articles/create_doc_by_aiagent
#
# Flow:
# 0) Collect security news with Tavily -> 1) Generate outline -> 2) Generate table of contents ->
# 3) Generate slide (Marp) body -> 4) Evaluate -> 5) Save slide Markdown and render

import os
import re
import json
import shutil
import subprocess
from typing import Any, Union, Optional, TypedDict, List, Dict
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from langsmith import traceable
from langgraph.graph import StateGraph, START, END
from langchain_google import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableConfig
from zoneinfo import ZoneInfo
from langchain_core.tools import tool

# -------------------
# Environment Variable Loading
# -------------------
load_dotenv()

def _env(key: str, default: Optional[str] = None) -> str:
    v = os.getenv(key, default)
    if v is None:
        raise RuntimeError(f"Missing environment variable: {key}")
    return v

# LangSmith (Recommended ON)
os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
os.environ.setdefault("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")


# Google Gemini
GOOGLE_API_KEY = _env("GOOGLE_API_KEY")
GEMINI_MODEL_NAME = _env("GEMINI_MODEL_NAME", "gemini-1.5-flash-latest")


# Tavily
TAVILY_API_KEY = _env("TAVILY_API_KEY")

# Marp Output (pdf / png / html). Empty means .md only
SLIDE_FORMAT = os.getenv("SLIDE_FORMAT", "pdf").lower().strip()
MARP_THEME = os.getenv("MARP_THEME", "default")  # default, gaia, uncover etc.
MARP_PAGINATE = os.getenv("MARP_PAGINATE", "true") # "true"/"false"

# -------------------
# LLM Client
# -------------------
llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL_NAME,
    google_api_key=GOOGLE_API_KEY,
    temperature=0.2,
    convert_system_message_to_human=True # Gemini specific
)

# -------------------
# Utilities
# -------------------
def _log(state: dict, msg: str) -> List[str]:
    return (state.get("log") or []) + [msg]

def _strip_bullets(lines: List[str]) -> List[str]:
    out = []
    for line in lines:
        t = line.strip()
        if not t:
            continue
        t = t.lstrip("・-•* \t")
        out.append(t)
    return out

def _slugify_en(text: str, max_len: int = 80) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:max_len] or "slides"

def _find_json(text: str) -> Optional[str]:
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*", "", t)
    t = re.sub(r"\s*```$", "", t)
    m = re.search(r"\{.*\}\s*$", t, flags=re.DOTALL)
    if m:
        return m.group(0)
    return None

def _ensure_marp_header(md: str, title: str) -> str:
    header = (
        "---\n"
        "marp: true\n"
        f"paginate: {MARP_PAGINATE}\n"
        f"theme: {MARP_THEME}\n"
        f"title: {title}\n"
        "---\n\n"
    )
    body = re.sub(r"^---[\s\S]*?---\s*", "", md.strip(), count=1, flags=re.DOTALL)
    return header + (body + ("\n" if not body.endswith("\n") else ""))

def _insert_separators(md: str) -> str:
    out = []
    in_code = False
    fence = None
    prev = ""
    def need_sep(prev_line: str) -> bool:
        pl = prev_line.strip()
        return pl != "---"
    for line in md.splitlines():
        if line.startswith("```") or line.startswith("~~~"):
            if not in_code:
                in_code, fence = True, line[:3]
            else:
                if fence and line.startswith(fence):
                    in_code, fence = False, None
            out.append(line)
            prev = line
            continue
        if not in_code and line.startswith("## "):
            if need_sep(prev):
                out.append("---")
            out.append(line)
        else:
            out.append(line)
        prev = line
    return "\n".join(out).strip() + "\n"

def _dedupe_separators(md: str) -> str:
    md = re.sub(r"(?:\n*\s*---\s*\n+){2,}", "\n---\n", md, flags=re.MULTILINE)
    md = re.sub(r"^(?:\s*---\s*\n)+", "---\n", md)
    return md

def _strip_whole_code_fence(md: str) -> str:
    t = md.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z0-9_-]*\s*\n?", "", t, flags=re.DOTALL)
        t = re.sub(r"\n?```$", "", t.strip(), flags=re.DOTALL)
    return t

def _clean_title(raw: str) -> str:
    t = (raw or "").strip().splitlines()[0]
    t = t.strip("「」『』\"' 　:：")
    t = re.sub(r"^(以下のようなタイトル.*|title:?|suggested:?|案:?)[\s：:]*", "", t, flags=re.IGNORECASE)
    return t or "Daily Security News Summary"

def _remove_presenter_lines(md: str) -> str:
    parts = md.split("\n---\n", 1)
    head = parts[0]
    head = re.sub(r"^\s*(発表者|Presenter|Speaker)\s*[:：].*$", "", head, flags=re.MULTILINE)
    head = re.sub(r"\n{3,}", "\n\n", head).strip() + "\n"
    return head + ("\n---\n" + parts[1] if len(parts) == 2 else "")

JST = ZoneInfo("Asia/Tokyo")
def now_jst():
    return datetime.now(JST)

def today_iso(fmt: str = "%Y-%m-%d") -> str:
    return now_jst().strftime(fmt)

# -------------------
# Tavily Search
# -------------------
def tavily_search(
    query: str,
    max_results: int = 8,
    include_domains: Optional[List[str]] = None,
    time_range: str = "day",
) -> Dict:
    endpoint = "https://api.tavily.com/search"
    payload: Dict[str, Any] = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "include_answer": True,
        "max_results": max_results,
        "time_range": time_range,
    }
    if include_domains:
        payload["include_domains"] = include_domains
    r = requests.post(endpoint, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()

def tavily_collect_context(
    queries: List[Union[str, Dict[str, Any]]],
    max_per_query: int = 6,
    default_time_range: str = "day",
) -> Dict[str, List[Dict[str, str]]]:
    seen = set()
    out: Dict[str, List[Dict[str, str]]] = {}
    for q in queries:
        if isinstance(q, dict):
            qtext = q.get("q", "")
            inc = q.get("include_domains")
            tr  = q.get("time_range", default_time_range)
        else:
            qtext = q
            inc   = None
            tr    = default_time_range
        if not qtext:
            continue
        data = tavily_search(qtext, max_per_query, include_domains=inc, time_range=tr)
        items = []
        for r in data.get("results", []):
            url = r.get("url")
            if not url or url in seen:
                continue
            seen.add(url)
            items.append({
                "title": (r.get("title") or "")[:160],
                "url": url,
                "content": ((r.get("content") or "").replace("\n", " "))[:600],
            })
        out[qtext] = items
    return out

def context_to_bullets(ctx: Dict[str, List[Dict[str, str]]]) -> str:
    bullets = []
    for q, items in ctx.items():
        bullets.append(f"### Query: {q}")
        for it in items:
            title = it["title"]
            url = it["url"]
            content = it["content"].replace("\n", " ")
            bullets.append(f"- {title} — {content} [source]({url})")
        bullets.append("")
    return "\n".join(bullets)

# -------------------
# State
# -------------------
class State(TypedDict):
    topic: str
    outline: List[str]
    toc: List[str]
    slide_md: str
    score: float
    subscores: Dict[str, float]
    reasons: Dict[str, str]
    suggestions: List[str]
    risk_flags: List[str]
    passed: bool
    feedback: str
    title: str
    slide_path: str
    attempts: int
    error: str
    log: List[str]
    context_md: str
    sources: Dict[str, List[Dict[str, str]]]

# =======================
# Node 0: Collect Security News
# =======================
@traceable(name="0_collect_security_news")
def collect_info(state: State) -> Dict:
    topic = state.get("topic") or "Daily Security News Summary"

    # Reputable security news sources
    queries: List[Dict[str, Any]] = [
        {"q": "latest cybersecurity news", "include_domains": ["thehackernews.com", "bleepingcomputer.com"]},
        {"q": "latest vulnerability reports", "include_domains": ["krebsonsecurity.com", "darkreading.com"]},
        {"q": "data breach notifications", "include_domains": ["securityweek.com", "infosecurity-magazine.com"]},
        {"q": "malware trends", "include_domains": ["crowdstrike.com/blog", "paloaltonetworks.com/blog", "mandiant.com/resources/blog"]},
        {"q": "zero-day exploits", "include_domains": ["zerodayinitiative.com/blog", "threatpost.com"]}
    ]

    try:
        # Search for news in the last 24 hours
        sources = tavily_collect_context(queries, max_per_query=5, default_time_range="day")
        context_md = context_to_bullets(sources)
        return {
            "sources": sources,
            "context_md": context_md,
            "log": _log(state, f"[collect_info] Found news from {len(sources)} queries.")
        }
    except Exception as e:
        return {"error": f"tavily_error: {e}", "log": _log(state, f"[collect_info] EXCEPTION {e}")}

# -------------------
# Node 1: Generate Outline
# -------------------
@traceable(name="1_make_outline")
def make_outline(state: State) -> Dict:
    topic = state.get("topic") or "Daily Security News Summary"
    ctx = state.get("context_md") or ""
    prompt = f"""
System: You are a senior cybersecurity analyst. Your task is to create a presentation outline based on the latest security news.

User: Based on the following "Latest News Summary (with sources)", identify the 5 most critical security topics for a daily briefing. Present them as a concise bulleted list. Include URLs in your points.

[Latest News Summary]
{ctx}

[Topic]
{topic}
"""
    try:
        msg = llm.invoke(prompt)
        bullets = _strip_bullets(msg.content.splitlines())[:5] or [msg.content.strip()]
        return {"outline": bullets, "log": _log(state, f"[outline] {bullets}")}
    except Exception as e:
        return {"error": f"outline_error: {e}", "log": _log(state, f"[outline] EXCEPTION {e}")}

# -------------------
# Node 2: Generate Table of Contents
# -------------------
@traceable(name="2_make_toc")
def make_toc(state: State) -> Dict:
    outline = state.get("outline") or []
    prompt = f"""
System: You are a senior cybersecurity analyst creating the table of contents for a Marp slide presentation.

User: From the following outline, create a table of contents with 5-8 chapters. Return it in JSON format as {{"toc": [ ... ]}}.

Outline:
- {"\n- ".join(outline)}
"""
    try:
        msg = llm.invoke(prompt)
        try:
            data = json.loads(_find_json(msg.content) or msg.content)
            toc = [s.strip() for s in data.get("toc", []) if s.strip()]
        except Exception:
            toc = _strip_bullets(msg.content.splitlines())
        toc = toc[:8] or ["Introduction", "Key Threats", "Vulnerability Analysis", "Breach Reports", "Recommendations", "Conclusion"]
        return {"toc": toc, "error": "", "log": _log(state, f"[toc] {toc}")}
    except Exception as e:
        return {"error": f"toc_error: {e}", "log": _log(state, f"[toc] EXCEPTION {e}")}

# -------------------
# Node 3: Write Slide Body (Marp)
# -------------------
@traceable(name="3_write_slides")
def write_slides(state: State) -> Dict:
    ctx = state.get("context_md") or ""

    ja_title = f"{today_iso()}_Daily_Security_Briefing"

    prompt = f"""
System: You are a senior cybersecurity analyst creating a presentation in Marp Markdown format.
Do not wrap the output in a code block. Do not include slide separators (---).
Each slide must start with an H2 header (##). Do not write the presenter's name on the title slide.
IMPORTANT: Base your writing ONLY on the facts provided in the "Latest News Summary" below. Do not include information not present in the summary.

User:
Latest News Summary (with sources):
{ctx}

Requirements:
- Title (main heading on the cover): {ja_title}
- Page 1 should only have a # heading and a short subtitle. Do not write the presenter's name.
- Page 2 should be the Agenda (list the chapters).
- Subsequent pages should concisely detail the latest security news. Include URLs for each item.
- Every chapter must start with an H2 (##) heading.
"""
    try:
        msg = llm.invoke(prompt)
        slide_md = msg.content.strip()

        slide_md = _strip_whole_code_fence(slide_md)
        slide_md = _insert_separators(slide_md)
        slide_md = _dedupe_separators(slide_md)
        slide_md = _ensure_marp_header(slide_md, _clean_title(ja_title))
        slide_md = _remove_presenter_lines(slide_md)

        return {"slide_md": slide_md, "title": ja_title, "error": "", "log": _log(state, f"[slides] generated ({len(slide_md)} chars)")}
    except Exception as e:
        return {"error": f"slides_error: {e}", "log": _log(state, f"[slides] EXCEPTION {e}")}

# -------------------
# Node 4: Evaluation
# -------------------
MAX_ATTEMPTS = 3

@traceable(name="4_evaluate_slides")
def evaluate_slides(state: State) -> Dict:
    if state.get("error"):
        return {}
    slide_md = state.get("slide_md") or ""
    topic = state.get("topic") or ""
    eval_guide = (
        "Evaluation Criteria and Weights:\n"
        "- structure(0.20): Logical flow, chapter organization, one message per slide.\n"
        "- accuracy(0.30): Factual correctness based on the provided news summary.\n"
        "- clarity(0.25): Clear and easy-to-understand language, appropriate use of bullet points.\n"
        "- conciseness(0.25): Lack of redundancy, straight to the point.\n"
        "Passing Score: score >= 8.0\n"
    )

    prompt = f"""
System: You are a principal security architect. You will rigorously score the following Marp slide Markdown based on the provided criteria and weights. Output JSON only.

User:
Topic: {topic}
Slides (Marp Markdown):
<<<SLIDES
{slide_md}
SLIDES

Evaluation Guide:
<<<EVAL
{eval_guide}
EVAL

Return strictly this JSON schema:
{{
  "score": number,
  "subscores": {{"structure": number, "accuracy": number, "clarity": number, "conciseness": number}},
  "reasons": {{"structure": string, "accuracy": string, "clarity": string, "conciseness": string}},
  "suggestions": [string],
  "pass": boolean,
  "feedback": string
}}
"""
    try:
        msg = llm.invoke(prompt)
        raw = msg.content or ""
        js = _find_json(raw) or raw
        data = json.loads(js)

        score = float(data.get("score", 0.0))
        passed = bool(data.get("pass", score >= 8.0))
        attempts = (state.get("attempts") or 0) + 1

        return {
            "score": score,
            "subscores": data.get("subscores") or {},
            "reasons": data.get("reasons") or {},
            "suggestions": data.get("suggestions") or [],
            "passed": passed,
            "feedback": str(data.get("feedback", "")).strip(),
            "attempts": attempts,
            "log": _log(state, f"[evaluate] score={score:.2f} pass={passed} attempts={attempts}")
        }
    except Exception as e:
        return {"error": f"eval_error: {e}", "log": _log(state, f"[evaluate] EXCEPTION {e}")}

def route_after_eval(state: State) -> str:
    if (state.get("attempts") or 0) >= MAX_ATTEMPTS:
        return "ok"
    return "ok" if state.get("passed") else "retry"

# -------------------
# Node 5: Save & Render
# -------------------
@traceable(name="5_save_and_render")
def save_and_render(state: State) -> Dict:
    if state.get("error"):
        return {}
    slide_md = state.get("slide_md") or ""
    title = state.get("title") or "security-briefing"

    file_stem = f"{today_iso()}_{_slugify_en(title)}"

    slides_dir = Path("slides")
    slides_dir.mkdir(parents=True, exist_ok=True)
    slide_md_path = slides_dir / f"{file_stem}.md"
    slide_md_path.write_text(slide_md, encoding="utf-8")

    marp = shutil.which("marp")
    out_path = str(slide_md_path)
    log_msg = ""
    if marp and SLIDE_FORMAT in {"pdf", "png", "html"}:
        ext = SLIDE_FORMAT
        out_file = slides_dir / f"{file_stem}.{ext}"
        try:
            subprocess.run(
                [marp, str(slide_md_path), f"--{ext}", "-o", str(out_file)],
                check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            out_path = str(out_file)
            log_msg = f"[marp] generated {ext} -> {out_file}"
        except subprocess.CalledProcessError as e:
            log_msg = f"[marp] marp-cli failed: {e.stderr.decode()}"
    elif not marp and SLIDE_FORMAT:
        log_msg = "[marp] marp-cli not found – skipped rendering. Install with 'npm install -g @marp-team/marp-cli'"
    else:
        log_msg = "[marp] rendering skipped (SLIDE_FORMAT not set)."

    return {"slide_path": out_path, "log": _log(state, log_msg)}

# -------------------
# Graph Construction
# -------------------
graph_builder = StateGraph(State)
graph_builder.add_node("collect_info", collect_info)
graph_builder.add_node("make_outline", make_outline)
graph_builder.add_node("make_toc", make_toc)
graph_builder.add_node("write_slides", write_slides)
graph_builder.add_node("evaluate_slides", evaluate_slides)
graph_builder.add_node("save_and_render", save_and_render)

graph_builder.add_edge(START, "collect_info")
graph_builder.add_edge("collect_info", "make_outline")
graph_builder.add_edge("make_outline", "make_toc")
graph_builder.add_edge("make_toc", "write_slides")
graph_builder.add_edge("write_slides", "evaluate_slides")

graph_builder.add_conditional_edges(
    "evaluate_slides",
    route_after_eval,
    {"retry": "make_toc", "ok": "save_and_render"},
)

graph_builder.add_edge("save_and_render", END)

graph = graph_builder.compile()

# -------------------
# Execution
# -------------------
if __name__ == "__main__":
    if not all([GOOGLE_API_KEY, LANGCHAIN_API_KEY, TAVILY_API_KEY]):
        print("ERROR: Missing one or more required API keys in your .env file.")
        print("Please set GOOGLE_API_KEY, LANGCHAIN_API_KEY, and TAVILY_API_KEY.")
    else:
        print("LangSmith Tracing:", os.getenv("LANGCHAIN_TRACING_V2"),
              "| Project:", os.getenv("LANGCHAIN_PROJECT"))

        init_state: State = {
            "topic": "Daily Cybersecurity Threat Briefing",
            "outline": [], "toc": [], "slide_md": "",
            "score": 0.0, "subscores": {}, "reasons": {},
            "suggestions": [], "risk_flags": [], "passed": False,
            "feedback": "", "title": "", "slide_path": "",
            "attempts": 0, "error": "", "log": [],
            "context_md": "", "sources": {}
        }

        config: RunnableConfig = {
            "run_name": "daily-security-news-agent",
            "tags": ["security", "langgraph", "gemini", "tavily"],
            "metadata": {"env": "dev", "date": datetime.utcnow().isoformat()},
            "recursion_limit": 60,
        }

        out = graph.invoke(init_state, config=config)

        print("\n=== RESULT ===")
        if out.get("error"):
            print("ERROR:", out["error"])
        else:
            print("Title    :", out.get("title"))
            print("Slide    :", out.get("slide_path"))
            print("Score    :", out.get("score"))
            print("Passed   :", out.get("passed"))
        print("\n-- LOG --")
        for line in out.get("log", []):
            print(line)
