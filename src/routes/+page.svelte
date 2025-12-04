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

<div class="container">
	<div class="header">
		<h2>현재 열려있는 포트</h2>
		<div class="actions">
			<button on:click={findAvailablePort} disabled={findingPort} class="btn-secondary">
				{findingPort ? '검색 중...' : '사용 가능한 포트 찾기'}
			</button>
			<button on:click={loadPorts} disabled={loading} class="btn-primary">
				{loading ? '로딩 중...' : '새로고침'}
			</button>
		</div>
	</div>

	{#if availablePort}
		<div class="alert success">
			사용 가능한 포트: <strong>{availablePort}</strong>
		</div>
	{/if}

	{#if success}
		<div class="alert success">{success}</div>
	{/if}

	{#if error}
		<div class="alert error">{error}</div>
	{/if}

	<div class="search-box">
		<input
			type="text"
			placeholder="포트 번호, 프로토콜, 프로세스, 설명으로 검색..."
			bind:value={searchTerm}
		/>
	</div>

	{#if loading}
		<div class="loading">포트 정보를 불러오는 중...</div>
	{:else if filteredPorts.length === 0}
		<div class="empty">
			{searchTerm ? '검색 결과가 없습니다' : '열려있는 포트가 없습니다'}
		</div>
	{:else}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>포트</th>
						<th>프로토콜</th>
						<th>상태</th>
						<th>프로세스</th>
						<th>설명</th>
						<th>작업</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPorts as port}
						<tr class:editing={editingPort === port.port}>
							<td class="port">
								<button class="port-link" on:click={() => openPort(port)}>
									{port.port}
								</button>
							</td>
							<td>{port.protocol.toUpperCase()}</td>
							<td>
								<span class="status {port.state}">{port.state === 'open' ? '열림' : '닫힘'}</span>
							</td>
							<td>
								{#if port.processName}
									<span class="process-name">{port.processName}</span>
									{#if port.pid}
										<span class="pid">(PID: {port.pid})</span>
									{/if}
								{:else}
									-
								{/if}
							</td>
							<td>
								{#if editingPort === port.port}
									<div class="edit-form">
										<input
											type="text"
											placeholder="설명 입력..."
											bind:value={editForm.description}
											class="edit-input"
										/>
										<input
											type="text"
											placeholder="URL (선택사항)"
											bind:value={editForm.url}
											class="edit-input"
										/>
									</div>
								{:else}
									<span class="description">{port.description || '-'}</span>
								{/if}
							</td>
							<td>
								{#if editingPort === port.port}
									<div class="action-buttons">
										<button class="btn-small btn-success" on:click={() => saveDescription(port.port)}>
											저장
										</button>
										<button class="btn-small btn-secondary" on:click={cancelEdit}>취소</button>
									</div>
								{:else}
									<div class="action-buttons">
										<button class="btn-small btn-primary" on:click={() => startEditPort(port)}>
											{port.description ? '편집' : '추가'}
										</button>
										{#if port.description}
											<button
												class="btn-small btn-danger"
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
		<div class="summary">총 {filteredPorts.length}개의 포트가 열려있습니다</div>
	{/if}
</div>

<style>
	.container {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #2c3e50;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-primary,
	.btn-secondary,
	.btn-success,
	.btn-danger {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #3498db;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2980b9;
	}

	.btn-secondary {
		background: #95a5a6;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #7f8c8d;
	}

	.btn-success {
		background: #27ae60;
		color: white;
	}

	.btn-success:hover {
		background: #229954;
	}

	.btn-danger {
		background: #e74c3c;
		color: white;
	}

	.btn-danger:hover {
		background: #c0392b;
	}

	.btn-small {
		padding: 0.25rem 0.75rem;
		font-size: 0.85rem;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.alert {
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.alert.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.search-box {
		margin-bottom: 1rem;
	}

	.search-box input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.95rem;
	}

	.search-box input:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}

	.loading,
	.empty {
		text-align: center;
		padding: 3rem;
		color: #7f8c8d;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f8f9fa;
	}

	th {
		text-align: left;
		padding: 1rem;
		font-weight: 600;
		color: #2c3e50;
		border-bottom: 2px solid #dee2e6;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #dee2e6;
	}

	tbody tr:hover {
		background: #f8f9fa;
	}

	tbody tr.editing {
		background: #e8f4f8;
	}

	.port {
		font-weight: 600;
		font-family: 'Courier New', monospace;
	}

	.port-link {
		background: none;
		border: none;
		color: #3498db;
		cursor: pointer;
		font-weight: 600;
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		padding: 0;
		text-decoration: underline;
		transition: color 0.2s;
	}

	.port-link:hover {
		color: #2980b9;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.status.open {
		background: #d4edda;
		color: #155724;
	}

	.status.closed {
		background: #f8d7da;
		color: #721c24;
	}

	.description {
		color: #555;
		font-style: italic;
	}

	.process-name {
		font-weight: 500;
		color: #2c3e50;
	}

	.pid {
		color: #7f8c8d;
		font-size: 0.85rem;
		margin-left: 0.25rem;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 200px;
	}

	.edit-input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.edit-input:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.summary {
		margin-top: 1rem;
		text-align: right;
		color: #7f8c8d;
		font-size: 0.9rem;
	}
</style>
