<script lang="ts">
	import { PDFDocument, StandardFonts } from 'pdf-lib';
	import * as pdfjs from 'pdfjs-dist';
	pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

	// Compress state
	let compressStatus = $state('');
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
			compressDropStatus = 'Please drop PDF files only';
			return;
		}
		if (droppedFiles.length > 1) {
			compressDropStatus = 'Compress mode: only one PDF allowed';
			return;
		}
		pdfs.forEach(async (file) => {
			compressFile = file;
			compressDropStatus = 'Succesfully upload the PDF file';
			handleCompressFile(droppedFiles);
		});
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

	// Handle drop/select for compress mode
	async function handleCompressFile(selected: FileList | null | undefined) {
		if (!selected || selected.length === 0) return;
		const file = selected[0];
		if (file.type !== 'application/pdf') {
			compressStatus = 'Please select a PDF file';
			return;
		}
		console.log(selected);
		compressFile = file;
		originalSize = file.size;
		compressedBlob = null;
		compressedSize = 0;
		progress = 0;
		isCompressing = true;
		maxDimension = 12000;
		jpegQuality = 1;
		scaleFactor = 1;
		try {
			const arrayBuffer = await file.arrayBuffer();
			const originalPdf = await PDFDocument.load(arrayBuffer);
			const pageCount = originalPdf.getPageCount();
			let tempBuffer = null;
			// // Create brand new PDF document
			const newPdf = await PDFDocument.create();

			// // Optional: embed a font if needed later (rare in this method)
			const helvetica = await newPdf.embedFont(StandardFonts.Helvetica);

			// const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
			for (let i = 0; i < pageCount; i++) {
				// Get original page info
				tempBuffer = arrayBuffer.slice(0);
				const originalPage = originalPdf.getPage(i);
				const { width, height } = originalPage.getSize();
				// Calculate new dimensions
				const scale = Math.min(scaleFactor, maxDimension / Math.max(width, height));
				const newWidth = Math.round(width * scale);
				const newHeight = Math.round(height * scale);
				// Render original page to canvas at reduced size
				const pdf = await pdfjs.getDocument({ data: tempBuffer }).promise;
				const page = await pdf.getPage(i + 1);
				const viewport = page.getViewport({ scale });
				const canvas = document.createElement('canvas');
				canvas.width = newWidth;
				canvas.height = newHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) throw new Error('Failed to get canvas context');
				await page.render({
					canvasContext: ctx,
					canvas: canvas,
					viewport: page.getViewport({ scale })
				}).promise;
				// Convert canvas to JPEG blob with quality
				const jpegBlob = await new Promise<Blob>((resolve) => {
					canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', jpegQuality);
				});
				const jpegBytes = await jpegBlob.arrayBuffer();
				const jpegImage = await newPdf.embedJpg(jpegBytes);
				// Add new page with same aspect ratio
				const newPage = newPdf.addPage([newWidth, newHeight]);
				// Draw the downsampled image to fill the page
				newPage.drawImage(jpegImage, {
					x: 0,
					y: 0,
					width: newWidth,
					height: newHeight
				});
			}

			// Final save with compression enabled
			const bytes = await newPdf.save({
				useObjectStreams: true
			});

			compressedBlob = new Blob([bytes], { type: 'application/pdf' });
			compressedSize = compressedBlob.size;
			compressStatus = `Success! Reduced from ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB`;
		} catch (err) {
			console.error('Compression failed:', err);
			compressStatus = 'Failed to compress PDF. ';
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

<div class="flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
	<div class="flex items-center justify-center">
		<div class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
			<div class="px-8 py-10">
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
						</div>
					</div>
				{/if}
				{#if compressFile}
					<div class="mt-8 rounded-lg bg-white p-6 text-center">
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
		</div>
	</div>
</div>
