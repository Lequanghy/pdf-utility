<script lang="ts">
	import { PDFDocument } from 'pdf-lib';
	import Dropzone from 'svelte-file-dropzone';
	import type FileRejection from 'svelte-file-dropzone';

	// Shared state
	let mode: 'merge' | 'split' = $state('merge');

	// Merge state
	let mergeFiles: File[] = $state([]);
	let mergeStatus = $state('');
	let isMerging = $state(false);

	// Split state
	let splitFile: File | null = $state(null);
	let splitPdfDoc: PDFDocument | null = $state(null);
	let totalPages = $state(0);
	let splitMode: 'per-page' | 'range' = $state('per-page');
	let rangeInput = $state(''); // e.g. "1-5,8,10-12"
	let splitStatus = $state('');
	let isSplitting = $state(false);

	// Drop state
	let mergeDropStatus = $state('');
	let splitDropStatus = $state('');

	// ─── Helpers ────────────────────────────────────────
	function handleMergeFiles(selected: FileList | null | undefined) {
		if (!selected) return;
		const pdfs = Array.from(selected).filter((f) => f.type === 'application/pdf');
		mergeFiles = [...mergeFiles, ...pdfs];
		mergeStatus = '';
	}

	function removeMergeFile(index: number) {
		mergeFiles = mergeFiles.filter((_, i) => i !== index);
	}

	async function mergePDFs() {
		if (mergeFiles.length === 0) return;
		isMerging = true;
		mergeStatus = 'Merging PDFs... please wait';

		try {
			const merged = await PDFDocument.create();
			for (const file of mergeFiles) {
				const buf = await file.arrayBuffer();
				const src = await PDFDocument.load(buf);
				const pages = await merged.copyPages(src, src.getPageIndices());
				pages.forEach((p) => merged.addPage(p));
			}
			const bytes = await merged.save();
			download(bytes, `merged_${dateStr()}.pdf`);
			mergeStatus = `Success! Merged ${mergeFiles.length} file${mergeFiles.length === 1 ? '' : 's'}`;
		} catch (err) {
			mergeStatus = `Error: ${err instanceof Error ? err.message : 'Failed'}`;
		} finally {
			isMerging = false;
		}
	}

	// ─── Split logic ────────────────────────────────────
	async function handleSplitFile(selected: FileList | null | undefined) {
		if (!selected || selected.length === 0) return;
		const file = selected[0];
		if (file.type !== 'application/pdf') {
			splitStatus = 'Please select a PDF file';
			return;
		}

		splitFile = file;
		splitStatus = 'Loading PDF...';
		try {
			const buf = await file.arrayBuffer();
			splitPdfDoc = await PDFDocument.load(buf);
			totalPages = splitPdfDoc.getPageCount();
			splitStatus = `PDF loaded — ${totalPages} page${totalPages === 1 ? '' : 's'}`;
		} catch (err) {
			splitStatus = `Error loading PDF: ${err instanceof Error ? err.message : 'Invalid file'}`;
			splitFile = null;
			splitPdfDoc = null;
			totalPages = 0;
		}
	}

	async function splitPDF() {
		if (!splitPdfDoc || totalPages === 0) return;
		isSplitting = true;
		splitStatus = 'Splitting... please wait';

		try {
			if (splitMode === 'per-page') {
				for (let i = 0; i < totalPages; i++) {
					const newDoc = await PDFDocument.create();
					const [page] = await newDoc.copyPages(splitPdfDoc, [i]);
					newDoc.addPage(page);
					const bytes = await newDoc.save();
					download(bytes, `page_${i + 1}_of_${totalPages}_${dateStr()}.pdf`);
				}
				splitStatus = `Success! Downloaded ${totalPages} single-page PDF${totalPages === 1 ? '' : 's'}`;
			} else {
				// Range mode
				const pagesToExtract = parsePageRange(rangeInput, totalPages);
				if (pagesToExtract.length === 0) throw new Error('No valid pages selected');

				const newDoc = await PDFDocument.create();
				const copied = await newDoc.copyPages(splitPdfDoc, pagesToExtract);
				copied.forEach((p) => newDoc.addPage(p));

				const bytes = await newDoc.save();
				download(bytes, `extracted_${pagesToExtract.length}_pages_${dateStr()}.pdf`);
				splitStatus = `Success! Extracted ${pagesToExtract.length} page${pagesToExtract.length === 1 ? '' : 's'}`;
			}
		} catch (err) {
			splitStatus = `Error: ${err instanceof Error ? err.message : 'Failed to split'}`;
		} finally {
			isSplitting = false;
		}
	}

	function parsePageRange(input: string, max: number): number[] {
		const result = new Set<number>();
		const parts = input
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);

		for (const part of parts) {
			if (/^\d+$/.test(part)) {
				const n = Number(part);
				if (n >= 1 && n <= max) result.add(n - 1); // 0-based for pdf-lib
			} else if (/^\d+-\d+$/.test(part)) {
				const [start, end] = part.split('-').map(Number);
				if (start >= 1 && end <= max && start <= end) {
					for (let i = start; i <= end; i++) result.add(i - 1);
				}
			}
		}
		return Array.from(result).sort((a, b) => a - b);
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
	function onMergeDrop(e: CustomEvent<{ acceptedFiles: File[]; fileRejections: FileRejection[] }>) {
		const { acceptedFiles, fileRejections } = e.detail;

		if (fileRejections.length > 0) {
			mergeDropStatus = `Rejected: ${fileRejections.map((r) => r.file.name + ' - ' + r.errors[0].message).join(', ')}`;
			mergeDropStatus = mergeDropStatus + 'Split mode: only one PDF allowed';
			return;
		}

		if (mode === 'split' && acceptedFiles.length > 1) {
			mergeDropStatus = 'Split mode: only one PDF allowed';
			return;
		}

		acceptedFiles.forEach(async (file) => {
			if (mode === 'merge') {
				mergeFiles = [...mergeFiles, file];
			} else {
				splitFile = file;
			}
		});

		mergeDropStatus = `Added ${acceptedFiles.length} PDF${acceptedFiles.length !== 1 ? 's' : ''}`;
	}

	function onSplitDrop(e: CustomEvent<{ acceptedFiles: File[]; fileRejections: FileRejection[] }>) {
		const { acceptedFiles, fileRejections } = e.detail;

		if (fileRejections.length > 0) {
			splitDropStatus = `Rejected: ${fileRejections.map((r) => r.file.name + ' - ' + r.errors[0].message).join(', ')}`;
			splitDropStatus = splitDropStatus + 'Split mode: only one PDF allowed';
			return;
		}

		if (mode === 'split' && acceptedFiles.length > 1) {
			splitDropStatus = 'Split mode: only one PDF allowed';
			return;
		}

		acceptedFiles.forEach(async (file) => {
			if (mode === 'merge') {
				mergeFiles = [...mergeFiles, file];
			} else {
				splitFile = file;
			}
		});

		splitDropStatus = `Added ${acceptedFiles.length} PDF${acceptedFiles.length !== 1 ? 's' : ''}`;
	}
</script>

<main class="flex min-h-screen flex-col bg-gray-50">
	<div class="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
		<div class="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
			<!-- Mode Tabs -->
			<div class="flex border-b border-gray-200">
				<button
					onclick={() => (mode = 'merge')}
					class="flex-1 py-5 text-center font-medium transition-colors
                 {mode === 'merge'
						? 'border-primary text-primary border-b-4'
						: 'text-gray-600 hover:text-gray-900'}"
				>
					Merge
				</button>
				<button
					onclick={() => (mode = 'split')}
					class="flex-1 py-5 text-center font-medium transition-colors
                 {mode === 'split'
						? 'border-primary text-primary border-b-4'
						: 'text-gray-600 hover:text-gray-900'}"
				>
					Split
				</button>
			</div>

			<!-- Merge Content -->

			{#if mode === 'merge'}
				<div class="px-8 pt-8">
					<h2 class="mb-3 text-2xl font-bold text-gray-900">Merge PDFs</h2>
					<p class="mb-6 text-gray-600">Combine multiple PDFs into one</p>
					<Dropzone
						on:drop={onMergeDrop}
						accept="application/pdf"
						multiple={mode === 'merge'}
						class=""
					>
						<div
							class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-10 text-center hover:bg-blue-100"
						>
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
							<p class="text-xl font-medium text-gray-800">Drop PDFs here or click to select</p>
						</div>
					</Dropzone>

					{#if mergeDropStatus}
						<p
							class="mt-4 text-center text-sm {mergeDropStatus.includes('Rejected') ||
							mergeDropStatus.includes('only one')
								? 'text-red-600'
								: 'text-emerald-600'}"
						>
							{mergeDropStatus}
						</p>
					{/if}

					<!-- <label
						for="merge-upload"
						class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-10 text-center hover:bg-blue-100"
					>
						<input
							id="merge-upload"
							type="file"
							multiple
							accept="application/pdf"
							class="sr-only"
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
						<p class="text-xl font-medium text-gray-800">Drop PDFs here or click to select</p>
					</label> -->

					{#if mergeFiles.length > 0}
						<div class="mt-8 space-y-3">
							{#each mergeFiles as file, i (file.name + i)}
								<div class="flex items-center justify-between rounded-lg bg-gray-100 px-5 py-3">
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<svg class="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
											<path
												d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
											/>
										</svg>
										<div class="min-w-0 flex-1">
											<p class="truncate font-medium">{file.name}</p>
											<p class="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
										</div>
									</div>
									<button
										onclick={() => removeMergeFile(i)}
										class="ml-4 text-red-600 hover:text-red-800">Remove</button
									>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="mt-8 border-t border-gray-100 bg-gray-50 px-8 py-10">
					<div class="flex justify-center">
						<button
							onclick={mergePDFs}
							disabled={mergeFiles.length === 0 || isMerging}
							class="rounded-xl px-10 py-4 font-semibold text-white shadow-md transition-all
                     {isMerging || mergeFiles.length === 0
								? 'bg-primary cursor-not-allowed'
								: 'bg-gray-500 hover:bg-gray-900'}"
						>
							{isMerging
								? 'Merging…'
								: `Merge ${mergeFiles.length || ''} PDF${mergeFiles.length !== 1 ? 's' : ''}`}
						</button>
					</div>
					{#if mergeStatus}
						<p class="mt-6 text-center text-sm font-medium text-gray-700">{mergeStatus}</p>
					{/if}
				</div>
			{/if}

			<!-- Split Content -->
			{#if mode === 'split'}
				<div class="px-8 pt-8">
					<h2 class="mb-3 text-2xl font-bold text-gray-900">Split PDF</h2>
					<p class="mb-6 text-gray-600">Extract pages or split into single-page files</p>

					<Dropzone on:drop={onSplitDrop} accept="application/pdf" multiple={false} class="">
						<div
							class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-10 text-center hover:bg-blue-100"
						>
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
							<p class="text-xl font-medium text-gray-800">Drop PDFs here or click to select</p>
						</div>
					</Dropzone>
					{#if splitDropStatus}
						<p
							class="mt-4 text-center text-sm {splitDropStatus.includes('Rejected') ||
							splitDropStatus.includes('only one')
								? 'text-red-600'
								: 'text-emerald-600'}"
						>
							{splitDropStatus}
						</p>
					{/if}
					<!-- 
					<label
						for="split-upload"
						class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-10 text-center hover:bg-blue-100"
					>
						<input
							id="split-upload"
							type="file"
							accept="application/pdf"
							class="sr-only"
							onchange={(e) => handleSplitFile(e.currentTarget.files)}
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
						<p class="text-xl font-medium text-gray-800">Drop your PDF here or click to select</p>
					</label> -->

					{#if splitFile}
						<div class="mt-6 rounded-lg bg-gray-50 p-5">
							<p class="font-medium">Selected: {splitFile.name}</p>
							<p class="text-sm text-gray-600">Pages: {totalPages}</p>
						</div>

						<div class="mt-8">
							<div class="mb-4 flex gap-6">
								<label class="flex cursor-pointer items-center gap-2">
									<input type="radio" bind:group={splitMode} value="per-page" />
									One PDF per page
								</label>
								<label class="flex cursor-pointer items-center gap-2">
									<input type="radio" bind:group={splitMode} value="range" />
									Custom page range
								</label>
							</div>

							{#if splitMode === 'range'}
								<div class="mt-4">
									<label for="" class="mb-2 block text-sm font-medium text-gray-700">
										Pages (e.g. 1-5,8,10-12)
									</label>
									<input
										type="text"
										bind:value={rangeInput}
										placeholder="1-5,8,10-12"
										class="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 px-4 py-3"
										disabled={isSplitting}
									/>
									<p class="mt-2 text-sm text-gray-500">
										Use commas to separate, hyphen for ranges. 1-based indexing.
									</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div class="mt-8 border-t border-gray-100 bg-gray-50 px-8 py-10">
					<div class="flex justify-center">
						<button
							onclick={splitPDF}
							disabled={!splitPdfDoc ||
								isSplitting ||
								(splitMode === 'range' && !rangeInput.trim())}
							class="rounded-xl px-10 py-4 font-semibold text-white shadow-md transition-all
                     {isSplitting || !splitPdfDoc
								? 'bg-primary cursor-not-allowed'
								: 'bg-gray-500 hover:bg-gray-900'}"
						>
							{isSplitting
								? 'Splitting…'
								: splitMode === 'per-page'
									? 'Split into single pages'
									: 'Extract pages'}
						</button>
					</div>
					{#if splitStatus}
						<p class="mt-6 text-center text-sm font-medium text-gray-700">{splitStatus}</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<footer class="border-t bg-white py-6 text-center text-sm text-gray-500">
		<div class="flex items-center justify-center gap-3 text-gray-600">
			<span class="text-sm font-medium"
				>Crafted by
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
</main>
