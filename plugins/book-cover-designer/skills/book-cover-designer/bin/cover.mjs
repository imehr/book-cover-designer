#!/usr/bin/env node
/**
 * book-cover-designer portable CLI
 *
 * Zero-dependency Node (>=18, global fetch). Works standalone or under any
 * agent CLI that can run `node`. Generates cover ART candidates from a
 * template + optional reference images, and manages the local template
 * library.
 *
 * Provider routing (first available wins unless --provider given):
 *   1. OPENROUTER_API_KEY  → https://openrouter.ai/api/v1/images/generations
 *   2. OPENAI_API_KEY      → https://api.openai.com/v1/images/generations | /edits
 *   3. XAI_API_KEY / GROK_API_KEY → https://api.x.ai/v1/images/generations | /edits
 *   4. GEMINI_API_KEY      → https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *
 * Usage:
 *   cover.mjs list
 *   cover.mjs show <template-id>
 *   cover.mjs generate --template <id> --out <dir> [--title T] [--author A]
 *                      [--subtitle S] [--subject X] [--tone T] [--genre G]
 *                      [--refs a.png,b.png] [--provider openrouter|openai|xai|gemini]
 *                      [--model <id>] [--count N] [--aspect 1.6:1] [--dry-run]
 *   cover.mjs save --id <id> --name "Name" --prompt-art "..." [--kind illustrated]
 *                  [--refs a.png,b.png] [--role style] [--out <templates-dir>]
 *
 * Template location: ./templates next to this file, or BOOK_COVER_TEMPLATES env.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename, extname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = process.env.BOOK_COVER_TEMPLATES || join(HERE, "..", "templates");
const DEFAULT_ART_RATIO = "1.6:1";

/* ---------- helpers ---------- */

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function hasKey(name) {
  return !!(process.env[name] && process.env[name].length > 0);
}

function envKey(...names) {
  return names.find((n) => hasKey(n));
}

function assertTemplateDir() {
  if (!existsSync(TEMPLATES_DIR)) mkdirSync(TEMPLATES_DIR, { recursive: true });
}

function listTemplates() {
  assertTemplateDir();
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(TEMPLATES_DIR, d.name, "template.json")))
    .map((d) => {
      const t = JSON.parse(readFileSync(join(TEMPLATES_DIR, d.name, "template.json"), "utf8"));
      return { id: t.id || d.name, kind: t.kind, name: t.name, refs: (t.references || []).length };
    });
}

function loadTemplate(id) {
  const dir = join(TEMPLATES_DIR, id);
  const f = join(dir, "template.json");
  if (!existsSync(f)) fail(`unknown template '${id}' (try: cover.mjs list)`);
  return { dir, spec: JSON.parse(readFileSync(f, "utf8")) };
}

function resolveRefs(spec, extraRefs = "") {
  const out = [];
  for (const r of spec.references || []) {
    const p = join(TEMPLATES_DIR, spec.id, "references", r.file);
    if (existsSync(p)) out.push({ path: p, role: r.role });
  }
  for (const raw of (extraRefs || "").split(",").filter(Boolean)) {
    const p = raw.trim();
    if (!existsSync(p)) fail(`reference image not found: ${p}`);
    out.push({ path: p, role: "user-supplied" });
  }
  return out;
}

function fillPrompt(template, vars) {
  let p = template.prompt.art;
  for (const [k, v] of Object.entries(vars)) p = p.replaceAll(`{${k}}`, v ?? "");
  return p;
}

function toDataUrl(path) {
  const buf = readFileSync(path);
  const mime = extname(path).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  return { mime, data: buf.toString("base64"), size: buf.length };
}

function b64FromOpenAi(resp) {
  if (Array.isArray(resp.data)) {
    for (const d of resp.data) if (d.b64_json) return d.b64_json;
  }
  return null;
}

function b64FromGemini(resp) {
  const parts = resp?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) if (p.inlineData?.data) return p.inlineData.data;
  return null;
}

async function postJson(url, headers, body) {
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!r.ok) fail(`provider ${r.status}: ${text.slice(0, 500)}`);
  return json;
}

/* ---------- providers ---------- */

function detectProvider(model) {
  if (model) {
    if (model.startsWith("openai:")) return "openai";
    if (model.startsWith("xai:") || model.startsWith("grok:")) return "xai";
    if (model.startsWith("gemini")) return "gemini";
    if (model.startsWith("openrouter:")) return "openrouter";
  }
  if (envKey("OPENROUTER_API_KEY")) return "openrouter";
  if (envKey("OPENAI_API_KEY")) return "openai";
  if (envKey("XAI_API_KEY", "GROK_API_KEY")) return "xai";
  if (envKey("GEMINI_API_KEY")) return "gemini";
  fail("no image provider available: set OPENROUTER_API_KEY, OPENAI_API_KEY, XAI_API_KEY, or GEMINI_API_KEY");
}

function normalizeModel(provider, model) {
  if (!model) {
    switch (provider) {
      case "openrouter": return process.env.BOOK_COVER_MODEL || "openai/gpt-image-2";
      case "openai": return "gpt-image-2";
      case "xai": return "grok-imagine-image";
      case "gemini": return "gemini-3.1-flash-image-preview";
    }
  }
  return model.replace(/^(openai|xai|grok|openrouter):/, "");
}

function sizeForAspect(provider, aspect) {
  if (provider === "gemini") return null; // aspect passed in config
  const map = { "1.6:1": "1536x1024", "3:2": "1536x1024", "4:3": "1024x768", "1:1": "1024x1024", "2:3": "1024x1536", "9:16": "1024x1536" };
  return map[aspect] || map["1.6:1"];
}

async function generateOpenAiLike(provider, { model, prompt, count, aspect, refs }) {
  const base = provider === "xai" ? "https://api.x.ai" : provider === "openrouter" ? "https://openrouter.ai/api" : "https://api.openai.com";
  const key = provider === "xai" ? envKey("XAI_API_KEY", "GROK_API_KEY") : provider === "openrouter" ? envKey("OPENROUTER_API_KEY") : envKey("OPENAI_API_KEY");
  const headers = { Authorization: `Bearer ${key}` };
  const size = sizeForAspect(provider, aspect);

  if (refs.length) {
    // edit path: refs are input images; prompt instructs the transformation
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    if (size) form.append("size", size);
    form.append("n", String(count));
    for (const r of refs.slice(0, provider === "xai" ? 3 : 8)) {
      form.append("image", new Blob([readFileSync(r.path)], { type: "image/png" }), basename(r.path));
    }
    const res = await fetch(`${base}/v1/images/edits`, { method: "POST", headers, body: form });
    const text = await res.text();
    if (!res.ok) fail(`provider edit ${res.status}: ${text.slice(0, 500)}`);
    return JSON.parse(text);
  }

  const body = { model, prompt, n: count };
  if (size) body.size = size;
  return postJson(`${base}/v1/images/generations`, { ...headers, "Content-Type": "application/json" }, body);
}

async function generateGemini({ model, prompt, count, aspect, refs }) {
  const key = envKey("GEMINI_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${key}`;
  const parts = [];
  for (const r of refs.slice(0, 14)) {
    const d = toDataUrl(r.path);
    parts.push({ inlineData: { mimeType: d.mime, data: d.data } });
    parts.push({ text: `Reference image (role: ${r.role}). ${r.role === "style" ? "Use as style board: palette, texture, composition logic. Do not copy subjects." : "Inform the artwork."}` });
  }
  parts.push({ text: prompt });
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: aspect === "1:1" ? "1:1" : aspect === "2:3" || aspect === "9:16" ? "3:4" : "4:3", imageSize: "1K" },
    },
  };
  // count > 1: loop sequentially; Gemini returns one image per call
  const images = [];
  for (let i = 0; i < count; i++) {
    const json = await postJson(url, { "Content-Type": "application/json" }, body);
    const b64 = b64FromGemini(json);
    if (!b64) fail("gemini returned no image; response may be text-only: " + JSON.stringify(json).slice(0, 300));
    images.push(b64);
  }
  return images;
}

/* ---------- commands ---------- */

function cmdList() {
  const ts = listTemplates();
  if (!ts.length) {
    console.log("no templates yet. save one: cover.mjs save --id <id> --prompt-art \"...\"");
    return;
  }
  for (const t of ts) console.log(`${t.id.padEnd(28)} ${t.kind.padEnd(12)} ${t.name} (${t.refs} refs)`);
}

function cmdShow(id) {
  const { spec } = loadTemplate(id);
  console.log(JSON.stringify(spec, null, 2));
}

async function cmdGenerate(opts) {
  const { template: tid, out } = opts;
  if (!tid) fail("--template <id> required");
  if (!out) fail("--out <dir> required");
  const { spec } = loadTemplate(tid);
  const provider = detectProvider(opts.model || spec.provider?.defaultModel);
  const model = normalizeModel(provider, opts.model || spec.provider?.defaultModel);
  const count = Math.max(1, Math.min(Number(opts.count) || 1, 4));
  const aspect = opts.aspect || spec.provider?.aspect || DEFAULT_ART_RATIO;
  const refs = resolveRefs(spec, opts.refs);

  const prompt = fillPrompt(spec, {
    title: opts.title || "A BOOK",
    author: opts.author || "",
    subtitle: opts.subtitle || "",
    subject: opts.subject || "",
    tone: opts.tone || "",
    genre: opts.genre || "",
  }).trim();

  console.log(`generating via ${provider}/${model} (aspect ${aspect}, ${refs.length} refs, n=${count})`);
  if (opts["dry-run"]) {
    console.log("--- prompt ---\n" + prompt + "\n---");
    console.log(JSON.stringify({ provider, model, aspect, refs: refs.map((r) => ({ path: r.path, role: r.role })) }, null, 2));
    return;
  }

  mkdirSync(out, { recursive: true });
  const manifest = {
    template: tid,
    provider,
    model,
    prompt,
    aspect,
    refs: refs.map((r) => ({ path: r.path, role: r.role })),
    generatedAt: new Date().toISOString(),
    candidates: [],
  };

  let images;
  if (provider === "gemini") {
    images = await generateGemini({ model, prompt, count, aspect, refs });
  } else {
    const json = await generateOpenAiLike(provider, { model, prompt, count, aspect, refs });
    const b64 = b64FromOpenAi(json);
    images = b64 ? [b64] : [];
  }

  for (let i = 0; i < images.length; i++) {
    const p = join(out, `candidate-${String(i + 1).padStart(2, "0")}.png`);
    writeFileSync(p, Buffer.from(images[i], "base64"));
    manifest.candidates.push({ file: basename(p), bytes: statSync(p).size });
    console.log(`wrote ${p}`);
  }
  writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`manifest: ${join(out, "manifest.json")}`);
}

function cmdSave(opts) {
  const id = opts.id;
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) fail("--id <slug> required (lowercase, hyphens)");
  if (!opts["prompt-art"]) fail("--prompt-art <full art prompt> required");
  const dir = join(TEMPLATES_DIR, id);
  const refsDir = join(dir, "references");
  mkdirSync(refsDir, { recursive: true });

  const references = [];
  if (opts.refs) {
    for (const raw of opts.refs.split(",").filter(Boolean)) {
      const src = raw.trim();
      if (!existsSync(src)) fail(`reference image not found: ${src}`);
      const dest = join(refsDir, basename(src));
      copyFileSync(src, dest);
      references.push({ file: basename(dest), role: opts.role || "style" });
    }
  }

  const spec = {
    id,
    version: 1,
    name: opts.name || id,
    kind: opts.kind || "illustrated",
    description: opts.description || "",
    layout: { composition: opts.composition || "", margins: opts.margins || "10% safe zone", safeZone: 0.1 },
    typography: { classification: opts["type-class"] || "", families: [], hierarchy: opts.hierarchy || "" },
    palette: { colors: opts["palette-colors"] ? opts["palette-colors"].split(",").map((s) => s.trim()) : [], contrast: opts.contrast || "" },
    prompt: { art: opts["prompt-art"], negative: opts["prompt-negative"] || "", roleRefs: opts["role-refs"] || "" },
    references,
    provider: { preferred: [], defaultModel: opts.model || "openai/gpt-image-2", aspect: opts.aspect || "1.6:1" },
    provenance: { createdBy: process.env.USER || "unknown", createdAt: new Date().toISOString(), source: opts.source || "saved via cover.mjs" },
  };
  writeFileSync(join(dir, "template.json"), JSON.stringify(spec, null, 2));
  console.log(`saved template ${id} -> ${dir}`);
  console.log(`  ${references.length} reference image(s) copied to ${refsDir}`);
}

/* ---------- main ---------- */

const [cmd, ...rest] = process.argv.slice(2);
const opts = {};
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : "true";
    opts[k] = v;
  }
}

switch (cmd) {
  case "list": cmdList(); break;
  case "show": if (!rest[0]) fail("usage: cover.mjs show <template-id>"); cmdShow(rest[0]); break;
  case "generate": await cmdGenerate(opts); break;
  case "save": cmdSave(opts); break;
  case "--help":
  case "help":
  default:
    console.log(`book-cover-designer CLI

commands:
  list                        list saved templates
  show <id>                   print template JSON
  generate --template <id> --out <dir> [--title T] [--author A] [--subtitle S]
           [--subject X] [--tone T] [--genre G] [--refs a.png,b.png]
           [--provider openrouter|openai|xai|gemini] [--model <id>]
           [--count 1-4] [--aspect 1.6:1] [--dry-run]
  save --id <id> --prompt-art "<art prompt>" [--name N] [--kind illustrated]
       [--refs a.png,b.png] [--role style] [--description D]

templates dir: ${TEMPLATES_DIR}
providers read keys from env: OPENROUTER_API_KEY, OPENAI_API_KEY, XAI_API_KEY, GEMINI_API_KEY
`);
}