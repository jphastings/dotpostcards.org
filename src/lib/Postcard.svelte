<script lang="ts">
	import { orientation, type Card } from '$lib/cards';

	let {
		card,
		motion = 'tap',
		delay,
		flipped = $bindable(false)
	}: { card: Card; motion?: 'tap' | 'sequence'; delay?: string; flipped?: boolean } = $props();

	const uid = $props.id();
	const id = `postcard-${uid}`;
	const place = $derived(card.location?.name ?? card.name);
	const style = $derived.by(() => {
		const { pxW, pxH } = card.physical.frontSize;
		const base = `--postcard: url('${card.src}'); --aspect-ratio: ${pxW} / ${pxH}`;
		return motion === 'sequence' && delay ? `${base}; animation-delay: ${delay}` : base;
	});

	// Temporary, until the vendored library stops routing images through shared var(--postcard)
	// declarations. WebKit caches one var() result per declaration, so cards with different
	// --postcard values restyling every frame (--flip) keep evicting it, and Safari re-fetches and
	// blanks their images. Each card's own rules with literal URLs avoid that; mirrors the library's
	// declarations. Details: .superpowers/debug/LIBRARY-ISSUE.md
	const imageRules = $derived.by(() => {
		const selector = `label.postcard[data-card="${card.name}"]`;
		const url = `url('${card.src}')`;
		const face = (shade: string) =>
			`linear-gradient(var(${shade}), rgb(var(--v1), var(--v1), var(--v1)), rgb(var(--v2), var(--v2), var(--v2))), ${url}`;
		return `<style>
${selector}:not(.flip-none)::after { mask: ${url} top/100%; background-image: ${face('--shade')}; }
${selector}:not(.flip-none)::before { mask: ${url} bottom/100%; background-image: ${face('--shade-back')}; }
${selector} .shadow::before { mask: ${url} top/100%; }
</style>`;
	});
</script>

<svelte:head>{@html imageRules}</svelte:head>

<input
	type="checkbox"
	{id}
	class="visually-hidden"
	class:sequence={motion === 'sequence'}
	aria-label="Flip the {place} postcard"
	bind:checked={flipped}
/>
<label
	data-card={card.name}
	for={id}
	class="postcard flip-{card.flip} {orientation(card)}"
	class:sequence={motion === 'sequence'}
	role="img"
	aria-label={card.front.description ?? place}
	{style}
>
	<img src={card.src} alt="" loading="lazy" />
	<div class="shadow"></div>
	{#if motion === 'sequence'}
		<span class="axis" aria-hidden="true"><span></span></span>
	{/if}
</label>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	input:focus-visible + label {
		outline: 3px solid currentColor;
		outline-offset: 4px;
	}

	/* Face-sized, so --rise's percentages lift it exactly as far as the card. It skips --turn: the
	   line lies on that axis anyway, and turning would show it edge-on mid-flip. Between the shadow
	   (0) and the faces (2), so only its ends show past the card. */
	.axis {
		position: absolute;
		width: 100%;
		aspect-ratio: var(--aspect-ratio);
		z-index: 1;
		pointer-events: none;
		transform: var(--p) translateZ(var(--lift)) var(--rise);
	}
	.portrait .axis {
		width: auto;
		height: 100%;
	}
	.axis span {
		position: absolute;
		top: 50%;
		left: 50%;
		width: max(var(--card-w), var(--card-h));
		border-top: 1px dashed var(--tertiary);
		translate: -50% -50%;
	}
	.flip-book .axis span {
		rotate: 90deg;
	}
	:is(.flip-left-hand, .flip-right-hand) .axis span {
		width: calc(100cqw * sqrt(2));
		rotate: -45deg;
	}
	.flip-right-hand .axis span {
		rotate: 45deg;
	}

	@media (prefers-reduced-motion: no-preference) {
		/* Looping cards can't be flipped, so their checkbox leaves the tab order until motion is reduced */
		input.sequence {
			visibility: hidden;
		}
		/* label.: outranks the library's pointer, since clicking a looping card does nothing */
		:global(label.postcard.sequence) {
			animation: postcard-sequence 11s ease-in-out infinite;
			transition: none;
			cursor: default;
		}
	}

	/* 11s loop: flip over in the first 1s, hold, flip back the way it came from 5.5s to 6.5s, hold.
	   --flip stays in [0, 180] because the library's lift and shadow scale by sin(--flip), which goes negative past 180. The band
	   staggers its cards by 1.25s so they turn one after another. */
	@keyframes -global-postcard-sequence {
		0% {
			--flip: 0deg;
		}
		9.091% {
			--flip: 180deg;
		}
		50% {
			--flip: 180deg;
		}
		59.091% {
			--flip: 0deg;
		}
		100% {
			--flip: 0deg;
		}
	}
</style>
