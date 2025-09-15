"""Unit tests for utility functions."""

import pytest
import json
from datetime import datetime
from security_news_agent.utils.helpers import (
    log_message,
    strip_bullets,
    slugify_en,
    find_json,
    ensure_marp_header,
    insert_separators,
    dedupe_separators,
    strip_whole_code_fence,
    clean_title,
    remove_presenter_lines,
    today_iso,
    now_jst,
    validate_url,
    truncate_text,
    extract_urls_from_text,
    count_words,
    format_file_size,
    sanitize_filename,
    parse_json_safely,
    merge_dicts
)


class TestLogMessage:
    """Test cases for log_message function."""
    
    def test_log_message_empty_state(self):
        """Test adding log message to empty state."""
        state = {}
        result = log_message(state, "Test message")
        
        assert result == ["Test message"]
    
    def test_log_message_existing_log(self):
        """Test adding log message to state with existing log."""
        state = {"log": ["Previous message"]}
        result = log_message(state, "New message")
        
        assert result == ["Previous message", "New message"]
    
    def test_log_message_none_log(self):
        """Test adding log message when log is None."""
        state = {"log": None}
        result = log_message(state, "Test message")
        
        assert result == ["Test message"]


class TestStripBullets:
    """Test cases for strip_bullets function."""
    
    def test_strip_bullets_basic(self):
        """Test basic bullet stripping."""
        lines = ["- Item 1", "• Item 2", "* Item 3", "・ Item 4"]
        result = strip_bullets(lines)
        
        assert result == ["Item 1", "Item 2", "Item 3", "Item 4"]
    
    def test_strip_bullets_with_whitespace(self):
        """Test bullet stripping with whitespace."""
        lines = ["  - Item 1  ", "\t* Item 2\t", ""]
        result = strip_bullets(lines)
        
        assert result == ["Item 1", "Item 2"]
    
    def test_strip_bullets_empty_list(self):
        """Test bullet stripping with empty list."""
        result = strip_bullets([])
        
        assert result == []
    
    def test_strip_bullets_no_bullets(self):
        """Test bullet stripping with no bullets."""
        lines = ["Item 1", "Item 2"]
        result = strip_bullets(lines)
        
        assert result == ["Item 1", "Item 2"]


class TestSlugifyEn:
    """Test cases for slugify_en function."""
    
    def test_slugify_basic(self):
        """Test basic slugification."""
        result = slugify_en("Hello World")
        
        assert result == "hello-world"
    
    def test_slugify_special_characters(self):
        """Test slugification with special characters."""
        result = slugify_en("Hello, World! & More")
        
        assert result == "hello-world-more"
    
    def test_slugify_multiple_spaces(self):
        """Test slugification with multiple spaces."""
        result = slugify_en("Hello    World")
        
        assert result == "hello-world"
    
    def test_slugify_max_length(self):
        """Test slugification with max length."""
        long_text = "a" * 100
        result = slugify_en(long_text, max_len=10)
        
        assert len(result) == 10
        assert result == "a" * 10
    
    def test_slugify_empty_string(self):
        """Test slugification with empty string."""
        result = slugify_en("")
        
        assert result == "slides"
    
    def test_slugify_none(self):
        """Test slugification with None."""
        result = slugify_en(None)
        
        assert result == "slides"


class TestFindJson:
    """Test cases for find_json function."""
    
    def test_find_json_basic(self):
        """Test finding JSON in basic text."""
        text = 'Some text {"key": "value"} more text'
        result = find_json(text)
        
        assert result == '{"key": "value"}'
    
    def test_find_json_code_block(self):
        """Test finding JSON in code block."""
        text = '```json\n{"key": "value"}\n```'
        result = find_json(text)
        
        assert result == '{"key": "value"}'
    
    def test_find_json_multiline(self):
        """Test finding multiline JSON."""
        text = '''Some text {
            "key": "value",
            "number": 42
        }'''
        result = find_json(text)
        
        assert '"key": "value"' in result
        assert '"number": 42' in result
    
    def test_find_json_no_json(self):
        """Test finding JSON when none exists."""
        text = "Just some regular text"
        result = find_json(text)
        
        assert result is None
    
    def test_find_json_empty_string(self):
        """Test finding JSON in empty string."""
        result = find_json("")
        
        assert result is None


class TestEnsureMarpHeader:
    """Test cases for ensure_marp_header function."""
    
    def test_ensure_marp_header_no_header(self):
        """Test adding Marp header to content without header."""
        content = "# Title\n\nContent"
        result = ensure_marp_header(content, "Test Title")
        
        assert result.startswith("---\nmarp: true")
        assert "title: Test Title" in result
        assert "# Title\n\nContent" in result
    
    def test_ensure_marp_header_existing_header(self):
        """Test replacing existing Marp header."""
        content = "---\nold: header\n---\n\n# Title\n\nContent"
        result = ensure_marp_header(content, "Test Title")
        
        assert result.startswith("---\nmarp: true")
        assert "old: header" not in result
        assert "title: Test Title" in result
    
    def test_ensure_marp_header_empty_content(self):
        """Test adding Marp header to empty content."""
        result = ensure_marp_header("", "Test Title")
        
        assert result.startswith("---\nmarp: true")
        assert "title: Test Title" in result


class TestInsertSeparators:
    """Test cases for insert_separators function."""
    
    def test_insert_separators_basic(self):
        """Test inserting separators before H2 headers."""
        content = "# Title\n\n## Section 1\n\nContent\n\n## Section 2\n\nMore content"
        result = insert_separators(content)
        
        assert "---\n## Section 1" in result
        assert "---\n## Section 2" in result
    
    def test_insert_separators_with_existing(self):
        """Test inserting separators with existing separators."""
        content = "# Title\n\n---\n## Section 1\n\nContent\n\n## Section 2"
        result = insert_separators(content)
        
        # Should not add separator before Section 1 (already has one)
        assert result.count("---\n## Section 1") == 1
        assert "---\n## Section 2" in result
    
    def test_insert_separators_in_code_block(self):
        """Test not inserting separators inside code blocks."""
        content = "# Title\n\n```\n## Not a header\n```\n\n## Real Header"
        result = insert_separators(content)
        
        # Should only add separator before real header
        assert result.count("---") == 1
        assert "---\n## Real Header" in result
    
    def test_insert_separators_no_headers(self):
        """Test with content that has no H2 headers."""
        content = "# Title\n\nJust some content"
        result = insert_separators(content)
        
        assert "---" not in result


class TestDedupeSeperators:
    """Test cases for dedupe_separators function."""
    
    def test_dedupe_separators_multiple(self):
        """Test removing multiple consecutive separators."""
        content = "Content\n---\n---\n---\nMore content"
        result = dedupe_separators(content)
        
        assert result.count("---") == 1
    
    def test_dedupe_separators_beginning(self):
        """Test removing separators at beginning."""
        content = "---\n---\nContent"
        result = dedupe_separators(content)
        
        assert result.startswith("---\nContent")
        assert result.count("---") == 1
    
    def test_dedupe_separators_single(self):
        """Test with single separator (should remain unchanged)."""
        content = "Content\n---\nMore content"
        result = dedupe_separators(content)
        
        assert result == content


class TestStripWholeCodeFence:
    """Test cases for strip_whole_code_fence function."""
    
    def test_strip_code_fence_basic(self):
        """Test stripping basic code fence."""
        content = "```\nContent inside\n```"
        result = strip_whole_code_fence(content)
        
        assert result == "Content inside"
    
    def test_strip_code_fence_with_language(self):
        """Test stripping code fence with language."""
        content = "```markdown\nContent inside\n```"
        result = strip_whole_code_fence(content)
        
        assert result == "Content inside"
    
    def test_strip_code_fence_no_fence(self):
        """Test with content that has no code fence."""
        content = "Regular content"
        result = strip_whole_code_fence(content)
        
        assert result == "Regular content"
    
    def test_strip_code_fence_partial(self):
        """Test with content that has partial code fence."""
        content = "```\nContent inside"  # Missing closing fence
        result = strip_whole_code_fence(content)
        
        assert result == "Content inside"


class TestCleanTitle:
    """Test cases for clean_title function."""
    
    def test_clean_title_basic(self):
        """Test basic title cleaning."""
        result = clean_title("  My Title  ")
        
        assert result == "My Title"
    
    def test_clean_title_with_quotes(self):
        """Test cleaning title with quotes."""
        result = clean_title('"My Title"')
        
        assert result == "My Title"
    
    def test_clean_title_with_prefix(self):
        """Test cleaning title with prefix."""
        result = clean_title("Title: My Title")
        
        assert result == "My Title"
    
    def test_clean_title_empty(self):
        """Test cleaning empty title."""
        result = clean_title("")
        
        assert result == "Daily Security News Summary"
    
    def test_clean_title_none(self):
        """Test cleaning None title."""
        result = clean_title(None)
        
        assert result == "Daily Security News Summary"


class TestRemovePresenterLines:
    """Test cases for remove_presenter_lines function."""
    
    def test_remove_presenter_lines_basic(self):
        """Test removing presenter lines."""
        content = "# Title\nPresenter: John Doe\nContent\n---\nMore content"
        result = remove_presenter_lines(content)
        
        assert "Presenter: John Doe" not in result
        assert "# Title" in result
        assert "Content" in result
    
    def test_remove_presenter_lines_japanese(self):
        """Test removing Japanese presenter lines."""
        content = "# Title\n発表者：田中太郎\nContent"
        result = remove_presenter_lines(content)
        
        assert "発表者：田中太郎" not in result
    
    def test_remove_presenter_lines_no_presenter(self):
        """Test with content that has no presenter lines."""
        content = "# Title\nContent\n---\nMore content"
        result = remove_presenter_lines(content)
        
        assert result == content


class TestDateTimeFunctions:
    """Test cases for date/time functions."""
    
    def test_now_jst(self):
        """Test getting current time in JST."""
        result = now_jst()
        
        assert isinstance(result, datetime)
        assert str(result.tzinfo) == "Asia/Tokyo"
    
    def test_today_iso_default(self):
        """Test getting today's date in default format."""
        result = today_iso()
        
        assert len(result) == 10  # YYYY-MM-DD
        assert result.count("-") == 2
    
    def test_today_iso_custom_format(self):
        """Test getting today's date in custom format."""
        result = today_iso("%Y%m%d")
        
        assert len(result) == 8  # YYYYMMDD
        assert "-" not in result


class TestValidateUrl:
    """Test cases for validate_url function."""
    
    def test_validate_url_valid_http(self):
        """Test validating valid HTTP URL."""
        assert validate_url("http://example.com") is True
    
    def test_validate_url_valid_https(self):
        """Test validating valid HTTPS URL."""
        assert validate_url("https://example.com") is True
    
    def test_validate_url_with_path(self):
        """Test validating URL with path."""
        assert validate_url("https://example.com/path/to/page") is True
    
    def test_validate_url_with_port(self):
        """Test validating URL with port."""
        assert validate_url("https://example.com:8080") is True
    
    def test_validate_url_invalid(self):
        """Test validating invalid URL."""
        assert validate_url("not-a-url") is False
    
    def test_validate_url_empty(self):
        """Test validating empty URL."""
        assert validate_url("") is False


class TestTruncateText:
    """Test cases for truncate_text function."""
    
    def test_truncate_text_basic(self):
        """Test basic text truncation."""
        result = truncate_text("Hello World", 8)
        
        assert result == "Hello..."
    
    def test_truncate_text_no_truncation(self):
        """Test text that doesn't need truncation."""
        result = truncate_text("Hello", 10)
        
        assert result == "Hello"
    
    def test_truncate_text_custom_suffix(self):
        """Test truncation with custom suffix."""
        result = truncate_text("Hello World", 8, " [more]")
        
        assert result == "H [more]"
    
    def test_truncate_text_exact_length(self):
        """Test truncation at exact length."""
        result = truncate_text("Hello", 5)
        
        assert result == "Hello"


class TestExtractUrlsFromText:
    """Test cases for extract_urls_from_text function."""
    
    def test_extract_urls_basic(self):
        """Test extracting URLs from text."""
        text = "Visit https://example.com and http://test.org for more info"
        result = extract_urls_from_text(text)
        
        assert set(result) == {"https://example.com", "http://test.org"}
    
    def test_extract_urls_none(self):
        """Test extracting URLs when none exist."""
        text = "Just some text without URLs"
        result = extract_urls_from_text(text)
        
        assert result == []
    
    def test_extract_urls_with_paths(self):
        """Test extracting URLs with paths and parameters."""
        text = "Check https://example.com/path?param=value#section"
        result = extract_urls_from_text(text)
        
        assert len(result) == 1
        assert "example.com/path" in result[0]


class TestCountWords:
    """Test cases for count_words function."""
    
    def test_count_words_basic(self):
        """Test basic word counting."""
        result = count_words("Hello world this is a test")
        
        assert result == 6
    
    def test_count_words_with_markdown(self):
        """Test word counting with markdown formatting."""
        result = count_words("# Hello **world** this is a `test`")
        
        assert result == 6
    
    def test_count_words_empty(self):
        """Test word counting with empty string."""
        result = count_words("")
        
        assert result == 0
    
    def test_count_words_whitespace_only(self):
        """Test word counting with whitespace only."""
        result = count_words("   \n\t   ")
        
        assert result == 0


class TestFormatFileSize:
    """Test cases for format_file_size function."""
    
    def test_format_file_size_bytes(self):
        """Test formatting bytes."""
        result = format_file_size(512)
        
        assert result == "512.0 B"
    
    def test_format_file_size_kb(self):
        """Test formatting kilobytes."""
        result = format_file_size(1536)  # 1.5 KB
        
        assert result == "1.5 KB"
    
    def test_format_file_size_mb(self):
        """Test formatting megabytes."""
        result = format_file_size(1572864)  # 1.5 MB
        
        assert result == "1.5 MB"
    
    def test_format_file_size_zero(self):
        """Test formatting zero bytes."""
        result = format_file_size(0)
        
        assert result == "0 B"


class TestSanitizeFilename:
    """Test cases for sanitize_filename function."""
    
    def test_sanitize_filename_basic(self):
        """Test basic filename sanitization."""
        result = sanitize_filename("file<name>.txt")
        
        assert result == "file_name_.txt"
    
    def test_sanitize_filename_multiple_invalid(self):
        """Test sanitizing filename with multiple invalid characters."""
        result = sanitize_filename('file:name|with*invalid?chars')
        
        assert result == "file_name_with_invalid_chars"
    
    def test_sanitize_filename_empty(self):
        """Test sanitizing empty filename."""
        result = sanitize_filename("")
        
        assert result == "untitled"
    
    def test_sanitize_filename_dots_spaces(self):
        """Test sanitizing filename with leading/trailing dots and spaces."""
        result = sanitize_filename("  .filename.  ")
        
        assert result == "filename"


class TestParseJsonSafely:
    """Test cases for parse_json_safely function."""
    
    def test_parse_json_safely_valid(self):
        """Test parsing valid JSON."""
        result = parse_json_safely('{"key": "value"}')
        
        assert result == {"key": "value"}
    
    def test_parse_json_safely_invalid(self):
        """Test parsing invalid JSON."""
        result = parse_json_safely('{"key": invalid}')
        
        assert result is None
    
    def test_parse_json_safely_none(self):
        """Test parsing None."""
        result = parse_json_safely(None)
        
        assert result is None
    
    def test_parse_json_safely_empty(self):
        """Test parsing empty string."""
        result = parse_json_safely("")
        
        assert result is None


class TestMergeDicts:
    """Test cases for merge_dicts function."""
    
    def test_merge_dicts_basic(self):
        """Test basic dictionary merging."""
        dict1 = {"a": 1, "b": 2}
        dict2 = {"c": 3, "d": 4}
        result = merge_dicts(dict1, dict2)
        
        assert result == {"a": 1, "b": 2, "c": 3, "d": 4}
    
    def test_merge_dicts_overlapping(self):
        """Test merging dictionaries with overlapping keys."""
        dict1 = {"a": 1, "b": 2}
        dict2 = {"b": 3, "c": 4}
        result = merge_dicts(dict1, dict2)
        
        assert result == {"a": 1, "b": 3, "c": 4}  # dict2 overwrites
    
    def test_merge_dicts_empty(self):
        """Test merging empty dictionaries."""
        result = merge_dicts({}, {})
        
        assert result == {}
    
    def test_merge_dicts_with_none(self):
        """Test merging with None values."""
        dict1 = {"a": 1}
        result = merge_dicts(dict1, None, {"b": 2})
        
        assert result == {"a": 1, "b": 2}