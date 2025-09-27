"""Report rendering and file operations."""

import logging
import re
import shutil
import subprocess  # nosec B404
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..config.settings import AgentConfig
from ..utils.helpers import slugify_en, today_iso

logger = logging.getLogger(__name__)


class RenderError(Exception):
    """Base exception for rendering errors."""

    pass


class MarpNotFoundError(RenderError):
    """Raised when Marp CLI is not found."""

    pass


class FileOperationError(RenderError):
    """Raised when file operations fail."""

    pass


class ReportRenderer:
    """Handles report rendering and file operations."""

    def __init__(self, config: AgentConfig, output_dir: str = "slides"):
        """Initialize the renderer.

        Args:
            config: Agent configuration
            output_dir: Directory for output files
        """
        self.config = config
        self.output_dir = Path(output_dir)
        self.marp_cli = shutil.which("marp")

        logger.info(
            f"Initialized ReportRenderer with output_dir: {self.output_dir}"
        )
        if self.marp_cli:
            logger.info(f"Marp CLI found at: {self.marp_cli}")
        else:
            logger.warning(
                "Marp CLI not found - rendering to non-markdown formats will be unavailable"
            )

    def ensure_output_directory(self) -> Path:
        """Ensure output directory exists.

        Returns:
            Path to output directory

        Raises:
            FileOperationError: If directory creation fails
        """
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Output directory ensured: {self.output_dir}")
            return self.output_dir
        except Exception as e:
            raise FileOperationError(
                f"Failed to create output directory {self.output_dir}: {e}"
            )

    def generate_filename(self, title: str, extension: str = "md") -> Path:
        """Generate filename from title.

        Args:
            title: Report title
            extension: File extension (without dot)

        Returns:
            Generated filename as a Path object
        """
        date_prefix = today_iso()
        slug = slugify_en(title)
        filename = f"{date_prefix}_{slug}.{extension}"

        logger.debug(f"Generated filename: {filename}")
        return self.output_dir / filename

    def save_markdown(
        self, content: str, title: str, filename: str = ""
    ) -> Path:
        """Save markdown content to file.

        Args:
            content: Markdown content
            title: Report title (used for filename if filename not provided)
            filename: Optional custom filename

        Returns:
            Path to saved file

        Raises:
            FileOperationError: If file saving fails
        """
        try:
            self.ensure_output_directory()

            if not filename:
                file_path = self.generate_filename(title, "md")
            else:
                file_path = self.output_dir / filename

            # Write content with UTF-8 encoding
            file_path.write_text(content, encoding="utf-8")

            logger.info(f"Markdown saved to: {file_path}")
            return file_path

        except Exception as e:
            raise FileOperationError(f"Failed to save markdown file: {e}")

    def render_with_marp(
        self, md_path: Path, output_format: str
    ) -> Optional[Path]:
        """Render markdown to specified format using Marp CLI.

        Args:
            md_path: Path to markdown file
            output_format: Output format ("pdf", "png", "html")

        Returns:
            Path to rendered file, or None if rendering failed

        Raises:
            MarpNotFoundError: If Marp CLI is not available
            RenderError: If rendering fails
        """
        if not self.marp_cli:
            raise MarpNotFoundError(
                "Marp CLI not found. Install with 'npm install -g @marp-team/marp-cli'"
            )

        if output_format not in {"pdf", "png", "html"}:
            raise RenderError(f"Unsupported output format: {output_format}")

        # Generate output filename
        output_filename = md_path.stem + f".{output_format}"
        output_path = md_path.parent / output_filename

        # Build Marp command
        cmd = [
            self.marp_cli,
            str(md_path),
            f"--{output_format}",
            "-o",
            str(output_path),
        ]

        logger.info(f"Rendering {md_path.name} to {output_format} format")
        logger.debug(f"Marp command: {' '.join(cmd)}")

        try:
            subprocess.run(  # nosec B603
                cmd,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=120,  # 2 minute timeout
            )

            if output_path.exists():
                logger.info(f"Successfully rendered to: {output_path}")
                return output_path
            else:
                logger.error("Marp completed but output file not found")
                return None

        except subprocess.TimeoutExpired:
            logger.error("Marp rendering timed out")
            raise RenderError("Marp rendering timed out after 2 minutes")
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.strip() if e.stderr else "Unknown error"
            logger.error(f"Marp rendering failed: {error_msg}")
            raise RenderError(f"Marp rendering failed: {error_msg}")
        except Exception as e:
            logger.error(f"Unexpected error during Marp rendering: {e}")
            raise RenderError(f"Unexpected rendering error: {e}")

    def save_and_render(self, content: str, title: str) -> Dict[str, Any]:
        """Save markdown and optionally render to configured format.

        Args:
            content: Markdown content
            title: Report title

        Returns:
            Dictionary with file paths and rendering results
        """
        result = {
            "markdown_path": None,
            "rendered_path": None,
            "format": self.config.slide_format,
            "success": False,
            "error": None,
        }

        try:
            # Save markdown file
            md_path = self.save_markdown(content, title)
            result["markdown_path"] = str(md_path)

            # Render to additional format if configured
            if self.config.slide_format and self.config.slide_format in {
                "pdf",
                "png",
                "html",
            }:
                try:
                    rendered_path = self.render_with_marp(
                        md_path, self.config.slide_format
                    )
                    if rendered_path:
                        result["rendered_path"] = str(rendered_path)
                        logger.info("Report saved and rendered successfully")
                    else:
                        logger.warning("Markdown saved but rendering failed")
                        result["error"] = (
                            "Rendering failed but markdown was saved"
                        )
                except (MarpNotFoundError, RenderError) as e:
                    logger.warning(f"Rendering failed: {e}")
                    result["error"] = str(e)
            else:
                logger.info("No additional rendering requested")

            result["success"] = True
            return result

        except FileOperationError as e:
            logger.error(f"Failed to save report: {e}")
            result["error"] = str(e)
            return result
        except Exception as e:
            logger.error(f"Unexpected error in save_and_render: {e}")
            result["error"] = f"Unexpected error: {e}"
            return result

    def cleanup_old_files(self, keep_count: int = 10) -> int:
        """Clean up old report files, keeping only the most recent ones.

        Args:
            keep_count: Number of recent files to keep

        Returns:
            Number of files deleted
        """
        if not self.output_dir.exists():
            return 0

        try:
            # Get all report files (markdown and rendered)
            all_files: List[Path] = []
            for pattern in ["*.md", "*.pdf", "*.png", "*.html"]:
                all_files.extend(self.output_dir.glob(pattern))

            if len(all_files) <= keep_count:
                return 0

            # Sort by modification time (newest first)
            all_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

            # Delete old files
            files_to_delete = all_files[keep_count:]
            deleted_count = 0

            for file_path in files_to_delete:
                try:
                    file_path.unlink()
                    deleted_count += 1
                    logger.debug(f"Deleted old file: {file_path.name}")
                except Exception as e:
                    logger.warning(f"Failed to delete {file_path.name}: {e}")

            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old report files")

            return deleted_count

        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return 0

    def get_output_info(self) -> Dict[str, Any]:
        """Get information about output configuration and status.

        Returns:
            Dictionary with output configuration info
        """
        return {
            "output_dir": str(self.output_dir),
            "output_dir_exists": self.output_dir.exists(),
            "slide_format": self.config.slide_format,
            "marp_theme": self.config.marp_theme,
            "marp_paginate": self.config.marp_paginate,
            "marp_cli_available": self.marp_cli is not None,
            "marp_cli_path": self.marp_cli,
        }

    def validate_markdown_content(self, content: str) -> Dict[str, Any]:
        """Validate markdown content for common issues.

        Args:
            content: Markdown content to validate

        Returns:
            Dictionary with validation results
        """
        validation: Dict[str, Any] = {
            "valid": True,
            "warnings": [],
            "errors": [],
        }

        if not content.strip():
            validation["valid"] = False
            validation["errors"].append("Content is empty")
            return validation

        # Check for Marp header
        if not content.startswith("---\nmarp: true"):
            validation["warnings"].append("Missing Marp header")

        # Check for title
        if "# " not in content:
            validation["warnings"].append("No main title found")

        # Check for slide separators
        body = re.sub(r"^---[\s\S]*?---\s*", "", content, count=1)
        if "---" not in body:
            validation["warnings"].append("No slide separators found")

        # Check content length
        if len(content) < 100:
            validation["warnings"].append("Content seems very short")
        elif len(content) > 50000:
            validation["warnings"].append(
                "Content is very long, may cause rendering issues"
            )

        return validation
