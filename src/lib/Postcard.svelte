<script lang="ts">
	import { orientation, type Card } from '$lib/cards';

	let {
		card,
		motion = 'tap',
		delay,
		flipped = $bindable(false)
	}: { card: Card; motion?: 'tap' | 'spin'; delay?: string; flipped?: boolean } = $props();

	const uid = $props.id();
	const id = `postcard-${uid}`;
	const style = $derived.by(() => {
		const { pxW, pxH } = card.physical.frontSize;
		const base = `--postcard: url('${card.src}'); --aspect-ratio: ${pxW} / ${pxH}`;
		return motion === 'spin' && delay ? `${base}; animation-delay: ${delay}` : base;
	});
</script>

<input type="checkbox" {id} class="visually-hidden" aria-label="Flip postcard" bind:checked={flipped} />
<label
	for={id}
	class="postcard flip-{card.flip} {orientation(card)}"
	class:spin={motion === 'spin'}
	role="img"
	aria-label={card.front.description}
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
		:global(.postcard.spin) {
			animation: postcard-spin 3s linear infinite;
			transition: none;
		}
	}

	@keyframes -global-postcard-spin {
		from {
			--flip: 0deg;
		}
		to {
			--flip: 360deg;
		}
	}
</style>
