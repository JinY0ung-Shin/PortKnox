import cron from 'node-cron';
import { performAllHealthChecks, performCleanup } from './monitorManager';

let healthCheckTask: cron.ScheduledTask | null = null;
let cleanupTask: cron.ScheduledTask | null = null;

export function startMonitoringScheduler(): void {
	if (healthCheckTask) {
		console.log('[PortKnox Monitor] Scheduler already running');
		return;
	}

	// Run health checks every minute
	healthCheckTask = cron.schedule('* * * * *', async () => {
		try {
			await performAllHealthChecks();
		} catch (error) {
			console.error('[PortKnox Monitor] Error in scheduled health check:', error);
		}
	});

	// Run cleanup daily at 3 AM
	cleanupTask = cron.schedule('0 3 * * *', () => {
		try {
			performCleanup();
		} catch (error) {
			console.error('[PortKnox Monitor] Error in scheduled cleanup:', error);
		}
	});

	console.log('[PortKnox Monitor] Scheduler started - health checks every minute');

	// Run initial check immediately
	performAllHealthChecks().catch((error) => {
		console.error('[PortKnox Monitor] Error in initial health check:', error);
	});
}

export function stopMonitoringScheduler(): void {
	if (healthCheckTask) {
		healthCheckTask.stop();
		healthCheckTask = null;
	}

	if (cleanupTask) {
		cleanupTask.stop();
		cleanupTask = null;
	}

	console.log('[PortKnox Monitor] Scheduler stopped');
}
