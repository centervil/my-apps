"""Utility functions and helpers."""

import re
import json
from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo


# Timezone configuration
JST = ZoneInfo("Asia/Tokyo")


def log_message(state: dict, msg: str) -> List[str]:
    """Add a log message to the state log.
    
    Args:
        state: Current state dictionary
        msg: Message to log
        
    Returns:
        Updated log list
    """
    return (state.get("log") or []) + [msg]


def strip_bullets(lines: List[str]) -> List[str]:
    """Strip bullet points and formatting from lines.
    
    Args:
        lines: List of lines to process
        
    Returns:
        List of cleaned lines
    """
    out = []
    for line in lines:
        text = line.strip()
        if not text:
            continue
        # Remove common bullet point characters
        text = text.lstrip("・-•* \t")
        out.append(text)
    return out


def slugify_en(text: str, max_len: int = 80) -> str:
    """Convert text to URL-friendly slug.
    
    Args:
        text: Text to slugify
        max_len: Maximum length of slug
        
    Returns:
        Slugified text
    """
    text = (text or "").lower()
    # Replace non-alphanumeric characters with hyphens
    text = re.sub(r"[^a-z0-9]+", "-", text)
    # Remove multiple consecutive hyphens
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:max_len] or "slides"


def find_json(text: str) -> Optional[str]:
    """Extract JSON content from text.
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Extracted JSON string or None
    """
    text = text.strip()
    # Remove code block markers
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    
    # Find JSON-like content
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if match:
        return match.group(0).strip()
    return None


def ensure_marp_header(md: str, title: str) -> str:
    """Ensure markdown has proper Marp header.
    
    Args:
        md: Markdown content
        title: Document title
        
    Returns:
        Markdown with Marp header
    """
    # Default Marp configuration
    header = (
        "---\n"
        "marp: true\n"
        "paginate: true\n"
        "theme: default\n"
        f"title: {title}\n"
        "---\n\n"
    )
    
    # Remove existing header if present
    body = re.sub(r"^---[\s\S]*?---\s*", "", md.strip(), count=1, flags=re.DOTALL)
    
    return header + (body + ("\n" if not body.endswith("\n") else ""))


def insert_separators(md: str) -> str:
    """Insert slide separators before H2 headers.
    
    Args:
        md: Markdown content
        
    Returns:
        Markdown with slide separators
    """
    out = []
    in_code = False
    fence = None
    prev = ""
    
    def need_separator(prev_line: str) -> bool:
        """Check if separator is needed before current line."""
        prev_stripped = prev_line.strip()
        return prev_stripped != "---"
    
    for line in md.splitlines():
        # Track code blocks
        if line.startswith("```") or line.startswith("~~~"):
            if not in_code:
                in_code, fence = True, line[:3]
            else:
                if fence and line.startswith(fence):
                    in_code, fence = False, None
            out.append(line)
            prev = line
            continue
        
        # Insert separator before H2 headers (outside code blocks)
        if not in_code and line.startswith("## "):
            if need_separator(prev):
                out.append("---")
            out.append(line)
        else:
            out.append(line)
        
        prev = line
    
    return "\n".join(out).strip() + "\n"


def dedupe_separators(md: str) -> str:
    """Remove duplicate slide separators.
    
    Args:
        md: Markdown content
        
    Returns:
        Markdown with deduplicated separators
    """
    # Remove multiple consecutive separators
    md = re.sub(r"(?:\n*\s*---\s*\n+){2,}", "\n---\n", md, flags=re.MULTILINE)
    # Remove separators at the beginning
    md = re.sub(r"^(?:\s*---\s*\n)+", "---\n", md)
    return md


def strip_whole_code_fence(md: str) -> str:
    """Remove code fence that wraps entire content.
    
    Args:
        md: Markdown content
        
    Returns:
        Markdown without wrapping code fence
    """
    text = md.strip()
    if text.startswith("```"):
        # Remove opening fence
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*\n?", "", text, flags=re.DOTALL)
        # Remove closing fence
        text = re.sub(r"\n?```$", "", text.strip(), flags=re.DOTALL)
    return text


def clean_title(raw: str) -> str:
    """Clean and normalize title text.
    
    Args:
        raw: Raw title text
        
    Returns:
        Cleaned title
    """
    lines = (raw or "").strip().splitlines()
    if not lines:
        return "Daily Security News Summary"
    text = lines[0]
    # Remove quotes and special characters
    text = text.strip("「」『』\"' 　:：")
    # Remove common prefixes
    text = re.sub(
        r"^(以下のようなタイトル.*|title:?|suggested:?|案:?)[\s：:]*", 
        "", 
        text, 
        flags=re.IGNORECASE
    )
    return text or "Daily Security News Summary"


def remove_presenter_lines(md: str) -> str:
    """Remove presenter information from slides.
    
    Args:
        md: Markdown content
        
    Returns:
        Markdown without presenter lines
    """
    parts = md.split("\n---\n", 1)
    head = parts[0]
    
    # Remove presenter lines
    head = re.sub(
        r"^\s*(発表者|Presenter|Speaker)\s*[:：].*$", 
        "", 
        head, 
        flags=re.MULTILINE
    )
    
    # Clean up extra newlines
    head = re.sub(r"\n{3,}", "\n\n", head).strip()
    
    return head + ("\n---\n" + parts[1] if len(parts) == 2 else "")


def now_jst() -> datetime:
    """Get current time in JST timezone.
    
    Returns:
        Current datetime in JST
    """
    return datetime.now(JST)


def today_iso(fmt: str = "%Y-%m-%d") -> str:
    """Get today's date in ISO format (JST).
    
    Args:
        fmt: Date format string
        
    Returns:
        Formatted date string
    """
    return now_jst().strftime(fmt)


def validate_url(url: str) -> bool:
    """Validate if string is a valid URL.
    
    Args:
        url: URL string to validate
        
    Returns:
        True if valid URL, False otherwise
    """
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(url_pattern.match(url))


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to specified length.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add when truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def extract_urls_from_text(text: str) -> List[str]:
    """Extract URLs from text.
    
    Args:
        text: Text to search for URLs
        
    Returns:
        List of found URLs
    """
    url_pattern = re.compile(
        r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?',
        re.IGNORECASE
    )
    
    return url_pattern.findall(text)


def count_words(text: str) -> int:
    """Count words in text.
    
    Args:
        text: Text to count words in
        
    Returns:
        Number of words
    """
    # Remove markdown formatting
    clean_text = re.sub(r'[#*_`\[\]()]', '', text)
    # Split on whitespace and filter empty strings
    words = [word for word in clean_text.split() if word.strip()]
    return len(words)


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format.
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Formatted size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1
    
    return f"{size:.1f} {size_names[i]}"


def sanitize_filename(filename: str) -> str:
    """Sanitize filename by removing invalid characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove invalid characters for most filesystems
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing dots and spaces
    sanitized = sanitized.strip('. ')
    # Ensure it's not empty
    return sanitized or "untitled"


def parse_json_safely(text: str) -> Optional[dict]:
    """Safely parse JSON text.
    
    Args:
        text: JSON text to parse
        
    Returns:
        Parsed dictionary or None if parsing fails
    """
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return None


def merge_dicts(*dicts) -> dict:
    """Merge multiple dictionaries.
    
    Args:
        *dicts: Dictionaries to merge
        
    Returns:
        Merged dictionary
    """
    result = {}
    for d in dicts:
        if isinstance(d, dict):
            result.update(d)
    return result