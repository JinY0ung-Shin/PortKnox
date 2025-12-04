<script lang="ts">
	import { onMount } from 'svelte';
	import type { SSHForwardConfig } from '$lib/types';

	let forwards: SSHForwardConfig[] = [];
	let loading = false;
	let error = '';
	let success = '';
	let showForm = false;

	let formData: SSHForwardConfig = {
		name: '',
		remoteHost: '',
		remotePort: 0,
		localPort: 0,
		sshUser: '',
		sshHost: '',
		sshPort: 22,
		portDescription: '',
		portUrl: ''
	};

	async function loadForwards() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/ssh-forward');
			const data = await response.json();

			if (data.success) {
				forwards = data.forwards;
			} else {
				error = data.error || '포워딩 정보를 가져오는데 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		} finally {
			loading = false;
		}
	}

	async function createForward() {
		error = '';
		success = '';
		loading = true;

		try {
			const response = await fetch('/api/ssh-forward', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			const data = await response.json();

			if (data.success) {
				success = data.message;
				showForm = false;
				resetForm();
				await loadForwards();
			} else {
				error = data.message || '포워딩 생성에 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		} finally {
			loading = false;
		}
	}

	async function stopForward(id: string) {
		if (!confirm('이 포트 포워딩을 중지하시겠습니까?')) return;

		error = '';
		success = '';

		try {
			const response = await fetch('/api/ssh-forward', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const data = await response.json();

			if (data.success) {
				success = data.message;
				await loadForwards();
			} else {
				error = data.message || '포워딩 중지에 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		}
	}

	function resetForm() {
		formData = {
			name: '',
			remoteHost: '',
			remotePort: 0,
			localPort: 0,
			sshUser: '',
			sshHost: '',
			sshPort: 22,
			portDescription: '',
			portUrl: ''
		};
	}

	onMount(() => {
		loadForwards();
	});
</script>

<div class="bg-white rounded-lg p-8 shadow-sm">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-semibold text-slate-700">SSH 포트 포워딩 관리</h2>
		<div class="flex gap-2">
			<button
				on:click={() => (showForm = !showForm)}
				class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition"
			>
				{showForm ? '취소' : '새 포워딩 추가'}
			</button>
			<button
				on:click={loadForwards}
				disabled={loading}
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition"
			>
				{loading ? '로딩 중...' : '새로고침'}
			</button>
		</div>
	</div>

	{#if success}
		<div class="p-4 bg-green-50 text-green-800 border border-green-200 rounded mb-4">{success}</div>
	{/if}

	{#if error}
		<div class="p-4 bg-red-50 text-red-800 border border-red-200 rounded mb-4">{error}</div>
	{/if}

	{#if showForm}
		<div class="bg-gray-50 p-6 rounded-lg mb-8">
			<h3 class="text-xl font-semibold text-slate-700 mb-6">새 SSH 포트 포워딩 설정</h3>
			<form on:submit|preventDefault={createForward}>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="flex flex-col">
						<label for="name" class="mb-2 font-medium text-slate-700">설정 이름</label>
						<input
							id="name"
							type="text"
							bind:value={formData.name}
							placeholder="예: Production API"
							required
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="localPort" class="mb-2 font-medium text-slate-700">로컬 포트</label>
						<input
							id="localPort"
							type="number"
							bind:value={formData.localPort}
							placeholder="예: 8080"
							required
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="remoteHost" class="mb-2 font-medium text-slate-700">원격 호스트</label>
						<input
							id="remoteHost"
							type="text"
							bind:value={formData.remoteHost}
							placeholder="예: localhost 또는 192.168.1.100"
							required
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="remotePort" class="mb-2 font-medium text-slate-700">원격 포트</label>
						<input
							id="remotePort"
							type="number"
							bind:value={formData.remotePort}
							placeholder="예: 3000"
							required
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="sshHost" class="mb-2 font-medium text-slate-700">SSH 서버 주소</label>
						<input
							id="sshHost"
							type="text"
							bind:value={formData.sshHost}
							placeholder="예: ssh.example.com"
							required
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="sshPort" class="mb-2 font-medium text-slate-700">SSH 포트</label>
						<input
							id="sshPort"
							type="number"
							bind:value={formData.sshPort}
							placeholder="기본값: 22"
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="sshUser" class="mb-2 font-medium text-slate-700">SSH 사용자명</label>
						<input
							id="sshUser"
							type="text"
							bind:value={formData.sshUser}
							placeholder="예: ubuntu"
							required
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div class="flex flex-col">
						<label for="portDescription" class="mb-2 font-medium text-slate-700">포트 설명 (선택사항)</label>
						<input
							id="portDescription"
							type="text"
							bind:value={formData.portDescription}
							placeholder="예: Production API Server"
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<small class="mt-1 text-sm text-gray-500 italic">로컬 포트에 자동으로 설명이 추가됩니다</small>
					</div>

					<div class="flex flex-col">
						<label for="portUrl" class="mb-2 font-medium text-slate-700">포트 URL (선택사항)</label>
						<input
							id="portUrl"
							type="text"
							bind:value={formData.portUrl}
							placeholder="예: http://localhost:8080/admin"
							class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<small class="mt-1 text-sm text-gray-500 italic">포트 클릭 시 이 URL로 접속합니다</small>
					</div>
				</div>

				<div class="flex gap-2 mt-6">
					<button
						type="submit"
						class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition"
						disabled={loading}
					>
						{loading ? '생성 중...' : '포워딩 시작'}
					</button>
					<button
						type="button"
						class="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium transition"
						on:click={() => (showForm = false)}
					>
						취소
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div>
		{#if loading && forwards.length === 0}
			<div class="text-center py-12 text-gray-500">포워딩 정보를 불러오는 중...</div>
		{:else if forwards.length === 0}
			<div class="text-center py-12 text-gray-500">
				<p class="text-lg">활성화된 SSH 포트 포워딩이 없습니다</p>
				<p class="text-sm mt-2">새 포워딩을 추가하여 시작하세요</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each forwards as forward}
					<div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
						<div class="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
							<h3 class="text-lg font-semibold text-slate-700">{forward.name}</h3>
							<span class="px-3 py-1 rounded-full text-sm font-medium {forward.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
								{forward.status === 'active' ? '활성' : '비활성'}
							</span>
						</div>
						<div class="p-6">
							<div class="mb-3">
								<span class="font-medium text-gray-600">로컬:</span>
								<span class="ml-2 text-slate-700 font-mono">127.0.0.1:{forward.localPort}</span>
							</div>
							<div class="mb-3">
								<span class="font-medium text-gray-600">원격:</span>
								<span class="ml-2 text-slate-700 font-mono">{forward.remoteHost}:{forward.remotePort}</span>
							</div>
							<div>
								<span class="font-medium text-gray-600">SSH:</span>
								<span class="ml-2 text-slate-700 font-mono">{forward.sshUser}@{forward.sshHost}:{forward.sshPort}</span>
							</div>
						</div>
						<div class="p-4 bg-gray-50 border-t border-gray-200">
							{#if forward.id}
								<button
									on:click={() => stopForward(forward.id!)}
									class="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium transition"
								>
									중지
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
