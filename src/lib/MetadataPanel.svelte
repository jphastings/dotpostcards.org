<script lang="ts">
	import Postcard from '$lib/Postcard.svelte';
	import {
		formatDate,
		isHeteroriented,
		sideSize,
		transcriptionLanguage,
		type Card,
		type Flip
	} from '$lib/cards';

	let { card }: { card: Card } = $props();
	let flipped = $state(false);

	const uid = $props.id();
	const flipLabels: Record<Flip, string | undefined> = {
		'left-hand': 'Left-hand',
		'right-hand': 'Right-hand',
		book: 'Book',
		calendar: 'Calendar',
		none: undefined
	};
	const cardRows = $derived(
		[
			['Location', card.location?.name],
			['Sent on', card.sentOn && formatDate(card.sentOn)],
			['From', card.sender?.name],
			['To', card.recipient?.name],
			['Flip', flipLabels[card.flip]]
		].filter((row): row is [string, string] => !!row[1])
	);

	const side = $derived(flipped ? card.back : card.front);
	const sideName = $derived(flipped ? 'back' : 'front');
	const transcription = $derived(side?.transcription?.text);
	const language = $derived(side && transcriptionLanguage(side));
	const sideHasSecrets = $derived(!!side?.secrets?.length);
	const showSide = $derived(!!(side?.description || transcription || sideHasSecrets));

	const cardLength = 240;
	const { pxW, pxH } = $derived(card.physical.frontSize);
	// Hand flips are drawn in a square box with the longer side at cardLength; others fill the width
	const scale = $derived(cardLength / (isHeteroriented(card.flip) ? Math.max(pxW, pxH) : pxW));
	const frontBox = $derived({ width: pxW * scale, height: pxH * scale });
	const overlays = $derived(
		(['front', 'back'] as const).map((name) => ({
			name,
			size: sideSize(card, name),
			secrets: card[name]?.secrets ?? [],
			box:
				name === 'back' && isHeteroriented(card.flip)
					? { width: frontBox.height, height: frontBox.width }
					: frontBox
		}))
	);
</script>

<div class="panel">
	<div class="stage">
		<Postcard {card} bind:flipped />
		{#each overlays as { name, size, secrets, box } (name)}
			<div
				class="overlay"
				class:active={name === sideName}
				style="width: {box.width}px; height: {box.height}px"
			>
				<span class="dim w">{size.width}</span>
				<span class="dim h">{size.height}</span>
				{#if secrets.length}
					<svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
						<defs>
							<pattern
								id="hatch-{uid}-{name}"
								width="10"
								height="10"
								patternUnits="userSpaceOnUse"
								patternTransform="scale({1 / box.width} {1 / box.height})"
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
			</div>
		{/each}
	</div>

	<div class="groups">
		<section>
			<h4>The card</h4>
			<dl>
				{#each cardRows as [label, value] (label)}
					<dt>{label}</dt>
					<dd>{value}</dd>
				{/each}
			</dl>
		</section>
		{#if showSide && side}
			<section>
				<h4>This side · {sideName}</h4>
				<dl>
					{#if side.description}
						<dt>Description</dt>
						<dd>{side.description}</dd>
					{/if}
					{#if transcription}
						<dt>Transcription</dt>
						<dd>
							“{transcription}”
							{#if language}<span class="muted">({language})</span>{/if}
						</dd>
					{/if}
					{#if sideHasSecrets}
						<dt><span class="swatch" aria-hidden="true"></span>Anonymised</dt>
						<dd>Anonymised regions (eg. for an address)</dd>
					{/if}
				</dl>
			</section>
		{/if}
		<p class="foot">Stored as XMP inside <code>{card.name}.postcard.webp</code></p>
	</div>
</div>

<style>
	.panel {
		display: grid;
		grid-template-columns: 380px 1fr;
		gap: 40px;
		align-items: center;
		text-align: left;
	}
	.stage {
		position: relative;
		width: 380px;
		height: 380px;
		display: grid;
		place-items: center;
	}
	.stage :global(label.postcard) {
		width: 240px;
	}
	.overlay {
		position: absolute;
		inset: 0;
		margin: auto;
		pointer-events: none;
		z-index: 5;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.overlay.active {
		opacity: 1;
		transition: opacity 0.4s 0.95s;
	}
	.dim {
		position: absolute;
		font-size: 11px;
		color: var(--secondary);
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
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	polygon {
		stroke: #ff375f;
		stroke-width: 1.5px;
		stroke-dasharray: 4 3;
		vector-effect: non-scaling-stroke;
	}
	.groups {
		display: grid;
		gap: 26px;
	}
	h4 {
		margin: 0 0 10px;
		font-size: 12px;
		font-weight: 600;
		color: #86868b;
		letter-spacing: 0.02em;
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
		color: #86868b;
		font-size: 13px;
		padding-top: 2px;
	}
	dd {
		margin: 0;
	}
	.swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-right: 6px;
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
	.muted,
	.foot {
		color: #86868b;
	}
	.foot {
		margin: 0;
		font-size: 13px;
	}
	.foot code {
		font-size: 12px;
		color: var(--text);
	}
	@media (max-width: 733px) {
		.panel {
			grid-template-columns: 1fr;
			justify-items: center;
		}
		.stage {
			width: 100%;
		}
	}
</style>
