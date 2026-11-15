<script lang="ts">
	import '$lib/vendor/postcards@0.49.2.css';
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
