import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getAllMonitors,
	getMonitor,
	createMonitor,
	updateMonitor,
	deleteMonitor,
	getMonitorHistory,
	getAlarmHistory
} from '$lib/server/monitorCrud';

// GET: List all monitors or get specific monitor
export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const includeHistory = url.searchParams.get('history') === 'true';
		const includeAlarms = url.searchParams.get('alarms') === 'true';

		if (id) {
			const monitor = getMonitor(id);
			if (!monitor) {
				return json({ success: false, error: 'Monitor not found' }, { status: 404 });
			}

			const response: any = { success: true, monitor };

			if (includeHistory) {
				response.history = getMonitorHistory(id, 100);
			}

			if (includeAlarms) {
				response.alarms = getAlarmHistory(id, 50);
			}

			return json(response);
		}

		const monitors = getAllMonitors();
		return json({ success: true, monitors });
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// POST: Create new monitor
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		// Validation
		if (!data.name || !data.url || !data.emailRecipients || data.emailRecipients.length === 0) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const invalidEmails = data.emailRecipients.filter((email: string) => !emailRegex.test(email));
		if (invalidEmails.length > 0) {
			return json(
				{ success: false, error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
				{ status: 400 }
			);
		}

		const monitor = createMonitor({
			name: data.name,
			url: data.url,
			checkInterval: data.checkInterval || 60000,
			timeout: data.timeout || 5000,
			emailRecipients: data.emailRecipients,
			enabled: data.enabled !== false,
			author: data.author,
			tags: data.tags
		});

		return json({ success: true, monitor, message: 'Monitor created successfully' });
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// PATCH: Update existing monitor
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const { id, ...updates } = await request.json();

		if (!id) {
			return json({ success: false, error: 'Monitor ID required' }, { status: 400 });
		}

		const existingMonitor = getMonitor(id);
		if (!existingMonitor) {
			return json({ success: false, error: 'Monitor not found' }, { status: 404 });
		}

		updateMonitor(id, updates);

		const updatedMonitor = getMonitor(id);
		return json({ success: true, monitor: updatedMonitor, message: 'Monitor updated' });
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// DELETE: Remove monitor
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();

		if (!id) {
			return json({ success: false, error: 'Monitor ID required' }, { status: 400 });
		}

		const monitor = getMonitor(id);
		if (!monitor) {
			return json({ success: false, error: 'Monitor not found' }, { status: 404 });
		}

		deleteMonitor(id);

		return json({ success: true, message: 'Monitor deleted successfully' });
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
