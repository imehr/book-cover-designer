# Book Cover Designer

Design book covers like an advanced graphic designer — any genre, any retailer. **Concept before pixels**: read the text as a designer, choose a depiction plane, build a one-sentence visual argument, then compose on a modular grid with disciplined typography.

Portable plugin: works in **Claude Code**, **Codex CLI / Codex Desktop**, **Grok**, **OpenCode**, **Kimi**, **Ori**, and any MCP-capable agent, standalone from any book-writing repo.

## What it does

- **Concept engine** (Mendelsund): read-for-tone, depiction-plane taxonomy, image-correspondence, anti-cliché, genre signaling
- **Typography** (Bringhurst + Lupton + Tschichold): ≤2 typefaces, title→author hierarchy, type-crime self-check
- **Grid & form** (Müller-Brockmann): columns/gutters/margins/baseline, rational proportions
- **Templates**: design once from reference images → save as a reusable template → reuse in any tool
- **Provider routing**: OpenRouter → OpenAI → xAI Grok → Gemini, whichever key the running CLI exposes
- **Retailer matrix**: Amazon KDP / Apple Books / Google Play Books / print wrap specs

## Install

### Claude Code

```bash
# from this repo
claude plugin install book-cover-designer@imehr-marketplace
# or directly from a local checkout
claude plugin install /path/to/book-cover-designer
```

### Codex CLI / Codex Desktop

```bash
# add the GitHub repo as a plugin marketplace, then install
codex plugin marketplace add imehr/book-cover-designer
codex plugin add book-cover-designer
```

Or from a local checkout:

```bash
codex plugin marketplace add /path/to/book-cover-designer
codex plugin add book-cover-designer
```

Codex Desktop reads the same `~/.codex` plugin config as the CLI — installing with the CLI makes the plugin available in the desktop app.

### Any other agent CLI (Grok, OpenCode, Kimi, Ori)

```bash
bash <skill>/bin/install.sh
```

Symlinks the skill into every installed CLI's skill directory and registers the MCP server where the CLI supports it.

## MCP tools

Register the MCP server (`skills/book-cover-designer/bin/mcp-server.mjs`) in any agent:

| Tool | Purpose |
|------|---------|
| `list_templates` | List saved cover templates |
| `show_template` | Show a template's full spec |
| `save_template` | Save a template from reference images + art prompt |
| `generate_cover` | Generate cover candidates from a template |

## CLI

```bash
node skills/book-cover-designer/bin/cover.mjs list
node skills/book-cover-designer/bin/cover.mjs generate --template editorial-system-field --out ./candidates \
  --title "The Agentic Designer" --author "Mehran Mozaffari" --subject "geometric field" --count 3
node skills/book-cover-designer/bin/cover.mjs save --id my-brand --name "Our Brand Cover System" \
  --prompt-art "<art prompt>" --refs board1.png,board2.png --role style
```

Providers read keys from env: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY`.

## Design knowledge

The skill encodes the process from five of the most-cited books on the craft: Bringhurst's *The Elements of Typographic Style*, Lupton's *Thinking with Type*, Tschichold's *The Form of the Book*, Müller-Brockmann's *Grid Systems in Graphic Design*, and Mendelsund's *Cover*.

## License

MIT