"""Configuration management for the security news agent."""

import os
from dataclasses import dataclass
from typing import Optional, List
from dotenv import load_dotenv


class ConfigurationError(Exception):
    """Raised when configuration is invalid or missing."""
    pass


@dataclass
class AgentConfig:
    """Configuration settings for the security news agent."""
    
    google_api_key: str
    langchain_api_key: str
    tavily_api_key: str
    gemini_model_name: str = "gemini-1.5-flash-latest"
    slide_format: str = "pdf"
    marp_theme: str = "default"
    marp_paginate: bool = True
    langchain_tracing_v2: bool = True
    langchain_endpoint: str = "https://api.smith.langchain.com"
    langchain_project: str = "security-news-agent"
    
    @classmethod
    def from_env(cls, env_file: Optional[str] = None) -> 'AgentConfig':
        """Load configuration from environment variables.
        
        Args:
            env_file: Optional path to .env file to load
            
        Returns:
            AgentConfig instance
            
        Raises:
            ConfigurationError: If required environment variables are missing
        """
        if env_file:
            load_dotenv(env_file)
        else:
            load_dotenv()
        
        # Required API keys
        google_api_key = os.getenv("GOOGLE_API_KEY")
        langchain_api_key = os.getenv("LANGCHAIN_API_KEY") 
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        
        # Check for missing required keys
        missing_keys = []
        if not google_api_key:
            missing_keys.append("GOOGLE_API_KEY")
        if not langchain_api_key:
            missing_keys.append("LANGCHAIN_API_KEY")
        if not tavily_api_key:
            missing_keys.append("TAVILY_API_KEY")
            
        if missing_keys:
            raise ConfigurationError(
                f"Missing required environment variables: {', '.join(missing_keys)}. "
                f"Please set these in your .env file or environment."
            )
        
        # Optional settings with defaults
        gemini_model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash-latest")
        slide_format = os.getenv("SLIDE_FORMAT", "pdf").lower().strip()
        marp_theme = os.getenv("MARP_THEME", "default")
        marp_paginate = os.getenv("MARP_PAGINATE", "true").lower() == "true"
        langchain_tracing_v2 = os.getenv("LANGCHAIN_TRACING_V2", "true").lower() == "true"
        langchain_endpoint = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
        langchain_project = os.getenv("LANGCHAIN_PROJECT", "security-news-agent")
        
        config = cls(
            google_api_key=google_api_key,
            langchain_api_key=langchain_api_key,
            tavily_api_key=tavily_api_key,
            gemini_model_name=gemini_model_name,
            slide_format=slide_format,
            marp_theme=marp_theme,
            marp_paginate=marp_paginate,
            langchain_tracing_v2=langchain_tracing_v2,
            langchain_endpoint=langchain_endpoint,
            langchain_project=langchain_project
        )
        
        config.validate()
        return config
    
    def validate(self) -> None:
        """Validate configuration values.
        
        Raises:
            ConfigurationError: If configuration values are invalid
        """
        # Validate slide format
        valid_formats = {"pdf", "png", "html", ""}
        if self.slide_format not in valid_formats:
            raise ConfigurationError(
                f"Invalid SLIDE_FORMAT '{self.slide_format}'. "
                f"Must be one of: {', '.join(valid_formats)}"
            )
        
        # Validate model name
        if not self.gemini_model_name.strip():
            raise ConfigurationError("GEMINI_MODEL_NAME cannot be empty")
        
        # Validate theme
        if not self.marp_theme.strip():
            raise ConfigurationError("MARP_THEME cannot be empty")
        
        # Validate endpoint URL
        if not self.langchain_endpoint.startswith(("http://", "https://")):
            raise ConfigurationError(
                f"Invalid LANGCHAIN_ENDPOINT '{self.langchain_endpoint}'. "
                f"Must be a valid HTTP/HTTPS URL"
            )
    
    def setup_environment(self) -> None:
        """Set up environment variables for LangChain and other services."""
        os.environ["LANGCHAIN_TRACING_V2"] = str(self.langchain_tracing_v2).lower()
        os.environ["LANGCHAIN_ENDPOINT"] = self.langchain_endpoint
        os.environ["LANGCHAIN_API_KEY"] = self.langchain_api_key
        os.environ["LANGCHAIN_PROJECT"] = self.langchain_project
        os.environ["GOOGLE_API_KEY"] = self.google_api_key
        os.environ["TAVILY_API_KEY"] = self.tavily_api_key
    
    def get_search_queries(self) -> List[dict]:
        """Get default search queries for security news collection.
        
        Returns:
            List of search query configurations
        """
        return [
            {
                "q": "latest cybersecurity news",
                "include_domains": ["thehackernews.com", "bleepingcomputer.com"]
            },
            {
                "q": "latest vulnerability reports", 
                "include_domains": ["krebsonsecurity.com", "darkreading.com"]
            },
            {
                "q": "data breach notifications",
                "include_domains": ["securityweek.com", "infosecurity-magazine.com"]
            },
            {
                "q": "malware trends",
                "include_domains": [
                    "crowdstrike.com/blog",
                    "paloaltonetworks.com/blog", 
                    "mandiant.com/resources/blog"
                ]
            },
            {
                "q": "zero-day exploits",
                "include_domains": ["zerodayinitiative.com/blog", "threatpost.com"]
            }
        ]