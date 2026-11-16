<script lang="ts">
	import { tick } from 'svelte';
	import Postcard from '$lib/Postcard.svelte';
	import { cm, formatDate, transcriptionLanguage, type Card, type Flip } from '$lib/cards';

	type View = 'file' | 'front' | 'back';

	let { card }: { card: Card } = $props();
	let view = $state<View>('file');
	// The side left facing up when the file is folded: the other half folds away behind it
	let side = $state<'front' | 'back'>('front');
	let turning = $state(false);
	let flipped = $state(false);
	let figureEl: HTMLDivElement;
	let cardEl: HTMLDivElement;

	const uid = $props.id();
	const views: View[] = ['file', 'front', 'back'];
	const tabNames: Record<View, string> = { file: 'Postcard', front: 'Front', back: 'Back' };
	const flipLabels: Record<Flip, string | undefined> = {
		'left-hand': 'Left-hand',
		'right-hand': 'Right-hand',
		book: 'Book',
		calendar: 'Calendar',
		none: undefined
	};
	const tabs: HTMLButtonElement[] = [];

	const { cmW, cmH, pxW, pxH } = $derived(card.physical.frontSize);
	// ponytail: the fold and overlays assume the library draws the card filling the label's width,
	// as it does for calendar and book flips; a hand flip's squared box would need its own geometry.
	const width = 280;
	const height = $derived((width * pxH) / pxW);

	const postcardRows = $derived(
		[
			['Location', card.location?.name],
			['Sent on', card.sentOn && formatDate(card.sentOn)],
			['From', card.sender?.name],
			['To', card.recipient?.name],
			['Flip', flipLabels[card.flip]],
			['Size', `${cm(cmW)} × ${cm(cmH)}`]
		].filter((row): row is [string, string] => !!row[1])
	);
	const sides = $derived(
		(['front', 'back'] as const).map((name) => {
			const stored = card[name];
			return {
				name,
				description: stored?.description,
				transcription: stored?.transcription?.text,
				language: stored && transcriptionLanguage(stored),
				secrets: stored?.secrets ?? []
			};
		})
	);

	// Never jumps: mid-fold, the fold carries on (or reverses) on the same side, and the card
	// turns over to the chosen face once it has landed
	function show(next: View, cardShown = getComputedStyle(cardEl).visibility === 'visible') {
		if (next === view) return;
		const unfolded = !(parseFloat(getComputedStyle(figureEl).getPropertyValue('--fold')) > 0);
		view = next;
		if (next !== 'file' && (cardShown || unfolded)) settle(cardShown);
	}

	// While hidden behind the fold, the card snaps to the side being folded to; in view it turns over
	async function settle(inView: boolean) {
		if (view === 'file') return;
		turning = inView;
		side = view;
		// Whether the flip animates hangs off the classes set above, so they must land first: a
		// style recalc between the two (Chrome forces one when a tab has focus) would use stale ones
		await tick();
		flipped = view === 'back';
	}

	function onCardTransitionEnd(event: TransitionEvent) {
		if (event.target === cardEl && event.propertyName === 'visibility') settle(true);
	}

	function onStageClick(event: MouseEvent) {
		// The card's own checkbox, toggled from the keyboard, flips via the binding instead
		if (event.target instanceof HTMLInputElement) return;
		event.preventDefault();
		show(views[(views.indexOf(view) + 1) % views.length]);
	}

	function onTabKeydown(event: KeyboardEvent) {
		const i = views.indexOf(view);
		const moves: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: -1 };
		if (!(event.key in moves)) return;
		event.preventDefault();
		const next = (moves[event.key] + views.length) % views.length;
		show(views[next]);
		tabs[next].focus();
	}
</script>

<div class="panel">
	<!-- Clicking the card is a shortcut for the tabs, which are the keyboard route -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="stage" onclick={onStageClick}>
		<div
			class="figure"
			bind:this={figureEl}
			class:folded={view !== 'file'}
			class:to-back={side === 'back'}
			class:turning
			style="--w: {width}px; --h: {height}px; --hn: {height}"
		>
			<div class="file" style:visibility={view === 'file' ? null : 'hidden'}>
				<img
					class="front-half"
					src={card.src}
					alt="{card.name}.postcard.webp: the front above the back"
				/>
				<img class="back-half" src={card.src} alt="" />
			</div>
			<div
				class="card"
				bind:this={cardEl}
				style:visibility={view === 'file' ? 'hidden' : null}
				ontransitionend={onCardTransitionEnd}
			>
				<Postcard
					{card}
					bind:flipped={() => flipped, (back) => show(back ? 'back' : 'front', true)}
				/>
				{#each sides as { name, secrets } (name)}
					{#if secrets.length}
						<svg
							class:shown={name === (flipped ? 'back' : 'front')}
							viewBox="0 0 1 1"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<defs>
								<pattern
									id="hatch-{uid}-{name}"
									width="10"
									height="10"
									patternUnits="userSpaceOnUse"
									patternTransform="scale({1 / width} {1 / height})"
								>
									<path d="M-1 1L1 -1M0 10L10 0M9 11L11 9" stroke="rgba(255,55,95,.3)" stroke-width="3" />
								</pattern>
							</defs>
							{#each secrets as secret, i (i)}
								<polygon
									points={secret.points.map(([x, y]) => `${x},${y}`).join(' ')}
									fill="url(#hatch-{uid}-{name})"
								/>
							{/each}
						</svg>
					{/if}
				{/each}
			</div>
			<div class="measure" aria-hidden="true">
				<span class="dim w"><span class="px">{pxW} px</span><span class="cm">{cm(cmW)}</span></span>
				<span class="dim h"><span class="px">{2 * pxH} px</span><span class="cm">{cm(cmH)}</span></span>
			</div>
		</div>
	</div>

	<div class="info">
		<div class="tabs" role="tablist" aria-label="Stored in the file">
			{#each views as v, i (v)}
				<button
					bind:this={tabs[i]}
					role="tab"
					id="{uid}-tab-{v}"
					aria-selected={v === view}
					aria-controls="{uid}-panel-{v}"
					tabindex={v === view ? 0 : -1}
					onclick={() => show(v)}
					onkeydown={onTabKeydown}>{tabNames[v]}</button
				>
			{/each}
		</div>
		<div class="panels">
			<div
				role="tabpanel"
				id="{uid}-panel-file"
				aria-labelledby="{uid}-tab-file"
				tabindex="0"
				style:visibility={view === 'file' ? null : 'hidden'}
			>
				<dl>
					{#each postcardRows as [label, value] (label)}
						<dt>{label}</dt>
						<dd>{value}</dd>
					{/each}
					<dt>File</dt>
					<dd><code>{card.name}.postcard.webp</code></dd>
				</dl>
			</div>
			{#each sides as { name, description, transcription, language, secrets } (name)}
				<div
					role="tabpanel"
					id="{uid}-panel-{name}"
					aria-labelledby="{uid}-tab-{name}"
					tabindex="0"
					style:visibility={view === name ? null : 'hidden'}
				>
					{#if description || transcription || secrets.length}
						<dl>
							{#if description}
								<dt>Description</dt>
								<dd>{description}</dd>
							{/if}
							{#if transcription}
								<dt>Transcription</dt>
								<dd>
									“{transcription}”
									{#if language}<span class="muted">({language})</span>{/if}
								</dd>
							{/if}
							{#if secrets.length}
								<dt>Anonymised<span class="swatch" aria-hidden="true"></span></dt>
								<dd>Anonymised regions (eg. for an address)</dd>
							{/if}
						</dl>
					{:else}
						<p class="muted">Nothing stored about this side.</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.panel {
		display: grid;
		grid-template-columns: 380px 1fr;
		gap: 40px;
		align-items: start;
		text-align: left;
	}
	.stage {
		display: grid;
		justify-content: center;
		padding: 0 28px 28px 0;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		--lift: 0px;
	}
	@property --fold {
		syntax: '<number>';
		inherits: true;
		initial-value: 0;
	}
	.figure {
		--fold: 0;
		--angle: calc(var(--fold) * -180deg);
		/* The folding half's projected height, in card heights: cos θ, foreshortened by the perspective */
		--projected: calc(max(0, cos(var(--angle))) / (1 - var(--hn) * sin(var(--angle)) / 1000));
		position: relative;
		width: var(--w);
		height: calc(2 * var(--h));
	}
	.figure.folded {
		--fold: 1;
	}
	.file {
		position: absolute;
		inset: 0;
		transform: translateY(calc(var(--h) / 2 * var(--fold)));
	}
	.to-back .file {
		transform: translateY(calc(var(--h) / -2 * var(--fold)));
	}
	.file img {
		display: block;
		width: var(--w);
		height: var(--h);
		object-fit: cover;
		object-position: top;
		backface-visibility: hidden;
	}
	.file .back-half {
		object-position: bottom;
		transform-origin: top;
		transform: perspective(1000px) rotateX(var(--angle));
	}
	.to-back .file .back-half {
		transform: none;
	}
	.to-back .file .front-half {
		transform-origin: bottom;
		transform: perspective(1000px) rotateX(calc(-1 * var(--angle)));
	}
	.card {
		position: absolute;
		top: calc(var(--h) / 2);
		left: 0;
		width: var(--w);
		height: var(--h);
	}
	.card :global(label.postcard) {
		width: 100%;
	}
	/* Hugs the folding half's projected outer edge */
	.measure {
		position: absolute;
		left: 0;
		width: var(--w);
		top: calc(var(--h) / 2 * var(--fold));
		height: calc(var(--h) * (1 + var(--projected)));
		pointer-events: none;
	}
	.to-back .measure {
		top: calc(var(--h) * (1 - var(--projected) - var(--fold) / 2));
	}
	.dim {
		display: grid;
		position: absolute;
		font-size: 11px;
		color: var(--secondary);
		white-space: nowrap;
	}
	.dim.w {
		left: 0;
		right: 0;
		top: calc(100% + 8px);
		border-top: 1px solid var(--tertiary);
		text-align: center;
		padding-top: 2px;
	}
	.dim.h {
		top: 0;
		bottom: 0;
		left: calc(100% + 8px);
		border-left: 1px solid var(--tertiary);
		writing-mode: vertical-rl;
		text-align: center;
		padding-left: 3px;
	}
	.dim > * {
		grid-area: 1 / 1;
	}
	.cm,
	.folded .px {
		visibility: hidden;
	}
	.folded .cm {
		visibility: visible;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 5;
		pointer-events: none;
		opacity: 0;
	}
	svg.shown {
		opacity: 1;
	}
	polygon {
		stroke: #ff375f;
		stroke-width: 1.5px;
		stroke-dasharray: 4 3;
		vector-effect: non-scaling-stroke;
	}

	@media (prefers-reduced-motion: no-preference) {
		.figure {
			transition: --fold 1s ease-in-out;
		}
		.folded .file,
		.folded .card {
			transition: visibility 0s 1s;
		}
		/* Units change when the folding half turns edge-on */
		.px,
		.cm {
			transition: visibility 0s 0.5s;
		}
		svg {
			transition: opacity 0.2s;
		}
		svg.shown {
			transition: opacity 0.4s 0.95s;
		}
	}
	.figure:not(.turning) .card :global(label.postcard) {
		transition: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.card :global(label.postcard) {
			transition: none;
		}
	}

	.tabs {
		display: inline-flex;
		margin-bottom: 28px;
		padding: 2px;
		border-radius: 9px;
		background: rgb(118 118 128 / 0.12);
	}
	[role='tab'] {
		padding: 6px 18px;
		border: 0;
		border-radius: 7px;
		background: none;
		color: var(--text);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}
	[role='tab'][aria-selected='true'] {
		background: #fff;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
	}
	.panels {
		display: grid;
	}
	[role='tabpanel'] {
		grid-area: 1 / 1;
	}
	dl {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 12px 22px;
		margin: 0;
		font-size: 15px;
		line-height: 1.45;
	}
	dt {
		color: var(--secondary);
		font-size: 13px;
		padding-top: 2px;
	}
	dd {
		margin: 0;
	}
	dd code {
		font-size: 13px;
	}
	.swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-left: 6px;
		box-sizing: border-box;
		border: 1.5px dashed #ff375f;
		border-radius: 2px;
		vertical-align: -1px;
		background: repeating-linear-gradient(
			135deg,
			rgba(255, 55, 95, 0.3) 0 2px,
			transparent 2px 4px
		);
	}
	.muted {
		color: var(--secondary);
	}
	p.muted {
		margin: 0;
		font-size: 15px;
	}

	@media (prefers-color-scheme: dark) {
		.tabs {
			background: rgb(118 118 128 / 0.24);
		}
		[role='tab'][aria-selected='true'] {
			background: #636366;
		}
	}
	@media (max-width: 733px) {
		.panel {
			grid-template-columns: 1fr;
		}
		/* The stage hugs what's left in view, so the tabs sit just under a folded card */
		.figure {
			height: calc(var(--h) * (1 + var(--projected)));
		}
		.file {
			transform: none;
		}
		.to-back .file {
			transform: translateY(calc(var(--h) * (var(--projected) - 1)));
		}
		.card,
		.measure,
		.to-back .measure {
			top: 0;
		}
		.tabs {
			display: flex;
			width: fit-content;
			margin-inline: auto;
		}
		.info {
			justify-self: center;
			width: 100%;
			max-width: 34em;
		}
	}
</style>
