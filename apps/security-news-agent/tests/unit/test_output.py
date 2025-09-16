"""Unit tests for output rendering functionality."""

import pytest
import subprocess
from pathlib import Path
from unittest.mock import Mock, patch, mock_open
from security_news_agent.output.renderer import (
    ReportRenderer,
    RenderError,
    MarpNotFoundError,
    FileOperationError
)
from tests.fixtures.mock_data import MOCK_SLIDE_CONTENT


class TestReportRenderer:
    """Test cases for ReportRenderer class."""
    
    def test_init_with_marp(self, mock_config, tmp_path):
        """Test initialization when Marp CLI is available."""
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            assert renderer.config == mock_config
            assert renderer.output_dir == tmp_path
            assert renderer.marp_cli == '/usr/bin/marp'
    
    def test_init_without_marp(self, mock_config, tmp_path):
        """Test initialization when Marp CLI is not available."""
        with patch('shutil.which', return_value=None):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            assert renderer.marp_cli is None
    
    def test_ensure_output_directory_success(self, mock_config, tmp_path):
        """Test successful output directory creation."""
        output_dir = tmp_path / "test_output"
        renderer = ReportRenderer(mock_config, str(output_dir))
        
        result = renderer.ensure_output_directory()
        
        assert result == output_dir
        assert output_dir.exists()
    
    def test_ensure_output_directory_exists(self, mock_config, tmp_path):
        """Test output directory when it already exists."""
        output_dir = tmp_path / "existing_output"
        output_dir.mkdir()
        
        renderer = ReportRenderer(mock_config, str(output_dir))
        result = renderer.ensure_output_directory()
        
        assert result == output_dir
        assert output_dir.exists()
    
    def test_ensure_output_directory_permission_error(self, mock_config):
        """Test output directory creation with permission error."""
        with patch('pathlib.Path.mkdir', side_effect=PermissionError("Permission denied")):
            renderer = ReportRenderer(mock_config, "/invalid/path")
            
            with pytest.raises(FileOperationError) as exc_info:
                renderer.ensure_output_directory()
            
            assert "Permission denied" in str(exc_info.value)
    
    def test_generate_filename_default(self, mock_config):
        """Test filename generation with default extension."""
        renderer = ReportRenderer(mock_config)
        
        with patch('security_news_agent.output.renderer.today_iso', return_value='2025-09-14'):
            with patch('security_news_agent.output.renderer.slugify_en', return_value='test-title'):
                filename = renderer.generate_filename("Test Title")
                
                assert filename == "2025-09-14_test-title.md"
    
    def test_generate_filename_custom_extension(self, mock_config):
        """Test filename generation with custom extension."""
        renderer = ReportRenderer(mock_config)
        
        with patch('security_news_agent.output.renderer.today_iso', return_value='2025-09-14'):
            with patch('security_news_agent.output.renderer.slugify_en', return_value='test-title'):
                filename = renderer.generate_filename("Test Title", "pdf")
                
                assert filename == "2025-09-14_test-title.pdf"
    
    def test_save_markdown_success(self, mock_config, tmp_path):
        """Test successful markdown saving."""
        renderer = ReportRenderer(mock_config, str(tmp_path))
        content = "# Test Content\n\nThis is a test."
        
        result_path = renderer.save_markdown(content, "Test Title")
        
        assert result_path.exists()
        assert result_path.read_text(encoding="utf-8") == content
        assert result_path.parent == tmp_path
    
    def test_save_markdown_custom_filename(self, mock_config, tmp_path):
        """Test markdown saving with custom filename."""
        renderer = ReportRenderer(mock_config, str(tmp_path))
        content = "# Test Content"
        
        result_path = renderer.save_markdown(content, "Test Title", "custom.md")
        
        assert result_path.name == "custom.md"
        assert result_path.read_text(encoding="utf-8") == content
    
    def test_save_markdown_write_error(self, mock_config, tmp_path):
        """Test markdown saving with write error."""
        renderer = ReportRenderer(mock_config, str(tmp_path))
        
        with patch('pathlib.Path.write_text', side_effect=IOError("Write failed")):
            with pytest.raises(FileOperationError) as exc_info:
                renderer.save_markdown("content", "title")
            
            assert "Write failed" in str(exc_info.value)
    
    def test_render_with_marp_success(self, mock_config, tmp_path):
        """Test successful Marp rendering."""
        md_file = tmp_path / "test.md"
        md_file.write_text("# Test")
        pdf_file = tmp_path / "test.pdf"
        
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with patch('subprocess.run') as mock_run:
                mock_run.return_value = Mock(returncode=0, stdout="", stderr="")
                with patch('pathlib.Path.exists', return_value=True):
                    result = renderer.render_with_marp(md_file, "pdf")
                    
                    assert result == pdf_file
                    mock_run.assert_called_once()
    
    def test_render_with_marp_not_found(self, mock_config, tmp_path):
        """Test Marp rendering when CLI is not available."""
        md_file = tmp_path / "test.md"
        
        with patch('shutil.which', return_value=None):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with pytest.raises(MarpNotFoundError) as exc_info:
                renderer.render_with_marp(md_file, "pdf")
            
            assert "Marp CLI not found" in str(exc_info.value)
    
    def test_render_with_marp_invalid_format(self, mock_config, tmp_path):
        """Test Marp rendering with invalid format."""
        md_file = tmp_path / "test.md"
        
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with pytest.raises(RenderError) as exc_info:
                renderer.render_with_marp(md_file, "invalid")
            
            assert "Unsupported output format" in str(exc_info.value)
    
    def test_render_with_marp_command_failure(self, mock_config, tmp_path):
        """Test Marp rendering with command failure."""
        md_file = tmp_path / "test.md"
        md_file.write_text("# Test")
        
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with patch('subprocess.run') as mock_run:
                mock_run.side_effect = subprocess.CalledProcessError(
                    1, ['marp'], stderr="Rendering failed"
                )
                
                with pytest.raises(RenderError) as exc_info:
                    renderer.render_with_marp(md_file, "pdf")
                
                assert "Rendering failed" in str(exc_info.value)
    
    def test_render_with_marp_timeout(self, mock_config, tmp_path):
        """Test Marp rendering with timeout."""
        md_file = tmp_path / "test.md"
        md_file.write_text("# Test")
        
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with patch('subprocess.run') as mock_run:
                mock_run.side_effect = subprocess.TimeoutExpired(['marp'], 120)
                
                with pytest.raises(RenderError) as exc_info:
                    renderer.render_with_marp(md_file, "pdf")
                
                assert "timed out" in str(exc_info.value)
    
    def test_save_and_render_markdown_only(self, mock_config, tmp_path):
        """Test save and render with markdown only."""
        mock_config.slide_format = ""  # No additional rendering
        renderer = ReportRenderer(mock_config, str(tmp_path))
        
        result = renderer.save_and_render(MOCK_SLIDE_CONTENT, "Test Report")
        
        assert result["success"] is True
        assert result["markdown_path"] is not None
        assert result["rendered_path"] is None
        assert result["format"] == ""
        assert Path(result["markdown_path"]).exists()
    
    def test_save_and_render_with_pdf(self, mock_config, tmp_path):
        """Test save and render with PDF output."""
        mock_config.slide_format = "pdf"
        
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with patch.object(renderer, 'render_with_marp') as mock_render:
                mock_render.return_value = tmp_path / "test.pdf"
                
                result = renderer.save_and_render(MOCK_SLIDE_CONTENT, "Test Report")
                
                assert result["success"] is True
                assert result["markdown_path"] is not None
                assert result["rendered_path"] is not None
                assert result["format"] == "pdf"
    
    def test_save_and_render_render_failure(self, mock_config, tmp_path):
        """Test save and render when rendering fails."""
        mock_config.slide_format = "pdf"
        
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            with patch.object(renderer, 'render_with_marp') as mock_render:
                mock_render.side_effect = RenderError("Rendering failed")
                
                result = renderer.save_and_render(MOCK_SLIDE_CONTENT, "Test Report")
                
                assert result["success"] is True  # Markdown still saved
                assert result["markdown_path"] is not None
                assert result["rendered_path"] is None
                assert "Rendering failed" in result["error"]
    
    def test_save_and_render_save_failure(self, mock_config, tmp_path):
        """Test save and render when saving fails."""
        renderer = ReportRenderer(mock_config, str(tmp_path))
        
        with patch.object(renderer, 'save_markdown') as mock_save:
            mock_save.side_effect = FileOperationError("Save failed")
            
            result = renderer.save_and_render(MOCK_SLIDE_CONTENT, "Test Report")
            
            assert result["success"] is False
            assert result["markdown_path"] is None
            assert "Save failed" in result["error"]
    
    def test_cleanup_old_files(self, mock_config, tmp_path):
        """Test cleanup of old files."""
        renderer = ReportRenderer(mock_config, str(tmp_path))

        # Create mock file objects
        mock_files = []
        for i in range(15):
            mock_file = Mock(spec=Path)
            mock_file.name = f"report_{i:02d}.md"
            # Attach a stat mock to each file mock
            mock_stat_result = Mock()
            mock_stat_result.st_mtime = 1000000 - i # Newest first
            mock_file.stat.return_value = mock_stat_result
            mock_files.append(mock_file)

        # The glob should return .md files, and we can ignore other patterns
        def glob_side_effect(pattern):
            if pattern == "*.md":
                return mock_files
            return []

        with patch.object(Path, 'glob', side_effect=glob_side_effect):
            deleted_count = renderer.cleanup_old_files(keep_count=10)
            assert deleted_count == 5

        # Verify that unlink was called on the 5 oldest files
        for i in range(10, 15):
            mock_files[i].unlink.assert_called_once()
        # Verify that unlink was NOT called on the 10 newest files
        for i in range(10):
            mock_files[i].unlink.assert_not_called()
    
    def test_cleanup_old_files_no_directory(self, mock_config, tmp_path):
        """Test cleanup when output directory doesn't exist."""
        non_existent = tmp_path / "non_existent"
        renderer = ReportRenderer(mock_config, str(non_existent))
        
        deleted_count = renderer.cleanup_old_files()
        
        assert deleted_count == 0
    
    def test_cleanup_old_files_few_files(self, mock_config, tmp_path):
        """Test cleanup when there are fewer files than keep_count."""
        renderer = ReportRenderer(mock_config, str(tmp_path))
        
        # Create only 3 files
        for i in range(3):
            file_path = tmp_path / f"report_{i}.md"
            file_path.write_text(f"Content {i}")
        
        deleted_count = renderer.cleanup_old_files(keep_count=10)
        
        assert deleted_count == 0
    
    def test_get_output_info(self, mock_config, tmp_path):
        """Test getting output configuration info."""
        with patch('shutil.which', return_value='/usr/bin/marp'):
            renderer = ReportRenderer(mock_config, str(tmp_path))
            
            info = renderer.get_output_info()
            
            assert info["output_dir"] == str(tmp_path)
            assert info["slide_format"] == mock_config.slide_format
            assert info["marp_theme"] == mock_config.marp_theme
            assert info["marp_paginate"] == mock_config.marp_paginate
            assert info["marp_cli_available"] is True
            assert info["marp_cli_path"] == '/usr/bin/marp'
    
    def test_validate_markdown_content_valid(self, mock_config):
        """Test validation of valid markdown content."""
        renderer = ReportRenderer(mock_config)
        content = MOCK_SLIDE_CONTENT
        
        validation = renderer.validate_markdown_content(content)
        
        assert validation["valid"] is True
        assert len(validation["errors"]) == 0
    
    def test_validate_markdown_content_empty(self, mock_config):
        """Test validation of empty content."""
        renderer = ReportRenderer(mock_config)
        
        validation = renderer.validate_markdown_content("")
        
        assert validation["valid"] is False
        assert "Content is empty" in validation["errors"]
    
    def test_validate_markdown_content_no_marp_header(self, mock_config):
        """Test validation of content without Marp header."""
        renderer = ReportRenderer(mock_config)
        content = "# Title\n\nContent without Marp header"
        
        validation = renderer.validate_markdown_content(content)
        
        assert validation["valid"] is True
        assert "Missing Marp header" in validation["warnings"]
    
    def test_validate_markdown_content_no_title(self, mock_config):
        """Test validation of content without title."""
        renderer = ReportRenderer(mock_config)
        content = "---\nmarp: true\n---\n\nContent without title"
        
        validation = renderer.validate_markdown_content(content)
        
        assert validation["valid"] is True
        assert "No main title found" in validation["warnings"]
    
    def test_validate_markdown_content_no_separators(self, mock_config):
        """Test validation of content without slide separators."""
        renderer = ReportRenderer(mock_config)
        content = "---\nmarp: true\n---\n\n# Title\n\nContent without separators"
        
        validation = renderer.validate_markdown_content(content)
        
        assert validation["valid"] is True
        assert any("No slide separators found" in w for w in validation["warnings"])
    
    def test_validate_markdown_content_too_short(self, mock_config):
        """Test validation of very short content."""
        renderer = ReportRenderer(mock_config)
        content = "---\nmarp: true\n---\n\n# Title"
        
        validation = renderer.validate_markdown_content(content)
        
        assert validation["valid"] is True
        assert "Content seems very short" in validation["warnings"]
    
    def test_validate_markdown_content_too_long(self, mock_config):
        """Test validation of very long content."""
        renderer = ReportRenderer(mock_config)
        content = "---\nmarp: true\n---\n\n# Title\n\n" + "x" * 60000
        
        validation = renderer.validate_markdown_content(content)
        
        assert validation["valid"] is True
        assert any("Content is very long" in w for w in validation["warnings"])