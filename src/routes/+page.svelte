<script lang="ts">
	import { onMount } from 'svelte';
	import type { PortInfo } from '$lib/types';

	let ports: PortInfo[] = [];
	let loading = false;
	let error = '';
	let searchTerm = '';
	let availablePort: number | null = null;
	let findingPort = false;
	let editingPort: number | null = null;
	let editForm = {
		description: '',
		url: ''
	};
	let success = '';

	async function loadPorts() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/ports');
			const data = await response.json();

			if (data.success) {
				ports = data.ports;
			} else {
				error = data.error || '포트 정보를 가져오는데 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		} finally {
			loading = false;
		}
	}

	async function findAvailablePort() {
		findingPort = true;
		availablePort = null;
		try {
			const response = await fetch('/api/ports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'find-available', startPort: 3000, endPort: 65535 })
			});
			const data = await response.json();

			if (data.success) {
				availablePort = data.port;
			} else {
				error = data.error || '사용 가능한 포트를 찾는데 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		} finally {
			findingPort = false;
		}
	}

	function openPort(port: PortInfo) {
		const url = port.url || `http://localhost:${port.port}`;
		window.open(url, '_blank');
	}

	function startEditPort(port: PortInfo) {
		editingPort = port.port;
		editForm.description = port.description || '';
		editForm.url = port.url || `http://localhost:${port.port}`;
	}

	function cancelEdit() {
		editingPort = null;
		editForm.description = '';
		editForm.url = '';
	}

	async function saveDescription(port: number) {
		error = '';
		success = '';

		try {
			const response = await fetch('/api/port-descriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					port,
					description: editForm.description,
					url: editForm.url
				})
			});
			const data = await response.json();

			if (data.success) {
				success = '포트 설명이 저장되었습니다';
				cancelEdit();
				await loadPorts();
				setTimeout(() => (success = ''), 3000);
			} else {
				error = data.error || '저장에 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		}
	}

	async function deleteDescription(port: number) {
		if (!confirm('이 포트의 설명을 삭제하시겠습니까?')) return;

		error = '';
		success = '';

		try {
			const response = await fetch('/api/port-descriptions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ port })
			});
			const data = await response.json();

			if (data.success) {
				success = '포트 설명이 삭제되었습니다';
				await loadPorts();
				setTimeout(() => (success = ''), 3000);
			} else {
				error = data.error || '삭제에 실패했습니다';
			}
		} catch (e) {
			error = '서버 연결에 실패했습니다';
		}
	}

	onMount(() => {
		loadPorts();
	});

	$: filteredPorts = ports.filter(
		(p) =>
			p.port.toString().includes(searchTerm) ||
			p.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(p.service && p.service.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(p.processName && p.processName.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
	);
</script>

<div class="bg-white rounded-lg p-8 shadow-sm">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-semibold text-slate-700">현재 열려있는 포트</h2>
		<div class="flex gap-2">
			<button
				on:click={findAvailablePort}
				disabled={findingPort}
				class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition"
			>
				{findingPort ? '검색 중...' : '사용 가능한 포트 찾기'}
			</button>
			<button
				on:click={loadPorts}
				disabled={loading}
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition"
			>
				{loading ? '로딩 중...' : '새로고침'}
			</button>
		</div>
	</div>

	{#if availablePort}
		<div class="p-4 bg-green-50 text-green-800 border border-green-200 rounded mb-4">
			사용 가능한 포트: <strong>{availablePort}</strong>
		</div>
	{/if}

	{#if success}
		<div class="p-4 bg-green-50 text-green-800 border border-green-200 rounded mb-4">{success}</div>
	{/if}

	{#if error}
		<div class="p-4 bg-red-50 text-red-800 border border-red-200 rounded mb-4">{error}</div>
	{/if}

	<div class="mb-4">
		<input
			type="text"
			placeholder="포트 번호, 프로토콜, 프로세스, 설명으로 검색..."
			bind:value={searchTerm}
			class="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		/>
	</div>

	{#if loading}
		<div class="text-center py-12 text-gray-500">포트 정보를 불러오는 중...</div>
	{:else if filteredPorts.length === 0}
		<div class="text-center py-12 text-gray-500">
			{searchTerm ? '검색 결과가 없습니다' : '열려있는 포트가 없습니다'}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full border-collapse">
				<thead class="bg-gray-50">
					<tr>
						<th class="text-left p-4 font-semibold text-slate-700 border-b-2 border-gray-200">포트</th>
						<th class="text-left p-4 font-semibold text-slate-700 border-b-2 border-gray-200">프로토콜</th>
						<th class="text-left p-4 font-semibold text-slate-700 border-b-2 border-gray-200">상태</th>
						<th class="text-left p-4 font-semibold text-slate-700 border-b-2 border-gray-200">프로세스</th>
						<th class="text-left p-4 font-semibold text-slate-700 border-b-2 border-gray-200">설명</th>
						<th class="text-left p-4 font-semibold text-slate-700 border-b-2 border-gray-200">작업</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPorts as port}
						<tr class="hover:bg-gray-50 transition {editingPort === port.port ? 'bg-blue-50' : ''}">
							<td class="p-4 border-b border-gray-200">
								<button
									on:click={() => openPort(port)}
									class="text-blue-500 font-semibold font-mono underline hover:text-blue-700 transition"
								>
									{port.port}
								</button>
							</td>
							<td class="p-4 border-b border-gray-200">{port.protocol.toUpperCase()}</td>
							<td class="p-4 border-b border-gray-200">
								<span class="px-3 py-1 rounded-full text-sm font-medium {port.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
									{port.state === 'open' ? '열림' : '닫힘'}
								</span>
							</td>
							<td class="p-4 border-b border-gray-200">
								{#if port.processName}
									<span class="font-medium text-slate-700">{port.processName}</span>
									{#if port.pid}
										<span class="ml-1 text-gray-500 text-sm">(PID: {port.pid})</span>
									{/if}
								{:else}
									-
								{/if}
							</td>
							<td class="p-4 border-b border-gray-200">
								{#if editingPort === port.port}
									<div class="flex flex-col gap-2 min-w-[200px]">
										<input
											type="text"
											placeholder="설명 입력..."
											bind:value={editForm.description}
											class="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
										/>
										<input
											type="text"
											placeholder="URL (선택사항)"
											bind:value={editForm.url}
											class="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
										/>
									</div>
								{:else}
									<span class="text-gray-600 italic">{port.description || '-'}</span>
								{/if}
							</td>
							<td class="p-4 border-b border-gray-200">
								{#if editingPort === port.port}
									<div class="flex gap-2 flex-wrap">
										<button
											class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
											on:click={() => saveDescription(port.port)}
										>
											저장
										</button>
										<button
											class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
											on:click={cancelEdit}
										>
											취소
										</button>
									</div>
								{:else}
									<div class="flex gap-2 flex-wrap">
										<button
											class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
											on:click={() => startEditPort(port)}
										>
											{port.description ? '편집' : '추가'}
										</button>
										{#if port.description}
											<button
												class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
												on:click={() => deleteDescription(port.port)}
											>
												삭제
											</button>
										{/if}
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="mt-4 text-right text-gray-500 text-sm">
			총 {filteredPorts.length}개의 포트가 열려있습니다
		</div>
	{/if}
</div>
