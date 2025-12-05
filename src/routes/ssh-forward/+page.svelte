<script lang="ts">
        import { onMount } from "svelte";
        import TunnelForm from "./components/TunnelForm.svelte";
        import ForwardCard from "./components/ForwardCard.svelte";
        import ConfigCard from "./components/ConfigCard.svelte";
        import type {
                SSHConfigEntry,
                SSHForwardConfig,
        } from "$lib/types";

        let forwards: SSHForwardConfig[] = [];
        let loading = false;
        let error = "";
        let success = "";
        let showForm = false;

        let formData: SSHForwardConfig = {
                name: "",
                remoteHost: "",
                remotePort: 0,
                localPort: 0,
                sshUser: "",
                sshHost: "",
                sshPort: 22,
                portDescription: "",
                portUrl: "",
        };

        let configEntries: SSHConfigEntry[] = [];
        let configLoading = false;
        let configError = "";
        let sshConfigPath = "";
        let selectedAlias = "";

        async function loadForwards() {
                loading = true;
                error = "";
                try {
                        const response = await fetch("/api/ssh-forward");
                        const data = await response.json();

                        if (data.success) {
                                forwards = data.forwards;
                        } else {
                                error = data.error || "Failed to load tunnels";
                        }
                } catch (e) {
                        error = "Unable to reach server";
                } finally {
                        loading = false;
                }
        }

        async function loadConfigEntries() {
                configLoading = true;
                configError = "";
                try {
                        const response = await fetch("/api/ssh-config");
                        const data = await response.json();
                        if (data.success) {
                                configEntries = data.entries || [];
                                sshConfigPath = data.path || "";
                                if (selectedAlias && !configEntries.find((entry) => entry.alias === selectedAlias)) {
                                        selectedAlias = "";
                                }
                        } else {
                                configError = data.error || "Failed to load SSH config";
                        }
                } catch (e) {
                        configError = "Failed to load SSH config";
                } finally {
                        configLoading = false;
                }
        }

        async function createForward() {
                error = "";
                success = "";
                loading = true;

                try {
                        const response = await fetch("/api/ssh-forward", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(formData),
                        });
                        const data = await response.json();

                        if (data.success) {
                                success = data.message;
                                showForm = false;
                                resetForm();
                                await loadForwards();
                        } else {
                                error = data.message || "Tunnel start failed";
                        }
                } catch (e) {
                        error = "Unable to reach server";
                } finally {
                        loading = false;
                }
        }

        async function stopForward(id: string) {
                if (!confirm("Stop this tunnel?")) return;

                error = "";
                success = "";

                try {
                        const response = await fetch("/api/ssh-forward", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id }),
                        });
                        const data = await response.json();

                        if (data.success) {
                                success = data.message;
                                await loadForwards();
                        } else {
                                error = data.message || "Stop failed";
                        }
                } catch (e) {
                        error = "Unable to reach server";
                }
        }

        function resetForm() {
                formData = {
                        name: "",
                        remoteHost: "",
                        remotePort: 0,
                        localPort: 0,
                        sshUser: "",
                        sshHost: "",
                        sshPort: 22,
                        portDescription: "",
                        portUrl: "",
                };
                selectedAlias = "";
        }

        function handleAliasChange(alias: string) {
                selectedAlias = alias;
                const entry = configEntries.find((item) => item.alias === alias);
                if (!entry) return;

                formData = {
                        ...formData,
                        sshHost: entry.hostName || entry.alias,
                        sshPort: entry.port ?? 22,
                        sshUser: entry.user || formData.sshUser,
                };
        }

        function applyToTunnel(entry: SSHConfigEntry) {
                showForm = true;
                handleAliasChange(entry.alias);
        }

        onMount(() => {
                loadForwards();
                loadConfigEntries();
        });
</script>

<div class="space-y-8">
        <div class="flex items-center justify-between">
                <div>
                        <h2
                                class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 mb-2"
                        >
                                SSH Tunnels
                        </h2>
                        <p class="text-slate-400">
                                Securely forward local ports to remote servers
                        </p>
                </div>
                <div class="flex gap-3">
                        <button
                                on:click={() => (showForm = !showForm)}
                                class="glass-btn-secondary flex items-center gap-2"
                        >
                                {#if showForm}
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                />
                                        </svg>
                                        <span>Cancel</span>
                                {:else}
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M12 4v16m8-8H4"
                                                />
                                        </svg>
                                        <span>New Tunnel</span>
                                {/if}
                        </button>
                        <button
                                on:click={loadForwards}
                                disabled={loading}
                                class="glass-btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                                <svg class="h-4 w-4" class:animate-spin={loading} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                </svg>
                                <span>Refresh</span>
                        </button>
                </div>
        </div>

        {#if success}
                <div
                        class="p-4 bg-green-500/10 border border-green-500/20 text-green-200 rounded-lg animate-slide-up"
                >
                        {success}
                </div>
        {/if}

        {#if error}
                <div
                        class="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg animate-slide-up"
                >
                        {error}
                </div>
        {/if}

        {#if showForm}
                <TunnelForm
                        bind:formData
                        bind:selectedAlias
                        availableAliases={configEntries}
                        {loading}
                        onAliasChange={handleAliasChange}
                        onSubmit={createForward}
                        onCancel={() => (showForm = false)}
                />
        {/if}

        <div>
                {#if loading && forwards.length === 0}
                        <div class="text-center py-20 text-slate-400 flex flex-col items-center gap-4">
                                <div
                                        class="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"
                                ></div>
                                <p>Loading tunnels...</p>
                        </div>
                {:else if forwards.length === 0}
                        <div class="text-center py-20 text-slate-400 glass-card border-dashed border-2 border-slate-700/50">
                                <div class="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg class="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                        </svg>
                                </div>
                                <h3 class="text-lg font-medium text-slate-200 mb-1">No Active Tunnels</h3>
                                <p class="text-slate-500 mb-6">
                                        Create a new SSH tunnel to forward remote ports to your local machine.
                                </p>
                                <button
                                        on:click={() => (showForm = true)}
                                        class="glass-btn-primary inline-flex items-center gap-2"
                                >
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M12 4v16m8-8H4"
                                                />
                                        </svg>
                                        Create Tunnel
                                </button>
                        </div>
                {:else}
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {#each forwards as forward}
                                        <ForwardCard {forward} onStop={stopForward} />
                                {/each}
                        </div>
                {/if}
        </div>

        <div class="space-y-4 pt-10 border-t border-white/5">
                <div class="flex items-center justify-between flex-wrap gap-4">
                        <div>
                                <h3 class="text-2xl font-semibold text-white flex items-center gap-2">
                                        <svg class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M12 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM5.5 21a6.5 6.5 0 0113 0"
                                                />
                                        </svg>
                                        SSH Config (aliases)
                                </h3>
                                <p class="text-slate-400 text-sm">
                                        Showing Host entries from {sshConfigPath || "~/.ssh/config"}.
                                </p>
                        </div>
                        <div class="flex gap-3">
                                <button
                                        on:click={loadConfigEntries}
                                        disabled={configLoading}
                                        class="glass-btn-primary flex items-center gap-2 disabled:opacity-50"
                                >
                                        <svg
                                                class="h-4 w-4"
                                                class:animate-spin={configLoading}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                        >
                                                <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                        </svg>
                                        <span>Refresh</span>
                                </button>
                        </div>
                </div>

                {#if configError}
                        <div
                                class="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg animate-slide-up"
                        >
                                {configError}
                        </div>
                {/if}

                <div class="space-y-4">
                        {#if configLoading && configEntries.length === 0}
                                <div class="text-center py-12 text-slate-400">
                                        <div
                                                class="w-8 h-8 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4"
                                        ></div>
                                        <p>Loading SSH config...</p>
                                </div>
                        {:else if configEntries.length === 0}
                                <div class="glass-card border-dashed border-2 border-slate-700/50 text-center py-12">
                                        <h4 class="text-lg text-slate-200 mb-2">No aliases found</h4>
                                        <p class="text-slate-500 mb-4">
                                                Add Host blocks to your ~/.ssh/config file to see them here.
                                        </p>
                                </div>
                        {:else}
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {#each configEntries as entry}
                                                <ConfigCard
                                                        {entry}
                                                        applyToTunnel={applyToTunnel}
                                                />
                                        {/each}
                                </div>
                        {/if}
                </div>
        </div>
</div>
