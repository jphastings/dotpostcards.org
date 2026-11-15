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
</script>

<input
	type="checkbox"
	{id}
	class="visually-hidden"
	class:sequence={motion === 'sequence'}
	aria-label="Flip the {place} postcard"
	bind:checked={flipped}
/>
<label
	for={id}
	class="postcard flip-{card.flip} {orientation(card)}"
	class:sequence={motion === 'sequence'}
	role="img"
	aria-label={card.front.description ?? place}
	{style}
>
	<img src={card.src} alt="" loading="lazy" />
	<div class="shadow"></div>
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

	@media (prefers-reduced-motion: no-preference) {
		/* Looping cards can't be flipped, so their checkbox leaves the tab order until motion is reduced */
		input.sequence {
			visibility: hidden;
		}
		:global(.postcard.sequence) {
			animation: postcard-sequence 7s ease-in-out infinite;
			transition: none;
		}
	}

	/* 7s loop: flip over in the first 1s, hold, flip back round from 3.5s to 4.5s, hold */
	@keyframes -global-postcard-sequence {
		0% {
			--flip: 0deg;
		}
		14.286% {
			--flip: 180deg;
		}
		50% {
			--flip: 180deg;
		}
		64.286% {
			--flip: 360deg;
		}
		100% {
			--flip: 360deg;
		}
	}
</style>
