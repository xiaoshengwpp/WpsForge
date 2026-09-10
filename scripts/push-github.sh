#!/usr/bin/env bash
# 一键把本仓库创建为 GitHub 开源项目并推送。
# 前置条件：gh 已登录（gh auth login）。
set -euo pipefail
cd "$(dirname "$0")/.."
gh repo create wps-forge --public --source . --remote origin --push --description "WPS 表格「工具箱 + AI」混合效率加载项 — 高频操作一键化，长尾需求对话化，完全开源"
echo "[成功] 已推送: $(gh repo view --web --json url -q .url 2>/dev/null || echo https://github.com/<you>/wps-forge)"
