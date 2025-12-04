<script lang="ts">
	import { page } from '$app/stores';

	let tabs = [
		{ id: 'ports', label: '포트 관리', href: '/' },
		{ id: 'ssh', label: 'SSH 포워딩', href: '/ssh-forward' }
	];
</script>

<div class="app">
	<header>
		<h1>서버 포트 대시보드</h1>
		<nav>
			{#each tabs as tab}
				<a
					href={tab.href}
					class:active={$page.url.pathname === tab.href}
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</header>

	<main>
		<slot />
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f5f5f5;
		color: #333;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background: #2c3e50;
		color: white;
		padding: 0 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0;
		padding: 1.5rem 0 1rem;
		font-size: 1.5rem;
		font-weight: 600;
	}

	nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: -1px;
	}

	nav a {
		padding: 0.75rem 1.5rem;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.7);
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		font-weight: 500;
	}

	nav a:hover {
		color: white;
		background: rgba(255, 255, 255, 0.05);
	}

	nav a.active {
		color: white;
		border-bottom-color: #3498db;
		background: rgba(255, 255, 255, 0.1);
	}

	main {
		flex: 1;
		padding: 2rem;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
	}
</style>
