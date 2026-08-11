#!/usr/bin/env node
/**
 * book-cover-designer MCP server (stdio)
 *
 * Exposes cover-template + generation tools over the Model Context Protocol so
 * ANY agent CLI that supports MCP (Grok, Claude Code, Codex, OpenCode, Kimi,
 * Ori, omp) can use the same template library and provider routing without a
 * repo dependency.
 *
 * Tools:
 *   list_templates      -> [{ id, kind, name, refs }]
 *   show_template       -> template JSON (arg: id)
 *   save_template       -> persist a template from reference images + spec
 *   generate_cover      -> generate candidates from a template (+ refs/overrides)
 *
 * Register (examples):
 *   claude mcp add book-cover-designer -- node <path>/mcp-server.mjs
 *   codex mcp add book-cover-designer -- node <path>/mcp-server.mjs
 *   grok:  add [mcp_servers.book-cover-designer] to ~/.grok/config.toml
 *   opencode: add mcpServers entry to ~/.opencode/config.json
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "cover.mjs");

/* Minimal stdio JSON-RPC MCP. On each line: {jsonrpc,id,method,params}. */

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`))));
  });
}

async function handleTool(name, args) {
  switch (name) {
    case "list_templates": {
      const out = await runCli(["list"]);
      const rows = out.split("\n").filter(Boolean).map((l) => {
        const id = l.split(/\s+/)[0];
        return { id, line: l };
      });
      return { content: [{ type: "text", text: out }], structured: rows };
    }
    case "show_template": {
      if (!args?.id) throw new Error("id required");
      const out = await runCli(["show", String(args.id)]);
      return { content: [{ type: "text", text: out }] };
    }
    case "save_template": {
      const a = args || {};
      if (!a.id || !a.promptArt) throw new Error("id and promptArt required");
      const cliArgs = ["save", "--id", String(a.id), "--prompt-art", String(a.promptArt)];
      for (const [flag, val] of [["name", "name"], ["kind", "kind"], ["description", "description"], ["refs", "refs"], ["role", "role"], ["model", "model"]]) {
        if (a[val]) cliArgs.push(`--${flag}`, String(a[val]));
      }
      const out = await runCli(cliArgs);
      return { content: [{ type: "text", text: out }] };
    }
    case "generate_cover": {
      const a = args || {};
      if (!a.template || !a.out) throw new Error("template and out required");
      const cliArgs = ["generate", "--template", String(a.template), "--out", String(a.out)];
      for (const [flag, key] of [["title", "title"], ["author", "author"], ["subtitle", "subtitle"], ["subject", "subject"], ["tone", "tone"], ["genre", "genre"], ["refs", "refs"], ["provider", "provider"], ["model", "model"], ["count", "count"], ["aspect", "aspect"]]) {
        if (a[key]) cliArgs.push(`--${flag}`, String(a[key]));
      }
      const out = await runCli(cliArgs);
      return { content: [{ type: "text", text: out }] };
    }
    default:
      throw new Error(`unknown tool ${name}`);
  }
}

const decoder = new TextDecoder();
let buf = "";
process.stdin.on("data", async (chunk) => {
  buf += decoder.decode(chunk, { stream: true });
  let idx;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let req;
    try { req = JSON.parse(line); } catch { continue; }
    const respond = (result) => send({ jsonrpc: "2.0", id: req.id, result });
    const respondError = (error) => send({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: String(error?.message || error) } });

    if (req.method === "initialize") {
      respond({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "book-cover-designer", version: "1.0.0" },
      });
    } else if (req.method === "tools/list") {
      respond({
        tools: [
          { name: "list_templates", description: "List saved book cover templates", inputSchema: { type: "object", properties: {} } },
          { name: "show_template", description: "Show a template's full spec JSON", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
          { name: "save_template", description: "Save a new cover template from reference images + art prompt", inputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, kind: { type: "string", enum: ["type-only", "illustrated", "photographic", "hybrid"] }, description: { type: "string" }, promptArt: { type: "string" }, refs: { type: "string", description: "comma-separated image paths" }, role: { type: "string" }, model: { type: "string" } }, required: ["id", "promptArt"] } },
          { name: "generate_cover", description: "Generate cover art candidates from a template (uses OPENROUTER_API_KEY/OPENAI_API_KEY/XAI_API_KEY/GEMINI_API_KEY)", inputSchema: { type: "object", properties: { template: { type: "string" }, out: { type: "string" }, title: { type: "string" }, author: { type: "string" }, subtitle: { type: "string" }, subject: { type: "string" }, tone: { type: "string" }, genre: { type: "string" }, refs: { type: "string", description: "comma-separated image paths to add as references" }, provider: { type: "string", enum: ["openrouter", "openai", "xai", "gemini"] }, model: { type: "string" }, count: { type: "integer", minimum: 1, maximum: 4 }, aspect: { type: "string" } }, required: ["template", "out"] } },
        ],
      });
    } else if (req.method === "tools/call") {
      try {
        const result = await handleTool(req.params?.name, req.params?.arguments);
        respond(result);
      } catch (e) {
        respondError(e);
      }
    } else if (req.method === "notifications/initialized" || req.method === "resources/list") {
      // no-op: client initialized / no resources
    } else {
      respondError(new Error(`unsupported method ${req.method}`));
    }
  }
});