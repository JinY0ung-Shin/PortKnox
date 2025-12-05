<script lang="ts">
        import type { SSHConfigEntry } from "$lib/types";

        export let entry: SSHConfigEntry;
        export let applyToTunnel: (entry: SSHConfigEntry) => void;
</script>

<div class="glass-card relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4">
                <span class="text-xs text-slate-500">Host</span>
        </div>
        <div class="mb-4">
            <h4 class="text-xl font-semibold text-white">{entry.alias}</h4>
            <p class="text-sm text-slate-400 font-mono">
                    {entry.hostName}
                    {entry.port ? `:${entry.port}` : ""}
            </p>
            {#if entry.user}
                    <p class="text-xs text-slate-500 mt-1">User: {entry.user}</p>
            {/if}
        </div>

        <div class="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                <button class="glass-btn-secondary text-sm flex-1" on:click={() => applyToTunnel(entry)}>
                        Use for tunnel
                </button>
        </div>
</div>
