<script lang="ts">
	import { onMount } from 'svelte';
	import { arModel, getCard } from '$lib/cards';
	import { showcase } from '$lib/showcase';

	const arCard = getCard(showcase.ar);
	const { href, label } = arModel(arCard);
	const { pxW, pxH } = arCard.physical.frontSize;

	let canViewInAR = $state(false);
	onMount(() => {
		canViewInAR = document.createElement('a').relList.supports('ar');
	});
</script>

<section>
	<h2>Gorgeous to look through.</h2>
	<div class="ways">
		<div>
			<h3>Postcard Collector</h3>
			<p>Your entire collection. On your Mac.</p>
			<a
				class="pill"
				href="https://github.com/jphastings/postcard-collector.app/releases/latest/download/Postcards-macOS.zip"
				>Download for Mac</a
			>
		</div>
		<div>
			<h3>On the web</h3>
			<p>Already out in the wild.</p>
			<ul>
				<li><a href="https://shutup.jp">shutup.jp</a></li>
			</ul>
		</div>
		{#if canViewInAR}
			<div>
				<h3>In your room</h3>
				<a rel="ar" {href}>
					<img
						class="ar"
						src={arCard.src}
						alt={label}
						style="aspect-ratio: {pxW} / {pxH}"
					/>
				</a>
			</div>
		{/if}
	</div>
</section>

<style>
	.ways {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 24px;
		max-width: 1080px;
		margin: 56px auto 0;
	}
	.ways > div {
		flex: 1 1 260px;
		max-width: 340px;
		padding: 40px 28px;
		border-radius: 28px;
		background: var(--panel);
	}
	h3 {
		margin: 0;
		font-size: 24px;
		letter-spacing: -0.01em;
	}
	p {
		margin: 8px 0 24px;
		color: var(--secondary);
		font-size: 17px;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 21px;
	}
	.ar {
		width: 100%;
		margin-top: 20px;
		object-fit: cover;
		object-position: top;
		border-radius: 4px;
	}
</style>
