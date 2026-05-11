<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { initLanguage, language, setLanguage, uiText, type Language } from '$lib/i18n';
	import { initTheme, setTheme, theme, type Theme } from '$lib/preferences';

	const menu = [
		{ href: '/merge', labelKey: 'merge' },
		{ href: '/split', labelKey: 'split' },
		{ href: '/compress', labelKey: 'compress' }
	] as const;
	let { children } = $props();

	initLanguage();
	initTheme();

	function handleLanguageChange(nextLanguage: Language) {
		setLanguage(nextLanguage);
	}

	function handleThemeChange(nextTheme: Theme) {
		setTheme(nextTheme);
	}
</script>

<svelte:head>
	<!-- <link rel="icon" href={favicon} /> -->
	<title>{$uiText.appTitle}</title>
</svelte:head>
<div class="flex min-h-screen flex-col rounded-2xl bg-gray-50 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
	<header class="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-0">
		<h1 class="rounded-2xl text-gray-600 dark:text-slate-200">
			<a class="px-5 text-4xl font-bold tracking-tight md:text-5xl" href="/">{$uiText.appTitle}</a>
		</h1>
		<div class="w-full md:flex-1">
			<nav class="bg-primary px-4 md:px-0">
				<div class="mx-auto flex max-w-6xl items-center justify-between gap-6">
					<ul class="flex items-center space-x-6">
					{#each menu as item}
						<li>
							<a
								href={item.href}
								class="
              flex-1 py-5 text-center font-medium transition-colors
              {page.url.pathname === item.href
									? 'border-primary text-primary border-b-4 dark:text-sky-400'
									: 'text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white'}
            "
							>
								{$uiText.nav[item.labelKey]}
							</a>
						</li>
					{/each}
					</ul>
					<details class="relative">
						<summary
							class="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							{$uiText.settings.button}
						</summary>
						<div
							class="absolute right-0 z-20 mt-3 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
						>
							<div class="space-y-4">
								<div>
									<p class="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
										{$uiText.settings.language}
									</p>
									<div class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800">
										<button
											type="button"
											onclick={() => handleLanguageChange('en')}
											class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {$language === 'en'
												? 'bg-gray-900 text-white dark:bg-sky-500 dark:text-slate-950'
												: 'text-gray-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}"
										>
											{$uiText.languageToggle.english}
										</button>
										<button
											type="button"
											onclick={() => handleLanguageChange('vi')}
											class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {$language === 'vi'
												? 'bg-gray-900 text-white dark:bg-sky-500 dark:text-slate-950'
												: 'text-gray-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}"
										>
											{$uiText.languageToggle.vietnamese}
										</button>
									</div>
								</div>
								<div>
									<p class="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
										{$uiText.settings.theme}
									</p>
									<div class="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800">
										<button
											type="button"
											onclick={() => handleThemeChange('light')}
											class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {$theme === 'light'
												? 'bg-gray-900 text-white'
												: 'text-gray-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}"
										>
											{$uiText.settings.light}
										</button>
										<button
											type="button"
											onclick={() => handleThemeChange('dark')}
											class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {$theme === 'dark'
												? 'bg-sky-500 text-slate-950'
												: 'text-gray-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}"
										>
											{$uiText.settings.dark}
										</button>
									</div>
								</div>
							</div>
						</div>
					</details>
				</div>
			</nav>
		</div>
	</header>

	<main class="flex flex-col bg-gray-50 transition-colors dark:bg-slate-950">
		{@render children()}
	</main>

	<footer class="mt-auto border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
		<div class="flex items-center justify-center gap-3 text-gray-600 dark:text-slate-300">
			<span class="text-sm font-medium"
				>{$uiText.footer.craftedBy}
				<span class="font-bold">Le Quang Hy</span></span
			>
			<span class="text-gray-400 dark:text-slate-600">•</span>
			<a
				href="https://github.com/Lequanghy/pdf-utility"
				aria-label="Github"
				target="_blank"
				rel="noopener noreferrer"
				class="group inline-flex items-center gap-2 text-gray-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-sky-400"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					fill="currentColor"
					class="inline-block h-6 w-6"
					aria-label="GitHub"
				>
					<path
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
					/></svg
				>
			</a>
		</div>
	</footer>
</div>
