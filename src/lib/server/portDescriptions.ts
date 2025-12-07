import db from './db';
import type { PortDescription } from '$lib/types';

export function getPortDescription(port: number): PortDescription | undefined {
	const stmt = db.prepare(`
		SELECT port, description, author, tags,
			litellm_enabled, litellm_model_id, litellm_model_name, litellm_api_base
		FROM ports WHERE port = ?
	`);
	const row = stmt.get(port) as any;
	if (!row) return undefined;

	return {
		port: row.port,
		description: row.description,
		author: row.author,
		tags: row.tags ? JSON.parse(row.tags) : undefined,
		litellmEnabled: Boolean(row.litellm_enabled),
		litellmModelId: row.litellm_model_id,
		litellmModelName: row.litellm_model_name,
		litellmApiBase: row.litellm_api_base
	};
}

export function getAllPortDescriptions(): PortDescription[] {
	const stmt = db.prepare(`
		SELECT port, description, author, tags,
			litellm_enabled, litellm_model_id, litellm_model_name, litellm_api_base
		FROM ports ORDER BY port
	`);
	const rows = stmt.all() as any[];

	return rows.map((row) => ({
		port: row.port,
		description: row.description,
		author: row.author,
		tags: row.tags ? JSON.parse(row.tags) : undefined,
		litellmEnabled: Boolean(row.litellm_enabled),
		litellmModelId: row.litellm_model_id,
		litellmModelName: row.litellm_model_name,
		litellmApiBase: row.litellm_api_base
	}));
}

export function setPortDescription(
	port: number,
	description: string,
	author?: string,
	tags?: string[]
): void {
	// 기존 LiteLLM 정보 보존을 위해 UPDATE만 수행
	// (INSERT는 SSH 터널이나 사용자가 명시적으로 새 포트를 추가할 때만 발생해야 함)
	const existingPort = db.prepare('SELECT port FROM ports WHERE port = ?').get(port);

	if (existingPort) {
		// 기존 포트 업데이트 - LiteLLM 정보 보존
		const stmt = db.prepare(`
			UPDATE ports SET
				description = ?,
				author = ?,
				tags = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE port = ?
		`);
		const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
		stmt.run(description, author || null, tagsJson, port);
	} else {
		// 새 포트 생성
		const stmt = db.prepare(`
			INSERT INTO ports (port, description, author, tags)
			VALUES (?, ?, ?, ?)
		`);
		const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
		stmt.run(port, description, author || null, tagsJson);
	}
}

export function deletePortDescription(port: number): void {
	const stmt = db.prepare('DELETE FROM ports WHERE port = ? AND ssh_tunnel_id IS NULL');
	stmt.run(port);
}
