<script lang="ts">
	import { PDFDocument, StandardFonts } from 'pdf-lib';
	import * as pdfjs from 'pdfjs-dist';
	import { uiText } from '$lib/i18n';
	pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

	export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
	// Compress state
	let status = $state('');
	let compressFile: File | null = $state(null);

	// Drop state
	let compressDropStatus = $state('');
	let dragging = $state(false);

	// ─── Drop logic ────────────────────────────────────
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;

		const droppedFiles = e.dataTransfer?.files;
		if (!droppedFiles) return;

		const pdfs = Array.from(droppedFiles).filter((f) => f.type === 'application/pdf');

		if (pdfs.length === 0) {
			compressDropStatus = $uiText.compress.dropOnlyPdf;
			return;
		}
		if (droppedFiles.length > 1) {
			compressDropStatus = $uiText.compress.onePdfOnly;
			return;
		}
		// pdfs.forEach(async (file) => {
		// 	compressFile = file;
		// 	compressDropStatus = 'Succesfully upload the PDF file';
		// 	compressAndDownload(droppedFiles);
		// });
		compressDropStatus = $uiText.compress.uploadSuccess;
		compressAndDownload(droppedFiles);
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
	let maxDimension: number; // max width/height for images (default: 1200)
	let jpegQuality: number; // 0.1–1.0 (default: 0.75)
	let scaleFactor: number; // overall page scale (default: 0.75)
	let downloadUrl: string | null = $state(null);

	async function compressAndDownload(selected: FileList | null | undefined) {
		if (!selected || selected.length === 0) return;
		const file = selected[0];
		if (file.type !== 'application/pdf') {
			status = $uiText.compress.selectPdf;
			return;
		}
		originalSize = file.size;
		compressFile = file;
		compressedBlob = null;
		isCompressing = true;
		status = $uiText.compress.uploading;

		try {
			const formData = new FormData();
			formData.append('file', compressFile);
			const response = await fetch(`${API_URL}/compress`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || 'Server error');
			}

			const blob = await response.blob();
			compressedBlob = blob;
			compressedSize = compressedBlob.size;
			downloadUrl = URL.createObjectURL(blob);

			status = $uiText.compress.success(
				(originalSize / 1024 / 1024).toFixed(2),
				(compressedSize / 1024 / 1024).toFixed(2)
			);
		} catch (err) {
			status = `Error: ${err}`;
			console.error(err);
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

<div class="page-shell">
	<div class="tool-panel">
		<div class="space-y-8">
			<div>
				<p class="section-kicker">{$uiText.nav.compress}</p>
				<h2 class="text-3xl font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-4xl">
					{$uiText.compress.title}
				</h2>
				<p class="page-copy">{$uiText.compress.description}</p>
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
						onchange={(e) => compressAndDownload(e.currentTarget.files)}
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
						<p class="dropzone-title">{$uiText.compress.dropActive}</p>
					{:else}
						<p class="dropzone-title">{$uiText.compress.dropIdle}</p>
						<p class="dropzone-copy">{$uiText.compress.dropHelp}</p>
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
						<div class="queue-card">
							<div class="flex min-w-0 flex-1 items-center gap-3">
								<svg class="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
									<path
										d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
									/>
								</svg>
								<div class="min-w-0 flex-1">
									<p class="truncate font-medium text-[var(--app-text)]">{compressFile.name}</p>
									<p class="meta-copy">
										{(compressFile.size / 1024 / 1024).toFixed(2)} MB
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
				{#if compressFile}
					<div class="mt-8 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-6 text-center">
						{#if compressedBlob}
							<p class="mt-2 font-medium text-[var(--app-text)]">
								{$uiText.compress.compressedSummary(
									(compressedSize / 1024 / 1024).toFixed(2),
									((1 - compressedSize / originalSize) * 100).toFixed(1)
								)}
							</p>
							<button onclick={downloadCompressed} class="primary-button mt-4 sm:w-auto">
								{$uiText.compress.download}
							</button>
						{:else if isCompressing}
							<p class="mt-4 font-medium text-[var(--app-accent)]">
								{$uiText.compress.compressing(progress)}
							</p>
						{/if}
						{#if status}
							<p class="status-copy mt-6 text-center">{status}</p>
						{/if}
					</div>
				{/if}
		</div>
	</div>
</div>
