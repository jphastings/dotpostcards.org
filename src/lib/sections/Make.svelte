<script lang="ts">
	const install = 'brew install jphastings/tools/postcards jphastings/tools/fastfoto-postcards';
	let status = $state<'Copy' | 'Copied' | 'Press ⌘C'>('Copy');
	let command: HTMLElement;

	async function copy() {
		try {
			await navigator.clipboard.writeText(install);
			status = 'Copied';
		} catch {
			getSelection()?.selectAllChildren(command);
			status = 'Press ⌘C';
		}
		setTimeout(() => (status = 'Copy'), 2000);
	}
</script>

<section>
	<h2>Easy to make.</h2>
	<p class="lede">
		Feed a stack through an Epson FastFoto FF-680W and <code>fastfoto-postcards</code> turns every
		scan into a postcard.
	</p>
	<p class="help">Optional LLM help with</p>
	<ul>
		<li>orientation</li>
		<li>descriptions</li>
		<li>handwriting transcription</li>
		<li>location</li>
		<li>dates from postmarks or handwritten datestamps</li>
	</ul>
	<div class="install">
		<code bind:this={command}>{install}</code>
		<button onclick={copy}>{status}</button>
	</div>
</section>

<style>
	.lede code {
		white-space: nowrap;
	}
	.help {
		margin: 40px 0 12px;
		font-size: 14px;
		color: var(--secondary);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		max-width: 720px;
		margin: 0 auto;
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
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 16px;
		max-width: 820px;
		margin: 48px auto 0;
		padding: 18px 18px 18px 24px;
		border-radius: 18px;
		background: var(--panel);
		text-align: left;
	}
	.install code {
		flex: 1 1 300px;
		overflow-wrap: anywhere;
		font-size: 14px;
		line-height: 1.5;
	}
	button {
		flex: none;
		padding: 8px 18px;
		border: 0;
		border-radius: 980px;
		background: var(--button);
		color: #fff;
		font: inherit;
		font-size: 15px;
		cursor: pointer;
	}
</style>
