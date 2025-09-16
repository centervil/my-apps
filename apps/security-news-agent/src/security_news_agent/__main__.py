#!/usr/bin/env python3
"""Security News Agent - Main entry point.

This script creates a security news report using an AI agent with modular architecture.
Refactored from monolithic script to use proper separation of concerns.
"""

import sys
import argparse
from pathlib import Path

from .config.settings import AgentConfig, ConfigurationError
from .search.tavily_client import TavilyClient
from .processing.workflow import SecurityNewsWorkflow
from .output.renderer import ReportRenderer
from .utils.logging_config import setup_logging, ProgressLogger
from .utils.error_handling import SecurityNewsAgentError, handle_errors
from .processing.mock_clients import MockTavilyClient, MockChatGoogleGenerativeAI


def create_argument_parser() -> argparse.ArgumentParser:
    """Create command line argument parser."""
    parser = argparse.ArgumentParser(
        description="Security News Agent - AI-powered security news collection and reporting",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m security_news_agent                    # Run with default settings
  python -m security_news_agent --topic "Weekly Security Review"
  python -m security_news_agent --test-mode        # Run in test mode with limited API calls
  python -m security_news_agent --log-level DEBUG # Enable debug logging
  python -m security_news_agent --output-dir ./reports
        """
    )
    
    parser.add_argument(
        "--topic",
        default="Daily Cybersecurity Threat Briefing",
        help="Topic for the security briefing (default: %(default)s)"
    )
    
    parser.add_argument(
        "--test-mode",
        action="store_true",
        help="Run in test mode with limited API calls"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level (default: %(default)s)"
    )
    
    parser.add_argument(
        "--log-file",
        help="Optional log file path"
    )
    
    parser.add_argument(
        "--output-dir",
        default="slides",
        help="Output directory for generated reports (default: %(default)s)"
    )
    
    parser.add_argument(
        "--config-file",
        help="Path to custom .env configuration file"
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate configuration and prerequisites, don't run workflow"
    )
    
    parser.add_argument(
        "--version",
        action="version",
        version="Security News Agent 0.2.0"
    )
    
    return parser


@handle_errors(reraise=True)
def load_configuration(config_file: str = None, test_mode: bool = False) -> AgentConfig:
    """Load and validate configuration."""
    try:
        config = AgentConfig.from_env(config_file, test_mode=test_mode)
        config.setup_environment()
        return config
    except ConfigurationError as e:
        print(f"❌ Configuration Error: {e}")
        print("\nPlease ensure the following environment variables are set:")
        print("  - GOOGLE_API_KEY")
        print("  - LANGCHAIN_API_KEY")
        print("  - TAVILY_API_KEY")
        print("\nYou can set these in a .env file or as environment variables.")
        sys.exit(1)


def validate_prerequisites(config: AgentConfig, tavily_client: TavilyClient, workflow: SecurityNewsWorkflow) -> bool:
    """Validate all prerequisites for running the workflow."""
    print("🔍 Validating prerequisites...")
    
    # Validate configuration
    try:
        config.validate()
        print("✅ Configuration valid")
    except ConfigurationError as e:
        print(f"❌ Configuration invalid: {e}")
        return False
    
    # Validate workflow prerequisites
    if not workflow.validate_prerequisites():
        print("❌ Workflow prerequisites not met")
        return False
    
    print("✅ All prerequisites validated")
    return True


def print_workflow_summary(workflow: SecurityNewsWorkflow, config: AgentConfig, output_dir: str):
    """Print summary of workflow configuration."""
    summary = workflow.get_workflow_summary()
    
    print("\n📋 Workflow Configuration:")
    print(f"  Model: {summary['model']}")
    print(f"  Max Attempts: {summary['max_attempts']}")
    print(f"  Output Format: {config.slide_format or 'Markdown only'}")
    print(f"  Output Directory: {output_dir}")
    print(f"  Search Queries: {summary['search_queries_count']}")
    print(f"  Workflow Nodes: {len(summary['nodes'])}")


def run_workflow(
    config: AgentConfig,
    tavily_client: TavilyClient,
    workflow: SecurityNewsWorkflow,
    renderer: ReportRenderer,
    topic: str,
    test_mode: bool = False
) -> bool:
    """Run the complete security news workflow."""
    
    # Create progress logger
    logger = setup_logging(level="INFO")
    progress = ProgressLogger(logger, "Security News Generation", 6)
    
    try:
        # Step 1: Create initial state
        progress.step("Creating initial workflow state")
        initial_state = workflow.create_initial_state(topic)
        
        if test_mode:
            print("🧪 Running in test mode - using limited API calls")
            # Override search queries for test mode
            original_queries = config.get_search_queries
            def get_test_queries():
                return [
                    {
                        "q": "cybersecurity news",
                        "include_domains": ["thehackernews.com"],
                        "time_range": "week"
                    }
                ]
            config.get_search_queries = get_test_queries
        
        # Step 2: Execute workflow
        progress.step("Executing security news workflow")
        result = workflow.run(initial_state)
        
        # Step 3: Check for errors
        progress.step("Checking workflow results")
        if result.get("error"):
            print(f"❌ Workflow failed: {result['error']}")
            progress.complete(success=False)
            return False
        
        # Step 4: Validate output
        progress.step("Validating generated content")
        if not result.get("slide_md"):
            print("❌ No content was generated")
            progress.complete(success=False)
            return False
        
        # Validate markdown content
        validation = renderer.validate_markdown_content(result["slide_md"])
        if not validation["valid"]:
            print(f"❌ Generated content validation failed: {validation['errors']}")
            progress.complete(success=False)
            return False
        
        if validation["warnings"]:
            print("⚠️ Content validation warnings:")
            for warning in validation["warnings"]:
                print(f"  - {warning}")
        
        # Step 5: Save and render output
        progress.step("Saving and rendering report")
        render_result = renderer.save_and_render(
            result["slide_md"],
            result.get("title", "Security News Report")
        )
        
        if not render_result["success"]:
            print(f"❌ Failed to save report: {render_result.get('error', 'Unknown error')}")
            progress.complete(success=False)
            return False
        
        # Step 6: Display results
        progress.step("Finalizing results")
        print("\n🎉 Security news report generated successfully!")
        print(f"📄 Markdown: {render_result['markdown_path']}")
        
        if render_result["rendered_path"]:
            print(f"📊 Rendered: {render_result['rendered_path']}")
        
        # Display workflow statistics
        print(f"\n📊 Workflow Statistics:")
        print(f"  Score: {result.get('score', 'N/A')}")
        print(f"  Passed: {result.get('passed', 'N/A')}")
        print(f"  Attempts: {result.get('attempts', 'N/A')}")
        
        if result.get("log"):
            print(f"  Log entries: {len(result['log'])}")
        
        progress.complete(success=True)
        return True
        
    except SecurityNewsAgentError as e:
        print(f"❌ Security News Agent Error: {e.message}")
        if e.details:
            print(f"   Details: {e.details}")
        progress.complete(success=False)
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        progress.complete(success=False)
        return False


def main():
    """Main entry point."""
    parser = create_argument_parser()
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging(
        level=args.log_level,
        log_file=args.log_file,
        enable_console=True
    )
    
    print("🔐 Security News Agent v0.2.0")
    print("=" * 50)
    
    try:
        # Load configuration
        print("⚙️ Loading configuration...")
        config = load_configuration(args.config_file, test_mode=args.test_mode)
        
        # Create components
        print("🔧 Initializing components...")
        if args.test_mode and "mock" in config.google_api_key:
            print("🧪 Using MOCK clients for test mode")
            tavily_client = MockTavilyClient(api_key=config.tavily_api_key)
            llm_client = MockChatGoogleGenerativeAI(model=config.gemini_model_name)
            workflow = SecurityNewsWorkflow(config, tavily_client, llm_client=llm_client)
        else:
            tavily_client = TavilyClient(config.tavily_api_key)
            workflow = SecurityNewsWorkflow(config, tavily_client)

        renderer = ReportRenderer(config, args.output_dir)
        
        # Validate prerequisites
        if not validate_prerequisites(config, tavily_client, workflow):
            sys.exit(1)
        
        # Print workflow summary
        print_workflow_summary(workflow, config, args.output_dir)
        
        # If validate-only mode, exit here
        if args.validate_only:
            print("\n✅ Validation complete - all systems ready")
            sys.exit(0)
        
        # Run workflow
        print(f"\n🚀 Starting workflow with topic: '{args.topic}'")
        success = run_workflow(
            config=config,
            tavily_client=tavily_client,
            workflow=workflow,
            renderer=renderer,
            topic=args.topic,
            test_mode=args.test_mode
        )
        
        if success:
            print("\n✅ Security news agent completed successfully!")
            sys.exit(0)
        else:
            print("\n❌ Security news agent failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}", exc_info=True)
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
