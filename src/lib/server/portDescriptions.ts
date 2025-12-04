import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { PortDescription } from '$lib/types';

const DATA_DIR = join(process.cwd(), 'data');
const DESCRIPTIONS_FILE = join(DATA_DIR, 'port-descriptions.json');

async function ensureDataDir() {
	if (!existsSync(DATA_DIR)) {
		await mkdir(DATA_DIR, { recursive: true });
	}
}

async function readDescriptions(): Promise<Map<number, PortDescription>> {
	try {
		await ensureDataDir();
		if (!existsSync(DESCRIPTIONS_FILE)) {
			return new Map();
		}
		const data = await readFile(DESCRIPTIONS_FILE, 'utf-8');
		const descriptions: PortDescription[] = JSON.parse(data);
		return new Map(descriptions.map(d => [d.port, d]));
	} catch (error) {
		console.error('Error reading port descriptions:', error);
		return new Map();
	}
}

async function writeDescriptions(descriptions: Map<number, PortDescription>) {
	try {
		await ensureDataDir();
		const data = Array.from(descriptions.values());
		await writeFile(DESCRIPTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
	} catch (error) {
		console.error('Error writing port descriptions:', error);
		throw error;
	}
}

export async function getPortDescription(port: number): Promise<PortDescription | undefined> {
	const descriptions = await readDescriptions();
	return descriptions.get(port);
}

export async function getAllPortDescriptions(): Promise<PortDescription[]> {
	const descriptions = await readDescriptions();
	return Array.from(descriptions.values());
}

export async function setPortDescription(port: number, description: string, url?: string): Promise<void> {
	const descriptions = await readDescriptions();
	descriptions.set(port, { port, description, url });
	await writeDescriptions(descriptions);
}

export async function deletePortDescription(port: number): Promise<void> {
	const descriptions = await readDescriptions();
	descriptions.delete(port);
	await writeDescriptions(descriptions);
}
