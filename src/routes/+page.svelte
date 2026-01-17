<script lang="ts">
	import { PDFDocument } from 'pdf-lib';

	let files: File[] = $state([]);
	let status = $state('');
	let isMerging = $state(false);

	function handleFiles(selected: FileList | null | undefined) {
		if (!selected) return;
		const pdfs = Array.from(selected).filter((f) => f.type === 'application/pdf');
		if (pdfs.length === 0) return;

		files = [...files, ...pdfs];
		status = '';
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	async function mergePDFs() {
		if (files.length === 0) return;

		isMerging = true;
		status = 'Merging PDFs... please wait';

		try {
			const mergedPdf = await PDFDocument.create();

			for (const file of files) {
				const arrayBuffer = await file.arrayBuffer();
				const pdf = await PDFDocument.load(arrayBuffer);
				const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
				copiedPages.forEach((page) => mergedPdf.addPage(page));
			}

			const pdfBytes = await mergedPdf.save();
			const blob = new Blob([pdfBytes], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `merged_${new Date().toISOString().slice(0, 10)}.pdf`;
			a.click();

			URL.revokeObjectURL(url);

			status = `Success! Merged ${files.length} file${files.length === 1 ? '' : 's'}`;
			// files = []; // uncomment to clear list after download
		} catch (err) {
			console.error(err);
			status = `Error: ${err instanceof Error ? err.message : 'Failed to merge'}`;
		} finally {
			isMerging = false;
		}
	}
</script>

<main class="flex min-h-screen flex-col">
	<div class="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
		<div class="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
			<!-- Header -->
			<div class="border-b border-gray-100 px-8 pt-10 pb-6 text-center">
				<h1 class="text-4xl font-bold text-gray-900">Merge PDFs</h1>
				<p class="mt-3 text-lg text-gray-600">Combine multiple PDF files — 100% in browser</p>
			</div>

			<!-- Drop / Click Zone -->
			<label
				for="file-upload"
				class="mx-8 my-8 block cursor-pointer rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-12 text-center transition hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			>
				<input
					id="file-upload"
					type="file"
					multiple
					accept="application/pdf"
					class="sr-only"
					on:change={(e) => handleFiles(e.currentTarget.files)}
				/>

				<svg
					class="mx-auto h-16 w-16 text-blue-500"
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

				<p class="mt-4 text-xl font-medium text-gray-800">Drop PDFs here</p>
				<p class="mt-2 text-gray-500">or <span class="text-blue-600">click to select</span></p>
				<p class="mt-4 text-sm text-gray-500">Order matters — files are merged top to bottom</p>
			</label>

			<!-- File List -->
			<div class="px-8 pb-8">
				{#if files.length === 0}
					<p class="py-10 text-center text-gray-400">No files selected yet</p>
				{:else}
					<div class="space-y-3">
						{#each files as file, i (file.name + i)}
							<div
								class="flex items-center justify-between rounded-lg bg-gray-100 px-5 py-3 hover:bg-gray-200"
							>
								<div class="flex min-w-0 flex-1 items-center gap-3">
									<svg
										class="h-6 w-6 flex-shrink-0 text-red-600"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
										/>
									</svg>
									<div class="min-w-0 flex-1">
										<p class="truncate font-medium text-gray-900">{file.name}</p>
										<p class="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
									</div>
								</div>
								<button
									on:click={() => removeFile(i)}
									class="ml-4 rounded px-3 py-1 font-medium text-red-600 hover:bg-red-50 hover:text-red-800"
								>
									Remove
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Merge Button + Status -->
			<div class="border-t border-gray-100 bg-gray-50 px-8 py-10">
				<div class="flex justify-center">
					<button
						on:click={mergePDFs}
						disabled={files.length === 0 || isMerging}
						class="rounded-xl px-10 py-4 font-semibold text-white shadow-md transition-all
              {isMerging || files.length === 0
							? 'cursor-not-allowed bg-gray-400'
							: 'bg-primary hover:bg-primarydark focus:ring-primary focus:ring-2 focus:ring-offset-2'}"
					>
						{isMerging
							? 'Merging…'
							: files.length === 0
								? 'Merge PDFs'
								: `Merge ${files.length} PDF${files.length === 1 ? '' : 's'}`}
					</button>
				</div>

				{#if status}
					<p class="mt-6 text-center text-sm font-medium text-gray-700">{status}</p>
				{/if}
			</div>
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
