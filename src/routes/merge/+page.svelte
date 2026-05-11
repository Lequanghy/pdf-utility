<script lang="ts">
	import {
		getMergeableFileKind,
		getMergeableFiles,
		mergeFilesToPdf,
		type MergeableFile
	} from '$lib/pdf/merge';
	import { uiText } from '$lib/i18n';

	let mergeFiles: MergeableFile[] = $state([]);
	let mergeStatus = $state('');
	let mergeDropStatus = $state('');
	let dragging = $state(false);
	let isMerging = $state(false);

	async function handleMergeFiles(selected: FileList | null | undefined) {
		const validFiles = getMergeableFiles(selected);
		if (validFiles.length === 0) {
			mergeStatus = $uiText.merge.invalidSelection;
			return;
		}

		mergeFiles = [...mergeFiles, ...validFiles];
		mergeDropStatus = '';
		mergeStatus = $uiText.merge.filesReady(mergeFiles.length);
	}

	function removeMergeFile(index: number) {
		mergeFiles = mergeFiles.filter((_, i) => i !== index);
		mergeStatus = mergeFiles.length === 0 ? '' : $uiText.merge.filesReady(mergeFiles.length);
	}

	function clearMergeFiles() {
		mergeFiles = [];
		mergeStatus = '';
		mergeDropStatus = '';
	}

	function moveMergeFile(fromIndex: number, toIndex: number) {
		if (toIndex < 0 || toIndex >= mergeFiles.length || fromIndex === toIndex) {
			return;
		}

		const reordered = [...mergeFiles];
		const [item] = reordered.splice(fromIndex, 1);
		reordered.splice(toIndex, 0, item);
		mergeFiles = reordered;
		mergeStatus = $uiText.merge.fileOrderUpdated;
	}

	async function mergePDFs() {
		if (mergeFiles.length === 0) return;
		isMerging = true;
		mergeStatus = $uiText.merge.merging;

		try {
			const bytes = await mergeFilesToPdf(mergeFiles);
			download(bytes, `merged_${dateStr()}.pdf`);
			mergeStatus = $uiText.merge.success(mergeFiles.length);
		} catch (err) {
			mergeStatus = `Error: ${err instanceof Error ? err.message : $uiText.merge.failed}`;
		} finally {
			isMerging = false;
		}
	}

	function dateStr() {
		return new Date().toISOString().slice(0, 10);
	}
	function download(bytes: Uint8Array, filename: string) {
		const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	// ─── Drop logic ────────────────────────────────────
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;

		const droppedFiles = e.dataTransfer?.files;
		if (!droppedFiles) return;

		const hasUnsupportedFiles = Array.from(droppedFiles).some(
			(file) => !getMergeableFileKind(file)
		);
		if (hasUnsupportedFiles) {
			mergeDropStatus = $uiText.merge.unsupportedFiles;
			return;
		}

		handleMergeFiles(droppedFiles);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}
</script>

<div class="flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
	<div class="flex items-center justify-center">
		<div
			class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:shadow-slate-950/40"
		>
			<div class="px-8 py-10">
				<h2 class="mb-3 text-2xl font-bold text-gray-900 dark:text-slate-100">
					{$uiText.merge.title}
				</h2>
				<p class="mb-6 text-gray-600 dark:text-slate-400">{$uiText.merge.description}</p>
				<label
					for="file-input"
					class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-10 text-center hover:bg-blue-100"
					class:border-green-500={dragging}
					class:bg-green-50={dragging}
					class:border-blue-400={!dragging}
					class:bg-blue-50={!dragging}
					class:hover:border-blue-500={!dragging}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<input
						id="file-input"
						type="file"
						accept="application/pdf,image/jpeg,image/png,image/webp"
						multiple
						class="hidden"
						onchange={(e) => handleMergeFiles(e.currentTarget.files)}
					/>
					<svg
						class="mx-auto mb-4 h-16 w-16 text-blue-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
						/>
					</svg>
					{#if dragging}
						<p class="text-xl font-medium text-green-700 dark:text-slate-800">
							{$uiText.merge.dropActive}
						</p>
					{:else}
						<p class="text-xl font-medium text-gray-800 dark:text-slate-800">
							{$uiText.merge.dropIdle}
						</p>
						<p class="mt-2 text-gray-600 dark:text-slate-600">{$uiText.merge.dropHelp}</p>
					{/if}
				</label>

				{#if mergeDropStatus}
					<p
						class="mt-4 text-center text-sm {mergeDropStatus.includes('Please')
							? 'text-red-600'
							: 'text-green-600'}"
					>
						{mergeDropStatus}
					</p>
				{/if}

				{#if mergeFiles.length > 0}
					<div class="mt-8">
						<div class="mb-3 flex items-center justify-between gap-4">
							<div>
								<p class="text-sm font-medium text-gray-700 dark:text-slate-200">
									{$uiText.merge.orderTitle}
								</p>
								<p class="text-sm text-gray-500 dark:text-slate-500">
									{$uiText.merge.orderDescription}
								</p>
							</div>
							<button
								type="button"
								onclick={clearMergeFiles}
								class="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
							>
								{$uiText.merge.clearAll}
							</button>
						</div>
						<div class="space-y-3">
							{#each mergeFiles as item, i (item.file.name + i)}
								<div
									class="flex items-center justify-between gap-4 rounded-lg bg-gray-100 px-5 py-3 dark:bg-slate-800"
								>
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<div
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-700 dark:bg-slate-700 dark:text-slate-100"
										>
											{i + 1}
										</div>
										{#if item.kind === 'pdf'}
											<svg class="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
												<path
													d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
												/>
											</svg>
										{:else}
											<svg
												class="h-6 w-6 text-blue-600"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.5"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-10h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
										{/if}
										<div class="min-w-0 flex-1">
											<p class="truncate font-medium">{item.file.name}</p>
											<p class="text-sm text-gray-500 dark:text-slate-400">
												{item.kind.toUpperCase()} • {(item.file.size / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
									</div>
									<div class="flex shrink-0 items-center gap-2">
										<button
											type="button"
											onclick={() => moveMergeFile(i, i - 1)}
											disabled={i === 0}
											aria-label={$uiText.merge.moveUp(item.file.name)}
											class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-600"
										>
											↑
										</button>
										<button
											type="button"
											onclick={() => moveMergeFile(i, i + 1)}
											disabled={i === mergeFiles.length - 1}
											aria-label={$uiText.merge.moveDown(item.file.name)}
											class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-600"
										>
											↓
										</button>
										<button
											type="button"
											onclick={() => removeMergeFile(i)}
											class="ml-1 text-red-600 hover:text-red-800"
										>
											{$uiText.merge.remove}
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			{#if mergeFiles.length > 0}
				<div class="bg-white px-8 pb-10 dark:bg-slate-900">
					<div class="flex justify-center">
						<button
							id="mergeBtn"
							onclick={mergePDFs}
							disabled={mergeFiles.length === 0 || isMerging}
							class="rounded-xl px-10 py-4 font-semibold text-white shadow-md transition-all
                     {isMerging || mergeFiles.length === 0
								? 'bg-primary cursor-not-allowed'
								: 'bg-green-600 hover:bg-green-700'}"
						>
							{isMerging ? 'Merging…' : $uiText.merge.mergeButton(mergeFiles.length)}
						</button>
					</div>
					{#if mergeStatus}
						<p class="mt-6 text-center text-sm font-medium text-gray-700 dark:text-slate-300">
							{mergeStatus}
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
