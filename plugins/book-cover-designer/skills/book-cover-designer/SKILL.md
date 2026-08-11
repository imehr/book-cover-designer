---
name: book-cover-designer
description: "Design a book cover like an advanced graphic designer — any genre, any retailer. Drives the read-the-text conceptual workflow (tone/theme/atmosphere), the depiction-plane choice, cover structure selection, modular grid, typography (title/author/subtitle hierarchy), palette, and per-retailer export (Amazon KDP, Google Books, Apple Books, print wrap). Use when designing a book cover, generating cover candidates, choosing a cover concept/style, or making an existing cover look professional. Triggers: 'design a book cover', 'cover concept', 'make a cover for', 'choose a cover style', 'how should this cover look', 'title treatment', 'cover grid', 'cover for Amazon/Google/Apple', 'generate cover candidates'."
user-invocable: true
argument-hint: "[book slug or title+genre+brief]"
---

# Book Cover Designer

Design covers with a professional designer's method: **concept before pixels.** A cover is a translation of the book into one image — not decoration. This skill encodes the process of the field's most cited designers (Mendelsund, Bringhurst, Lupton, Tschichold, Müller-Brockmann) and the current retailer specs.

This skill is **portable**: it works inside the book-writer repo (handing off to its cover CLI/Studio) AND standalone under any agent CLI (Claude Code, Grok, Codex, OpenCode, Kimi, Ori, agy, omp). Generation uses whichever image provider the environment exposes — see **9b. Provider routing** — and the **template system** (section 11) lets you design from reference images and reuse them forever.

When this skill activates you run the full pipeline below, then hand off to the available cover tooling (repo CLI/Studio, or the bundled portable `bin/cover.mjs` / MCP server).

## The golden rule

`typography exists to honor content` (Bringhurst) and `a cover is a visual argument` (Mendelsund). Run the CONCEPT engine before touching any pixel. If you start with "make it pretty," you've already failed.

---

## Pipeline

1. **Clarify the brief** — title, subtitle, author, genre, sub-genre, audience, message, tone. Retailer set (Amazon / Google / Apple / print). One cover or a series?
2. **Read as a designer** — absorb the manuscript/abstract/outline. Extract tone, theme, atmosphere, inner structure. Read *against the grain*: not for plot, but for the book's soul.
3. **Choose a depiction plane** (from Mendelsund's taxonomy below) + fit to genre.
4. **Write a one/two-sentence concept statement** — the central visual argument. Get this approved mentally before generating.
5. **Choose cover structure** — type-only vs illustrated; pick a style (see repo `book-image-designer` styles).
6. **Grid the canvas** — modular columns + margins + baseline for deliberate placement.
7. **Select type** — 1–2 families; title display + author + subtitle hierarchy; spacing.
8. **Palette + art direction** — aligned to tone and genre.
9. **Generate candidates** (portable `cover.mjs`, repo CLI / Studio, or MCP tool), review, promote one.
10. **Quality pass** — type crimes, thumbnail legibility, safe zone, retailer dims.
11. **Export per-retailer** — eBook RGB + print PDF wrap.

---

## 2. Read as a designer (Mendelsund)

- Read for **tone, theme, atmosphere** and structure, not plot spoilers.
- **Concretize:** drag the book from abstract perfection into a specific, memorable image. Avoid vague "generic book" imagery.
- **The "Not-There":** often the strongest cover shows what is *not* literally in the text — an image-correspondence that captures the *feeling* of the work. It suggests; it does not depict.
- **Push away from cliché** — even on commercial titles. A cover that looks like every other book in its genre is invisible on the shelf and in the thumbnail grid.

### Depiction-plane taxonomy
A cover can depict (pick the right plane for THIS book + genre):

| Plane | Example | When |
|-------|---------|------|
| **Character** | a person central to the book | character-driven fiction |
| **Object** | a symbolic object | theme-object books |
| **Event** | a scene | plot-forward books |
| **Place** | the setting | setting-driven books |
| **Time** | era/period cues | historical, sci-fi |
| **Text sample** | the typography IS the image | literary, poetic, minimal |
| **Tone** | mood/atmosphere as the subject | literary fiction, memoir |
| **Plot** | a story event | thrillers, commercial |
| **Theme** | abstract meaning | upmarket, philosophical |
| **Parallel imagery** | an oblique correspondence | literary, artistic |

Choose ONE dominant plane; blend at most one secondary.

---

## 3. Structure: type-only vs illustrated

- **Type-only** (typography carries the concept): poster, minimal, framed, full-bleed, editorial-split, type-stack, spec-sheet, photographic. Use when the title/typography IS the idea (Text-sample plane), literary, minimal, or brand-driven.
- **Illustrated / art** (a generated hero image): engraving, flat illustration, floral/cultural motifs, miniature, etc. Use when a character/object/place/theme wants an image.
- If art is wanted, fetch the repo's available cover styles (`bun run scripts/generate-book-cover.ts --list`) and pass a `--motif` or full `--subject` art prompt.

---

## 4. Grid the canvas (Müller-Brockmann + Lupton)

Every cover is Letter + Text + Grid compressed to one page. Be deliberate:

- **Margins:** generous, rational (proportional to the canvas), not arbitrary. Traditional margin ratios over random padding.
- **Columns:** pick a modular count that suits the layout (e.g. a 4-column cover: title block, author, subtitle, art each sit on the grid). Column width derived from the target line-length/type size.
- **Gutters:** set explicitly for spacing between columns/blocks.
- **Baseline / rows:** keep title and author optically aligned on a consistent rhythm.
- **Breaking the grid deliberately** (not accidentally) is what creates expressive covers.

---

## 5. Typography (Bringhurst + Lupton + Tschichold)

### Selection discipline
- **Max two typefaces** per cover; one is often strongest. Mix faces that share an x-height or provenance.
- Use the **anatomy vocabulary** to *specify* precisely: x-height, cap height, stem, bowl, counter, serif, weight, tracking.
- Let classification carry meaning: Didone = formal/high contrast, geometric sans = modern/clean, slab = sturdy, old-style serif = classical/literary.
- Provenance matters: a face's era and design voice tells you what it "says" and when it's appropriate.

### Hierarchy (Tschichold's title-page grammar → cover)
The cover has a strict reading order — build it, don't fake it with same-size bold:
1. **Title** — the largest, dominant voice. A display size.
2. **Subtitle** (if any) — clearly secondary.
3. **Author** — tertiary, always legible (retailer-dependent placement: Amazon KDP often wants it near top or bottom).
4. **Imprint / edition** — smallest.
Set a defined scale (e.g. 4–6 steps), never fake hierarchy with bold-at-same-size alone.

### Spacing & setting
- Body/paragraph text that appears on cover: 45–75 characters per line, ~1.2 line-height.
- Display: control tracking/letterspacing deliberately; large caps benefit from tight or letterspaced settings.
- Dash/punctuation correctness (en/em dashes, no double spaces) — this separates pro from amateur.
- **Type crimes to avoid (self-check):** stretching/squashing type, more than 2 families, fake small-caps/bold, misused dashes, rivers, orphans, underlining where small caps belong, display type set too small or at zero tracking.

---

## 6. Palette & art direction

- Align palette to **tone and genre**, not to "pretty colors."
- Ensure **high contrast** between type and background for thumbnail legibility.
- Literature upmarket: restrained, tonal, often muted or typographic. Commercial: genre-coded color (romance pinks, thriller dark/saturated, business blue/green, horror high-contrast).
- Keep palette small (1–3 hues + neutrals) — restraint reads as professional.

---

## 7. Concept statement template

Write and hold this before generating:
> "The cover of *{Title}* should read as {one-line vibe}. Concept: {depiction plane} of {subject} evoking {tone}. Typography: {family/classification} conveying {register}. Palette: {colors} matching {genre/tone}."

---

## 8. Thumbnail discipline (all retailers)

Covers are seen first as tiny thumbnails:
- Title and author must be **large, legible, high-contrast** at thumbnail size.
- Leave a **~10% safe zone** around edges so platform UI/cropping never clips title/author/art.
- Test mentally at ~100px wide: can a stranger read the title and get the genre in one glance?
- If it doesn't work at thumbnail size, it doesn't work.

---

## 9. Platform / retailer export matrix (2025)

| Retailer | Ideal size | Min | Aspect | Format | Notes |
|----------|-----------|-----|--------|--------|-------|
| **Amazon KDP (Kindle)** | 2560 × 1600 | 1000 × 625 | 1.6:1 | JPEG/TIFF | ≤50MB, 300 DPI, RGB |
| **Apple Books** | high-res | 1400 px short side | 1.6:1 | JPEG/PNG | RGB |
| **Google Play Books** | 2400 × 2400 | — | 1:1 (square) | JPEG | square recommended |
| **Print (paperback/hardcover)** | per trim+page count | — | — | single PDF | front+spine+back, ≥300 DPI, CMYK |

**Universal master approach:** design one **2560 × 1600 px @ 300 DPI (1.6:1)** master; downscale for Apple; recrop/downscale for Google's 1:1. eBook specs are RGB; print wrap is CMYK.
**Always re-check retailer specs at design time** — they change; never hardcode.

---

## 9b. Provider routing (portable — works in any agent CLI)

Generation routes to whichever image model is reachable from the current environment. No repo dependency:

| Priority | Env key | Default model | Notes |
|----------|---------|---------------|-------|
| 1 | `OPENROUTER_API_KEY` | `openai/gpt-image-2` | OpenAI-compatible; present in many setups |
| 2 | `OPENAI_API_KEY` | `gpt-image-2` | |
| 3 | `XAI_API_KEY` / `GROK_API_KEY` | `grok-imagine-image` | Up to 3 reference images (multi-image edit) |
| 4 | `GEMINI_API_KEY` | `gemini-3.1-flash-image-preview` | Up to 14 references; strongest style-board support |

Each agent CLI carries its own auth to its subscription's image model. Use that auth — the skill only needs the env key to be visible to the CLI you run:

- **Claude Code** — inherits your shell env; or run `claude` with keys exported. Claude's own image tooling can also be used directly.
- **Codex** — uses OpenAI auth; expose `OPENAI_API_KEY` or route through OpenRouter.
- **Grok** — uses xAI auth (`~/.grok/auth.json`); export `XAI_API_KEY` or point at Grok Imagine.
- **Kimi / Ori / omp / agy** — export whichever provider key you want to use; all read env.

Reference-image behavior degrades gracefully: if the provider has no reference role (or the ref count exceeds its limit), refs become ordered prompt context or are truncated deterministically — never silently dropped mid-template.

**Never hardcode provider specifics in the skill.** The provider matrix research (`docs/research/2026-08-11-agentic-cover-provider-matrix.md`) covers capabilities, rights, and provenance; revalidate before production use.

**Portable generation tool** (works outside the repo too):
```bash
node <skill>/bin/cover.mjs list
node <skill>/bin/cover.mjs generate --template editorial-system-field --out ./candidates \
  --title "The Agentic Designer" --author "Mehran Mozaffari" --subject "geometric field" --count 3
```

---

## 10. Handoff to tooling

**In the book-writer repo**, generate with the existing infrastructure:

- **Styled generation:** `bun run scripts/generate-book-cover.ts --book <slug> --style <id>` (list styles with `--list`). `--motif` weaves a subject into a style; `--subject` is a full art-prompt override.
- **Studio:** `?tab=cover` Cover tab for candidate review, promote/pin, and the Kindle/EPUB/PDF/wrap artifact matrix. KDP tab packages print (6.14×9.21 trim, no bleed, wrap PDF) + upload sheet.
- **Model routing (auto-affinity):** typography covers → OpenAI/gpt-image; editorial/illustrated covers → Gemini/Nano Banana; reference-led → Gemini or xAI. Manual override always wins.
- **Pin:** promote the chosen candidate (sets `cover_layout` + `cover_art_asset`; wrap front follows the pin so KDP print matches the promoted art).

**Standalone (any agent CLI),** use the bundled portable kit:

```bash
<skill>/bin/install.sh   # symlinks skill into every CLI + registers MCP
node <skill>/bin/cover.mjs generate --template <id> --out <dir> [refs/vars]
```

Or register the MCP server (`claude mcp add … -- node <skill>/bin/mcp-server.mjs`) and call `generate_cover` / `save_template` / `list_templates` as tools — same template library from any MCP-capable agent.

Requires at least one image-provider key — there is no offline pixel fallback.

---

## 11. Templates & reference-driven design

A **template** is a folder under `templates/<id>/` containing `template.json` (style spec: layout, typography, palette, prompt program with `{title}`/`{author}`/`{subtitle}`/`{subject}`/`{tone}`/`{genre}` placeholders, provider preferences) plus an optional `references/` dir of reference images (style boards, subject refs).

### Design from reference images
When the user provides a few images (a style board, inspiring covers, brand assets):

1. **Interpret the refs first** (designer mode): name what each contributes — palette, texture, composition logic, subject, typography mood. This becomes the template's `reference` roles.
2. **Write the art prompt** from the refs' *logic*, not verbatim copying (copyright: influence style, don't reproduce elements).
3. **Generate with refs**:
   ```bash
   node <skill>/bin/cover.mjs generate --template <id> --out ./candidates \
     --refs board1.png,board2.png --subject "…"
   ```
   Refs flow to the provider's reference role (Gemini ≤14, xAI ≤3, OpenAI/OpenRouter edit path).

### Save as a reusable template
```bash
node <skill>/bin/cover.mjs save --id my-brand-style --name "Our Brand Cover System" \
  --prompt-art "<art prompt with {title} placeholder>" \
  --refs board1.png,board2.png --role style
```
Copies the refs into the template folder; the template is then usable in any CLI and any future book. Template JSON schema: `templates/_schema.json`. Manage with `cover.mjs list` / `show <id>`, or MCP `save_template` / `list_templates`.

Rules:
- Ref images that are other publishers' covers or third-party art must not be copied verbatim — use them as style direction only, and honor rights/provenance (see provider-matrix research).
- Templates are versioned (`version` field) and immutable-by-revision: bump the version rather than editing in place when a released cover depends on one.

---

## Self-review checklist before yielding

- [ ] Concept statement written (depiction plane + tone + genre fit), not just "a cover."
- [ ] ≤2 typefaces; title > subtitle > author hierarchy is legible at thumbnail size.
- [ ] Type-crime pass run (no stretched type, no >2 families, correct dashes).
- [ ] Modular grid used; margins are rational, not arbitrary.
- [ ] Palette aligned to tone/genre with type-background contrast.
- [ ] ~10% safe zone respected; no critical text at the very edge.
- [ ] Retailer export matrix applied (Amazon 2560×1600 / Apple short-side ≥1400 / Google 1:1 / print CMYK wrap).
- [ ] Promote pins the exact chosen bytes and rebuilds wrap after promote.