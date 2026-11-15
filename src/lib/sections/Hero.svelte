<script lang="ts">
	import Postcard from '$lib/Postcard.svelte';
	import { getCard } from '$lib/cards';
	import { showcase } from '$lib/showcase';
</script>

<section class="hero">
	<div class="copy">
		<p class="eyebrow">.postcard</p>
		<h1>Every postcard, kept whole.</h1>
		<p class="lede">Both sides and every detail, in a single image.</p>
		<p class="ctas">
			<a class="pill" href="https://github.com/jphastings/postcard-collector.app/releases/latest/download/Postcards-macOS.zip">Download for Mac</a>
			<a href="https://shutup.jp">See them in use ›</a>
		</p>
	</div>
	<div class="card">
		<Postcard card={getCard(showcase.hero)} />
	</div>
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 48px;
		align-items: center;
		max-width: 1080px;
		margin: 0 auto;
		padding-top: 120px;
		text-align: left;
		overflow-x: clip;
	}
	.eyebrow {
		margin: 0 0 8px;
		font-size: 17px;
		font-weight: 600;
		color: var(--eyebrow);
	}
	h1 {
		font-size: clamp(48px, 6.5vw, 72px);
		line-height: 1.04;
		letter-spacing: -0.025em;
	}
	.lede {
		margin-left: 0;
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		align-items: center;
		margin: 32px 0 0;
		font-size: 17px;
	}
	.card {
		position: relative;
	}
	.card::before {
		content: '';
		position: absolute;
		inset: -25%;
		background: var(--hero-glow);
	}
	.card :global(label.postcard) {
		width: 100%;
	}
	@media (max-width: 733px) {
		.hero {
			grid-template-columns: 1fr;
			padding-top: 64px;
		}
	}
</style>
