import type { MonitorCheckResult } from '$lib/types';

export async function checkUrlHealth(
	url: string,
	timeoutMs: number = 5000
): Promise<MonitorCheckResult> {
	const startTime = Date.now();

	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(timeoutMs),
			method: 'GET',
			redirect: 'follow'
		});

		const responseTimeMs = Date.now() - startTime;

		return {
			healthy: response.ok, // 200-299 status codes
			statusCode: response.status,
			responseTimeMs,
			checkedAt: new Date()
		};
	} catch (error) {
		const responseTimeMs = Date.now() - startTime;

		return {
			healthy: false,
			responseTimeMs,
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
			checkedAt: new Date()
		};
	}
}
