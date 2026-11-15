<script lang="ts">
	const docs = 'https://github.com/jphastings/dotpostcard/blob/main/docs/formats';
	const items = [
		['CSS-only flippable postcards for any website', `${docs}/css.md`],
		['A WASM encoder: images and metadata in, postcard out', 'https://github.com/jphastings/dotpostcard/releases'],
		['Postcards stored in AT Protocol repositories', `${docs}/atproto.md`],
		['USDZ models for games and AR', `${docs}/usdz.md`],
		['The XMP metadata spec', `${docs}/xmp.md`],
		['Go packages', 'https://github.com/jphastings/dotpostcard#using-dotpostcard-as-a-library']
	];
</script>

<section>
	<h2>For developers.</h2>
	<ul>
		{#each items as [text, href] (href)}
			<li><a {href}>{text} ›</a></li>
		{/each}
	</ul>
</section>

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 12px;
		max-width: 980px;
		margin: 56px auto 0;
		padding: 0;
		list-style: none;
		text-align: left;
	}
	a {
		display: block;
		height: 100%;
		box-sizing: border-box;
		padding: 24px 28px;
		border-radius: 18px;
		background: var(--panel);
		font-size: 19px;
		line-height: 1.3;
	}
</style>
