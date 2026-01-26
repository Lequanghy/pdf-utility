<script lang="ts">
	import { PDFDocument } from 'pdf-lib';

	// Shared state
	let mode: 'merge' | 'split' | 'compress' = $state('merge');

	// Merge state
	let mergeFiles: File[] = $state([]);
	let mergeStatus = $state('');
	let isMerging = $state(false);
	let mergePdfDoc: PDFDocument | null = $state(null);

	// Split state
	let splitFile: File | null = $state(null);
	let splitPdfDoc: PDFDocument | null = $state(null);
	let totalPages = $state(0);
	let splitStatus = $state('');

	// Compress state
	let compressStatus = $state('');
	let compressFile: File | null = $state(null);

	// Drop state
	let mergeDropStatus = $state('');
	let splitDropStatus = $state('');
	let dragging = $state(false);

	// ─── Helpers ────────────────────────────────────────
	async function handleMergeFiles(selected: FileList | null | undefined) {
		if (!selected) return;
		const pdfs = Array.from(selected).filter((f) => f.type === 'application/pdf');
		mergeFiles = [...mergeFiles, ...pdfs];
		mergeStatus = 'Loading PDF...';

		if (!mergeFiles || mergeFiles.length === 0) return;
		for (let i = 0; i < mergeFiles.length; i++) {
			console.log(i);
			const file = selected[0];
			if (file.type !== 'application/pdf') {
				mergeStatus = 'Please select a PDF file';
				return;
			}
			try {
				const buf = await file.arrayBuffer();
				mergePdfDoc = await PDFDocument.load(buf);
				totalPages = mergePdfDoc.getPageCount();
			} catch (err) {
				splitStatus = `Error loading PDF: ${err instanceof Error ? err.message : 'Invalid file'}`;
				splitFile = null;
				splitPdfDoc = null;
				totalPages = 0;
			}
		}
		mergeStatus = `${mergeFiles.length} PDF${mergeFiles.length === 1 ? '' : 's'} Loaded `;
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

		const pdfs = Array.from(droppedFiles).filter((f) => f.type === 'application/pdf');

		if (pdfs.length === 0) {
			mergeDropStatus = 'Please drop PDF files only';
			return;
		}
		if (mode === 'split' && droppedFiles.length > 1) {
			splitDropStatus = 'Split mode: only one PDF allowed';
			return;
		}

		if (mode === 'merge') {
			mergeDropStatus = '';
			handleMergeFiles(droppedFiles);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}
</script>

<main class=" flex flex-col bg-gray-50">
	<div class="flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
		<div class="flex items-center justify-center">
			<div class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
				<div class="px-8 py-10">
					<h2 class="mb-3 text-2xl font-bold text-gray-900">Merge PDFs</h2>
					<p class="mb-6 text-gray-600">Combine multiple PDFs into one</p>
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
							accept="application/pdf"
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
							<p class="text-xl font-medium text-green-700">Drop here to upload</p>
						{:else}
							<p class="text-xl font-medium text-gray-800">Drop PDF files here</p>
							<p class="mt-2 text-gray-600">or click to select</p>
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
											<p class="text-sm text-gray-500">
												{(file.size / 1024 / 1024).toFixed(2)} MB
											</p>
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
				{#if mergePdfDoc}
					<div class=" bg-white px-8 pb-10">
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
			</div>
		</div>
	</div>
</main>
