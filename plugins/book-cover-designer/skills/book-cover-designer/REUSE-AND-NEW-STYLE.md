# Book Cover Designer — Reuse & New-Style Workflow

How to reuse an existing cover style for a different book, and how to build a
brand-new style from fresh reference images. This is the operational companion
to the design pipeline in SKILL.md.

## A. Reuse an existing style for a different book

You don't re-derive anything — the template already encodes the style. You only
swap the **text**.

1. **Pick the template** (the style is already saved):
   ```bash
   node <skill>/bin/cover.mjs list                 # -> find the style id
   node <skill>/bin/cover.mjs show munich-72-banknote
   ```
   Templates live under `templates/<id>/`. `munich-72-banknote` is the approved
   style (cream panel, bordered color blocks, nested-arc motif, banknote moiré).

2. **Get the new book's text** — title, subtitle, author, edition, and any
   tool/version line. Keep it verbatim; this is the only part that changes.

3. **Generate candidates** with the template, substituting the new text:
   ```bash
   node <skill>/bin/cover.mjs generate --template munich-72-banknote \
     --out ./my-book/covers --title "My New Book" --subtitle "..." \
     --author "..." --count 3
   ```
   The template's art prompt has `{title}`, `{subtitle}`, `{author}` placeholders.
   `--refs` can add extra images if you want to vary the motif.

4. **Run the quality pass** (SKILL.md self-review checklist): title legible at
   thumbnail, ≤2 typefaces, safe zone, retailer dims, no watermark.

5. **Export per retailer** (Amazon 2560×1600 / Apple / Google / print) and
   promote the chosen pin.

> Same style, different book = change only the text. The composition, palette,
> textures, and motifs stay locked by the template.

## B. Create a NEW style from different reference images

The heavy work is **style extraction**: pull the design DNA out of the references
so the prompt carries it explicitly. Your earlier feedback is the rule set:

1. **Gather references** — put the new images in a folder (e.g.
   `book-cover-refs/my-style/`).

2. **Analyze each image in detail** — not a montage, each one individually.
   Extract per image:
   - **Palette** with hex approximations, and which colors are dominant vs accent
   - **Layout / grid** (zones, banding, alignment, negative space)
   - **Patterns & textures** (guilloche, engraving, halftone, screenprint grain,
     moiré, ruled lines, woven meshes) — this is often the soul of the style
   - **Typography** style and verbatim text
   - **Geometric motifs** and how they're constructed
   - **Art-creation style** (flat screenprint? engraved linework? photographic?)
   - A one-line art-direction name

   > Tool: use a vision-capable model / agent (AGY, Grok, or `inspect_image`) to
   > read each image. Give it the same per-image extraction checklist. Zoom into
   > textured regions (banknote/guilloche areas) for the fine detail.

3. **Synthesize the StyleDNA** — turn the per-image notes into one JSON
   (`templates/<new-id>/template.json`) with:
   - `styleDna`: intent, semantic descriptors, art-creation style
   - `palette`: core + secondary hex, plus a `note` on what's forbidden (e.g.
     "no mint/dark-green dominance")
   - `patterns`: grid, motifs, texture, `negativeConstraint` (what NOT to include
     from the subjects — e.g. "no literal stadium, no tickets")
   - `banknoteTexture` (if applicable): guilloche lattice, engraved line-density,
     line-as-tone, peripheral micro-index
   - `prompt.art` with `{title}`/`{subtitle}`/`{author}`/`{genre}` placeholders
   - `prompt.negative` and `prompt.roleRefs` (how references should be used —
     style board, not subject copy)
   - `references[]` pointing at the source images with roles

4. **Distinguish essence from subject** — the mistake to avoid: a reference is a
   sport *ticket*, but the style is the **graphic language** (palette, texture,
   grid, emblem), not the stadium. Extract essence; forbid the subject in the
   negative prompt.

5. **Explore arrangements** — the template can encode 6 named arrangements
   (banded / radial sunburst / modular grid / fan sectors / central lattice /
   stepped stack). Generate one variant per arrangement so the agent explores
   composition, not just one layout.

6. **Validate against the old-design trap** — if this replaces a prior cover,
   hard-negative the old palette & typography in the brief so the model cannot
   silently "reskin" it (e.g. "no mint ground, no dark-green lead").

7. **Save as a template** so it's reusable (step A) and committed to the repo.

## Watermark rule

Grok Imagine **always** stamps a small `Grok` logo/wordmark bottom-right; a "no
watermark" prompt does not remove it. If a Grok cover is chosen, regenerate the
final through **Gemini / AGY (Nano Banana)** which does not watermark, using the
approved composition as a guide. Always spider-check the final for any
watermark/logo/signature before promotion.

## Reference roles (from the provider matrix)

Use reference images as **style boards**: palette, grain, texture, grid, emblem
geometry. Never copy their subject matter or another cover's protected content.
Respect rights/provenance (see the provider-matrix research doc).
