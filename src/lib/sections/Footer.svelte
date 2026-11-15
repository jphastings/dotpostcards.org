<script lang="ts">
	import { contactHref } from '$lib/email';

	let contact = $state('#contact');
	const reveal = () => (contact = contactHref());
</script>

<footer id="contact">
	<a href={contact} onpointerenter={reveal} onfocus={reveal} onclick={reveal} ontouchstart={reveal}>Get in touch</a>
	<a href="https://github.com/jphastings/dotpostcard">dotpostcard on GitHub</a>
	<a href="https://github.com/jphastings/postcard-collector.app">Postcard Collector on GitHub</a>
</footer>

<style>
	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px 32px;
		padding: 48px 22px 64px;
		border-top: 1px solid var(--panel);
		font-size: 14px;
	}
</style>
