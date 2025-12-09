import nodemailer from 'nodemailer';
import type { EmailConfig, UrlMonitor, MonitorCheckResult } from '$lib/types';

let transporter: nodemailer.Transporter | null = null;

export function initializeEmailService(config: EmailConfig): void {
	transporter = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: {
			user: config.user,
			pass: config.password
		}
	});

	console.log('[PortKnox Monitor] Email service initialized');
}

export async function sendAlarmEmail(
	monitor: UrlMonitor,
	alarmType: 'unhealthy' | 'recovered',
	checkResult?: MonitorCheckResult
): Promise<{ success: boolean; error?: string }> {
	if (!transporter) {
		return { success: false, error: 'Email service not initialized' };
	}

	try {
		const subject =
			alarmType === 'unhealthy'
				? `[PortKnox] ALERT: ${monitor.name} is DOWN`
				: `[PortKnox] RECOVERED: ${monitor.name} is UP`;

		const html = generateEmailHtml(monitor, alarmType, checkResult);

		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'PortKnox <noreply@portknox.dev>',
			to: monitor.emailRecipients.join(', '),
			subject,
			html
		});

		console.log(`[PortKnox Monitor] Alarm email sent for ${monitor.name}`);
		return { success: true };
	} catch (error) {
		console.error('[PortKnox Monitor] Failed to send email:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

function generateEmailHtml(
	monitor: UrlMonitor,
	alarmType: 'unhealthy' | 'recovered',
	checkResult?: MonitorCheckResult
): string {
	const isUnhealthy = alarmType === 'unhealthy';
	const color = isUnhealthy ? '#dc2626' : '#16a34a';
	const status = isUnhealthy ? 'DOWN' : 'UP';

	return `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
				.content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
				.info { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; }
				.label { font-weight: 600; color: #64748b; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1 style="margin: 0;">${status}: ${monitor.name}</h1>
				</div>
				<div class="content">
					<div class="info">
						<p><span class="label">Monitor:</span> ${monitor.name}</p>
						<p><span class="label">URL:</span> <a href="${monitor.url}">${monitor.url}</a></p>
						<p><span class="label">Status:</span> ${status}</p>
						${checkResult?.statusCode ? `<p><span class="label">Status Code:</span> ${checkResult.statusCode}</p>` : ''}
						${checkResult?.errorMessage ? `<p><span class="label">Error:</span> ${checkResult.errorMessage}</p>` : ''}
						<p><span class="label">Checked at:</span> ${new Date().toLocaleString()}</p>
						${isUnhealthy ? `<p><span class="label">Consecutive Failures:</span> ${monitor.consecutiveFailures}</p>` : ''}
					</div>

					${monitor.author ? `<p style="color: #64748b;">Registered by: ${monitor.author}</p>` : ''}

					<p style="color: #64748b; font-size: 12px; margin-top: 20px;">
						This is an automated message from PortKnox monitoring system.
					</p>
				</div>
			</div>
		</body>
		</html>
	`;
}

export async function testEmailConnection(config: EmailConfig): Promise<boolean> {
	try {
		const testTransporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: {
				user: config.user,
				pass: config.password
			}
		});

		await testTransporter.verify();
		return true;
	} catch (error) {
		console.error('[PortKnox Monitor] Email connection test failed:', error);
		return false;
	}
}
