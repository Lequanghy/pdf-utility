<script lang="ts">
	import { uiText } from '$lib/i18n';
</script>

<div class="mx-auto max-w-5xl px-6 py-16 text-center">
	<h2 class="mb-10 text-3xl font-bold text-gray-900 dark:text-slate-100">{$uiText.home.title}</h2>

	<div class="grid gap-8 md:grid-cols-3">
		<a
			href="/merge"
			class="group block rounded-xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-slate-950/40"
		>
			<h3 class="mb-4 text-2xl font-semibold text-gray-700 group-hover:text-gray-800 dark:text-slate-100 dark:group-hover:text-sky-300">
				{$uiText.home.mergeTitle}
			</h3>
			<p class="text-gray-600 dark:text-slate-400">{$uiText.home.mergeDescription}</p>
		</a>

		<a
			href="/split"
			class="group block rounded-xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-slate-950/40"
		>
			<h3 class="mb-4 text-2xl font-semibold text-gray-700 group-hover:text-gray-800 dark:text-slate-100 dark:group-hover:text-sky-300">
				{$uiText.home.splitTitle}
			</h3>
			<p class="text-gray-600 dark:text-slate-400">{$uiText.home.splitDescription}</p>
		</a>

		<a
			href="/compress"
			class="group block rounded-xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-slate-950/40"
		>
			<h3 class="mb-4 text-2xl font-semibold text-gray-700 group-hover:text-gray-800 dark:text-slate-100 dark:group-hover:text-sky-300">
				{$uiText.home.compressTitle}
			</h3>
			<p class="text-gray-600 dark:text-slate-400">{$uiText.home.compressDescription}</p>
		</a>
	</div>
</div>
