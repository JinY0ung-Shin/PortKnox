import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createSSHForward,
	stopSSHForward,
	listActiveForwards,
	getForwardById
} from '$lib/server/sshForwarder';
import type { SSHForwardConfig } from '$lib/types';

export const GET: RequestHandler = async () => {
	try {
		const forwards = listActiveForwards();
		return json({ success: true, forwards });
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const config: SSHForwardConfig = await request.json();
		const result = await createSSHForward(config);

		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
	} catch (error) {
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();
		const result = await stopSSHForward(id);

		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
	} catch (error) {
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
