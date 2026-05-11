import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pdf-utility-theme';

export const theme = writable<Theme>('light');

export function initTheme() {
	if (!browser) {
		return;
	}

	const savedTheme = window.localStorage.getItem(STORAGE_KEY);
	if (savedTheme === 'light' || savedTheme === 'dark') {
		applyTheme(savedTheme);
		return;
	}

	const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
	applyTheme(preferredTheme);
}

export function setTheme(nextTheme: Theme) {
	applyTheme(nextTheme);

	if (browser) {
		window.localStorage.setItem(STORAGE_KEY, nextTheme);
	}
}

function applyTheme(nextTheme: Theme) {
	theme.set(nextTheme);

	if (!browser) {
		return;
	}

	document.documentElement.classList.toggle('dark', nextTheme === 'dark');
}
