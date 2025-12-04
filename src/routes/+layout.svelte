<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	let tabs = [
		{ id: 'ports', label: '포트 관리', href: '/' },
		{ id: 'ssh', label: 'SSH 포워딩', href: '/ssh-forward' }
	];
</script>

<div class="flex flex-col min-h-screen bg-gray-100">
	<header class="bg-slate-700 text-white px-8 shadow-md">
		<h1 class="text-2xl font-semibold py-6 pb-4">서버 포트 대시보드</h1>
		<nav class="flex gap-2 -mb-px">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="px-6 py-3 no-underline text-white/70 border-b-2 border-transparent transition-all font-medium hover:text-white hover:bg-white/5 {$page.url.pathname === tab.href ? 'text-white border-b-blue-500 bg-white/10' : ''}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</header>

	<main class="flex-1 p-8 max-w-7xl w-full mx-auto">
		<slot />
	</main>
</div>
