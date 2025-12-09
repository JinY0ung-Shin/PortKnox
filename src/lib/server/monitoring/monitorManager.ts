import { checkUrlHealth } from './healthChecker';
import { sendAlarmEmail } from './emailService';
import {
	getAllMonitors,
	updateMonitorStatus,
	saveMonitorHistory,
	saveAlarmHistory,
	cleanupOldHistory
} from '../monitorCrud';

const FAILURE_THRESHOLD = parseInt(process.env.MONITOR_FAILURE_THRESHOLD || '3');

export async function performHealthCheck(monitorId: string): Promise<void> {
	const monitors = getAllMonitors();
	const monitor = monitors.find((m) => m.id === monitorId);

	if (!monitor || !monitor.enabled) {
		return;
	}

	console.log(`[PortKnox Monitor] Checking ${monitor.name} (${monitor.url})`);

	try {
		const result = await checkUrlHealth(monitor.url, monitor.timeout);

		// Save to history
		saveMonitorHistory(monitor.id, result);

		// Determine if state changed
		const previousStatus = monitor.status;
		const wasHealthy = previousStatus === 'healthy';
		const isNowHealthy = result.healthy;

		// Update monitor status
		updateMonitorStatus(monitor.id, result);

		// Get updated monitor to check new status
		const updatedMonitor = getAllMonitors().find((m) => m.id === monitorId);
		if (!updatedMonitor) return;

		// Send alarms only on state transitions
		const shouldSendUnhealthyAlarm =
			!wasHealthy &&
			updatedMonitor.status === 'unhealthy' &&
			updatedMonitor.consecutiveFailures === FAILURE_THRESHOLD;

		const shouldSendRecoveryAlarm = !wasHealthy && isNowHealthy && previousStatus === 'unhealthy';

		if (shouldSendUnhealthyAlarm) {
			console.log(`[PortKnox Monitor] Sending UNHEALTHY alarm for ${monitor.name}`);
			const emailResult = await sendAlarmEmail(updatedMonitor, 'unhealthy', result);
			saveAlarmHistory(
				monitor.id,
				'unhealthy',
				monitor.emailRecipients,
				emailResult.success,
				emailResult.error
			);
		} else if (shouldSendRecoveryAlarm) {
			console.log(`[PortKnox Monitor] Sending RECOVERY alarm for ${monitor.name}`);
			const emailResult = await sendAlarmEmail(updatedMonitor, 'recovered', result);
			saveAlarmHistory(
				monitor.id,
				'recovered',
				monitor.emailRecipients,
				emailResult.success,
				emailResult.error
			);
		}
	} catch (error) {
		console.error(`[PortKnox Monitor] Error checking ${monitor.name}:`, error);
	}
}

export async function performAllHealthChecks(): Promise<void> {
	const monitors = getAllMonitors().filter((m) => m.enabled);

	console.log(`[PortKnox Monitor] Running health checks for ${monitors.length} monitors`);

	// Run checks in parallel but with some concurrency limit
	const BATCH_SIZE = 5;
	for (let i = 0; i < monitors.length; i += BATCH_SIZE) {
		const batch = monitors.slice(i, i + BATCH_SIZE);
		await Promise.all(batch.map((m) => performHealthCheck(m.id)));
	}
}

export function performCleanup(): void {
	const daysToKeep = parseInt(process.env.MONITOR_CLEANUP_DAYS || '30');
	cleanupOldHistory(daysToKeep);
}
