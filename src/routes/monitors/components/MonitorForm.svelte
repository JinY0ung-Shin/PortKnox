<script lang="ts">
	export let formData: {
		name: string;
		url: string;
		emailRecipients: string[];
		checkInterval: number;
		timeout: number;
		enabled: boolean;
		author: string;
		tags: string[];
	};
	export let loading: boolean;
	export let onSubmit: () => void;
	export let onCancel: () => void;

	let emailInput = '';
	let tagInput = '';

	function addEmail() {
		const email = emailInput.trim();
		if (email && !formData.emailRecipients.includes(email)) {
			formData.emailRecipients = [...formData.emailRecipients, email];
			emailInput = '';
		}
	}

	function removeEmail(email: string) {
		formData.emailRecipients = formData.emailRecipients.filter((e) => e !== email);
	}

	function addTag() {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !formData.tags.includes(tag)) {
			formData.tags = [...formData.tags, tag];
			tagInput = '';
		}
	}

	function removeTag(tag: string) {
		formData.tags = formData.tags.filter((t) => t !== tag);
	}

	function handleSubmit() {
		if (formData.emailRecipients.length === 0) {
			alert('Please add at least one email recipient');
			return;
		}
		onSubmit();
	}
</script>

<div class="glass-card">
	<h3 class="text-sm font-semibold text-slate-200 mb-2">New Monitor</h3>

	<div class="space-y-2">
		<div>
			<label class="block text-xs text-slate-400 mb-1">Name *</label>
			<input
				type="text"
				bind:value={formData.name}
				placeholder="My API Server"
				class="glass-input w-full"
				required
			/>
		</div>

		<div>
			<label class="block text-xs text-slate-400 mb-1">URL *</label>
			<input
				type="url"
				bind:value={formData.url}
				placeholder="https://api.example.com/health"
				class="glass-input w-full"
				required
			/>
		</div>

		<div>
			<label class="block text-xs text-slate-400 mb-1">Email Recipients *</label>
			<div class="flex gap-1 mb-1">
				<input
					type="email"
					bind:value={emailInput}
					placeholder="user@example.com"
					class="glass-input flex-1"
					on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
				/>
				<button type="button" on:click={addEmail} class="glass-btn-secondary">Add</button>
			</div>
			{#if formData.emailRecipients.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each formData.emailRecipients as email}
						<span
							class="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 border border-blue-800 rounded"
						>
							{email}
							<button
								type="button"
								on:click={() => removeEmail(email)}
								class="ml-1 text-blue-400 hover:text-blue-200"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-2">
			<div>
				<label class="block text-xs text-slate-400 mb-1">Check Interval (seconds)</label>
				<input
					type="number"
					min="10"
					step="10"
					class="glass-input w-full"
					on:input={(e) => (formData.checkInterval = parseInt(e.currentTarget.value) * 1000)}
					value={formData.checkInterval / 1000}
				/>
			</div>

			<div>
				<label class="block text-xs text-slate-400 mb-1">Timeout (seconds)</label>
				<input
					type="number"
					min="1"
					step="1"
					class="glass-input w-full"
					on:input={(e) => (formData.timeout = parseInt(e.currentTarget.value) * 1000)}
					value={formData.timeout / 1000}
				/>
			</div>
		</div>

		<div>
			<label class="block text-xs text-slate-400 mb-1">Author (optional)</label>
			<input
				type="text"
				bind:value={formData.author}
				placeholder="Your name"
				class="glass-input w-full"
			/>
		</div>

		<div>
			<label class="block text-xs text-slate-400 mb-1">Tags (optional)</label>
			<div class="flex gap-1 mb-1">
				<input
					type="text"
					bind:value={tagInput}
					placeholder="production, api, critical"
					class="glass-input flex-1"
					on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
				/>
				<button type="button" on:click={addTag} class="glass-btn-secondary">Add</button>
			</div>
			{#if formData.tags.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each formData.tags as tag}
						<span
							class="px-2 py-1 text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded"
						>
							#{tag}
							<button
								type="button"
								on:click={() => removeTag(tag)}
								class="ml-1 text-slate-400 hover:text-slate-200"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<input type="checkbox" bind:checked={formData.enabled} id="enabled" class="rounded" />
			<label for="enabled" class="text-xs text-slate-400">Enabled</label>
		</div>

		<div class="flex gap-1 pt-2">
			<button
				type="button"
				on:click={handleSubmit}
				disabled={loading}
				class="glass-btn-primary flex-1 disabled:opacity-50"
			>
				Create Monitor
			</button>
			<button type="button" on:click={onCancel} class="glass-btn-secondary">Cancel</button>
		</div>
	</div>
</div>
