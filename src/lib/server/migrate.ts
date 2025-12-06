import { readFileSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import db from './db';

const DATA_DIR = join(process.cwd(), 'data');
const PORT_DESCRIPTIONS_FILE = join(DATA_DIR, 'port-descriptions.json');
const SSH_TUNNELS_FILE = join(DATA_DIR, 'ssh-tunnels.json');

interface PortDescriptionJSON {
	port: number;
	description: string;
	author?: string;
	url?: string; // 이전 버전 호환
}

interface SSHTunnelJSON {
	id: string;
	name: string;
	remoteHost: string;
	remotePort: number;
	localPort: number;
	localBindAddress?: string;
	sshUser: string;
	sshHost: string;
	sshPort: number;
	author?: string;
	status?: string;
}

export function migrateJSONToSQLite(): void {
	let migrated = false;

	// 1. Port Descriptions 마이그레이션 (일반 포트)
	if (existsSync(PORT_DESCRIPTIONS_FILE)) {
		try {
			console.log('[Migration] Migrating port descriptions from JSON to SQLite...');
			const data = readFileSync(PORT_DESCRIPTIONS_FILE, 'utf-8');

			if (data && data.trim()) {
				const descriptions: PortDescriptionJSON[] = JSON.parse(data);

				const insertStmt = db.prepare(`
					INSERT INTO ports (port, description, author)
					VALUES (?, ?, ?)
					ON CONFLICT(port) DO UPDATE SET
						description = excluded.description,
						author = excluded.author
				`);

				const transaction = db.transaction((items: PortDescriptionJSON[]) => {
					for (const item of items) {
						insertStmt.run(item.port, item.description, item.author || null);
					}
				});

				transaction(descriptions);
				console.log(`[Migration] Migrated ${descriptions.length} port descriptions`);

				// JSON 파일을 백업으로 이름 변경
				renameSync(PORT_DESCRIPTIONS_FILE, `${PORT_DESCRIPTIONS_FILE}.backup`);
				migrated = true;
			}
		} catch (error) {
			console.error('[Migration] Failed to migrate port descriptions:', error);
		}
	}

	// 2. SSH Tunnels 마이그레이션
	if (existsSync(SSH_TUNNELS_FILE)) {
		try {
			console.log('[Migration] Migrating SSH tunnels from JSON to SQLite...');
			const data = readFileSync(SSH_TUNNELS_FILE, 'utf-8');

			if (data && data.trim()) {
				const tunnels: SSHTunnelJSON[] = JSON.parse(data);

				const insertStmt = db.prepare(`
					INSERT INTO ports (
						port, description, author,
						ssh_tunnel_id, ssh_tunnel_name, ssh_remote_host, ssh_remote_port,
						ssh_local_bind_address, ssh_user, ssh_host, ssh_port, ssh_status
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(port) DO UPDATE SET
						description = excluded.description,
						author = excluded.author,
						ssh_tunnel_id = excluded.ssh_tunnel_id,
						ssh_tunnel_name = excluded.ssh_tunnel_name,
						ssh_remote_host = excluded.ssh_remote_host,
						ssh_remote_port = excluded.ssh_remote_port,
						ssh_local_bind_address = excluded.ssh_local_bind_address,
						ssh_user = excluded.ssh_user,
						ssh_host = excluded.ssh_host,
						ssh_port = excluded.ssh_port,
						ssh_status = excluded.ssh_status
				`);

				const transaction = db.transaction((items: SSHTunnelJSON[]) => {
					for (const item of items) {
						const description = `SSH Tunnel: ${item.name}`;
						insertStmt.run(
							item.localPort,
							description,
							item.author || null,
							item.id,
							item.name,
							item.remoteHost,
							item.remotePort,
							item.localBindAddress || '127.0.0.1',
							item.sshUser,
							item.sshHost,
							item.sshPort,
							item.status || 'active'
						);
					}
				});

				transaction(tunnels);
				console.log(`[Migration] Migrated ${tunnels.length} SSH tunnels`);

				// JSON 파일을 백업으로 이름 변경
				renameSync(SSH_TUNNELS_FILE, `${SSH_TUNNELS_FILE}.backup`);
				migrated = true;
			}
		} catch (error) {
			console.error('[Migration] Failed to migrate SSH tunnels:', error);
		}
	}

	// 3. 기존 DB 테이블 마이그레이션 (이미 SQLite를 사용 중인 경우)
	try {
		// port_descriptions 테이블이 존재하는지 확인
		const hasOldTables = db.prepare(`
			SELECT name FROM sqlite_master
			WHERE type='table' AND (name='port_descriptions' OR name='ssh_tunnels')
		`).all();

		if (hasOldTables.length > 0) {
			console.log('[Migration] Migrating from old table structure to unified ports table...');

			// port_descriptions 테이블 데이터 마이그레이션
			const hasPortDescriptions = db.prepare(`
				SELECT name FROM sqlite_master WHERE type='table' AND name='port_descriptions'
			`).get();

			if (hasPortDescriptions) {
				const oldPortDescriptions = db.prepare('SELECT * FROM port_descriptions').all();

				if (oldPortDescriptions.length > 0) {
					const insertStmt = db.prepare(`
						INSERT INTO ports (port, description, author)
						VALUES (?, ?, ?)
						ON CONFLICT(port) DO UPDATE SET
							description = excluded.description,
							author = excluded.author
					`);

					const transaction = db.transaction((items: any[]) => {
						for (const item of items) {
							insertStmt.run(item.port, item.description, item.author);
						}
					});

					transaction(oldPortDescriptions);
					console.log(`[Migration] Migrated ${oldPortDescriptions.length} entries from port_descriptions table`);
				}

				// 기존 테이블 삭제
				db.prepare('DROP TABLE IF EXISTS port_descriptions').run();
				console.log('[Migration] Dropped old port_descriptions table');
				migrated = true;
			}

			// ssh_tunnels 테이블 데이터 마이그레이션
			const hasSSHTunnels = db.prepare(`
				SELECT name FROM sqlite_master WHERE type='table' AND name='ssh_tunnels'
			`).get();

			if (hasSSHTunnels) {
				const oldSSHTunnels = db.prepare('SELECT * FROM ssh_tunnels').all();

				if (oldSSHTunnels.length > 0) {
					const insertStmt = db.prepare(`
						INSERT INTO ports (
							port, description, author,
							ssh_tunnel_id, ssh_tunnel_name, ssh_remote_host, ssh_remote_port,
							ssh_local_bind_address, ssh_user, ssh_host, ssh_port, ssh_status
						)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
						ON CONFLICT(port) DO UPDATE SET
							description = excluded.description,
							author = excluded.author,
							ssh_tunnel_id = excluded.ssh_tunnel_id,
							ssh_tunnel_name = excluded.ssh_tunnel_name,
							ssh_remote_host = excluded.ssh_remote_host,
							ssh_remote_port = excluded.ssh_remote_port,
							ssh_local_bind_address = excluded.ssh_local_bind_address,
							ssh_user = excluded.ssh_user,
							ssh_host = excluded.ssh_host,
							ssh_port = excluded.ssh_port,
							ssh_status = excluded.ssh_status
					`);

					const transaction = db.transaction((items: any[]) => {
						for (const item of items) {
							const description = `SSH Tunnel: ${item.name}`;
							insertStmt.run(
								item.local_port,
								description,
								item.author,
								item.id,
								item.name,
								item.remote_host,
								item.remote_port,
								item.local_bind_address,
								item.ssh_user,
								item.ssh_host,
								item.ssh_port,
								item.status
							);
						}
					});

					transaction(oldSSHTunnels);
					console.log(`[Migration] Migrated ${oldSSHTunnels.length} entries from ssh_tunnels table`);
				}

				// 기존 테이블 삭제
				db.prepare('DROP TABLE IF EXISTS ssh_tunnels').run();
				console.log('[Migration] Dropped old ssh_tunnels table');
				migrated = true;
			}
		}
	} catch (error) {
		console.error('[Migration] Failed to migrate from old tables:', error);
	}

	if (migrated) {
		console.log('[Migration] Migration completed successfully!');
		console.log('[Migration] All data is now in the unified ports table');
	} else {
		console.log('[Migration] No migration needed');
	}
}
