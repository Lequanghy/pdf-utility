// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build', // default
			precompress: false, // optional
			envPrefix: 'SVELTE_', // optional
			polyfills: true // helps with some Node compat
		}),
		// For a pure client-side app like yours, these help avoid SSR issues
		csr: true,
		ssr: false, // disable server-side rendering
		prerender: { entries: [] } // no prerendering needed
	}
};

export default config;
