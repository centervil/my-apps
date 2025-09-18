"""Error handling utilities for the security news agent."""

import logging
import traceback
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Optional, Type

logger = logging.getLogger(__name__)


class SecurityNewsAgentError(Exception):
    """Base exception for security news agent errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        """Initialize the error.

        Args:
            message: Error message
            details: Optional additional error details
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary representation."""
        return {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }


class ConfigurationError(SecurityNewsAgentError):
    """Raised when configuration is invalid or missing."""

    pass


class APIError(SecurityNewsAgentError):
    """Base class for API-related errors."""

    def __init__(
        self,
        message: str,
        service: str,
        status_code: Optional[int] = None,
        **kwargs,
    ):
        """Initialize API error.

        Args:
            message: Error message
            service: Name of the API service
            status_code: HTTP status code if applicable
            **kwargs: Additional error details
        """
        details = {"service": service, **kwargs}
        if status_code:
            details["status_code"] = status_code

        super().__init__(message, details)
        self.service = service
        self.status_code = status_code


class RateLimitError(APIError):
    """Raised when API rate limits are exceeded."""

    def __init__(
        self, service: str, retry_after: Optional[int] = None, **kwargs
    ):
        """Initialize rate limit error.

        Args:
            service: Name of the API service
            retry_after: Seconds to wait before retrying
            **kwargs: Additional error details
        """
        message = f"{service} API rate limit exceeded"
        if retry_after:
            message += f" (retry after {retry_after}s)"

        details = kwargs
        if retry_after:
            details["retry_after"] = retry_after

        super().__init__(message, service, status_code=429, **details)
        self.retry_after = retry_after


class ProcessingError(SecurityNewsAgentError):
    """Raised when content processing fails."""

    def __init__(self, message: str, stage: str, **kwargs):
        """Initialize processing error.

        Args:
            message: Error message
            stage: Processing stage where error occurred
            **kwargs: Additional error details
        """
        details = {"stage": stage, **kwargs}
        super().__init__(message, details)
        self.stage = stage


class OutputError(SecurityNewsAgentError):
    """Raised when output generation fails."""

    def __init__(self, message: str, output_type: str, **kwargs):
        """Initialize output error.

        Args:
            message: Error message
            output_type: Type of output being generated
            **kwargs: Additional error details
        """
        details = {"output_type": output_type, **kwargs}
        super().__init__(message, details)
        self.output_type = output_type


def handle_errors(
    default_return: Any = None,
    reraise: bool = True,
    log_level: int = logging.ERROR,
):
    """Decorator for comprehensive error handling.

    Args:
        default_return: Value to return if error occurs and reraise=False
        reraise: Whether to reraise the exception after logging
        log_level: Logging level for error messages

    Returns:
        Decorator function
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except SecurityNewsAgentError as e:
                # Log our custom errors with structured information
                logger.log(
                    log_level,
                    f"Security News Agent error in {func.__name__}: {e.message}",
                    extra={
                        "error_details": e.details,
                        "function": func.__name__,
                    },
                )
                if reraise:
                    raise
                return default_return
            except Exception as e:
                # Log unexpected errors with full traceback
                logger.log(
                    log_level,
                    f"Unexpected error in {func.__name__}: {e}",
                    exc_info=True,
                    extra={"function": func.__name__},
                )
                if reraise:
                    raise
                return default_return

        return wrapper

    return decorator


def safe_execute(
    func: Callable,
    *args,
    default_return: Any = None,
    error_message: str = None,
    **kwargs,
) -> Any:
    """Safely execute a function with error handling.

    Args:
        func: Function to execute
        *args: Function arguments
        default_return: Value to return on error
        error_message: Custom error message
        **kwargs: Function keyword arguments

    Returns:
        Function result or default_return on error
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        message = error_message or f"Error executing {func.__name__}: {e}"
        logger.error(message, exc_info=True)
        return default_return


def create_error_context(operation: str) -> Dict[str, Any]:
    """Create error context information.

    Args:
        operation: Name of the operation

    Returns:
        Dictionary with error context
    """
    return {
        "operation": operation,
        "timestamp": datetime.now().isoformat(),
        "traceback": traceback.format_stack(),
    }


def log_and_reraise(
    exception: Exception,
    message: str = None,
    context: Dict[str, Any] = None,
    level: int = logging.ERROR,
):
    """Log an exception and reraise it.

    Args:
        exception: Exception to log and reraise
        message: Custom log message
        context: Additional context information
        level: Logging level
    """
    log_message = message or f"Exception occurred: {exception}"

    extra = {"exception_type": type(exception).__name__}
    if context:
        extra.update(context)

    logger.log(level, log_message, exc_info=True, extra=extra)
    raise exception


def convert_exception(
    exception: Exception,
    target_type: Type[SecurityNewsAgentError],
    message: str = None,
    **details,
) -> SecurityNewsAgentError:
    """Convert a generic exception to a specific SecurityNewsAgentError.

    Args:
        exception: Original exception
        target_type: Target exception type
        message: Custom message (uses original if not provided)
        **details: Additional error details

    Returns:
        Converted exception
    """
    error_message = message or str(exception)

    # Add original exception info to the details that will be passed as kwargs
    details["original_exception"] = type(exception).__name__
    details["original_message"] = str(exception)

    # The target constructors (e.g. ProcessingError) expect details as kwargs
    return target_type(error_message, **details)


class ErrorCollector:
    """Collect and manage multiple errors during processing."""

    def __init__(self):
        """Initialize error collector."""
        self.errors = []
        self.warnings = []

    def add_error(self, error: Exception, context: str = None):
        """Add an error to the collection.

        Args:
            error: Exception to add
            context: Optional context information
        """
        error_info = {
            "exception": error,
            "type": type(error).__name__,
            "message": str(error),
            "context": context,
            "timestamp": datetime.now(),
        }
        self.errors.append(error_info)

        logger.error(
            f"Error collected: {error}",
            extra={"context": context, "error_type": type(error).__name__},
        )

    def add_warning(self, message: str, context: str = None):
        """Add a warning to the collection.

        Args:
            message: Warning message
            context: Optional context information
        """
        warning_info = {
            "message": message,
            "context": context,
            "timestamp": datetime.now(),
        }
        self.warnings.append(warning_info)

        logger.warning(
            f"Warning collected: {message}", extra={"context": context}
        )

    def has_errors(self) -> bool:
        """Check if any errors were collected."""
        return len(self.errors) > 0

    def has_warnings(self) -> bool:
        """Check if any warnings were collected."""
        return len(self.warnings) > 0

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of collected errors and warnings."""
        return {
            "error_count": len(self.errors),
            "warning_count": len(self.warnings),
            "errors": [
                {
                    "type": err["type"],
                    "message": err["message"],
                    "context": err["context"],
                    "timestamp": err["timestamp"].isoformat(),
                }
                for err in self.errors
            ],
            "warnings": [
                {
                    "message": warn["message"],
                    "context": warn["context"],
                    "timestamp": warn["timestamp"].isoformat(),
                }
                for warn in self.warnings
            ],
        }

    def raise_if_errors(self, message: str = None):
        """Raise an exception if any errors were collected.

        Args:
            message: Custom error message

        Raises:
            ProcessingError: If errors were collected
        """
        if self.has_errors():
            error_message = (
                message or f"Processing failed with {len(self.errors)} errors"
            )
            raise ProcessingError(
                error_message, "error_collection", summary=self.get_summary()
            )


def log_api_call(logger_instance, service: str):
    """Decorator for logging API calls.

    Args:
        logger_instance: Logger instance to use
        service: Name of the API service

    Returns:
        Decorator function
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time

            start_time = time.time()
            method = kwargs.get("method", "GET")
            endpoint = func.__name__

            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time

                logger_instance.info(
                    f"API call successful: {service} {method} {endpoint} ({duration:.2f}s)",
                    extra={
                        "service": service,
                        "endpoint": endpoint,
                        "method": method,
                        "duration": duration,
                        "success": True,
                    },
                )
                return result

            except Exception as e:
                duration = time.time() - start_time

                logger_instance.error(
                    f"API call failed: {service} {method} {endpoint} - {e} ({duration:.2f}s)",
                    extra={
                        "service": service,
                        "endpoint": endpoint,
                        "method": method,
                        "duration": duration,
                        "error": str(e),
                        "success": False,
                    },
                )
                raise

        return wrapper

    return decorator


def log_api_call_simple(
    service: str,
    endpoint: str,
    method: str = "GET",
    status_code: Optional[int] = None,
    duration: Optional[float] = None,
    error: Optional[str] = None,
):
    """Log API call information (simple function version).

    Args:
        service: Name of the API service
        endpoint: API endpoint called
        method: HTTP method used
        status_code: HTTP status code received
        duration: Request duration in seconds
        error: Error message if call failed
    """
    log_data = {
        "service": service,
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "duration": duration,
        "error": error,
    }

    if error:
        logger.error(
            f"API call failed: {service} {method} {endpoint} - {error}",
            extra=log_data,
        )
    elif status_code and status_code >= 400:
        logger.warning(
            f"API call returned error: {service} {method} {endpoint} - {status_code}",
            extra=log_data,
        )
    else:
        duration_str = f" ({duration:.2f}s)" if duration else ""
        logger.info(
            f"API call successful: {service} {method} {endpoint}{duration_str}",
            extra=log_data,
        )


def retry_with_backoff(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
):
    """Decorator for retrying functions with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        base_delay: Base delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        backoff_factor: Factor to multiply delay by after each attempt
        exceptions: Tuple of exceptions to retry on

    Returns:
        Decorator function
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            import random
            import time

            last_exception = None
            delay = base_delay

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_attempts - 1:
                        # Last attempt, don't wait
                        break

                    # Add jitter to prevent thundering herd
                    jitter = random.uniform(0.1, 0.3) * delay
                    sleep_time = min(delay + jitter, max_delay)

                    logger.warning(
                        f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {e}. "
                        f"Retrying in {sleep_time:.2f}s"
                    )

                    time.sleep(sleep_time)
                    delay *= backoff_factor

            # All attempts failed
            logger.error(
                f"All {max_attempts} attempts failed for {func.__name__}"
            )
            raise last_exception

        return wrapper

    return decorator
