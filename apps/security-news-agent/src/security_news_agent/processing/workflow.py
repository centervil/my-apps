"""LangGraph workflow management for security news processing."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph

from ..config.settings import AgentConfig
from ..search.tavily_client import TavilyClient
from .nodes import WorkflowNodes
from .state import State

logger = logging.getLogger(__name__)


class SecurityNewsWorkflow:
    """Manages the LangGraph workflow for security news processing."""

    def __init__(
        self,
        config: AgentConfig,
        tavily_client: TavilyClient,
        llm_client: Any = None,
    ):
        """Initialize the workflow.

        Args:
            config: Agent configuration
            tavily_client: Tavily API client
            llm_client: Optional pre-initialized LLM client for mocking/testing
        """
        self.config = config
        self.tavily_client = tavily_client
        self.max_attempts = 3

        # Initialize LLM
        if llm_client:
            self.llm = llm_client
        else:
            self.llm = ChatGoogleGenerativeAI(
                model=config.gemini_model_name,
                google_api_key=config.google_api_key,
                temperature=0.2,
                convert_system_message_to_human=True,  # Gemini specific
            )

        # Build the workflow graph
        self.graph = self._build_graph()

        logger.info(
            f"Initialized SecurityNewsWorkflow with model: {config.gemini_model_name}"
        )

    def _build_graph(self) -> Any:
        """Build the LangGraph workflow.

        Returns:
            Compiled StateGraph
        """
        graph_builder = StateGraph(State)

        # Add nodes
        graph_builder.add_node("collect_info", self._collect_info_wrapper)
        graph_builder.add_node("make_outline", self._make_outline_wrapper)
        graph_builder.add_node("make_toc", self._make_toc_wrapper)
        graph_builder.add_node("write_slides", self._write_slides_wrapper)
        graph_builder.add_node(
            "evaluate_slides", self._evaluate_slides_wrapper
        )

        # Add edges
        graph_builder.add_edge(START, "collect_info")
        graph_builder.add_edge("collect_info", "make_outline")
        graph_builder.add_edge("make_outline", "make_toc")
        graph_builder.add_edge("make_toc", "write_slides")
        graph_builder.add_edge("write_slides", "evaluate_slides")

        # Add conditional edge for evaluation
        graph_builder.add_conditional_edges(
            "evaluate_slides",
            self._route_after_eval,
            {"retry": "make_toc", "ok": END},
        )

        return graph_builder.compile()

    def _collect_info_wrapper(self, state: State) -> Dict[str, Any]:
        """Wrapper for collect_info node."""
        return WorkflowNodes.collect_info(
            state, self.tavily_client, self.config
        )

    def _make_outline_wrapper(self, state: State) -> Dict[str, Any]:
        """Wrapper for make_outline node."""
        return WorkflowNodes.make_outline(state, self.llm)

    def _make_toc_wrapper(self, state: State) -> Dict[str, Any]:
        """Wrapper for make_toc node."""
        return WorkflowNodes.make_toc(state, self.llm)

    def _write_slides_wrapper(self, state: State) -> Dict[str, Any]:
        """Wrapper for write_slides node."""
        return WorkflowNodes.write_slides(state, self.llm)

    def _evaluate_slides_wrapper(self, state: State) -> Dict[str, Any]:
        """Wrapper for evaluate_slides node."""
        return WorkflowNodes.evaluate_slides(
            state, self.llm, self.max_attempts
        )

    def _route_after_eval(self, state: State) -> str:
        """Wrapper for route_after_eval."""
        return WorkflowNodes.route_after_eval(state, self.max_attempts)

    def create_initial_state(self, topic: Optional[str] = None) -> State:
        """Create initial state for the workflow.

        Args:
            topic: Optional topic override

        Returns:
            Initial state dictionary
        """
        return State(
            topic=topic or "Daily Cybersecurity Threat Briefing",
            outline=[],
            toc=[],
            slide_md="",
            score=0.0,
            subscores={},
            reasons={},
            suggestions=[],
            risk_flags=[],
            passed=False,
            feedback="",
            title="",
            slide_path="",
            attempts=0,
            error="",
            log=[],
            context_md="",
            sources={},
        )

    def create_run_config(
        self, run_name: Optional[str] = None
    ) -> RunnableConfig:
        """Create configuration for workflow execution.

        Args:
            run_name: Optional custom run name

        Returns:
            RunnableConfig for the workflow
        """
        return RunnableConfig(
            run_name=run_name or "daily-security-news-agent",
            tags=["security", "langgraph", "gemini", "tavily"],
            metadata={
                "env": "production",
                "date": datetime.now(timezone.utc).isoformat(),
                "model": self.config.gemini_model_name,
            },
            recursion_limit=60,
        )

    def run(
        self,
        initial_state: Optional[State] = None,
        config: Optional[RunnableConfig] = None,
    ) -> Dict[str, Any]:
        """Execute the complete workflow.

        Args:
            initial_state: Optional initial state (will create default if None)
            config: Optional run configuration (will create default if None)

        Returns:
            Final workflow state
        """
        if initial_state is None:
            initial_state = self.create_initial_state()

        if config is None:
            config = self.create_run_config()

        logger.info("Starting security news workflow execution")

        try:
            result: Dict[str, Any] = self.graph.invoke(
                initial_state, config=config
            )

            if result.get("error"):
                logger.error(
                    f"Workflow completed with error: {result['error']}"
                )
            else:
                logger.info(
                    f"Workflow completed successfully. Score: {result.get('score', 'N/A')}"
                )

            return result

        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            # Return the current state with error information
            error_log = initial_state.get("log", []) + [
                f"[workflow] EXECUTION FAILED: {e}"
            ]
            error_state = {
                **initial_state,
                "error": f"workflow_execution_error: {e}",
                "log": error_log,
            }
            return error_state

    def validate_prerequisites(self) -> bool:
        """Validate that all prerequisites are met for workflow execution.

        Returns:
            True if all prerequisites are met, False otherwise
        """
        try:
            # Test Tavily client
            if not self.tavily_client.api_key:
                logger.error("Tavily API key not configured")
                return False

            # Test LLM configuration
            if not self.config.google_api_key:
                logger.error("Google API key not configured")
                return False

            logger.info("All prerequisites validated successfully")
            return True

        except Exception as e:
            logger.error(f"Prerequisites validation failed: {e}")
            return False

    def get_workflow_summary(self) -> Dict[str, Any]:
        """Get summary information about the workflow configuration.

        Returns:
            Dictionary with workflow configuration summary
        """
        return {
            "model": self.config.gemini_model_name,
            "max_attempts": self.max_attempts,
            "slide_format": self.config.slide_format,
            "marp_theme": self.config.marp_theme,
            "search_queries_count": len(self.config.get_search_queries()),
            "nodes": [
                "collect_info",
                "make_outline",
                "make_toc",
                "write_slides",
                "evaluate_slides",
            ],
        }
