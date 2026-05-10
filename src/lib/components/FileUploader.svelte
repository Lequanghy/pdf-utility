<script lang="ts">
	export let multiple = false;
	export let accept = 'application/pdf';
	export let onFilesSelected: (files: File[]) => void = () => {};

	let files: File[] = [];

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		files = Array.from(input.files ?? []);
		onFilesSelected(files);
	}
</script>

<input type="file" {multiple} {accept} onchange={handleChange} class="border p-2" />
