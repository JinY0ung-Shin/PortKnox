<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import MonitorForm from './components/MonitorForm.svelte';
	import MonitorCard from './components/MonitorCard.svelte';
	import type { UrlMonitor } from '$lib/types';

	let monitors: UrlMonitor[] = [];
	let loading = false;
	let error = '';
	let success = '';
	let showForm = false;
	let searchTerm = '';
	let statusCheckInterval: ReturnType<typeof setInterval> | null = null;

	let formData = {
		name: '',
		url: '',
		emailRecipients: [] as string[],
		checkInterval: 60000,
		timeout: 5000,
		enabled: true,
		author: '',
		tags: [] as string[]
	};

	async function loadMonitors() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/monitors');
			const data = await response.json();

			if (data.success) {
				monitors = data.monitors;
			} else {
				error = data.error || 'Failed to load monitors';
			}
		} catch (e) {
			error = 'Unable to reach server';
		} finally {
			loading = false;
		}
	}

	async function createMonitor() {
		error = '';
		success = '';
		loading = true;

		try {
			const response = await fetch('/api/monitors', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			const data = await response.json();

			if (data.success) {
				success = data.message;
				showForm = false;
				resetForm();
				await loadMonitors();
			} else {
				error = data.error || 'Failed to create monitor';
			}
		} catch (e) {
			error = 'Unable to reach server';
		} finally {
			loading = false;
		}
	}

	async function toggleMonitor(id: string, enabled: boolean) {
		try {
			const response = await fetch('/api/monitors', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, enabled })
			});
			const data = await response.json();

			if (data.success) {
				await loadMonitors();
			} else {
				error = data.error || 'Failed to update monitor';
			}
		} catch (e) {
			error = 'Unable to reach server';
		}
	}

	async function deleteMonitor(id: string) {
		if (!confirm('Delete this monitor? All history will be lost.')) return;

		error = '';
		success = '';

		try {
			const response = await fetch('/api/monitors', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const data = await response.json();

			if (data.success) {
				success = data.message;
				await loadMonitors();
			} else {
				error = data.error || 'Delete failed';
			}
		} catch (e) {
			error = 'Unable to reach server';
		}
	}

	function resetForm() {
		formData = {
			name: '',
			url: '',
			emailRecipients: [],
			checkInterval: 60000,
			timeout: 5000,
			enabled: true,
			author: '',
			tags: []
		};
	}

	onMount(() => {
		loadMonitors();

		// Auto-refresh every 30 seconds
		statusCheckInterval = setInterval(() => {
			loadMonitors();
		}, 30000);
	});

	onDestroy(() => {
		if (statusCheckInterval) {
			clearInterval(statusCheckInterval);
		}
	});

	$: filteredMonitors = monitors.filter(
		(m) =>
			m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			m.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(m.author && m.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(m.tags && m.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
	);

	$: healthyCount = monitors.filter((m) => m.status === 'healthy').length;
	$: unhealthyCount = monitors.filter((m) => m.status === 'unhealthy').length;
	$: unknownCount = monitors.filter((m) => m.status === 'unknown').length;
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold text-slate-200">URL Monitors</h2>
			<p class="text-slate-500 text-xs">
				{monitors.length} monitors
				{#if healthyCount > 0}
					<span class="text-green-400">• {healthyCount} healthy</span>
				{/if}
				{#if unhealthyCount > 0}
					<span class="text-red-400">• {unhealthyCount} unhealthy</span>
				{/if}
				{#if unknownCount > 0}
					<span class="text-slate-400">• {unknownCount} unknown</span>
				{/if}
			</p>
		</div>
		<div class="flex gap-1">
			<button on:click={() => (showForm = !showForm)} class="glass-btn-secondary">
				{showForm ? 'Cancel' : 'New Monitor'}
			</button>
			<button on:click={loadMonitors} disabled={loading} class="glass-btn-primary disabled:opacity-50">
				Refresh
			</button>
		</div>
	</div>

	<div class="glass-card">
		<input
			type="text"
			placeholder="Search monitors..."
			bind:value={searchTerm}
			class="glass-input w-full"
		/>
	</div>

	{#if success}
		<div class="p-2 bg-green-900 border border-green-700 text-green-200 rounded text-sm">
			{success}
		</div>
	{/if}

	{#if error}
		<div class="p-2 bg-red-900 border border-red-700 text-red-200 rounded text-sm">
			{error}
		</div>
	{/if}

	{#if showForm}
		<MonitorForm
			bind:formData
			{loading}
			onSubmit={createMonitor}
			onCancel={() => (showForm = false)}
		/>
	{/if}

	<div>
		{#if loading && monitors.length === 0}
			<div class="text-center py-8 text-slate-500 text-sm">Loading...</div>
		{:else if filteredMonitors.length === 0}
			<div class="text-center py-8 glass-card border-dashed border-slate-700">
				<p class="text-slate-500 text-sm mb-2">
					{searchTerm ? 'No matching monitors' : 'No monitors configured'}
				</p>
				{#if !searchTerm}
					<button on:click={() => (showForm = true)} class="glass-btn-primary">
						Create Monitor
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
				{#each filteredMonitors as monitor}
					<MonitorCard
						{monitor}
						onToggle={(enabled) => toggleMonitor(monitor.id, enabled)}
						onDelete={() => deleteMonitor(monitor.id)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
