<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { initLanguage, language, setLanguage, uiText, type Language } from '$lib/i18n';

	const menu = [
		{ href: '/merge', labelKey: 'merge' },
		{ href: '/split', labelKey: 'split' },
		{ href: '/compress', labelKey: 'compress' }
	] as const;
	let { children } = $props();

	initLanguage();

	function handleLanguageChange(nextLanguage: Language) {
		setLanguage(nextLanguage);
	}
</script>

<svelte:head>
	<!-- <link rel="icon" href={favicon} /> -->
	<title>{$uiText.appTitle}</title>
</svelte:head>
<div class="flex min-h-screen flex-col rounded-2xl">
	<header class="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-0">
		<h1 class="rounded-2xl text-gray-600">
			<a class="px-5 text-4xl font-bold tracking-tight md:text-5xl" href="/">{$uiText.appTitle}</a>
		</h1>
		<div class="flex flex-col items-start gap-4 md:items-end">
			<div class="flex items-center gap-2 px-4 md:px-0">
				<span class="text-sm font-medium text-gray-600">{$uiText.languageToggle.label}</span>
				<div class="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
					<button
						type="button"
						onclick={() => handleLanguageChange('en')}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {$language === 'en'
							? 'bg-gray-900 text-white'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						{$uiText.languageToggle.english}
					</button>
					<button
						type="button"
						onclick={() => handleLanguageChange('vi')}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {$language === 'vi'
							? 'bg-gray-900 text-white'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						{$uiText.languageToggle.vietnamese}
					</button>
				</div>
			</div>
			<nav class="bg-primary">
				<div class="mx-auto max-w-6xl px-4">
					<ul class="flex space-x-6">
					{#each menu as item}
						<li>
							<a
								href={item.href}
								class="
              flex-1 py-5 text-center font-medium transition-colors
              {page.url.pathname === item.href
									? 'border-primary text-primary border-b-4'
									: 'text-gray-600 hover:text-gray-900'}
            "
							>
								{$uiText.nav[item.labelKey]}
							</a>
						</li>
					{/each}
					</ul>
				</div>
			</nav>
		</div>
	</header>

	<main class=" flex flex-col bg-gray-50">
		{@render children()}
	</main>

	<footer class="mt-auto border-t bg-white py-6 text-center text-sm text-gray-500">
		<div class="flex items-center justify-center gap-3 text-gray-600">
			<span class="text-sm font-medium"
				>{$uiText.footer.craftedBy}
				<span class="font-bold">Le Quang Hy</span></span
			>
			<span class="text-gray-400">•</span>
			<a
				href="https://github.com/Lequanghy/pdf-utility"
				aria-label="Github"
				target="_blank"
				rel="noopener noreferrer"
				class="group inline-flex items-center gap-2 text-gray-600 transition hover:text-indigo-600"
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
