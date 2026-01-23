<script lang="ts">
	import { PDFDocument } from 'pdf-lib';
	import { compressBalanced } from '@quicktoolsone/pdf-compress';

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
	let splitMode: 'per-page' | 'range' = $state('per-page');
	let rangeInput = $state(''); // e.g. "1-5,8,10-12"
	let splitStatus = $state('');
	let isSplitting = $state(false);

	// Compress state
	let compressStatus = $state('');
	let compressFile: File | null = $state(null);

	// Drop state
	let mergeDropStatus = $state('');
	let splitDropStatus = $state('');
	let compressDropStatus = $state('');
	let dragging = $state(false);
	let status = $state('');

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
		} else {
			pdfs.forEach(async (file) => {
				splitFile = file;
				splitDropStatus = '';
				handleSplitFile(droppedFiles);
			});
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}

	// ─── Compress logic ────────────────────────────────────
	// State
	let originalSize = $state(0);
	let compressedBlob: Blob | null = $state(null);
	let compressedSize = $state(0);
	let isCompressing = $state(false);
	let progress = $state(0);
	compressStatus = 'complete';
	// Handle drop/select for compress mode
	async function handleCompressFile(selected: FileList | null | undefined) {
		if (!selected || selected.length === 0) return;
		const file = selected[0];
		if (file.type !== 'application/pdf') {
			compressStatus = 'Please select a PDF file';
			return;
		}

		compressFile = file;
		originalSize = file.size;
		compressedBlob = null;
		compressedSize = 0;
		progress = 0;
		isCompressing = true;

		try {
			const buffer = await file.arrayBuffer();
			const result = await compressBalanced(buffer);
			compressedBlob = new Blob([result.pdf], { type: 'application/pdf' });
			compressedSize = compressedBlob.size;
			compressStatus = 'complete';
		} catch (err) {
			console.error(err);
			compressStatus =
				'Compression failed: ' + (err instanceof Error ? err.message : 'Unknown error');
		} finally {
			isCompressing = false;
		}

		try {
			// compressedBlob = new Blob([result.pdf], { type: 'application/pdf' });
			// compressedSize = compressedBlob.size;
			// compressStatus = 'complete';
		} catch (err) {
			console.error(err);
			compressStatus =
				'Compression failed: ' + (err instanceof Error ? err.message : 'Unknown error');
		} finally {
			isCompressing = false;
		}
	}

	function downloadCompressed() {
		if (!compressedBlob || !compressFile) return;

		const url = URL.createObjectURL(compressedBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `compressed_${compressFile.name}`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<main class=" flex flex-col bg-gray-50">
	<div class="flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
		<div class="flex items-center justify-center">
			<div class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
				<div class="px-8 pt-8">
					<h2 class="mb-3 text-2xl font-bold text-gray-900">Compress PDF</h2>
					<p class="mb-6 text-gray-600">Reduce file size while trying to preserve quality</p>
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
							class="hidden"
							onchange={(e) => handleCompressFile(e.currentTarget.files)}
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
							<p class="text-xl font-medium text-gray-800">Drop a PDF file here</p>
							<p class="mt-2 text-gray-600">or click to select</p>
						{/if}
					</label>
					{#if compressDropStatus}
						<p
							class="mt-4 text-center text-sm {compressDropStatus.includes('allowed')
								? 'text-red-600'
								: 'text-green-600'}"
						>
							{compressDropStatus}
						</p>
					{/if}
					{#if compressFile}
						<div class="mt-8 space-y-3">
							<div class="flex items-center justify-between rounded-lg bg-gray-100 px-5 py-3">
								<div class="flex min-w-0 flex-1 items-center gap-3">
									<svg class="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
										/>
									</svg>
									<div class="min-w-0 flex-1">
										<p class="truncate font-medium">{compressFile.name}</p>
										<p class="text-sm text-gray-500">
											{(compressFile.size / 1024 / 1024).toFixed(2)} MB
										</p>
									</div>
								</div>
								<!-- <button
										onclick={() => removeCompressFile(i)}
										class="ml-4 text-red-600 hover:text-red-800">Remove</button
									> -->
							</div>
						</div>
					{/if}
					{#if compressFile}
						<div class="mt-8 rounded-lg bg-gray-50 p-6">
							{#if compressedBlob}
								<p class="mt-2 font-medium text-green-700">
									Compressed: {(compressedSize / 1024 / 1024).toFixed(2)} MB (saved {(
										(1 - compressedSize / originalSize) *
										100
									).toFixed(1)}%)
								</p>
								<button
									onclick={downloadCompressed}
									class="mt-4 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
								>
									Download Compressed PDF
								</button>
							{:else if isCompressing}
								<p class="mt-4 text-blue-600">Compressing... {progress}%</p>
							{/if}
							{#if compressStatus}
								<p class="mt-6 text-center text-sm font-medium text-gray-700">{compressStatus}</p>
							{/if}
						</div>
					{/if}
				</div>
				<div class="mt-8 border-t border-gray-100 bg-gray-50 px-8 py-10">
					<div class="flex justify-center">
						<button
							onclick={downloadCompressed}
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
					{#if compressStatus}
						<p class="mt-6 text-center text-sm font-medium text-gray-700">{mergeStatus}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</main>
