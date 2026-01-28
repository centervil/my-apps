#!/bin/bash
# .gemini/skills/skill-issue-manager/scripts/get-issue-template.sh

TEMPLATE_DIR=".github/ISSUE_TEMPLATE"

case "$1" in
    "bug")
        cat "$TEMPLATE_DIR/bug_report.md"
        ;;
    "feature"|"enhancement")
        cat "$TEMPLATE_DIR/feature_request.md"
        ;;
    "question")
        cat "$TEMPLATE_DIR/question.md"
        ;;
    "reflect")
        cat "$TEMPLATE_DIR/reflect_knowledge.md"
        ;;
    *)
        echo "Error: Unknown template type '$1'. Available: bug, feature, enhancement, question, reflect" >&2
        exit 1
        ;;
esac
