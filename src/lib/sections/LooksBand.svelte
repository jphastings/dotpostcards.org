<script lang="ts">
	import Postcard from '$lib/Postcard.svelte';
	import { getCard } from '$lib/cards';
	import { showcase } from '$lib/showcase';

	const cards = showcase.band.map(getCard);
</script>

<section>
	<div class="panel">
		<h2>Flip or flop</h2>
		<p class="lede">Store which way the postcard flips, for unnecessary accuracy.</p>
		<div class="band">
			{#each cards as card, i (card.name)}
				<figure>
					<Postcard {card} motion="sequence" delay="{i * 250}ms" />
					<figcaption>{card.flip} flip</figcaption>
				</figure>
			{/each}
		</div>
	</div>
</section>

<style>
	.panel {
		max-width: 1340px;
		margin: 0 auto;
		padding: 72px 24px;
		border-radius: 28px;
		background: var(--panel);
		overflow: clip;
	}
	.band {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 40px clamp(48px, 7vw, 110px);
		margin-top: 56px;
	}
	figure {
		position: relative;
		display: grid;
		grid-template-rows: 250px auto;
		justify-items: center;
		align-items: center;
		gap: 20px;
		margin: 0;
	}
	figure :global(label.postcard) {
		width: 170px;
	}
	figcaption {
		font-size: 14px;
		color: var(--secondary);
	}
	@media (max-width: 733px) {
		.panel {
			padding: 56px 16px;
		}
		figure {
			grid-template-rows: 170px auto;
			gap: 12px;
		}
		figure :global(label.postcard) {
			width: 130px;
		}
	}
</style>
