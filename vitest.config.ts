import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	resolve: {
		alias: {
			$lib: resolve(__dirname, './src/lib')
		}
	},
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'jsdom',
		globals: true,
		passWithNoTests: true,
		setupFiles: ['tests/setup.ts']
	}
});
