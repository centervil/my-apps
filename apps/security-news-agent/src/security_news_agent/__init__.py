"""Security News Agent - AI-powered security news collection and reporting."""

__version__ = "0.2.0"
__author__ = "Jules"
__description__ = (
    "An AI agent that collects security news and generates reports"
)

from .config.settings import AgentConfig
from .output.renderer import ReportRenderer
from .processing.workflow import SecurityNewsWorkflow
from .search.tavily_client import TavilyClient

__all__ = [
    "AgentConfig",
    "TavilyClient",
    "SecurityNewsWorkflow",
    "ReportRenderer",
]
