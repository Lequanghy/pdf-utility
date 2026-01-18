// svelte.config.js
import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapter =
	process.env.ADAPTER === 'node'
		? adapterNode({
				out: 'build', // default
				precompress: false,
				envPrefix: 'SVELTE_',
				polyfills: true
			})
		: adapterStatic({ fallback: 'index.html' });

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter
		// adapter: adapter({
		// 	out: 'build', // default
		// 	precompress: false,
		// 	envPrefix: 'SVELTE_',
		// 	polyfills: true
		// })
	}
};

export default config;
