import { PDFDocument } from 'pdf-lib';

const PDF_MIME_TYPE = 'application/pdf';
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type MergeableFileKind = 'pdf' | 'image';

export interface MergeableFile {
	file: File;
	kind: MergeableFileKind;
}

export function getMergeableFileKind(file: File): MergeableFileKind | null {
	if (file.type === PDF_MIME_TYPE) {
		return 'pdf';
	}

	if (IMAGE_MIME_TYPES.includes(file.type)) {
		return 'image';
	}

	return null;
}

export function getMergeableFiles(files: FileList | File[] | null | undefined): MergeableFile[] {
	if (!files) {
		return [];
	}

	return Array.from(files)
		.map((file) => {
			const kind = getMergeableFileKind(file);
			return kind ? { file, kind } : null;
		})
		.filter((item): item is MergeableFile => item !== null);
}

export async function mergeFilesToPdf(files: MergeableFile[]): Promise<Uint8Array> {
	const merged = await PDFDocument.create();

	for (const item of files) {
		if (item.kind === 'pdf') {
			await appendPdf(merged, item.file);
			continue;
		}

		await appendImageAsPage(merged, item.file);
	}

	return merged.save();
}

async function appendPdf(target: PDFDocument, file: File) {
	const sourceBytes = await file.arrayBuffer();
	const sourcePdf = await PDFDocument.load(sourceBytes);
	const pages = await target.copyPages(sourcePdf, sourcePdf.getPageIndices());

	for (const page of pages) {
		target.addPage(page);
	}
}

async function appendImageAsPage(target: PDFDocument, file: File) {
	const imageBytes = await file.arrayBuffer();
	const embeddedImage =
		file.type === 'image/png'
			? await target.embedPng(imageBytes)
			: await target.embedJpg(await imageFileToJpegBytes(file));

	const { width, height } = embeddedImage.scale(1);
	const page = target.addPage([width, height]);

	page.drawImage(embeddedImage, {
		x: 0,
		y: 0,
		width,
		height
	});
}

async function imageFileToJpegBytes(file: File): Promise<ArrayBuffer> {
	if (file.type === 'image/jpeg') {
		return file.arrayBuffer();
	}

	const image = await loadImage(file);
	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;

	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error('Could not prepare image for PDF conversion');
	}

	// Fill with white so transparent images export predictably in JPEG form.
	context.fillStyle = '#ffffff';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0);

	const blob = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, 'image/jpeg', 0.92);
	});

	if (!blob) {
		throw new Error('Could not convert image for PDF merging');
	}

	return blob.arrayBuffer();
}

async function loadImage(file: File): Promise<HTMLImageElement> {
	const imageUrl = URL.createObjectURL(file);

	try {
		return await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error(`Unable to read image: ${file.name}`));
			image.src = imageUrl;
		});
	} finally {
		URL.revokeObjectURL(imageUrl);
	}
}
