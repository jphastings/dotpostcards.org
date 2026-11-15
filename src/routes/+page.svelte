<script lang="ts">
	import Hero from '$lib/sections/Hero.svelte';
	import LooksBand from '$lib/sections/LooksBand.svelte';
	import Together from '$lib/sections/Together.svelte';
	import LookThrough from '$lib/sections/LookThrough.svelte';
	import Make from '$lib/sections/Make.svelte';
	import Developers from '$lib/sections/Developers.svelte';
	import Footer from '$lib/sections/Footer.svelte';
</script>

<svelte:head>
	<title>.postcard — the open digital postcard format</title>
	<meta name="description" content="Both sides of a postcard and everything known about it, in one ordinary image." />
</svelte:head>

<main>
	<Hero />
	<LooksBand />
	<Together />
	<LookThrough />
	<Make />
	<Developers />
</main>
<Footer />
