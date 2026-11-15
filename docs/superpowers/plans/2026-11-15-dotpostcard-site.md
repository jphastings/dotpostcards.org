# dotpostcard.org Showcase Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-page, prerendered SvelteKit site at dotpostcard.org that shows off `.postcard` files with real, flipping postcards and links collectors to the app and developers to the tools.

**Architecture:** SvelteKit + `adapter-static` prerenders one page. Postcard metadata is extracted from the card files by a script into a committed `src/lib/cards.json`; one `Postcard.svelte` component renders the dotpostcard library's markup, styled by the library's `postcards.css` (vendored, unmodified, v0.49.0). Page sections are small components composed in `src/routes/+page.svelte`. Deployed to GitHub Pages by GitHub Actions.

**Tech Stack:** SvelteKit 2 / Svelte 5 (runes), TypeScript, pnpm, Vite, vitest + jsdom + @testing-library/svelte, Playwright, oxlint/oxfmt. The `postcards` CLI (Homebrew) and `jq` for the data script only.

**Spec:** `docs/superpowers/specs/2026-11-15-dotpostcard-site-design.md` — read it first; this plan argues from it.

## Global Constraints

- Every postcard is drawn by the unmodified `postcards.css` from dotpostcard **v0.49.0**. Site CSS only sets the library's custom properties (`--flip`, `--postcard`, `--aspect-ratio`, shadow/light knobs) and lays things out around cards.
- Every value shown about a card comes verbatim from `src/lib/cards.json` (made by `scripts/cards.sh`). Never hand-type card data into components.
- Never draw regions for ordinary metadata. Only anonymised regions (`secrets`) are drawn, at their stored coordinates.
- From/To show `name` only, never `uri`.
- Card files are committed as `static/cards/<name>.postcard.webp`. No extensionless files: GitHub Pages serves them as `application/octet-stream`, and browsers won't use them as CSS masks.
- Which cards appear where is decided in one file, `src/lib/showcase.ts`. Swapping a card never means editing a component.
- Light mode: bg `#fbfbfd`, text `#1d1d1f`, secondary `#6e6e73`/`#86868b`, panel `#f5f5f7`, button `#0071e3`, links `#0066cc`. Dark mode (`prefers-color-scheme: dark`): bg `#000`, text `#f5f5f7`, secondary `#86868b`, panel `#161617`, headline gradient white→`#a1a1a6`, links `#2997ff`, soft radial glow behind the hero card. No manual toggle.
- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`.
- Band cards turn 360° every **3s**, linear, no pauses, each offset so none move in step. All other cards flip on tap/click/Space.
- `jp@dotpostcard.org` must never appear whole in any built HTML.
- Download link: `https://github.com/jphastings/postcard-collector.app/releases/latest/download/Postcards-macOS.zip`. "See them in use" → `https://shutup.jp`. Brew: `brew install jphastings/tools/postcards jphastings/tools/fastfoto-postcards`.
- Copy is short and lets the cards speak (the user's global "Let the app speak" rule). JP reviews all copy before launch.
- Pushing, enabling GitHub Pages, and DNS are JP's calls: ask before each.

## Review Focus

1. **A card missing optional fields** (no `sentOn`, no back, no transcription, `flip: none`): the metadata panel must omit those rows, never print `undefined` or an empty label. Test in Task 4.
2. **Phone-width screens (390px)**: hero stacks, band wraps, no sideways scrolling. Test in Task 5.
3. **Reduced motion**: band cards stop turning and flip on tap instead. Test in Task 3.
4. **Keyboard only**: Tab reaches each card with a visible focus ring; Space flips it. Test in Task 3.
5. **No JavaScript**: the prerendered HTML already contains the hero card and section copy. Test in Task 1 (built-HTML check), extended in Task 5.

---

### Task 1: Scaffold the static site and its deploy

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `.gitignore`, `src/app.html`, `src/routes/+layout.ts`, `src/routes/+page.svelte` (placeholder), `static/.nojekyll`, `static/CNAME`, `.github/workflows/deploy.yml`, `e2e/build.test.ts`
- Move: `public/.well-known/atproto-did`, `public/.well-known/did.json` → `static/.well-known/` (JP's untracked files; SvelteKit serves `static/`, not `public/`)
- Modify: `.sesh/config.json`

**Interfaces:**
- Produces: `pnpm dev | build | preview | check | test | test:e2e | lint | format` scripts; build output in `build/`.

Model the configs on `~/src/personal/wecanjust.at` (same stack): `vitest.config.ts` includes `tests/**/*.test.ts` with jsdom and the `$lib` alias; `playwright.config.ts` runs `pnpm build && pnpm preview` on port 4173 with `testDir: 'e2e'`. `svelte.config.js` uses `adapter-static` with defaults; `+layout.ts` exports `prerender = true`.

- [ ] **Step 1: Write the failing e2e test** `e2e/build.test.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('serves the atproto DID for dotpostcard.org', async ({ request }) => {
	const res = await request.get('/.well-known/atproto-did');
	expect((await res.text()).trim()).toBe('did:web:dotpostcard.org');
	expect((await request.get('/.well-known/did.json')).ok()).toBe(true);
});

test('ships Pages files in the build', () => {
	expect(readFileSync('build/CNAME', 'utf8').trim()).toBe('dotpostcard.org');
	expect(() => readFileSync('build/.nojekyll')).not.toThrow();
});
```

- [ ] **Step 2: Scaffold** with `pnpm dlx sv create . --template minimal --types ts --no-add-ons --install pnpm` (or by hand), then add vitest, jsdom, @testing-library/svelte, @testing-library/user-event, @testing-library/jest-dom (registered via a vitest `setupFiles` entry so `toBeInTheDocument` etc. work), @playwright/test, oxlint, oxfmt as dev dependencies. Move `public/.well-known` to `static/.well-known` with `mv` and delete the empty `public/`. Write `static/CNAME` (`dotpostcard.org`) and an empty `static/.nojekyll`. `.nojekyll` is needed because Jekyll would drop `_app/` and `.well-known/`.

- [ ] **Step 3: Run** `pnpm exec playwright install chromium && pnpm test:e2e`. Expected: both tests PASS.

- [ ] **Step 4: Write `.github/workflows/deploy.yml`.** On push to `main`: checkout → `pnpm/action-setup` → `actions/setup-node` (Node 24, pnpm cache) → `pnpm install --frozen-lockfile` → `pnpm build` → `actions/upload-pages-artifact` (path `build`) → `actions/deploy-pages`. Permissions: `pages: write`, `id-token: write`, `contents: read`. A separate `test` job runs `pnpm check`, `pnpm test` and `pnpm test:e2e`, and the deploy job `needs` it.

- [ ] **Step 5: Set `.sesh/config.json`** to `{ "setup": "pnpm install --frozen-lockfile" }`. Ports stay at the default of 1 (`pnpm dev --port $SESH_SESSION_PORT`).

- [ ] **Step 6: Commit**

```bash
git add -A package.json pnpm-lock.yaml svelte.config.js vite.config.ts vitest.config.ts playwright.config.ts tsconfig.json .gitignore src static .github e2e .sesh/config.json
git commit -m "feat: scaffold static SvelteKit site with GitHub Pages deploy"
```

---

### Task 2: Card data from the card files

**Files:**
- Create: `scripts/cards.sh`, `static/cards/*.postcard.webp`, `src/lib/cards.json` (generated, committed), `src/lib/cards.ts`, `src/lib/showcase.ts`, `tests/cards.test.ts`

**Interfaces:**
- Produces (in `src/lib/cards.ts`):
  - `type Flip = 'book' | 'calendar' | 'left-hand' | 'right-hand' | 'none'`
  - `interface Side { description?: string; transcription?: { text?: string; annotations?: { type: string; value: string; start: number; end: number }[] }; secrets?: { prehidden: boolean; points: [number, number][] }[] }`
  - `interface Card { name: string; src: string; flip: Flip; locale?: string; location?: { name?: string; latitude?: number; longitude?: number; countrycode?: string }; sentOn?: string; sender?: { name?: string; uri?: string }; recipient?: { name?: string; uri?: string }; front: Side; back?: Side; context?: { author?: { name?: string; uri?: string }; description?: string }; physical: { frontSize: { cmW: string; cmH: string; pxW: number; pxH: number } } }`, where `src = '/cards/<name>.postcard.webp'`
  - `getCard(name: string): Card` (throws `Unknown card: <name>`)
  - `isHeteroriented(flip: Flip): boolean`: true for left-hand/right-hand
  - `orientation(card: Card): 'portrait' | 'landscape' | 'square'`, from `pxW`/`pxH`
  - `cm(fraction: string): string`: `"345/32"` → `"10.8 cm"` (one decimal place)
  - `sideSize(card: Card, side: 'front' | 'back'): { width: string; height: string }`: back swaps width/height when heteroriented
  - `formatDate(iso: string): string`: `"2023-01-13"` → `"13 January 2023"` (en-GB, UTC)
  - `transcriptionLanguage(side: Side): string | undefined`: first `locale` annotation's language subtag via `Intl.DisplayNames(['en'], { type: 'language' })` (`is-IS` → `"Icelandic"`)
- Produces (in `src/lib/showcase.ts`): `export const showcase = { hero: 'athens', band: ['france', 'assisi', 'china', 'hold-on', 'dualism'], together: 'iceland' } as const`

- [ ] **Step 1: Copy the cards.** From `~/src/personal/shutup.jp/postcards/`: `athens`, `france`, `assisi`, `china`, `iceland` (`*.postcard.webp`). From `~/Downloads/`: `hold-on.postcard` → `static/cards/hold-on.postcard.webp`, `dualism.postcard` → `static/cards/dualism.postcard.webp`.

- [ ] **Step 2: Write `scripts/cards.sh`** and run it:

```sh
#!/bin/sh
# Regenerates src/lib/cards.json from the card files. Re-run whenever static/cards changes.
set -eu
cd "$(dirname "$0")/.."
for f in static/cards/*.postcard.webp; do
	name=$(basename "$f" .postcard.webp)
	postcards info --json "$f" | jq --arg n "$name" '{($n): .}'
done | jq -s 'add' > src/lib/cards.json
```

Expected: `jq 'keys' src/lib/cards.json` lists all seven names, and `jq '.iceland.back.secrets | length'` prints `1`.

- [ ] **Step 3: Write the failing tests** `tests/cards.test.ts`:

```ts
import { readdirSync } from 'node:fs';
import { getCard, cm, sideSize, formatDate, transcriptionLanguage, orientation } from '$lib/cards';
import { showcase } from '$lib/showcase';

test('every card file has an image extension and data', () => {
	for (const f of readdirSync('static/cards')) expect(f).toMatch(/\.postcard\.(webp|jpe?g)$/);
	for (const name of [showcase.hero, ...showcase.band, showcase.together]) expect(getCard(name).name).toBe(name);
});
test('reads iceland as stored', () => {
	const c = getCard('iceland');
	expect(c.src).toBe('/cards/iceland.postcard.webp');
	expect(c.flip).toBe('left-hand');
	expect(orientation(c)).toBe('portrait');
	expect(formatDate(c.sentOn!)).toBe('13 January 2023');
	expect(transcriptionLanguage(c.back!)).toBe('Icelandic');
});
test('sizes follow the side', () => {
	expect(cm('345/32')).toBe('10.8 cm');
	expect(sideSize(getCard('iceland'), 'front')).toEqual({ width: '10.8 cm', height: '15.2 cm' });
	expect(sideSize(getCard('iceland'), 'back')).toEqual({ width: '15.2 cm', height: '10.8 cm' });
	expect(sideSize(getCard('athens'), 'back')).toEqual(sideSize(getCard('athens'), 'front'));
});
test('unknown cards fail loudly', () => expect(() => getCard('nope')).toThrow('Unknown card: nope'));
```

- [ ] **Step 4: Run** `pnpm test tests/cards.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 5: Implement `src/lib/cards.ts` and `src/lib/showcase.ts`** to the interfaces above, importing `cards.json`.

- [ ] **Step 6: Run** `pnpm test tests/cards.test.ts`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts static/cards src/lib/cards.json src/lib/cards.ts src/lib/showcase.ts tests/cards.test.ts
git commit -m "feat: card data generated from the postcard files"
```

---

### Task 3: The Postcard component

**Files:**
- Create: `src/lib/vendor/postcards@0.49.0.css` (byte-for-byte from `https://raw.githubusercontent.com/jphastings/dotpostcard/v0.49.0/formats/web/postcards.css`), `src/lib/Postcard.svelte`, `tests/Postcard.test.ts`, `e2e/postcards.test.ts`
- Modify: `src/routes/+page.svelte` (temporarily render one tap card and one spinning card, for the e2e test; Task 5 replaces it)

**Interfaces:**
- Consumes: `Card`, `orientation` from Task 2.
- Produces: `Postcard.svelte` with props `{ card: Card; motion?: 'tap' | 'spin'; delay?: string; flipped?: boolean /* $bindable */ }`. It renders the library's markup (`formats/web/postcard.html.qtpl`): `<input type="checkbox" id="postcard-…">` followed by `<label class="postcard flip-{flip} {orientation}" style="--postcard: url('{src}'); --aspect-ratio: {pxW} / {pxH}">` containing `<img src alt loading="lazy">` and `<div class="shadow">`. Ids come from `$props.id()` and must start with `postcard-`, which the library's selector needs.

Decisions the tests pin:
- The checkbox is visually hidden but focusable (not `display:none`), with `aria-label="Flip postcard"`. `input:focus-visible + label` gets a visible outline.
- The label has `role="img"` and `aria-label={card.front.description}`, because the library hides the `<img>`.
- `motion="spin"` adds class `spin` and `style="animation-delay: {delay}"`. Under `@media (prefers-reduced-motion: no-preference)`, `.postcard.spin { animation: postcard-spin 3s linear infinite; transition: none }` with `@keyframes postcard-spin { from { --flip: 0deg } to { --flip: 360deg } }`. Under reduced motion there's no animation, so the checkbox flips it.
- Import the vendored CSS once, in `src/routes/+layout.svelte`.

- [ ] **Step 1: Write the failing component test** `tests/Postcard.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Postcard from '$lib/Postcard.svelte';
import { getCard } from '$lib/cards';

test('describes the card and flips from the keyboard', async () => {
	const card = getCard('iceland');
	render(Postcard, { card });
	expect(screen.getByRole('img', { name: card.front.description })).toBeInTheDocument();
	const box = screen.getByRole('checkbox', { name: 'Flip postcard' });
	box.focus();
	await userEvent.keyboard(' ');
	expect(box).toBeChecked();
});
test('uses the library markup', () => {
	const { container } = render(Postcard, { card: getCard('iceland') });
	const label = container.querySelector('label.postcard.flip-left-hand.portrait') as HTMLElement;
	expect(label.getAttribute('style')).toContain("url('/cards/iceland.postcard.webp')");
	expect(label.getAttribute('style')).toContain('--aspect-ratio: 1091 / 1536');
	expect(container.querySelector('input')!.id).toMatch(/^postcard-/);
});
```

- [ ] **Step 2: Run** `pnpm test tests/Postcard.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/Postcard.svelte`** and vendor the CSS. Check the vendored file with `diff <(curl -s <url>) src/lib/vendor/postcards@0.49.0.css`; expected: no output.

- [ ] **Step 4: Run** `pnpm test tests/Postcard.test.ts`. Expected: PASS.

- [ ] **Step 5: Write the e2e test** `e2e/postcards.test.ts`. It covers: a click flips a tap card, so the label's computed `--flip` is `180deg` after 1.2s; a spinning card's `--flip` changes between two readings 500ms apart; with `test.use({ reducedMotion: 'reduce' })` the spinning card's `--flip` stays put and a click flips it; and Tab focus lands on a card's checkbox with a non-`none` outline on the label.

- [ ] **Step 6: Run** `pnpm test:e2e e2e/postcards.test.ts`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/vendor src/lib/Postcard.svelte src/routes tests/Postcard.test.ts e2e/postcards.test.ts
git commit -m "feat: postcard component built on the dotpostcard CSS library"
```

---

### Task 4: The metadata panel

**Files:**
- Create: `src/lib/MetadataPanel.svelte`, `tests/MetadataPanel.test.ts`

**Interfaces:**
- Consumes: `Postcard` (with `bind:flipped`), `Card`, `sideSize`, `formatDate`, `transcriptionLanguage`, `isHeteroriented` from Tasks 2–3.
- Produces: `MetadataPanel.svelte` with props `{ card: Card }`.

Behaviour, from the spec's "Metadata panel" section and the mockup `.superpowers/brainstorm/37070-1794728057/content/metadata-v2.html` (local only):
- The card is on the left, in a 380px stage, with the card 240px wide; the fields are on the right.
- There are two overlays, sized to the front box and the back box (swapped for heteroriented flips). Each holds dimension lines (bottom = width, right = height, from `sideSize`). Overlays fade out in 0.2s when the flip starts and the new side's overlay fades in over 0.4s after a 0.95s delay.
- The back overlay draws each `back.secrets` entry, and the front overlay each `front.secrets` entry, as an SVG `<polygon>` (viewBox `0 0 1 1`, `preserveAspectRatio="none"`, dashed `#ff375f` stroke with `vector-effect: non-scaling-stroke`, hatched fill). Points from `postcards info --json` are relative to the upright side; iceland's lands on the blanked address lines.
- "The card" group shows Location, Sent on, From, To and Flip. "This side" shows Description, then Transcription with its language in brackets, then "Anonymised" → "Anonymised regions (eg. for an address)". It swaps with `flipped`. Omit any row whose value is missing, and the whole "This side" group if it would be empty.
- The Flip value reads "Left-hand", "Right-hand", "Book", "Calendar" (dropped for `none`).
- The footnote reads: Stored as XMP inside `<code>{name}.postcard.webp</code>`.

- [ ] **Step 1: Write the failing tests** `tests/MetadataPanel.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import MetadataPanel from '$lib/MetadataPanel.svelte';
import { getCard, type Card } from '$lib/cards';

test('shows iceland as stored, front first', () => {
	render(MetadataPanel, { card: getCard('iceland') });
	for (const v of ['Reykjavík, Iceland', '13 January 2023', 'Claire', 'JP', 'Left-hand', '10.8 cm', '15.2 cm'])
		expect(screen.getAllByText(v).length).toBeGreaterThan(0);
	expect(screen.getByText(/fiendishly grinning/)).toBeVisible();
	expect(screen.queryByText('“Haltu Kjafti, JP”')).toBeNull();
	expect(screen.queryByRole('link')).toBeNull();
});
test('flipping shows the back: transcription and anonymised region', async () => {
	const { container } = render(MetadataPanel, { card: getCard('iceland') });
	await userEvent.click(screen.getByRole('checkbox', { name: 'Flip postcard' }));
	expect(screen.getByText('“Haltu Kjafti, JP”')).toBeInTheDocument();
	expect(screen.getByText('(Icelandic)')).toBeInTheDocument();
	expect(screen.getByText('Anonymised regions (eg. for an address)')).toBeInTheDocument();
	expect(container.querySelectorAll('polygon')).toHaveLength(1);
});
test('omits what a card does not store', () => {
	const sparse: Card = { ...getCard('athens'), sentOn: undefined, sender: undefined, recipient: undefined, back: undefined };
	render(MetadataPanel, { card: sparse });
	for (const label of ['Sent on', 'From', 'To']) expect(screen.queryByText(label)).toBeNull();
	expect(document.body.textContent).not.toMatch(/undefined/);
});
```

- [ ] **Step 2: Run** `pnpm test tests/MetadataPanel.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/MetadataPanel.svelte`.**

- [ ] **Step 4: Run** `pnpm test tests/MetadataPanel.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/MetadataPanel.svelte tests/MetadataPanel.test.ts
git commit -m "feat: metadata panel with side-aware measurements and anonymised regions"
```

---

### Task 5: The page

**Files:**
- Create: `src/app.css`, `src/routes/+layout.svelte` (if not already), `src/lib/sections/Hero.svelte`, `LooksBand.svelte`, `Together.svelte`, `LookThrough.svelte`, `Make.svelte`, `Developers.svelte`, `Footer.svelte`, `src/lib/email.ts`, `static/app/postcard-collector-light.png`, `static/app/postcard-collector-dark.png`, `tests/email.test.ts`, `e2e/page.test.ts`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `Postcard`, `MetadataPanel`, `getCard`, `showcase`.
- Produces: `contactHref(): string` in `src/lib/email.ts`. It returns `'mailto:' + ['jp', 'dotpostcard.org'].join('@')`.

Section order and content follow the spec's "Page structure" (1–7). Starting headlines, from the mockups: hero "Every postcard, kept whole." / "Both sides and every detail, in a single image."; band "Beautiful from every side."; together "Everything stays together." / "Both sides and everything known about the card, inside one ordinary image." Other copy is yours to draft, short, for JP's review.
- **Hero:** `.postcard` eyebrow, h1, sub-copy, "Download for Mac" (pill button) and "See them in use ›". The hero card is `showcase.hero`, tap to flip. The two columns stack below 734px.
- **LooksBand:** a rounded panel with `showcase.band` cards, `motion="spin"`, `delay` = `-(i * 3 / n)s`, each captioned `{flip} flip` (e.g. "left-hand flip"). Wide gaps (~110px) because the cards sweep wide as they turn. The captions sit on one baseline (`grid-template-rows: 250px auto`).
- **Together:** `MetadataPanel` for `showcase.together`.
- **LookThrough:** the Postcard Collector screenshot (a `<picture>` with a `prefers-color-scheme: dark` source), "Download for Mac", sites using the format (shutup.jp), and an AR link `<a rel="ar" href="https://shutup.jp/athens.postcard.usdz"><img …></a>`, rendered only when `document.createElement('a').relList.supports('ar')`.
- **Make:** fastfoto-postcards + Epson FastFoto FF-680W, the optional LLM help (orientation, descriptions, handwriting transcription, location, dates from postmarks or handwritten datestamps), and the brew command in a `<code>` block with a Copy button (`navigator.clipboard.writeText`).
- **Developers:** one line each, linking out: CSS-only flippable postcards → `https://github.com/jphastings/dotpostcard/blob/main/docs/formats/css.md`; WASM encoder → `https://github.com/jphastings/dotpostcard/releases`; AT Protocol → `…/docs/formats/atproto.md`; USDZ for games and AR → `…/docs/formats/usdz.md`; XMP metadata → `…/docs/formats/xmp.md`; Go packages → `https://github.com/jphastings/dotpostcard#using-dotpostcard-as-a-library`.
- **Footer:** a "Get in touch" link with `href="#contact"` that sets `href = contactHref()` on `pointerenter`, `focus` and `touchstart` so the native click opens mail; plus GitHub links (dotpostcard, postcard-collector.app).
- **Theme:** `src/app.css` defines the Global Constraints colours as custom properties, with a `prefers-color-scheme: dark` block. In dark mode, tune the library's `--shadow-color` / `--shadow-softness` / `--light-angle` so card shadows read on black (no grey boxes). Check it by eye in Step 6.
- **Screenshots:** launch `/Applications/Postcard Collector.app` (`open -a "Postcard Collector" --args -AppleInterfaceStyle Dark` for dark) and capture its window with `screencapture -o -l <windowID>`. If macOS blocks screen recording for this session, stop and ask JP for the two screenshots. Do not grant permissions.

- [ ] **Step 1: Write the failing tests.** `tests/email.test.ts` asserts `contactHref() === 'mailto:jp@dotpostcard.org'`. `e2e/page.test.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('prerendered HTML has content but no whole email address', () => {
	const html = readFileSync('build/index.html', 'utf8');
	expect(html).toContain('class="postcard');
	expect(html).toContain('Every postcard, kept whole.');
	expect(html).not.toContain('jp@dotpostcard.org');
});
test('calls to action', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Download for Mac' }).first()).toHaveAttribute('href', 'https://github.com/jphastings/postcard-collector.app/releases/latest/download/Postcards-macOS.zip');
	await expect(page.getByRole('link', { name: /See them in use/ })).toHaveAttribute('href', 'https://shutup.jp');
	await expect(page.getByText('brew install jphastings/tools/postcards jphastings/tools/fastfoto-postcards')).toBeVisible();
	const contact = page.getByRole('link', { name: 'Get in touch' });
	await contact.hover();
	await expect(contact).toHaveAttribute('href', 'mailto:jp@dotpostcard.org');
});
test('fits a phone screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
test('dark mode follows the system', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/');
	expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(0, 0, 0)');
});
```

- [ ] **Step 2: Run** `pnpm test tests/email.test.ts && pnpm test:e2e e2e/page.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement the sections, theme, email helper and page**, and capture the screenshots.

- [ ] **Step 4: Run** `pnpm check && pnpm lint && pnpm test && pnpm test:e2e`. Expected: all PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src static/app tests e2e
git commit -m "feat: the dotpostcard.org page"
```

- [ ] **Step 6: Look at it.** Run `pnpm preview` and use the chrome-devtools MCP (or the headless Chrome fallback: see the `browser-checking` memory). Screenshot at 1440px and 390px wide, in light and dark. Tap the hero and Iceland cards and check the measurements fade and swap, and the anonymised region lands on the blanked address. Fix anything that looks wrong, commit the fixes, and hand the screenshots to JP for review of the look and copy.

---

### Task 6: Launch (JP's go-ahead at each step)

- [ ] **Step 1:** Ask JP to confirm the git remote. He said the repo was renamed to `dotpostcard.org`; `origin` may still point at `jphastings/dotpostcards.org`.
- [ ] **Step 2:** With JP's OK, push `main`, then switch the repo's Pages source to GitHub Actions (`gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`, or `PUT` if Pages already exists) and set the custom domain to `dotpostcard.org`.
- [ ] **Step 3:** JP adds DNS at mqdns: apex `A` records 185.199.108.153, .109.153, .110.153, .111.153 (and `AAAA` 2606:50c0:8000::153 … 8003::153). Then enforce HTTPS.
- [ ] **Step 4:** Verify: `curl -sI https://dotpostcard.org/` returns 200; `curl -s https://dotpostcard.org/.well-known/atproto-did` prints `did:web:dotpostcard.org`; `curl -sI https://dotpostcard.org/cards/iceland.postcard.webp` shows `content-type: image/webp`.
