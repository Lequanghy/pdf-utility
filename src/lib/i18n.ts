import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export type Language = 'en' | 'vi';

const STORAGE_KEY = 'pdf-utility-language';

export const language = writable<Language>('en');

export function initLanguage() {
	if (!browser) {
		return;
	}

	const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
	if (savedLanguage === 'en' || savedLanguage === 'vi') {
		language.set(savedLanguage);
	}
}

export function setLanguage(nextLanguage: Language) {
	language.set(nextLanguage);

	if (browser) {
		window.localStorage.setItem(STORAGE_KEY, nextLanguage);
	}
}

export const uiText = derived(language, ($language) => translations[$language]);

export const translations = {
	en: {
		appTitle: 'PDF Tool Box',
		shellCopy:
			'Client-side PDF tools with a lighter, faster workspace for merging, splitting, and compressing files.',
		nav: {
			merge: 'Merge',
			split: 'Split',
			compress: 'Compress'
		},
		languageToggle: {
			label: 'Language',
			english: 'English',
			vietnamese: 'Tiếng Việt'
		},
		settings: {
			button: 'Settings',
			language: 'Language',
			theme: 'Theme',
			light: 'Light',
			dark: 'Dark'
		},
		footer: {
			craftedBy: 'Crafted by'
		},
		home: {
			title: 'Choose Your Tool',
			mergeTitle: 'Merge PDFs',
			mergeDescription: 'Combine multiple documents into one',
			splitTitle: 'Split PDF',
			splitDescription: 'Extract pages or custom ranges',
			compressTitle: 'Compress PDF',
			compressDescription: 'Reduce file size'
		},
		merge: {
			title: 'Merge PDFs and Images',
			description: 'Combine PDFs plus JPG, PNG, or WEBP images into one PDF',
			dropActive: 'Drop here to upload',
			dropIdle: 'Drop PDF or image files here',
			dropHelp: 'or click to select PDFs, JPGs, PNGs, and WEBPs',
			unsupportedFiles: 'Only PDF, JPG, PNG, and WEBP files are supported',
			invalidSelection: 'Please select PDF, JPG, PNG, or WEBP files',
			filesReady: (count: number) => `${count} file${count === 1 ? '' : 's'} ready to merge`,
			fileOrderUpdated: 'File order updated',
			orderTitle: 'Merge order',
			orderDescription: 'Use the arrows to reorder files before merging',
			moveUp: (name: string) => `Move ${name} up`,
			moveDown: (name: string) => `Move ${name} down`,
			clearAll: 'Clear all',
			remove: 'Remove',
			merging: 'Merging files... please wait',
			success: (count: number) => `Success! Merged ${count} file${count === 1 ? '' : 's'}`,
			failed: 'Failed to merge files',
			mergeButton: (count: number) => `Merge ${count || ''} File${count !== 1 ? 's' : ''}`
		},
		split: {
			title: 'Split PDF',
			description: 'Extract pages or split into single-page files',
			selectPdf: 'Please select a PDF file',
			loading: 'Loading PDF...',
			loaded: (pages: number) => `PDF loaded — ${pages} page${pages === 1 ? '' : 's'}`,
			loadError: (message: string) => `Error loading PDF: ${message}`,
			splitting: 'Splitting... please wait',
			noValidPages: 'No valid pages selected',
			perPageSuccess: (pages: number) =>
				`Success! Downloaded ${pages} single-page PDF${pages === 1 ? '' : 's'}`,
			rangeSuccess: (pages: number) => `Success! Extracted ${pages} page${pages === 1 ? '' : 's'}`,
			failed: 'Failed to split',
			dropOnlyPdf: 'Please drop PDF files only',
			onePdfOnly: 'Split mode: only one PDF allowed',
			dropActive: 'Drop here to upload',
			dropIdle: 'Drop a PDF file here',
			dropHelp: 'or click to select',
			selected: 'Selected',
			pages: 'Pages',
			perPageOption: 'One PDF per page',
			rangeOption: 'Custom page range',
			rangeLabel: 'Pages (e.g. 1-5,8,10-12)',
			rangePlaceholder: '1-5,8,10-12',
			rangeHelp: 'Use commas to separate, hyphen for ranges. 1-based indexing.',
			buttonPerPage: 'Split into single pages',
			buttonRange: 'Extract pages',
			buttonBusy: 'Splitting…'
		},
		compress: {
			title: 'Compress PDF',
			description: 'Reduce file size while trying to preserve quality',
			dropOnlyPdf: 'Please drop PDF files only',
			onePdfOnly: 'Compress mode: only one PDF allowed',
			uploadSuccess: 'Successfully uploaded the PDF file',
			selectPdf: 'Please select a PDF file',
			uploading: 'Uploading and compressing...',
			success: (originalMb: string, compressedMb: string) =>
				`Success! Reduced from ${originalMb} MB to ${compressedMb} MB`,
			compressedSummary: (compressedMb: string, savedPercent: string) =>
				`Compressed: ${compressedMb} MB (saved ${savedPercent}%)`,
			download: 'Download Compressed PDF',
			compressing: (progress: number) => `Compressing... ${progress}%`,
			dropActive: 'Drop here to upload',
			dropIdle: 'Drop a PDF file here',
			dropHelp: 'or click to select'
		}
	},
	vi: {
		appTitle: 'Công Cụ PDF',
		shellCopy:
			'Các công cụ PDF chạy trên trình duyệt với không gian làm việc gọn gàng và nhanh hơn để ghép, tách và nén tệp.',
		nav: {
			merge: 'Ghép',
			split: 'Tách',
			compress: 'Nén'
		},
		languageToggle: {
			label: 'Ngôn ngữ',
			english: 'English',
			vietnamese: 'Tiếng Việt'
		},
		settings: {
			button: 'Cài đặt',
			language: 'Ngôn ngữ',
			theme: 'Giao diện',
			light: 'Sáng',
			dark: 'Tối'
		},
		footer: {
			craftedBy: 'Được tạo bởi'
		},
		home: {
			title: 'Chọn Công Cụ',
			mergeTitle: 'Ghép PDF',
			mergeDescription: 'Kết hợp nhiều tài liệu thành một tệp',
			splitTitle: 'Tách PDF',
			splitDescription: 'Tách trang hoặc khoảng trang tùy chỉnh',
			compressTitle: 'Nén PDF',
			compressDescription: 'Giảm dung lượng tệp'
		},
		merge: {
			title: 'Ghép PDF và Hình Ảnh',
			description: 'Kết hợp PDF cùng JPG, PNG hoặc WEBP thành một tệp PDF',
			dropActive: 'Thả tệp vào đây để tải lên',
			dropIdle: 'Thả tệp PDF hoặc hình ảnh vào đây',
			dropHelp: 'hoặc bấm để chọn PDF, JPG, PNG và WEBP',
			unsupportedFiles: 'Chỉ hỗ trợ PDF, JPG, PNG và WEBP',
			invalidSelection: 'Vui lòng chọn tệp PDF, JPG, PNG hoặc WEBP',
			filesReady: (count: number) => `Đã sẵn sàng ${count} tệp để ghép`,
			fileOrderUpdated: 'Đã cập nhật thứ tự tệp',
			orderTitle: 'Thứ tự ghép',
			orderDescription: 'Dùng mũi tên để sắp xếp tệp trước khi ghép',
			moveUp: (name: string) => `Di chuyển ${name} lên`,
			moveDown: (name: string) => `Di chuyển ${name} xuống`,
			clearAll: 'Xóa tất cả',
			remove: 'Xóa',
			merging: 'Đang ghép tệp... vui lòng chờ',
			success: (count: number) => `Thành công! Đã ghép ${count} tệp`,
			failed: 'Không thể ghép tệp',
			mergeButton: (count: number) => `Ghép ${count || ''} Tệp`
		},
		split: {
			title: 'Tách PDF',
			description: 'Trích xuất trang hoặc tách thành từng tệp một trang',
			selectPdf: 'Vui lòng chọn tệp PDF',
			loading: 'Đang tải PDF...',
			loaded: (pages: number) => `Đã tải PDF — ${pages} trang`,
			loadError: (message: string) => `Lỗi khi tải PDF: ${message}`,
			splitting: 'Đang tách... vui lòng chờ',
			noValidPages: 'Không có trang hợp lệ được chọn',
			perPageSuccess: (pages: number) => `Thành công! Đã tải ${pages} tệp PDF một trang`,
			rangeSuccess: (pages: number) => `Thành công! Đã trích xuất ${pages} trang`,
			failed: 'Không thể tách PDF',
			dropOnlyPdf: 'Vui lòng chỉ thả tệp PDF',
			onePdfOnly: 'Chế độ tách chỉ cho phép một tệp PDF',
			dropActive: 'Thả tệp vào đây để tải lên',
			dropIdle: 'Thả tệp PDF vào đây',
			dropHelp: 'hoặc bấm để chọn tệp',
			selected: 'Đã chọn',
			pages: 'Số trang',
			perPageOption: 'Một PDF cho mỗi trang',
			rangeOption: 'Khoảng trang tùy chỉnh',
			rangeLabel: 'Trang (ví dụ 1-5,8,10-12)',
			rangePlaceholder: '1-5,8,10-12',
			rangeHelp: 'Dùng dấu phẩy để ngăn cách, dấu gạch ngang cho khoảng. Đánh số từ 1.',
			buttonPerPage: 'Tách thành từng trang',
			buttonRange: 'Trích xuất trang',
			buttonBusy: 'Đang tách…'
		},
		compress: {
			title: 'Nén PDF',
			description: 'Giảm dung lượng tệp trong khi cố gắng giữ chất lượng',
			dropOnlyPdf: 'Vui lòng chỉ thả tệp PDF',
			onePdfOnly: 'Chế độ nén chỉ cho phép một tệp PDF',
			uploadSuccess: 'Đã tải tệp PDF lên thành công',
			selectPdf: 'Vui lòng chọn tệp PDF',
			uploading: 'Đang tải lên và nén tệp...',
			success: (originalMb: string, compressedMb: string) =>
				`Thành công! Giảm từ ${originalMb} MB xuống ${compressedMb} MB`,
			compressedSummary: (compressedMb: string, savedPercent: string) =>
				`Đã nén: ${compressedMb} MB (giảm ${savedPercent}%)`,
			download: 'Tải PDF đã nén',
			compressing: (progress: number) => `Đang nén... ${progress}%`,
			dropActive: 'Thả tệp vào đây để tải lên',
			dropIdle: 'Thả tệp PDF vào đây',
			dropHelp: 'hoặc bấm để chọn tệp'
		}
	}
} as const;
