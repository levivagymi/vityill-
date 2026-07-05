#!/bin/bash
set -euo pipefail

mkdir -p "$HOME/.claude"
cp "$CLAUDE_PROJECT_DIR/.claude/global-CLAUDE.md" "$HOME/.claude/CLAUDE.md"
