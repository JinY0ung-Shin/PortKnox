import db from './db';
import type { UrlMonitor, MonitorHistory, AlarmHistory, MonitorCheckResult } from '$lib/types';
import { randomUUID } from 'crypto';

export function createMonitor(
	data: Omit<
		UrlMonitor,
		'id' | 'createdAt' | 'updatedAt' | 'status' | 'consecutiveFailures'
	>
): UrlMonitor {
	const id = randomUUID();

	const stmt = db.prepare(`
		INSERT INTO url_monitors (
			id, name, url, check_interval, timeout, email_recipients,
			enabled, status, consecutive_failures, author, tags
		) VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', 0, ?, ?)
	`);

	stmt.run(
		id,
		data.name,
		data.url,
		data.checkInterval,
		data.timeout,
		JSON.stringify(data.emailRecipients),
		data.enabled ? 1 : 0,
		data.author || null,
		data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null
	);

	return getMonitor(id)!;
}

export function getMonitor(id: string): UrlMonitor | undefined {
	const stmt = db.prepare('SELECT * FROM url_monitors WHERE id = ?');
	const row = stmt.get(id) as any;

	if (!row) return undefined;

	return rowToMonitor(row);
}

export function getAllMonitors(): UrlMonitor[] {
	const stmt = db.prepare('SELECT * FROM url_monitors ORDER BY created_at DESC');
	const rows = stmt.all() as any[];

	return rows.map(rowToMonitor);
}

export function updateMonitor(id: string, updates: Partial<UrlMonitor>): void {
	const fields: string[] = [];
	const values: any[] = [];

	if (updates.name !== undefined) {
		fields.push('name = ?');
		values.push(updates.name);
	}
	if (updates.url !== undefined) {
		fields.push('url = ?');
		values.push(updates.url);
	}
	if (updates.checkInterval !== undefined) {
		fields.push('check_interval = ?');
		values.push(updates.checkInterval);
	}
	if (updates.timeout !== undefined) {
		fields.push('timeout = ?');
		values.push(updates.timeout);
	}
	if (updates.emailRecipients !== undefined) {
		fields.push('email_recipients = ?');
		values.push(JSON.stringify(updates.emailRecipients));
	}
	if (updates.enabled !== undefined) {
		fields.push('enabled = ?');
		values.push(updates.enabled ? 1 : 0);
	}
	if (updates.author !== undefined) {
		fields.push('author = ?');
		values.push(updates.author);
	}
	if (updates.tags !== undefined) {
		fields.push('tags = ?');
		values.push(updates.tags.length > 0 ? JSON.stringify(updates.tags) : null);
	}

	if (fields.length === 0) return;

	fields.push('updated_at = CURRENT_TIMESTAMP');
	values.push(id);

	const stmt = db.prepare(`UPDATE url_monitors SET ${fields.join(', ')} WHERE id = ?`);
	stmt.run(...values);
}

export function updateMonitorStatus(id: string, result: MonitorCheckResult): void {
	const monitor = getMonitor(id);
	if (!monitor) return;

	const newConsecutiveFailures = result.healthy ? 0 : monitor.consecutiveFailures + 1;

	const failureThreshold = parseInt(process.env.MONITOR_FAILURE_THRESHOLD || '3');
	const status = result.healthy
		? 'healthy'
		: newConsecutiveFailures >= failureThreshold
			? 'unhealthy'
			: monitor.status;

	const stmt = db.prepare(`
		UPDATE url_monitors SET
			status = ?,
			consecutive_failures = ?,
			last_check_at = ?,
			last_status_code = ?,
			last_error_message = ?,
			${result.healthy ? 'last_success_at = ?,' : 'last_failure_at = ?,'}
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`);

	stmt.run(
		status,
		newConsecutiveFailures,
		result.checkedAt.toISOString(),
		result.statusCode || null,
		result.errorMessage || null,
		result.checkedAt.toISOString(),
		id
	);
}

export function deleteMonitor(id: string): void {
	const stmt = db.prepare('DELETE FROM url_monitors WHERE id = ?');
	stmt.run(id);
}

// History functions
export function saveMonitorHistory(monitorId: string, result: MonitorCheckResult): void {
	const stmt = db.prepare(`
		INSERT INTO monitor_history (
			monitor_id, healthy, status_code, response_time_ms, error_message
		) VALUES (?, ?, ?, ?, ?)
	`);

	stmt.run(
		monitorId,
		result.healthy ? 1 : 0,
		result.statusCode || null,
		result.responseTimeMs,
		result.errorMessage || null
	);
}

export function getMonitorHistory(monitorId: string, limit: number = 100): MonitorHistory[] {
	const stmt = db.prepare(`
		SELECT * FROM monitor_history
		WHERE monitor_id = ?
		ORDER BY checked_at DESC
		LIMIT ?
	`);

	const rows = stmt.all(monitorId, limit) as any[];

	return rows.map((row) => ({
		id: row.id,
		monitorId: row.monitor_id,
		checkedAt: new Date(row.checked_at),
		healthy: Boolean(row.healthy),
		statusCode: row.status_code,
		responseTimeMs: row.response_time_ms,
		errorMessage: row.error_message
	}));
}

export function saveAlarmHistory(
	monitorId: string,
	alarmType: 'unhealthy' | 'recovered',
	recipients: string[],
	emailSent: boolean,
	errorMessage?: string
): void {
	const stmt = db.prepare(`
		INSERT INTO alarm_history (
			monitor_id, alarm_type, recipients, email_sent, error_message
		) VALUES (?, ?, ?, ?, ?)
	`);

	stmt.run(
		monitorId,
		alarmType,
		JSON.stringify(recipients),
		emailSent ? 1 : 0,
		errorMessage || null
	);
}

export function getAlarmHistory(monitorId: string, limit: number = 50): AlarmHistory[] {
	const stmt = db.prepare(`
		SELECT * FROM alarm_history
		WHERE monitor_id = ?
		ORDER BY sent_at DESC
		LIMIT ?
	`);

	const rows = stmt.all(monitorId, limit) as any[];

	return rows.map((row) => ({
		id: row.id,
		monitorId: row.monitor_id,
		alarmType: row.alarm_type,
		sentAt: new Date(row.sent_at),
		recipients: JSON.parse(row.recipients),
		emailSent: Boolean(row.email_sent),
		errorMessage: row.error_message
	}));
}

export function cleanupOldHistory(daysToKeep: number = 30): void {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

	const stmt = db.prepare('DELETE FROM monitor_history WHERE checked_at < ?');
	const result = stmt.run(cutoffDate.toISOString());

	console.log(`[PortKnox Monitor] Cleaned up ${result.changes} old history records`);
}

function rowToMonitor(row: any): UrlMonitor {
	return {
		id: row.id,
		name: row.name,
		url: row.url,
		checkInterval: row.check_interval,
		timeout: row.timeout,
		emailRecipients: JSON.parse(row.email_recipients),
		enabled: Boolean(row.enabled),
		status: row.status,
		consecutiveFailures: row.consecutive_failures,
		lastCheckAt: row.last_check_at ? new Date(row.last_check_at) : undefined,
		lastSuccessAt: row.last_success_at ? new Date(row.last_success_at) : undefined,
		lastFailureAt: row.last_failure_at ? new Date(row.last_failure_at) : undefined,
		lastStatusCode: row.last_status_code,
		lastErrorMessage: row.last_error_message,
		author: row.author,
		tags: row.tags ? JSON.parse(row.tags) : undefined,
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at)
	};
}
