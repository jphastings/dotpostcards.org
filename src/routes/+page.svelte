<script lang="ts">
	import Postcard from '$lib/Postcard.svelte';
	import { getCard } from '$lib/cards';
</script>

<h1>.postcard</h1>
<Postcard card={getCard('iceland')} />
<Postcard card={getCard('athens')} motion="spin" />
