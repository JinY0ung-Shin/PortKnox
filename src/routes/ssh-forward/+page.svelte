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

<div class="container">
	<div class="header">
		<h2>SSH 포트 포워딩 관리</h2>
		<div class="actions">
			<button on:click={() => (showForm = !showForm)} class="btn-secondary">
				{showForm ? '취소' : '새 포워딩 추가'}
			</button>
			<button on:click={loadForwards} disabled={loading} class="btn-primary">
				{loading ? '로딩 중...' : '새로고침'}
			</button>
		</div>
	</div>

	{#if success}
		<div class="alert success">{success}</div>
	{/if}

	{#if error}
		<div class="alert error">{error}</div>
	{/if}

	{#if showForm}
		<div class="form-container">
			<h3>새 SSH 포트 포워딩 설정</h3>
			<form on:submit|preventDefault={createForward}>
				<div class="form-grid">
					<div class="form-group">
						<label for="name">설정 이름</label>
						<input
							id="name"
							type="text"
							bind:value={formData.name}
							placeholder="예: Production API"
							required
						/>
					</div>

					<div class="form-group">
						<label for="localPort">로컬 포트</label>
						<input
							id="localPort"
							type="number"
							bind:value={formData.localPort}
							placeholder="예: 8080"
							required
						/>
					</div>

					<div class="form-group">
						<label for="remoteHost">원격 호스트</label>
						<input
							id="remoteHost"
							type="text"
							bind:value={formData.remoteHost}
							placeholder="예: localhost 또는 192.168.1.100"
							required
						/>
					</div>

					<div class="form-group">
						<label for="remotePort">원격 포트</label>
						<input
							id="remotePort"
							type="number"
							bind:value={formData.remotePort}
							placeholder="예: 3000"
							required
						/>
					</div>

					<div class="form-group">
						<label for="sshHost">SSH 서버 주소</label>
						<input
							id="sshHost"
							type="text"
							bind:value={formData.sshHost}
							placeholder="예: ssh.example.com"
							required
						/>
					</div>

					<div class="form-group">
						<label for="sshPort">SSH 포트</label>
						<input
							id="sshPort"
							type="number"
							bind:value={formData.sshPort}
							placeholder="기본값: 22"
						/>
					</div>

					<div class="form-group">
						<label for="sshUser">SSH 사용자명</label>
						<input
							id="sshUser"
							type="text"
							bind:value={formData.sshUser}
							placeholder="예: ubuntu"
							required
						/>
					</div>

					<div class="form-group">
						<label for="portDescription">포트 설명 (선택사항)</label>
						<input
							id="portDescription"
							type="text"
							bind:value={formData.portDescription}
							placeholder="예: Production API Server"
						/>
						<small>로컬 포트에 자동으로 설명이 추가됩니다</small>
					</div>

					<div class="form-group">
						<label for="portUrl">포트 URL (선택사항)</label>
						<input
							id="portUrl"
							type="text"
							bind:value={formData.portUrl}
							placeholder="예: http://localhost:8080/admin"
						/>
						<small>포트 클릭 시 이 URL로 접속합니다</small>
					</div>
				</div>

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? '생성 중...' : '포워딩 시작'}
					</button>
					<button type="button" class="btn-secondary" on:click={() => (showForm = false)}>
						취소
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="forwards-list">
		{#if loading && forwards.length === 0}
			<div class="loading">포워딩 정보를 불러오는 중...</div>
		{:else if forwards.length === 0}
			<div class="empty">
				<p>활성화된 SSH 포트 포워딩이 없습니다</p>
				<p class="hint">새 포워딩을 추가하여 시작하세요</p>
			</div>
		{:else}
			<div class="cards">
				{#each forwards as forward}
					<div class="card">
						<div class="card-header">
							<h3>{forward.name}</h3>
							<span class="status {forward.status}">{forward.status === 'active' ? '활성' : '비활성'}</span>
						</div>
						<div class="card-body">
							<div class="info-row">
								<span class="label">로컬:</span>
								<span class="value">127.0.0.1:{forward.localPort}</span>
							</div>
							<div class="info-row">
								<span class="label">원격:</span>
								<span class="value">{forward.remoteHost}:{forward.remotePort}</span>
							</div>
							<div class="info-row">
								<span class="label">SSH:</span>
								<span class="value">{forward.sshUser}@{forward.sshHost}:{forward.sshPort}</span>
							</div>
						</div>
						<div class="card-footer">
							{#if forward.id}
								<button on:click={() => stopForward(forward.id!)} class="btn-danger">
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

	.btn-danger {
		background: #e74c3c;
		color: white;
	}

	.btn-danger:hover {
		background: #c0392b;
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

	.form-container {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.form-container h3 {
		margin: 0 0 1.5rem;
		color: #2c3e50;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #2c3e50;
	}

	.form-group input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.95rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}

	.form-group small {
		margin-top: 0.25rem;
		font-size: 0.85rem;
		color: #7f8c8d;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 3rem;
		color: #7f8c8d;
	}

	.empty .hint {
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.card {
		border: 1px solid #dee2e6;
		border-radius: 8px;
		overflow: hidden;
		transition: box-shadow 0.2s;
	}

	.card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: #2c3e50;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.status.active {
		background: #d4edda;
		color: #155724;
	}

	.status.inactive {
		background: #f8d7da;
		color: #721c24;
	}

	.card-body {
		padding: 1.5rem;
	}

	.info-row {
		display: flex;
		margin-bottom: 0.75rem;
	}

	.info-row:last-child {
		margin-bottom: 0;
	}

	.info-row .label {
		font-weight: 500;
		color: #7f8c8d;
		min-width: 60px;
	}

	.info-row .value {
		color: #2c3e50;
		font-family: 'Courier New', monospace;
	}

	.card-footer {
		padding: 1rem 1.5rem;
		background: #f8f9fa;
		border-top: 1px solid #dee2e6;
	}
</style>
