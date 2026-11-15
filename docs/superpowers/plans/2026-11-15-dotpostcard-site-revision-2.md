# dotpostcard.org Revision 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply JP's first-look feedback: a calmer "Flip or flop" band, a tongue-in-cheek voice, a scanner-only "Easy to make", and a three-tab file → front → back sequence for "Everything stays together".

**Architecture:** Builds on the existing site (branch `sesh/dotpostcard-site`): `src/lib/cards.ts` + generated `cards.json`, `src/lib/showcase.ts`, `src/lib/Postcard.svelte` (library markup, vendored `postcards@0.49.0.css`), `src/lib/MetadataPanel.svelte`, sections in `src/lib/sections/`.

**Tech Stack:** unchanged (SvelteKit 2 / Svelte 5, pnpm, vitest + jsdom, Playwright).

**Spec:** `docs/superpowers/specs/2026-11-15-dotpostcard-site-design.md`, especially the **Revision 2** section at the end, which overrides earlier sections where they conflict.

## Global Constraints

- All earlier Global Constraints in `docs/superpowers/plans/2026-11-15-dotpostcard-site.md` still hold (unmodified library CSS, card data only from `cards.json`, showcase decided in `showcase.ts`, colours, no whole email in HTML, links).
- Exact copy pinned by JP (verbatim): hero "The open digital postcard format" / "Lovingly made by a geek with postcard fixation and the limited space of a London flat."; "Flip or flop" / "Store which way the postcard flips, for unnecessary accuracy."; "Everything stays together." / "Just an image with standard XMP metadata inside, so you never lose context."; "Scan postcards rapidly with an Epson FastFoto FF-680W"; chip "dates"; the terminal transcript in the spec's Revision 2 section.
- Voice for all other copy: knowing, tongue-in-cheek Apple-page pastiche; short. JP reviews.
- Showcase: hero `athens`, band `france`, `assisi`, `china`, together `around-we-go`, ar `athens`.
- Measurement labels come from data: px from `physical.frontSize.pxW/pxH` (file height = 2 × front height), cm via `cm()`.

## Review Focus

1. **Reduced motion**: the band doesn't loop and the fold doesn't animate; everything still reachable by tap/keyboard. Tests in Tasks 7 and 8.
2. **Keyboard on the tabs**: the tabs follow the ARIA tabs pattern (arrow keys move between tabs). Test in Task 8.
3. **Constant column height**: the right column must not change height across tabs. Test in Task 8.
4. **A card with sparse metadata** (`around-we-go`): no empty labels or "undefined"; an empty tab says so. Test in Task 8.
5. **Phone width (390px)**: the scanner photo, terminal and tabbed section stack without sideways scroll. Test via the existing phone-fit e2e.

---

### Task 7: Calmer band, new voice, scanner-only "Easy to make"

**Files:**
- Modify: `src/lib/showcase.ts`, `src/lib/cards.json` (regenerate with `scripts/cards.sh`), `src/lib/sections/Hero.svelte`, `LooksBand.svelte`, `Make.svelte`, `Developers.svelte`, `LookThrough.svelte`, `Footer.svelte` (copy only where voice needs it), `src/lib/Postcard.svelte` (only if the loop needs a new motion mode), tests and e2e that pin old copy or old cards
- Delete: `static/cards/hold-on.postcard.webp`, `static/cards/dualism.postcard.webp`
- Create: `static/scanner/epson-ff680w.png` (copy of `/Users/jp/Downloads/epson-ff680w.png`, 2449×2195 RGBA; consider a downscaled ~1200px-wide copy to keep weight down)
- (`static/cards/around-we-go.postcard.webp` is already in place, uncommitted; commit it in this task.)

**Interfaces:**
- Produces: `showcase.together === 'around-we-go'`, `showcase.band = ['france','assisi','china']` (Task 8 consumes `together`).
- If `Postcard.svelte` gains a motion mode for the loop, name it `motion="sequence"` with a `delay` prop, and keep `spin` only if still used (otherwise remove it and its tests).

Band loop, per the spec: a 7s CSS animation of the library's `--flip`, per card: 0→180deg over the first 1s (ease-in-out), hold, 180→360deg starting at 3.5s over 1s, hold to 7s; card i is offset by `i × 250ms`. Under `prefers-reduced-motion: reduce` there's no animation, and the cards tap to flip (keep them focusable then, as `spin` does today).

- [ ] **Step 1:** Regenerate data and showcase: delete the two unused cards, run `scripts/cards.sh`, update `showcase.ts`. Update `tests/cards.test.ts` and other tests naming the removed cards. Run `pnpm test`; expected PASS.
- [ ] **Step 2: Failing e2e for the loop.** In `e2e/postcards.test.ts`: (a) the three band cards' computed `--flip` at ~0.6s after load satisfies france > assisi > china (staggered), and all three read `180deg` at ~2.5s (held still); (b) under reduced motion, none animates and a click flips one. Update selectors from `.spin` to whatever the new mode's class is. Run; expected FAIL.
- [ ] **Step 3:** Implement the loop and the band copy ("Flip or flop" + line). Run `pnpm test:e2e e2e/postcards.test.ts`; expected PASS.
- [ ] **Step 4:** Make section: heading in the new voice; the pinned line "Scan postcards rapidly with an Epson FastFoto FF-680W"; the scanner photo beside it (padding around the transparent image, alt text describing the scanner, `width`/`height` attributes); chips orientation, descriptions, handwriting transcription, location, dates; the copyable `brew install jphastings/tools/fastfoto-postcards`; a terminal-window mockup (window chrome dots, monospace, dark in both modes) containing the transcript verbatim as text (not an image). Developers: add `brew install jphastings/tools/postcards`. Hero: the pinned headline and sub-copy. Redraft other section copy in the new voice.
- [ ] **Step 5:** Update `e2e/page.test.ts` for the new copy: the hero headline, the fastfoto-only brew command, the terminal transcript lines present, the postcards brew in Developers. Run `pnpm check && pnpm lint && pnpm test && pnpm test:e2e`; expected PASS.
- [ ] **Step 6:** Screenshot with Playwright's Chromium (never `/Applications/Google Chrome.app`) at 1440 and 390, light and dark, into the screens folder the controller names. Look, fix, commit.

---

### Task 8: "Everything stays together" as file → front → back

**Files:**
- Modify (rewrite): `src/lib/MetadataPanel.svelte`; `src/lib/sections/Together.svelte` (copy)
- Test: `tests/MetadataPanel.test.ts`, `e2e/together.test.ts` (new)

**Interfaces:**
- Consumes: `getCard`, `cm`, `sideSize`, `formatDate`, `transcriptionLanguage`, `isHeteroriented`, `Postcard` (`bind:flipped`), `showcase.together`.
- Produces: `MetadataPanel.svelte` with props `{ card: Card }`, internal state `view: 'file' | 'front' | 'back'`.

Behaviour (spec Revision 2 is the authority):
- **Tabs** "Postcard", "Front", "Back" use the ARIA tabs pattern (`role="tablist"`/`tab`/`tabpanel`, `aria-selected`, Left/Right arrow keys, Home/End). Clicking or tapping the card advances file → front → back → file.
- **Constant height:** stack all three tab panels in one CSS grid cell (`grid-area: 1/1`), hiding inactive ones with `visibility: hidden`, so the column is always as tall as the tallest panel.
- **File view:** show the raw file image (`card.src` as an `<img>`, front above back) at the stage width. Dimension lines on the right and bottom read `{pxW} px` and `{2 × pxH} px` (for around-we-go: `1536 px`, `2132 px`).
- **Fold to front:** the lower half (the same image, showing its bottom half) rotates about the midline away from the viewer until it's hidden behind the front (≈1s, ease-in-out; `backface-visibility: hidden`). The labels switch to cm (`cm(frontSize.cmW)`, `cm(frontSize.cmH)`) as it folds, and the dimension lines shrink to the front's height. When the fold lands, the library-drawn `Postcard` takes over at exactly the front's box, with no visible jump. Easing the folded card to the stage's vertical centre is your call. Going back from front to file plays the fold in reverse.
- **Front ↔ back:** the library's calendar flip (`flipped`). The measurements stay visible, never fading.
- **Panels:**
  - **Postcard** shows Title (if stored), Location, Sent on, From, To (names only), Flip, Size (cm), and File (`{name}.postcard.webp`).
  - **Front** and **Back** each show Description, Transcription (with its language), and "Anonymised" with the dashed swatch to the *right* of the word → "Anonymised regions (eg. for an address)" when that side has secrets. Anonymised regions are drawn on the side shown, as now.
  - Omit fields that aren't stored. A tab with nothing stored shows one muted line: "Nothing stored about this side." (or "…about this postcard." for the Postcard tab).
- **Reduced motion:** views swap without fold or flip animation.

- [ ] **Step 1: Failing tests** in `tests/MetadataPanel.test.ts`, replacing the old ones:
  - around-we-go starts on "Postcard", showing "Calendar", "14.2 cm × 9.9 cm" (or however size is phrased, from `cm`) and "around-we-go.postcard.webp", with no "undefined".
  - Clicking the "Front" tab shows the stored description.
  - "Back" shows "Nothing stored about this side."
  - Iceland's Back tab shows "Haltu Kjafti, JP", "(Icelandic)" and "Anonymised regions (eg. for an address)", with the swatch after the word (DOM order).
  - Arrow-right on the selected tab moves selection.
  - Clicking the card advances the view.
  - Run them; expected FAIL.
- [ ] **Step 2: Implement.** Run `pnpm test tests/MetadataPanel.test.ts`; expected PASS.
- [ ] **Step 3: e2e** `e2e/together.test.ts`:
  - The right column's height is equal across all three tabs.
  - The file view's dimension labels read `1536 px` / `2132 px`, and the front's read cm.
  - After choosing Front, the label's computed `--flip` reads `0deg`; after Back, it reads `180deg`.
  - Under reduced motion, choosing Front shows the card immediately.
  - Run `pnpm check && pnpm lint && pnpm test && pnpm test:e2e`; expected PASS.
- [ ] **Step 4:** Screenshot the three states and mid-fold (light, dark, 1440, 390) with Playwright's Chromium into the controller's screens folder. Look: does the fold read as "the back folds up behind the front"? Do the measurements hug the edges in every state? Fix, then commit.
