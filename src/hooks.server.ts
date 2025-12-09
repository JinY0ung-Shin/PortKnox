import { restoreSavedTunnels } from '$lib/server/sshForwarder';
import { initializeEmailService } from '$lib/server/monitoring/emailService';
import { startMonitoringScheduler } from '$lib/server/monitoring/scheduler';
import type { EmailConfig } from '$lib/types';

// 서버 초기화
(async () => {
	try {
		// 저장된 SSH 터널 복원
		await restoreSavedTunnels();

		// 이메일 서비스 초기화
		const emailConfig: EmailConfig = {
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.SMTP_PORT || '587'),
			secure: process.env.SMTP_SECURE === 'true',
			user: process.env.SMTP_USER || '',
			password: process.env.SMTP_PASSWORD || '',
			from: process.env.SMTP_FROM || 'PortKnox <noreply@portknox.dev>'
		};

		if (emailConfig.user && emailConfig.password) {
			initializeEmailService(emailConfig);

			// 모니터링 스케줄러 시작
			startMonitoringScheduler();
		} else {
			console.log('[PortKnox Monitor] Email not configured - monitoring disabled');
		}
	} catch (error) {
		console.error('[PortKnox] Initialization error:', error);
	}
})();

// 전역 에러 핸들러 - SSH 연결 에러로 인한 서버 크래시 방지
process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	// SSH 연결 에러는 무시하고 서버는 계속 실행
	if (error.message?.includes('ECONNRESET') || error.message?.includes('SSH')) {
		console.log('SSH 연결 에러 무시, 서버 계속 실행');
	} else {
		// 다른 심각한 에러는 로그를 남김
		console.error('심각한 에러 발생:', error);
	}
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export async function handle({ event, resolve }) {
	return resolve(event);
}
