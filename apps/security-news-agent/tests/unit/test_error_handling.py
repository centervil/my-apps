import pytest
import logging
from datetime import datetime
from security_news_agent.utils.error_handling import (
    SecurityNewsAgentError,
    ConfigurationError,
    APIError,
    RateLimitError,
    ProcessingError,
    OutputError,
    ErrorCollector,
    handle_errors,
    convert_exception,
)

class TestCustomExceptions:
    """Test cases for custom exception classes."""

    def test_security_news_agent_error(self):
        """Test the base exception."""
        err = SecurityNewsAgentError("Base error", details={"key": "value"})
        assert err.message == "Base error"
        assert err.details == {"key": "value"}
        assert isinstance(err.timestamp, datetime)
        err_dict = err.to_dict()
        assert err_dict["error_type"] == "SecurityNewsAgentError"
        assert err_dict["message"] == "Base error"

    def test_configuration_error(self):
        """Test the configuration exception."""
        err = ConfigurationError("Config failed")
        assert isinstance(err, SecurityNewsAgentError)
        assert err.message == "Config failed"

    def test_api_error(self):
        """Test the API exception."""
        err = APIError("API failed", service="TestService", status_code=500, extra="info")
        assert err.service == "TestService"
        assert err.status_code == 500
        assert err.details["extra"] == "info"
        assert err.details["service"] == "TestService"

    def test_rate_limit_error(self):
        """Test the rate limit exception."""
        err = RateLimitError("TestService", retry_after=60)
        assert err.service == "TestService"
        assert err.status_code == 429
        assert err.retry_after == 60
        assert "retry after 60s" in err.message

    def test_processing_error(self):
        """Test the processing exception."""
        err = ProcessingError("Processing failed", stage="parsing", file="test.txt")
        assert err.stage == "parsing"
        assert err.details["file"] == "test.txt"

    def test_output_error(self):
        """Test the output exception."""
        err = OutputError("Output failed", output_type="pdf", renderer="marp")
        assert err.output_type == "pdf"
        assert err.details["renderer"] == "marp"


class TestErrorCollector:
    """Test cases for the ErrorCollector class."""

    def test_add_and_has_errors(self):
        """Test adding and checking for errors."""
        collector = ErrorCollector()
        assert not collector.has_errors()
        collector.add_error(ValueError("Test error"), context="testing")
        assert collector.has_errors()
        assert collector.errors[0]["message"] == "Test error"
        assert collector.errors[0]["context"] == "testing"

    def test_add_and_has_warnings(self):
        """Test adding and checking for warnings."""
        collector = ErrorCollector()
        assert not collector.has_warnings()
        collector.add_warning("Test warning", context="testing")
        assert collector.has_warnings()
        assert collector.warnings[0]["message"] == "Test warning"

    def test_get_summary(self):
        """Test getting a summary of errors and warnings."""
        collector = ErrorCollector()
        collector.add_error(TypeError("Type issue"), context="c1")
        collector.add_warning("Warning message", context="c2")
        summary = collector.get_summary()
        assert summary["error_count"] == 1
        assert summary["warning_count"] == 1
        assert summary["errors"][0]["type"] == "TypeError"
        assert summary["warnings"][0]["message"] == "Warning message"

    def test_raise_if_errors(self):
        """Test that raise_if_errors raises an exception when errors exist."""
        collector = ErrorCollector()
        collector.add_error(ValueError("An error occurred"))
        with pytest.raises(ProcessingError) as exc_info:
            collector.raise_if_errors("Operation failed")
        assert "Operation failed" in str(exc_info.value)
        assert "summary" in exc_info.value.details

    def test_raise_if_errors_no_errors(self):
        """Test that raise_if_errors does nothing when there are no errors."""
        collector = ErrorCollector()
        try:
            collector.raise_if_errors()
        except ProcessingError:
            pytest.fail("raise_if_errors should not have raised an exception.")

class TestHandleErrorsDecorator:
    """Test cases for the @handle_errors decorator."""

    def test_handle_errors_success(self):
        """Test decorator with a successful function call."""
        @handle_errors()
        def success_func():
            return "success"
        assert success_func() == "success"

    def test_handle_errors_reraises_by_default(self):
        """Test that the decorator reraises exceptions by default."""
        @handle_errors()
        def fail_func():
            raise ValueError("Failure")
        with pytest.raises(ValueError):
            fail_func()

    def test_handle_errors_no_reraise(self):
        """Test decorator with reraise=False."""
        @handle_errors(reraise=False, default_return="error_occurred")
        def fail_func():
            raise ValueError("Failure")
        assert fail_func() == "error_occurred"

    def test_handle_errors_logs_exception(self, caplog):
        """Test that the decorator logs the exception."""
        @handle_errors(reraise=False)
        def fail_func():
            raise SecurityNewsAgentError("Custom error")

        with caplog.at_level(logging.ERROR):
            fail_func()

        assert "Custom error" in caplog.text
        assert "Security News Agent error in fail_func" in caplog.text


class TestConvertException:
    """Test cases for the convert_exception function."""

    def test_convert_exception(self):
        """Test basic exception conversion."""
        original_exc = ValueError("Original error")
        new_exc = convert_exception(original_exc, ProcessingError, stage="conversion")

        assert isinstance(new_exc, ProcessingError)
        assert new_exc.message == "Original error"
        assert new_exc.details["original_exception"] == "ValueError"
        assert new_exc.details["stage"] == "conversion"

    def test_convert_exception_with_custom_message(self):
        """Test exception conversion with a custom message."""
        original_exc = ValueError("Original error")
        new_exc = convert_exception(original_exc, APIError, message="New message", service="Test")

        assert isinstance(new_exc, APIError)
        assert new_exc.message == "New message"
        assert new_exc.details["original_message"] == "Original error"
        assert new_exc.details["service"] == "Test"
