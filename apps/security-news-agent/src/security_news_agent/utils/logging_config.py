"""Logging configuration for the security news agent."""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Optional, Type, TypeVar

from typing_extensions import Self

F = TypeVar("F", bound=Callable[..., Any])


def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    log_dir: str = "logs",
    enable_console: bool = True,
    format_style: str = "detailed",
) -> logging.Logger:
    """Set up logging configuration for the application.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file name (will be created in log_dir)
        log_dir: Directory for log files
        enable_console: Whether to enable console logging
        format_style: Format style ("simple", "detailed", "json")

    Returns:
        Configured logger instance
    """

    # Convert string level to logging constant
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    # Create logger
    logger = logging.getLogger("security_news_agent")
    logger.setLevel(numeric_level)

    # Clear existing handlers
    logger.handlers.clear()

    # Define formatters
    formatters = {
        "simple": logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s", datefmt="%H:%M:%S"
        ),
        "detailed": logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ),
        "json": JsonFormatter(),
    }

    formatter = formatters.get(format_style, formatters["detailed"])

    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(numeric_level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    # File handler
    if log_file:
        log_path = Path(log_dir)
        log_path.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(
            log_path / log_file, encoding="utf-8"
        )
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    # Set up third-party library logging levels
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    return logger


class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        import json

        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in {
                "name",
                "msg",
                "args",
                "levelname",
                "levelno",
                "pathname",
                "filename",
                "module",
                "lineno",
                "funcName",
                "created",
                "msecs",
                "relativeCreated",
                "thread",
                "threadName",
                "processName",
                "process",
                "getMessage",
                "exc_info",
                "exc_text",
                "stack_info",
            }:
                log_entry[key] = value

        return json.dumps(log_entry, ensure_ascii=False)


class ProgressLogger:
    """Logger for tracking progress of long-running operations."""

    def __init__(
        self, logger: logging.Logger, operation: str, total_steps: int
    ) -> None:
        """Initialize progress logger.

        Args:
            logger: Logger instance
            operation: Name of the operation
            total_steps: Total number of steps
        """
        self.logger = logger
        self.operation = operation
        self.total_steps = total_steps
        self.current_step = 0
        self.start_time = datetime.now()

        self.logger.info(f"Starting {operation} ({total_steps} steps)")

    def step(self, description: str = "") -> None:
        """Log progress for a step.

        Args:
            description: Optional description of the current step
        """
        self.current_step += 1
        progress = (self.current_step / self.total_steps) * 100

        elapsed = datetime.now() - self.start_time

        message = f"{self.operation} progress: {self.current_step}/{self.total_steps} ({progress:.1f}%)"
        if description:
            message += f" - {description}"
        message += f" [elapsed: {elapsed.total_seconds():.1f}s]"

        self.logger.info(message)

    def complete(self, success: bool = True) -> None:
        """Log completion of the operation.

        Args:
            success: Whether the operation completed successfully
        """
        elapsed = datetime.now() - self.start_time
        status = "completed successfully" if success else "failed"

        self.logger.info(
            f"{self.operation} {status} in {elapsed.total_seconds():.1f}s "
            f"({self.current_step}/{self.total_steps} steps)"
        )


def log_function_call(logger: logging.Logger) -> Callable[[F], F]:
    """Decorator to log function calls and execution time.

    Args:
        logger: Logger instance to use

    Returns:
        Decorator function
    """

    def decorator(func: F) -> F:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = datetime.now()
            func_name = f"{func.__module__}.{func.__name__}"

            logger.debug(
                f"Calling {func_name} with args={args}, kwargs={kwargs}"
            )

            try:
                result = func(*args, **kwargs)
                elapsed = datetime.now() - start_time
                logger.debug(
                    f"{func_name} completed in {elapsed.total_seconds():.3f}s"
                )
                return result
            except Exception as e:
                elapsed = datetime.now() - start_time
                logger.error(
                    f"{func_name} failed after {elapsed.total_seconds():.3f}s: {e}",
                    exc_info=True,
                )
                raise

        return wrapper  # type: ignore

    return decorator


def log_api_call(
    logger: logging.Logger, service: str
) -> Callable[[F], F]:
    """Decorator to log API calls with rate limiting awareness.

    Args:
        logger: Logger instance to use
        service: Name of the API service

    Returns:
        Decorator function
    """

    def decorator(func: F) -> F:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = datetime.now()

            logger.info(f"Making {service} API call: {func.__name__}")

            try:
                result = func(*args, **kwargs)
                elapsed = datetime.now() - start_time
                logger.info(
                    f"{service} API call successful in {elapsed.total_seconds():.3f}s"
                )
                return result
            except Exception as e:
                elapsed = datetime.now() - start_time
                error_msg = str(e).lower()

                if "rate" in error_msg or "limit" in error_msg:
                    logger.warning(
                        f"{service} API rate limit hit after {elapsed.total_seconds():.3f}s: {e}"
                    )
                elif "timeout" in error_msg:
                    logger.warning(
                        f"{service} API timeout after {elapsed.total_seconds():.3f}s: {e}"
                    )
                else:
                    logger.error(
                        f"{service} API call failed after {elapsed.total_seconds():.3f}s: {e}",
                        exc_info=True,
                    )
                raise

        return wrapper  # type: ignore

    return decorator


class ContextLogger:
    """Context manager for logging operations with automatic cleanup."""

    def __init__(
        self,
        logger: logging.Logger,
        operation: str,
        level: int = logging.INFO,
    ) -> None:
        """Initialize context logger.

        Args:
            logger: Logger instance
            operation: Name of the operation
            level: Logging level
        """
        self.logger = logger
        self.operation = operation
        self.level = level
        self.start_time: Optional[datetime] = None

    def __enter__(self) -> Self:
        """Enter the context."""
        self.start_time = datetime.now()
        self.logger.log(self.level, f"Starting {self.operation}")
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[Any],
    ) -> bool:
        """Exit the context."""
        if self.start_time is None:
            # Should not happen if __enter__ was called
            return False

        elapsed = datetime.now() - self.start_time

        if exc_type is None:
            self.logger.log(
                self.level,
                f"{self.operation} completed successfully in {elapsed.total_seconds():.3f}s",
            )
        else:
            self.logger.error(
                f"{self.operation} failed after {elapsed.total_seconds():.3f}s: {exc_val}",
                exc_info=(exc_type, exc_val, exc_tb),
            )

        return False  # Don't suppress exceptions


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a logger instance with the application's configuration.

    Args:
        name: Logger name (defaults to calling module)

    Returns:
        Logger instance
    """
    if name is None:
        # Get the calling module's name
        import inspect

        frame = inspect.currentframe()
        if frame and frame.f_back:
            name = frame.f_back.f_globals.get(
                "__name__", "security_news_agent"
            )
        else:
            name = "security_news_agent"

    return logging.getLogger(name)
