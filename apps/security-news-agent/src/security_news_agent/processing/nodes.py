"""Individual workflow nodes for the LangGraph pipeline."""

import json
import logging
from typing import Dict, Any
from langsmith import traceable
from langchain_google_genai import ChatGoogleGenerativeAI

from ..search.tavily_client import TavilyClient, TavilyError
from ..utils.helpers import (
    log_message,
    strip_bullets,
    find_json,
    ensure_marp_header,
    insert_separators,
    dedupe_separators,
    strip_whole_code_fence,
    clean_title,
    remove_presenter_lines,
    today_iso
)
from .state import State


logger = logging.getLogger(__name__)


class WorkflowNodes:
    """Collection of workflow nodes for the security news pipeline."""
    
    @staticmethod
    @traceable(name="0_collect_security_news")
    def collect_info(state: State, tavily_client: TavilyClient, config: Any) -> Dict:
        """Collect security news from various sources.
        
        Args:
            state: Current workflow state
            tavily_client: Tavily API client
            config: Agent configuration
            
        Returns:
            Updated state dictionary
        """
        topic = state.get("topic") or "Daily Security News Summary"
        
        try:
            # Get search queries from configuration
            queries = config.get_search_queries()
            
            # Search for news in the last 24 hours
            sources = tavily_client.collect_context(
                queries, 
                max_per_query=5, 
                default_time_range="day"
            )
            
            context_md = tavily_client.format_context_as_markdown(sources)
            total_results = tavily_client.get_total_results_count(sources)
            
            logger.info(f"Collected {total_results} news articles from {len(sources)} queries")
            
            return {
                "sources": sources,
                "context_md": context_md,
                "log": log_message(state, f"[collect_info] Found news from {len(sources)} queries, {total_results} total results.")
            }
            
        except TavilyError as e:
            error_msg = f"tavily_error: {e}"
            logger.error(f"Failed to collect news: {error_msg}")
            return {
                "error": error_msg,
                "log": log_message(state, f"[collect_info] EXCEPTION {e}")
            }
        except Exception as e:
            error_msg = f"unexpected_error: {e}"
            logger.error(f"Unexpected error in collect_info: {error_msg}")
            return {
                "error": error_msg,
                "log": log_message(state, f"[collect_info] UNEXPECTED EXCEPTION {e}")
            }
    
    @staticmethod
    @traceable(name="1_make_outline")
    def make_outline(state: State, llm: ChatGoogleGenerativeAI) -> Dict:
        """Generate outline from collected news.
        
        Args:
            state: Current workflow state
            llm: Language model client
            
        Returns:
            Updated state dictionary
        """
        topic = state.get("topic") or "Daily Security News Summary"
        context_md = state.get("context_md") or ""
        
        if not context_md.strip():
            logger.warning("No context available for outline generation")
            return {
                "error": "No news context available for outline generation",
                "log": log_message(state, "[outline] No context available")
            }
        
        prompt = f"""
System: You are a senior cybersecurity analyst. Your task is to create a presentation outline based on the latest security news.

User: Based on the following "Latest News Summary (with sources)", identify the 5 most critical security topics for a daily briefing. Present them as a concise bulleted list. Include URLs in your points.

[Latest News Summary]
{context_md}

[Topic]
{topic}
"""
        
        try:
            logger.info("Generating outline from collected news")
            msg = llm.invoke(prompt)
            bullets = strip_bullets(msg.content.splitlines())[:5] or [msg.content.strip()]
            
            logger.info(f"Generated outline with {len(bullets)} items")
            return {
                "outline": bullets,
                "log": log_message(state, f"[outline] Generated {len(bullets)} outline items")
            }
            
        except Exception as e:
            error_msg = f"outline_error: {e}"
            logger.error(f"Failed to generate outline: {error_msg}")
            return {
                "error": error_msg,
                "log": log_message(state, f"[outline] EXCEPTION {e}")
            }
    
    @staticmethod
    @traceable(name="2_make_toc")
    def make_toc(state: State, llm: ChatGoogleGenerativeAI) -> Dict:
        """Generate table of contents from outline.
        
        Args:
            state: Current workflow state
            llm: Language model client
            
        Returns:
            Updated state dictionary
        """
        outline = state.get("outline") or []
        
        if not outline:
            logger.warning("No outline available for TOC generation")
            return {
                "error": "No outline available for TOC generation",
                "log": log_message(state, "[toc] No outline available")
            }
        
        prompt = f"""
System: You are a senior cybersecurity analyst creating the table of contents for a Marp slide presentation.

User: From the following outline, create a table of contents with 5-8 chapters. Return it in JSON format as {{"toc": [ ... ]}}.

Outline:
- {chr(10).join(f"- {item}" for item in outline)}
"""
        
        try:
            logger.info("Generating table of contents")
            msg = llm.invoke(prompt)
            
            try:
                json_content = find_json(msg.content) or msg.content
                data = json.loads(json_content)
                toc = [s.strip() for s in data.get("toc", []) if s.strip()]
            except (json.JSONDecodeError, KeyError):
                logger.warning("Failed to parse JSON response, falling back to bullet parsing")
                toc = strip_bullets(msg.content.splitlines())
            
            # Ensure we have a reasonable TOC
            if not toc:
                toc = [
                    "Introduction", 
                    "Key Threats", 
                    "Vulnerability Analysis", 
                    "Breach Reports", 
                    "Recommendations", 
                    "Conclusion"
                ]
                logger.info("Using default TOC structure")
            
            toc = toc[:8]  # Limit to 8 chapters
            
            logger.info(f"Generated TOC with {len(toc)} chapters")
            return {
                "toc": toc,
                "error": "",
                "log": log_message(state, f"[toc] Generated {len(toc)} chapters")
            }
            
        except Exception as e:
            error_msg = f"toc_error: {e}"
            logger.error(f"Failed to generate TOC: {error_msg}")
            return {
                "error": error_msg,
                "log": log_message(state, f"[toc] EXCEPTION {e}")
            }
    
    @staticmethod
    @traceable(name="3_write_slides")
    def write_slides(state: State, llm: ChatGoogleGenerativeAI) -> Dict:
        """Write slide content in Marp format.
        
        Args:
            state: Current workflow state
            llm: Language model client
            
        Returns:
            Updated state dictionary
        """
        context_md = state.get("context_md") or ""
        
        if not context_md.strip():
            logger.warning("No context available for slide generation")
            return {
                "error": "No news context available for slide generation",
                "log": log_message(state, "[slides] No context available")
            }
        
        title = f"{today_iso()}_Daily_Security_Briefing"
        
        prompt = f"""
System: You are a senior cybersecurity analyst creating a presentation in Marp Markdown format.
Do not wrap the output in a code block. Do not include slide separators (---).
Each slide must start with an H2 header (##). Do not write the presenter's name on the title slide.
IMPORTANT: Base your writing ONLY on the facts provided in the "Latest News Summary" below. Do not include information not present in the summary.

User:
Latest News Summary (with sources):
{context_md}

Requirements:
- Title (main heading on the cover): {title}
- Page 1 should only have a # heading and a short subtitle. Do not write the presenter's name.
- Page 2 should be the Agenda (list the chapters).
- Subsequent pages should concisely detail the latest security news. Include URLs for each item.
- Every chapter must start with an H2 (##) heading.
"""
        
        try:
            logger.info("Generating slide content")
            msg = llm.invoke(prompt)
            slide_md = msg.content.strip()
            
            # Process the markdown
            slide_md = strip_whole_code_fence(slide_md)
            slide_md = insert_separators(slide_md)
            slide_md = dedupe_separators(slide_md)
            slide_md = ensure_marp_header(slide_md, clean_title(title))
            slide_md = remove_presenter_lines(slide_md)
            
            logger.info(f"Generated slide content ({len(slide_md)} characters)")
            return {
                "slide_md": slide_md,
                "title": title,
                "error": "",
                "log": log_message(state, f"[slides] generated ({len(slide_md)} chars)")
            }
            
        except Exception as e:
            error_msg = f"slides_error: {e}"
            logger.error(f"Failed to generate slides: {error_msg}")
            return {
                "error": error_msg,
                "log": log_message(state, f"[slides] EXCEPTION {e}")
            }
    
    @staticmethod
    @traceable(name="4_evaluate_slides")
    def evaluate_slides(state: State, llm: ChatGoogleGenerativeAI, max_attempts: int = 3) -> Dict:
        """Evaluate the generated slides for quality.
        
        Args:
            state: Current workflow state
            llm: Language model client
            max_attempts: Maximum number of attempts allowed
            
        Returns:
            Updated state dictionary
        """
        if state.get("error"):
            logger.info("Skipping evaluation due to previous error")
            return {}
        
        slide_md = state.get("slide_md") or ""
        topic = state.get("topic") or ""
        
        if not slide_md.strip():
            logger.warning("No slide content to evaluate")
            return {
                "error": "No slide content available for evaluation",
                "log": log_message(state, "[evaluate] No slide content available")
            }
        
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
            logger.info("Evaluating slide quality")
            msg = llm.invoke(prompt)
            raw = msg.content or ""
            json_content = find_json(raw) or raw
            data = json.loads(json_content)
            
            score = float(data.get("score", 0.0))
            passed = bool(data.get("pass", score >= 8.0))
            attempts = (state.get("attempts") or 0) + 1
            
            logger.info(f"Evaluation complete: score={score:.2f}, passed={passed}, attempts={attempts}")
            
            return {
                "score": score,
                "subscores": data.get("subscores") or {},
                "reasons": data.get("reasons") or {},
                "suggestions": data.get("suggestions") or [],
                "passed": passed,
                "feedback": str(data.get("feedback", "")).strip(),
                "attempts": attempts,
                "log": log_message(state, f"[evaluate] score={score:.2f} pass={passed} attempts={attempts}")
            }
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse evaluation response: {e}")
            # Provide default evaluation if parsing fails
            attempts = (state.get("attempts") or 0) + 1
            return {
                "score": 7.0,
                "subscores": {"structure": 7.0, "accuracy": 7.0, "clarity": 7.0, "conciseness": 7.0},
                "reasons": {"structure": "Unable to evaluate", "accuracy": "Unable to evaluate", 
                           "clarity": "Unable to evaluate", "conciseness": "Unable to evaluate"},
                "suggestions": ["Review slide content manually"],
                "passed": attempts >= max_attempts,  # Pass if max attempts reached
                "feedback": "Evaluation parsing failed, using default scores",
                "attempts": attempts,
                "log": log_message(state, f"[evaluate] parsing failed, attempts={attempts}")
            }
        except Exception as e:
            error_msg = f"eval_error: {e}"
            logger.error(f"Failed to evaluate slides: {error_msg}")
            return {
                "error": error_msg,
                "log": log_message(state, f"[evaluate] EXCEPTION {e}")
            }
    
    @staticmethod
    def route_after_eval(state: State, max_attempts: int = 3) -> str:
        """Determine next step after evaluation.
        
        Args:
            state: Current workflow state
            max_attempts: Maximum number of attempts allowed
            
        Returns:
            Next node name ("ok" or "retry")
        """
        attempts = state.get("attempts", 0)
        passed = state.get("passed", False)
        
        if attempts >= max_attempts:
            logger.info(f"Max attempts ({max_attempts}) reached, proceeding to save")
            return "ok"
        
        if passed:
            logger.info("Evaluation passed, proceeding to save")
            return "ok"
        else:
            logger.info(f"Evaluation failed (attempt {attempts}/{max_attempts}), retrying")
            return "retry"