# dotpostcard.org — showcase site design

## Intent

dotpostcard.org is the home page for the `.postcard` format and its tools. It exists to make people want postcard files: first collectors (people with physical postcards), then developers (people who'd display or produce them).

It should leave a visitor wanting to do one of four things:

1. **Download the macOS app** (Postcard Collector) — the primary action.
2. **See postcards in use** on a real site — today only [shutup.jp](https://shutup.jp), more later.
3. **Install the CLI tools** — `brew install jphastings/tools/postcards jphastings/tools/fastfoto-postcards`.
4. **Get in touch** — `jp@dotpostcard.org`, easy for humans, hard for scrapers.

Success: a collector lands, sees beautiful flipping postcards before reading a word, and clicks "Download for Mac"; a developer scrolls on and finds the CSS library, WASM encoder and AT Protocol support.

## Goals, non-goals, anti-goals

**Goals**
- Show, don't tell. Real postcards, real metadata, flipping for real. Little copy; every word earns its place.
- Apple-product-page quality: large type, generous space, the postcard as the product.
- Light and dark modes that both look deliberate.
- The site is itself a demonstration of the format's display library: every postcard is drawn by the unmodified `postcards.css`.

**Non-goals**
- Documentation. Technical items link out to the dotpostcard repo and its docs.
- A postcard creator, uploader or viewer app (that's create.dotpostcard.org and the apps).
- Analytics, cookies, accounts, a CMS.

**Anti-goals** (failure even if it "works")
- Misrepresenting postcard data. Every value shown must be exactly what's stored in the card file; nothing may imply the format stores something it doesn't (e.g. highlighting card regions as if metadata were tied to them).
- A page that looks mechanical: cards that tick or pause in lockstep.
- Explanatory paragraphs where a working demo would do.

## Audience and order

Collectors first, developers second. Features are ordered by: how great the postcards **look**, then that **everything stays together**, then how **easy they are to use**, then how **easy they are to make**, then the **developer** section.

## Page structure

One page, top to bottom (validated as a wireframe):

1. **Hero** — two columns: left, the `.postcard` wordmark, a short headline, one line of sub-copy, "Download for Mac" (primary) and "See them in use ›" (to shutup.jp); right, one large postcard that flips when tapped. The hero card is a placeholder (shutup.jp's `athens`) until JP supplies a demo card.
2. **They look great** — a rounded panel with postcards turning continuously, one per flip direction, each captioned with its flip (`book flip`, `calendar flip`, `left-hand flip`, `right-hand flip`), plus one with transparent, ragged edges. Almost no words. Shows: both sides, transparency, and that each side has a right way up.
3. **Everything stays together** — one card (shutup.jp's `iceland`) beside its metadata (see "Metadata panel" below). Shows: it's just an image (`.webp`/`.jpeg`), both sides live in one file, the metadata travels inside it as XMP, anonymised regions.
4. **Easy to look through** — Postcard Collector (macOS) with a screenshot (light and dark variants, captured from the running app showing its bundled fixture collection; *Claude's call*) and "Download for Mac"; the sites using the format (shutup.jp, with room for more); USDZ, e.g. view a card in AR.
5. **Easy to make** — `fastfoto-postcards` with the Epson FastFoto FF-680W: rapid scanning, optional LLM help for orientation, descriptions, handwriting transcription, location, and dates from postmarks or handwritten datestamps. The `brew install` command, copyable.
6. **For developers** — short items, each linking out: CSS-only flippable postcards for any website; efficient WASM encoder (source images + metadata → postcard); full support for storing postcards in AT Protocol repositories; USDZ 3D models for games and AR; XMP metadata spec; Go packages.
7. **Footer** — "Get in touch" (see Email), GitHub links.

Placeholder copy from the mockups ("Every postcard, kept whole.", "Beautiful from every side.", "Everything stays together.") is a starting point, not final; JP reviews all copy.

## Visual design

- **Layout:** "Gallery white" (direction B): Apple-style sections, centred section headlines (~36–52px, tight tracking, bold), grey rounded panels for showcase bands, two-column hero.
- **Light mode:** background `#fbfbfd`, text `#1d1d1f`, secondary `#6e6e73`/`#86868b`, panel `#f5f5f7`, primary button `#0071e3`, links `#0066cc`.
- **Dark mode** ("Spotlight" colours, direction A): background `#000`, text `#f5f5f7`, secondary `#86868b`, panel `#161617`, headline in a white→`#a1a1a6` vertical gradient, links `#2997ff`, a soft radial glow behind the hero card. Shadows are tuned through the library's own knobs (`--shadow-color`, `--shadow-softness`, `--light-angle`, …) so they read on black, not overridden.
- **Mode switching:** follows the visitor's `prefers-color-scheme`. No manual toggle.
- **Font:** the system font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`).

## Postcard behaviour

- **Every postcard flips when tapped or clicked**, and back again — except those in the "look great" band, which turn on their own.
- **Constant turning** (the "look great" band): each card rotates through a full 360° every **3 seconds**, linear, no pauses. Cards are offset from each other so they never move in step.
- **How:** use the library's own markup and mechanism. Tap-to-flip is the library's checkbox + `<label class="postcard">` pattern. Constant turning animates the library's `--flip` (already registered with `@property` in the library) from 0 to 360deg, and sets `transition: none` on the `.postcard` so the library's 1s `--flip` transition doesn't fight the animation.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, the band stops turning; its cards become tap-to-flip like the rest.
- **Keyboard:** the library hides the checkbox with `display:none`, which makes it unfocusable. The site keeps the checkbox but hides it visually (not `display:none`), so Tab focuses it, Space flips it, and focus is visible on the card.
- **Alt text:** the library hides the `<img>` (and so its alt text) once CSS is applied. The site must keep each card's description available to assistive technology (e.g. `role="img"` + `aria-label` on the card, from the card's stored description).

### Metadata panel (section 3)

Validated mockup: `.superpowers/brainstorm/37070-1794728057/content/metadata-v2.html` (local only, not committed).

- The card sits on the left, the fields on the right.
- **Measurements:** dimension lines along the bottom and right edges of the side that's showing, labelled with its physical size (front 10.8 cm × 15.2 cm; for heteroriented flips the back is the swapped 15.2 cm × 10.8 cm). They fade out as the card starts to turn (both are invisible mid-flip) and fade in for the new side once it lands (~0.95s).
- **No highlighted regions** for ordinary metadata: fields aren't tied to areas of the card, and drawing them as if they were would misrepresent the format.
- **Anonymised regions are the exception**: they *are* stored as regions. Draw each as a dashed, hatched outline at its stored coordinates on the side it belongs to, shown only while that side faces up. For iceland's back it lands exactly on the blanked street-address lines.
- **Fields**, in two groups, field names in small grey, values in body text:
  - **The card** (always shown): Location, Sent on, From, To, Flip. From/To show names only, never their stored `uri` links: the sender is a private person, and a marketing page shouldn't link to them. *(Claude's call.)*
  - **This side** (swaps on flip): front — Description; back — Transcription (with its language, e.g. "Icelandic"), and "Anonymised regions (eg. for an address)" with a small dashed swatch matching the overlay.
- A footnote: "Stored as XMP inside `iceland.postcard.webp`".
- Values come verbatim from the card file. Dates are formatted for humans ("13 January 2023"); locale annotations become language names.

## Showcase cards

**Indicative only: JP will choose the final cards later.** Swapping a card must mean replacing a file and re-running the data script, never editing components.

| Role | Card | Flip | Source |
|---|---|---|---|
| Hero (placeholder) | `athens` | book | `~/src/personal/shutup.jp/postcards/` |
| Band | `france` | left-hand | shutup.jp |
| Band | `assisi` | book | shutup.jp |
| Band | `china` | right-hand | shutup.jp |
| Band | `hold-on` | calendar | `~/Downloads/hold-on.postcard` |
| Band (ragged edge) | `dualism` | left-hand | `~/Downloads/dualism.postcard` |
| Metadata panel | `iceland` | left-hand | shutup.jp |

`hold-on` and `dualism` are extensionless `.postcard` files (WebP inside). Commit them as `*.postcard.webp`: GitHub Pages serves extensionless files as `application/octet-stream`, and browsers then refuse them as CSS masks, so the cards render blank (seen during design).

Sections show only real cards: never a stand-in that would misrepresent the format.

## Build approach

**Approaches considered**

- **A · SvelteKit, prerendered to a static site (chosen).** Every section is real HTML at build time, so link previews and search engines see content, and the hero card shows before any JavaScript runs. A little more setup than B.
- **B · Plain Svelte + Vite single-page app.** Fewest moving parts, but the page is empty until JS runs, which undercuts a page whose job is to show something beautiful immediately.

JP chose A.

**Decided**
- SvelteKit + `@sveltejs/adapter-static`, TypeScript, pnpm — matching JP's other SvelteKit projects (e.g. `~/src/personal/wecanjust.at`: vitest, Playwright e2e, oxlint/oxfmt).
- **Hosting:** GitHub Pages at `dotpostcard.org`, deployed by GitHub Actions on push to `main`. (`create.dotpostcard.org` is already on GitHub Pages; `dotpostcard.org` has DNS at mqdns but no site yet.) DNS records are JP's to add.
- **Card data comes from the card files.** A script runs `postcards info --json` on each showcase card and writes the result to a JSON file in `src/lib/`, which is committed; the site renders from that. Re-run the script when cards change. CI doesn't need the CLI.
- **`postcards.css` is vendored unmodified from dotpostcard v0.49.2** (light-cast shadows, `@property` knobs), with the version noted alongside it. Site-specific CSS (spin, measurements, anonymised overlays, dark-mode shadow knobs) lives separately and only sets the library's custom properties (`--flip`, `--postcard`, `--aspect-ratio`, the shadow and light knobs).
- **Card markup** follows the library's HTML template (`formats/web/postcard.html.qtpl` in dotpostcard), with `--aspect-ratio` from the card's stored front pixel size and `flip-*`/orientation classes from its metadata, rendered by one Svelte component.
- **Download for Mac** links to `https://github.com/jphastings/postcard-collector.app/releases/latest/download/Postcards-macOS.zip`.
- **Email:** "Get in touch" is a link whose `mailto:jp@dotpostcard.org` is assembled by JavaScript on click from separate parts; the address never appears whole in the HTML. Without JS the link does nothing harmful.

**Left to the builder**
- Component breakdown, file layout, tests (behavioural; e.g. that rendered metadata matches the card JSON, that cards flip on click and via keyboard).
- Responsive behaviour (hero stacks on narrow screens; band wraps).
- Image weight: whether to ship the shutup.jp files as-is or re-encode smaller versions with `postcards` (`--quality efficient`).
- Exact spacing, type sizes and section copy within the visual rules above, for JP's review.
- How the USDZ/AR item is presented (e.g. an AR Quick Look link on iOS). Link to the live files on shutup.jp (e.g. `https://shutup.jp/athens.postcard.usdz`, which serves with CORS) rather than committing the binaries.


## Revision 2 (after JP's first look at the built site)

**Tone.** The site is a knowing, tongue-in-cheek pastiche of an Apple product page: a way-over-the-top sell for a postcard format, and it knows it. Copy leans into that, still short.

**Hero.** Headline "The open digital postcard format"; sub-copy "Lovingly made by a geek with postcard fixation and the limited space of a London flat."

**Flip or flop** (was "They look great"). Heading "Flip or flop", text beneath: "Store which way the postcard flips, for unnecessary accuracy." Only three cards: left-hand (`france`), book (`assisi`), right-hand (`china`); no calendar or ragged card. Continuous spinning was motion-sickness inducing, so instead a calm, sequential loop: left-hand flips (1s, the library's ease-in-out), 250ms later book flips, 250ms later right-hand flips; 2s pause; then each turns over again in the same order and direction, completing 360°; 2s pause; repeat (7s loop). Reduced motion: no loop; cards tap to flip.

**Everything stays together.** Text beneath: "Just an image with standard XMP metadata inside, so you never lose context." Uses a calendar-flip card (`around-we-go`, from JP), because folding the file's lower half up behind the front *is* a calendar flip. Three tabs on the right drive a three-state sequence on the left (tapping the card advances to the next tab, cycling):

1. **Postcard** — the raw file as stored: the web image, front stacked above back, with *pixel* dimensions down the right and along the bottom. The panel shows postcard-wide metadata (title, location, sent on, from, to, flip, physical size, file name).
2. **Front** — the lower half folds up behind the front (rotating away from the viewer about the midline) and the measurements switch to cm as it folds; now a card, drawn by the library. Panel shows front-specific metadata (description, transcription, anonymised regions).
3. **Back** — the card flips over (calendar flip); panel shows back-specific metadata.

Measurements stay visible throughout (no fading on flip). The right-hand column keeps a constant height across tabs so nothing jumps. The anonymised-region swatch sits to the right of the word "Anonymised". Fields a card doesn't store are omitted; a tab with nothing stored says so plainly rather than inventing anything. Reduced motion: states swap without the fold animation.

**Easy to make** — only about the scanner. Copy: "Scan postcards rapidly with an Epson FastFoto FF-680W". A photo of the scanner (`epson-ff680w.png`, from JP; transparent PNG whose scanner touches the edges, so it needs padding) sits beside the section. LLM-help chips: orientation, descriptions, handwriting transcription, location, dates. The install command is just `brew install jphastings/tools/fastfoto-postcards`, with a terminal-window mockup showing exactly:

```
$ fastfoto-postcards --quality detail --format postcard --llm claude-code
⚙︎ Scanning postcards into postcard format…
⊕ Postcard scanned, analysing with your LLM…
✓ london-sights scanned
  ↳ Postcard (2.3MB)
```

**For developers** gains the `postcards` CLI install: `brew install jphastings/tools/postcards`.

**Showcase** becomes: hero `athens`, band `france`/`assisi`/`china`, together `around-we-go`, AR `athens`. `hold-on` and `dualism` are no longer used and are removed from the build.
