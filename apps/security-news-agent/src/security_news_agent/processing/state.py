"""State management for the LangGraph workflow."""

from typing import Dict, List, TypedDict


class State(TypedDict):
    """State object for the security news workflow."""

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
