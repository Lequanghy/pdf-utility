// src/lib/pdf/compress.ts
import { PDFDocument } from 'pdf-lib';

export async function basicCompress(pdfFile: File): Promise<Blob> {
	const arrayBuffer = await pdfFile.arrayBuffer();
	const pdfDoc = await PDFDocument.load(arrayBuffer);

	// Minimal compression – mostly object stream + metadata cleanup
	const compressedBytes = await pdfDoc.save({
		useObjectStreams: true,
		updateFieldAppearances: false,
		addDefaultPage: false
	});

	return new Blob([compressedBytes.slice()], { type: 'application/pdf' });
}

// Placeholder for advanced compression if you integrate another lib later
export async function advancedCompress(file: File, options?: any): Promise<Blob> {
	// Future: use @quicktoolsone/pdf-compress or similar
	throw new Error('Advanced compression not implemented yet');
}
