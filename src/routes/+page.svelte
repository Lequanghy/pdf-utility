<script lang="ts">
	import { uiText } from '$lib/i18n';
</script>

<div class="page-shell">
	<section class="hero-panel text-center">
		<p class="section-kicker mx-auto w-fit">{$uiText.appTitle}</p>
		<h2 class="page-title mx-auto">{$uiText.home.title}</h2>

		<div class="tool-grid">
			<a href="/merge" class="home-card text-left">
				<span class="card-eyebrow">{$uiText.nav.merge}</span>
				<h3 class="home-card-title mt-5">{$uiText.home.mergeTitle}</h3>
				<p class="home-card-copy">{$uiText.home.mergeDescription}</p>
			</a>

			<a href="/split" class="home-card text-left">
				<span class="card-eyebrow">{$uiText.nav.split}</span>
				<h3 class="home-card-title mt-5">{$uiText.home.splitTitle}</h3>
				<p class="home-card-copy">{$uiText.home.splitDescription}</p>
			</a>

			<a href="/compress" class="home-card text-left">
				<span class="card-eyebrow">{$uiText.nav.compress}</span>
				<h3 class="home-card-title mt-5">{$uiText.home.compressTitle}</h3>
				<p class="home-card-copy">{$uiText.home.compressDescription}</p>
			</a>
		</div>
	</section>
</div>
