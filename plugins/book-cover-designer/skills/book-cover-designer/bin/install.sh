#!/usr/bin/env bash
# install.sh — deploy book-cover-designer to every installed agent CLI.
#
# Installs:
#   1. The portable SKILL.md + templates + bin/ into each CLI's skill directory
#      (symlinked so `git pull`/edits stay live).
#   2. MCP registration so each agent exposes generate_cover / save_template /
#      list_templates as tools.
#
# Idempotent: safe to re-run; skips CLIs that are not installed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_BIN="$(node -e "console.log(require('node:path').join('$ROOT','bin','mcp-server.mjs'))")"
NODE_BIN="$(command -v node || echo /usr/bin/env node)"

echo "book-cover-designer installer"
echo "  package: $ROOT"
echo "  mcp:     $MCP_BIN"

install_skill() {
  local dest="$1"
  mkdir -p "$(dirname "$dest")"
  if [ -L "$dest" ]; then rm -f "$dest"; fi
  ln -sfn "$ROOT" "$dest"
  echo "  OK skill -> $dest"
}

# ---------- 1. skill directories per CLI ----------
# Grok reads ~/.claude/skills too — one symlink covers Claude Code + Grok.
install_skill "$HOME/.claude/skills/book-cover-designer"
install_skill "$HOME/.grok/skills/book-cover-designer"
install_skill "$HOME/.codex/skills/book-cover-designer"
install_skill "$HOME/.config/opencode/skills/book-cover-designer"
install_skill "$HOME/.kimi-code/skills/book-cover-designer"
# Ori: skills live under the global feature root
if [ -d "$HOME/.ori/global" ]; then
  install_skill "$HOME/.ori/global/features/book-cover-designer"
fi

# ---------- 2. MCP registration per CLI ----------
register_mcp() {
  local name="$1" cmd="$2" label="$3"
  if command -v "$name" >/dev/null 2>&1 || [ -x "$(command -v "$name")" ]; then
    echo "  MCP [$label] $cmd (best-effort)"
    eval "$cmd" >/dev/null 2>&1 || echo "    (registration skipped/failed — register manually)"
  fi
}

# Claude Code: user-scope MCP server
register_mcp claude "claude mcp add book-cover-designer --scope user -- node $MCP_BIN" claude
# Codex: user-scope MCP server
register_mcp codex "codex mcp add book-cover-designer --scope user -- node $MCP_BIN" codex
# OpenCode: JSON config merge (mcpServers)
if command -v opencode >/dev/null 2>&1; then
  CFG="$HOME/.opencode/config.json"
  if [ -f "$CFG" ]; then
    node -e "
      const fs=require('node:fs'); const p='$CFG';
      const j=JSON.parse(fs.readFileSync(p,'utf8'));
      j.mcpServers=j.mcpServers||{};
      if(!j.mcpServers['book-cover-designer']){
        j.mcpServers['book-cover-designer']={command:'node',args:['$MCP_BIN']};
        fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
        console.log('    opencode mcpServers updated');
      } else { console.log('    opencode mcpServers already present'); }
    "
  else
    echo "  MCP [opencode] config not found at $CFG — skip"
  fi
fi
# Grok: TOML config merge ([mcp_servers.book-cover-designer])
if command -v grok >/dev/null 2>&1; then
  GCFG="$HOME/.grok/config.toml"
  if [ -f "$GCFG" ]; then
    if grep -q 'mcp_servers.book-cover-designer' "$GCFG" 2>/dev/null; then
      echo "  MCP [grok] already registered"
    else
      cat >> "$GCFG" <<EOF

[mcp_servers.book-cover-designer]
command = "$NODE_BIN"
args = ["$MCP_BIN"]
enabled = true
EOF
      echo "  MCP [grok] appended to $GCFG"
    fi
  else
    echo "  MCP [grok] config not found at $GCFG — skip"
  fi
fi
# Kimi / Ori: manual note (hook-based config; register via their own MCP UIs)
echo "  NOTE kimie/ori: register MCP node $MCP_BIN in their settings UI if not auto."

echo "done. Re-run after edits; symlinks make updates live."