<script lang="ts">
	import { PDFDocument } from 'pdf-lib';
	import { uiText } from '$lib/i18n';

	// Shared state
	let mode: 'merge' | 'split' | 'compress' = $state('merge');

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
	let dragging = $state(false);

	// ─── Split logic ────────────────────────────────────
	async function handleSplitFile(selected: FileList | null | undefined) {
		if (!selected || selected.length === 0) return;
		const file = selected[0];
		if (file.type !== 'application/pdf') {
			splitStatus = $uiText.split.selectPdf;
			return;
		}
		splitFile = file;
		splitStatus = $uiText.split.loading;

		try {
			const buf = await file.arrayBuffer();
			splitPdfDoc = await PDFDocument.load(buf);
			totalPages = splitPdfDoc.getPageCount();
			splitStatus = $uiText.split.loaded(totalPages);
		} catch (err) {
			splitStatus = $uiText.split.loadError(err instanceof Error ? err.message : 'Invalid file');
			splitFile = null;
			splitPdfDoc = null;
			totalPages = 0;
		}
	}

	async function splitPDF() {
		if (!splitPdfDoc || totalPages === 0) return;
		isSplitting = true;
		splitStatus = $uiText.split.splitting;

		try {
			if (splitMode === 'per-page') {
				for (let i = 0; i < totalPages; i++) {
					const newDoc = await PDFDocument.create();
					const [page] = await newDoc.copyPages(splitPdfDoc, [i]);
					newDoc.addPage(page);
					const bytes = await newDoc.save();
					download(bytes, `page_${i + 1}_of_${totalPages}_${dateStr()}.pdf`);
				}
				splitStatus = $uiText.split.perPageSuccess(totalPages);
			} else {
				// Range mode
				const pagesToExtract = parsePageRange(rangeInput, totalPages);
				if (pagesToExtract.length === 0) throw new Error($uiText.split.noValidPages);

				const newDoc = await PDFDocument.create();
				const copied = await newDoc.copyPages(splitPdfDoc, pagesToExtract);
				copied.forEach((p) => newDoc.addPage(p));

				const bytes = await newDoc.save();
				download(bytes, `extracted_${pagesToExtract.length}_pages_${dateStr()}.pdf`);
				splitStatus = $uiText.split.rangeSuccess(pagesToExtract.length);
			}
		} catch (err) {
			splitStatus = `Error: ${err instanceof Error ? err.message : $uiText.split.failed}`;
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
			mergeDropStatus = $uiText.split.dropOnlyPdf;
			return;
		}
		if (mode === 'split' && droppedFiles.length > 1) {
			splitDropStatus = $uiText.split.onePdfOnly;
			return;
		}

		pdfs.forEach(async (file) => {
			splitFile = file;
			splitDropStatus = '';
			handleSplitFile(droppedFiles);
		});
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}
</script>

<div class="page-shell">
	<div class="tool-panel">
		<div class="space-y-8">
			<div>
				<p class="section-kicker">{$uiText.nav.split}</p>
				<h2 class="text-3xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-4xl">
					{$uiText.split.title}
				</h2>
				<p class="page-copy">{$uiText.split.description}</p>
			</div>

				<label
					for="file-input"
					class="dropzone-panel cursor-pointer"
					class:is-dragging={dragging}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<input
						id="file-input"
						type="file"
						accept="application/pdf"
						class="hidden"
						onchange={(e) => handleSplitFile(e.currentTarget.files)}
					/>
					<svg class="dropzone-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
						/>
					</svg>
					{#if dragging}
						<p class="dropzone-title">{$uiText.split.dropActive}</p>
					{:else}
						<p class="dropzone-title">{$uiText.split.dropIdle}</p>
						<p class="dropzone-copy">{$uiText.split.dropHelp}</p>
					{/if}
				</label>

				{#if splitDropStatus}
					<p
						class="mt-4 text-center text-sm {splitDropStatus.includes('allowed')
							? 'text-red-600'
							: 'text-green-600'}"
					>
						{splitDropStatus}
					</p>
				{/if}

				{#if splitFile}
					<div class="queue-card">
						<div>
							<p class="font-medium text-[var(--app-text)]">{$uiText.split.selected}: {splitFile.name}</p>
							<p class="meta-copy">{$uiText.split.pages}: {totalPages}</p>
						</div>
					</div>

					<div class="mt-8">
						<div class="mb-4 flex gap-6">
							<label class="flex cursor-pointer items-center gap-2">
								<input type="radio" bind:group={splitMode} value="per-page" />
								{$uiText.split.perPageOption}
							</label>
							<label class="flex cursor-pointer items-center gap-2">
								<input type="radio" bind:group={splitMode} value="range" />
								{$uiText.split.rangeOption}
							</label>
						</div>

						{#if splitMode === 'range'}
							<div class="mt-4">
								<label for="" class="mb-2 block text-sm font-medium text-[var(--app-text)]">
									{$uiText.split.rangeLabel}
								</label>
								<input
									type="text"
									bind:value={rangeInput}
									placeholder={$uiText.split.rangePlaceholder}
									class="input-field"
									disabled={isSplitting}
								/>
								<p class="mt-2 meta-copy">{$uiText.split.rangeHelp}</p>
							</div>
						{/if}
					</div>
				{/if}
		</div>
		{#if splitPdfDoc}
			<div class="mt-8 space-y-5">
				<div class="divider-line"></div>
				<div class="flex justify-center">
					<button
						onclick={splitPDF}
						disabled={!splitPdfDoc || isSplitting || (splitMode === 'range' && !rangeInput.trim())}
						class="primary-button"
					>
						{isSplitting
							? $uiText.split.buttonBusy
							: splitMode === 'per-page'
								? $uiText.split.buttonPerPage
								: $uiText.split.buttonRange}
					</button>
				</div>
				{#if splitStatus}
					<p class="status-copy text-center">{splitStatus}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
