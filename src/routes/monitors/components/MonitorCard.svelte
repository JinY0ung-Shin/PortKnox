<script lang="ts">
	import type { UrlMonitor } from '$lib/types';

	export let monitor: UrlMonitor;
	export let onToggle: (enabled: boolean) => void;
	export let onDelete: () => void;

	function formatDate(date?: Date): string {
		if (!date) return 'Never';
		return new Date(date).toLocaleString();
	}

	function formatDuration(date?: Date): string {
		if (!date) return 'Never';
		const ms = Date.now() - new Date(date).getTime();
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return `${seconds}s ago`;
	}

	$: statusColor =
		monitor.status === 'healthy'
			? 'text-green-400'
			: monitor.status === 'unhealthy'
				? 'text-red-400'
				: 'text-slate-400';

	$: statusIcon =
		monitor.status === 'healthy' ? '✓' : monitor.status === 'unhealthy' ? '✗' : '?';
</script>

<div class="glass-card">
	<div class="flex items-start justify-between mb-2">
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<h3 class="text-sm font-semibold text-slate-200">{monitor.name}</h3>
				<span class="text-lg {statusColor}">{statusIcon}</span>
			</div>
			<a
				href={monitor.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-blue-400 hover:underline break-all"
			>
				{monitor.url}
			</a>
		</div>

		<label class="relative inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				checked={monitor.enabled}
				on:change={(e) => onToggle(e.currentTarget.checked)}
				class="sr-only peer"
			/>
			<div
				class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"
			></div>
		</label>
	</div>

	<div class="space-y-1 text-xs">
		<div class="flex justify-between">
			<span class="text-slate-500">Status:</span>
			<span class={statusColor}>{monitor.status.toUpperCase()}</span>
		</div>

		{#if monitor.lastCheckAt}
			<div class="flex justify-between">
				<span class="text-slate-500">Last Check:</span>
				<span class="text-slate-400">{formatDuration(monitor.lastCheckAt)}</span>
			</div>
		{/if}

		{#if monitor.consecutiveFailures > 0}
			<div class="flex justify-between">
				<span class="text-slate-500">Failures:</span>
				<span class="text-red-400">{monitor.consecutiveFailures}</span>
			</div>
		{/if}

		{#if monitor.lastStatusCode}
			<div class="flex justify-between">
				<span class="text-slate-500">Status Code:</span>
				<span class="text-slate-400">{monitor.lastStatusCode}</span>
			</div>
		{/if}

		<div class="flex justify-between">
			<span class="text-slate-500">Interval:</span>
			<span class="text-slate-400">{monitor.checkInterval / 1000}s</span>
		</div>

		<div class="flex justify-between">
			<span class="text-slate-500">Recipients:</span>
			<span class="text-slate-400">{monitor.emailRecipients.length}</span>
		</div>

		{#if monitor.author}
			<div class="flex justify-between">
				<span class="text-slate-500">Author:</span>
				<span class="text-slate-400">{monitor.author}</span>
			</div>
		{/if}

		{#if monitor.tags && monitor.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each monitor.tags as tag}
					<span
						class="px-1.5 py-0.5 text-xs rounded bg-slate-800 text-slate-400 border border-slate-700"
					>
						#{tag}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	{#if monitor.lastErrorMessage}
		<div class="mt-2 p-2 bg-red-900/20 border border-red-800 rounded">
			<p class="text-xs text-red-300">{monitor.lastErrorMessage}</p>
		</div>
	{/if}

	<div class="mt-2 pt-2 border-t border-slate-800">
		<button on:click={onDelete} class="text-xs text-red-400 hover:text-red-300">
			Delete Monitor
		</button>
	</div>
</div>
