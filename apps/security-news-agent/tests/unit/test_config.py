"""Unit tests for configuration management."""

import os
import pytest
from unittest.mock import patch, mock_open
from security_news_agent.config.settings import AgentConfig, ConfigurationError


class TestAgentConfig:
    """Test cases for AgentConfig class."""
    
    def test_from_env_success(self):
        """Test successful configuration loading from environment."""
        env_vars = {
            "GOOGLE_API_KEY": "test-google-key",
            "LANGCHAIN_API_KEY": "test-langchain-key",
            "TAVILY_API_KEY": "test-tavily-key",
            "GEMINI_MODEL_NAME": "gemini-1.5-pro",
            "SLIDE_FORMAT": "html",
            "MARP_THEME": "gaia",
            "MARP_PAGINATE": "false",
            "LANGCHAIN_TRACING_V2": "false",
            "LANGCHAIN_PROJECT": "test-project"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = AgentConfig.from_env()
            
        assert config.google_api_key == "test-google-key"
        assert config.langchain_api_key == "test-langchain-key"
        assert config.tavily_api_key == "test-tavily-key"
        assert config.gemini_model_name == "gemini-1.5-pro"
        assert config.slide_format == "html"
        assert config.marp_theme == "gaia"
        assert config.marp_paginate is False
        assert config.langchain_tracing_v2 is False
        assert config.langchain_project == "test-project"
    
    def test_from_env_with_defaults(self):
        """Test configuration loading with default values."""
        env_vars = {
            "GOOGLE_API_KEY": "test-google-key",
            "LANGCHAIN_API_KEY": "test-langchain-key", 
            "TAVILY_API_KEY": "test-tavily-key"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = AgentConfig.from_env()
            
        assert config.gemini_model_name == "gemini-1.5-flash-latest"
        assert config.slide_format == "pdf"
        assert config.marp_theme == "default"
        assert config.marp_paginate is True
        assert config.langchain_tracing_v2 is True
        assert config.langchain_endpoint == "https://api.smith.langchain.com"
        assert config.langchain_project == "security-news-agent"
    
    def test_from_env_missing_google_key(self):
        """Test error when GOOGLE_API_KEY is missing."""
        env_vars = {
            "LANGCHAIN_API_KEY": "test-langchain-key",
            "TAVILY_API_KEY": "test-tavily-key"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                AgentConfig.from_env()
            
        assert "GOOGLE_API_KEY" in str(exc_info.value)
    
    def test_from_env_missing_langchain_key(self):
        """Test error when LANGCHAIN_API_KEY is missing."""
        env_vars = {
            "GOOGLE_API_KEY": "test-google-key",
            "TAVILY_API_KEY": "test-tavily-key"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                AgentConfig.from_env()
            
        assert "LANGCHAIN_API_KEY" in str(exc_info.value)
    
    def test_from_env_missing_tavily_key(self):
        """Test error when TAVILY_API_KEY is missing."""
        env_vars = {
            "GOOGLE_API_KEY": "test-google-key",
            "LANGCHAIN_API_KEY": "test-langchain-key"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                AgentConfig.from_env()
            
        assert "TAVILY_API_KEY" in str(exc_info.value)
    
    def test_from_env_missing_multiple_keys(self):
        """Test error message when multiple keys are missing."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ConfigurationError) as exc_info:
                AgentConfig.from_env()
            
        error_msg = str(exc_info.value)
        assert "GOOGLE_API_KEY" in error_msg
        assert "LANGCHAIN_API_KEY" in error_msg
        assert "TAVILY_API_KEY" in error_msg
    
    def test_validate_success(self, mock_config):
        """Test successful validation."""
        # Should not raise any exception
        mock_config.validate()
    
    def test_validate_invalid_slide_format(self, mock_config):
        """Test validation error for invalid slide format."""
        mock_config.slide_format = "invalid"
        
        with pytest.raises(ConfigurationError) as exc_info:
            mock_config.validate()
            
        assert "Invalid SLIDE_FORMAT" in str(exc_info.value)
    
    def test_validate_empty_model_name(self, mock_config):
        """Test validation error for empty model name."""
        mock_config.gemini_model_name = ""
        
        with pytest.raises(ConfigurationError) as exc_info:
            mock_config.validate()
            
        assert "GEMINI_MODEL_NAME cannot be empty" in str(exc_info.value)
    
    def test_validate_empty_theme(self, mock_config):
        """Test validation error for empty theme."""
        mock_config.marp_theme = ""
        
        with pytest.raises(ConfigurationError) as exc_info:
            mock_config.validate()
            
        assert "MARP_THEME cannot be empty" in str(exc_info.value)
    
    def test_validate_invalid_endpoint(self, mock_config):
        """Test validation error for invalid endpoint URL."""
        mock_config.langchain_endpoint = "invalid-url"
        
        with pytest.raises(ConfigurationError) as exc_info:
            mock_config.validate()
            
        assert "Invalid LANGCHAIN_ENDPOINT" in str(exc_info.value)
    
    def test_setup_environment(self, mock_config):
        """Test environment variable setup."""
        with patch.dict(os.environ, {}, clear=True):
            mock_config.setup_environment()
            
            assert os.environ["LANGCHAIN_TRACING_V2"] == "true"
            assert os.environ["LANGCHAIN_ENDPOINT"] == mock_config.langchain_endpoint
            assert os.environ["LANGCHAIN_API_KEY"] == mock_config.langchain_api_key
            assert os.environ["LANGCHAIN_PROJECT"] == mock_config.langchain_project
            assert os.environ["GOOGLE_API_KEY"] == mock_config.google_api_key
            assert os.environ["TAVILY_API_KEY"] == mock_config.tavily_api_key
    
    def test_get_search_queries(self, mock_config):
        """Test search queries configuration."""
        queries = mock_config.get_search_queries()
        
        assert len(queries) == 5
        assert all("q" in query for query in queries)
        assert all("include_domains" in query for query in queries)
        
        # Check specific queries
        query_texts = [q["q"] for q in queries]
        assert "latest cybersecurity news" in query_texts
        assert "latest vulnerability reports" in query_texts
        assert "data breach notifications" in query_texts
        assert "malware trends" in query_texts
        assert "zero-day exploits" in query_texts
    
    def test_slide_format_normalization(self):
        """Test that slide format is normalized to lowercase."""
        env_vars = {
            "GOOGLE_API_KEY": "test-google-key",
            "LANGCHAIN_API_KEY": "test-langchain-key",
            "TAVILY_API_KEY": "test-tavily-key",
            "SLIDE_FORMAT": "  PDF  "  # Test with whitespace and uppercase
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = AgentConfig.from_env()
            
        assert config.slide_format == "pdf"
    
    def test_boolean_parsing(self):
        """Test boolean environment variable parsing."""
        test_cases = [
            ("true", True),
            ("True", True), 
            ("TRUE", True),
            ("false", False),
            ("False", False),
            ("FALSE", False),
            ("", False),
            ("invalid", False)
        ]
        
        for env_value, expected in test_cases:
            env_vars = {
                "GOOGLE_API_KEY": "test-google-key",
                "LANGCHAIN_API_KEY": "test-langchain-key",
                "TAVILY_API_KEY": "test-tavily-key",
                "MARP_PAGINATE": env_value
            }
            
            with patch.dict(os.environ, env_vars, clear=True):
                config = AgentConfig.from_env()
                
            assert config.marp_paginate == expected, f"Failed for input '{env_value}'"

    @patch('security_news_agent.config.settings.load_dotenv')
    def test_from_env_with_file(self, mock_load_dotenv):
        """Test loading from a specified .env file."""
        env_vars = {
            "GOOGLE_API_KEY": "file-key",
            "LANGCHAIN_API_KEY": "file-key",
            "TAVILY_API_KEY": "file-key"
        }
        with patch.dict(os.environ, env_vars, clear=True):
            config = AgentConfig.from_env(env_file="mock.env")
            mock_load_dotenv.assert_called_once_with("mock.env")
            assert config.google_api_key == "file-key"

    def test_from_env_missing_key_no_test_mode(self):
        """Test that missing keys raise error when not in test mode."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ConfigurationError):
                AgentConfig.from_env(test_mode=False)

    def test_from_env_test_mode_no_keys(self):
        """Test that mock keys are used in test mode when no keys are provided."""
        with patch.dict(os.environ, {}, clear=True):
            config = AgentConfig.from_env(test_mode=True)

        assert config.google_api_key == "mock_google_api_key"
        assert config.langchain_api_key == "mock_langchain_api_key"
        assert config.tavily_api_key == "mock_tavily_api_key"

    def test_from_env_test_mode_with_real_keys(self):
        """Test that real keys are used in test mode when they are provided."""
        env_vars = {
            "GOOGLE_API_KEY": "real-google-key",
            "LANGCHAIN_API_KEY": "real-langchain-key",
            "TAVILY_API_KEY": "real-tavily-key",
        }
        with patch.dict(os.environ, env_vars, clear=True):
            config = AgentConfig.from_env(test_mode=True)

        assert config.google_api_key == "real-google-key"
        assert config.langchain_api_key == "real-langchain-key"
        assert config.tavily_api_key == "real-tavily-key"