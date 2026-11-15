<script lang="ts">
	import MetadataPanel from '$lib/MetadataPanel.svelte';
	import { getCard } from '$lib/cards';
	import { showcase } from '$lib/showcase';
</script>

<section>
	<h2>Everything stays together.</h2>
	<p class="lede">Just an image with standard XMP metadata inside, so you never lose context.</p>
	<div class="panel">
		<MetadataPanel card={getCard(showcase.together)} />
	</div>
</section>

<style>
	.panel {
		max-width: 900px;
		margin: 56px auto 0;
	}
</style>
