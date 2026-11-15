<script lang="ts">
	let { command }: { command: string } = $props();
	const id = $props.id();
	let status = $state<'Copy' | 'Copied' | 'Press ⌘C'>('Copy');
	let code: HTMLElement;

	async function copy() {
		try {
			await navigator.clipboard.writeText(command);
			status = 'Copied';
		} catch {
			getSelection()?.selectAllChildren(code);
			status = 'Press ⌘C';
		}
		setTimeout(() => (status = 'Copy'), 2000);
	}
</script>

<div class="command">
	<code id="command-{id}" bind:this={code}>{command}</code>
	<button aria-describedby="command-{id}" onclick={copy}>{status}</button>
</div>

<style>
	.command {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 16px;
		padding: 18px 18px 18px 24px;
		border-radius: 18px;
		background: var(--panel);
		text-align: left;
	}
	code {
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
