<script lang="ts">
	import Command from '$lib/Command.svelte';

	const transcript = [
		'$ fastfoto-postcards --quality detail --format postcard --llm claude-code',
		'⚙︎ Scanning postcards into postcard format…',
		'⊕ Postcard scanned, analysing with your LLM…',
		'✓ london-sights scanned',
		'  ↳ Postcard (2.3MB)',
	].join('\n');
</script>

<section>
	<h2>Ridiculously easy to make.</h2>
	<div class="scan">
		<img
			src="/scanner/epson-ff680w.webp"
			alt="An Epson FastFoto FF-680W scanner: a stack of photos in its feeder, and one sliding out into its tray"
			width="1200"
			height="1076"
		/>
		<div>
			<p class="lede">Scan postcards rapidly with an Epson FastFoto FF-680W</p>
			<p class="help">With optional LLM help for</p>
			<ul>
				<li>orientation</li>
				<li>descriptions</li>
				<li>handwriting transcription</li>
				<li>location</li>
				<li>dates</li>
			</ul>
		</div>
	</div>
	<div class="install">
		<Command command="brew install jphastings/tools/fastfoto-postcards" />
		<figure class="terminal">
			<div class="chrome" aria-hidden="true"><span></span><span></span><span></span></div>
			<pre>{transcript}</pre>
		</figure>
	</div>
</section>

<style>
	.scan {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 48px;
		align-items: center;
		max-width: 980px;
		margin: 56px auto 0;
		text-align: left;
	}
	img {
		width: 100%;
		height: auto;
		box-sizing: border-box;
		padding: 8%;
		background: var(--hero-glow);
	}
	.lede {
		margin: 0;
		color: var(--text);
		font-weight: 600;
	}
	.help {
		margin: 32px 0 12px;
		font-size: 14px;
		color: var(--secondary);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		padding: 8px 16px;
		border-radius: 980px;
		background: var(--panel);
		font-size: 15px;
	}
	.install {
		display: grid;
		gap: 16px;
		max-width: 820px;
		margin: 48px auto 0;
	}
	.terminal {
		margin: 0;
		border: 1px solid #3a3a3c;
		border-radius: 12px;
		background: #1d1d1f;
		color: #f5f5f7;
		text-align: left;
		overflow: hidden;
	}
	.chrome {
		display: flex;
		gap: 8px;
		padding: 12px 14px;
		background: #2c2c2e;
	}
	.chrome span {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #ff5f57;
	}
	.chrome span:nth-child(2) {
		background: #febc2e;
	}
	.chrome span:nth-child(3) {
		background: #28c840;
	}
	pre {
		margin: 0;
		padding: 20px 24px 24px;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 14px;
		line-height: 1.6;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	@media (max-width: 733px) {
		.scan {
			grid-template-columns: 1fr;
			gap: 24px;
		}
	}
</style>
