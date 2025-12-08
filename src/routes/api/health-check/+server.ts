import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const port = url.searchParams.get('port');
    
    try {
        const response = await fetch(`http://localhost:${port}/health`, {
            signal: AbortSignal.timeout(5000)
        });
        
        return json({
            healthy: response.ok,
            status: response.status,
            message: response.ok ? 'OK' : `${response.status} ${response.statusText}`
        });
    } catch (error) {
        return json({
            healthy: false,
            message: error instanceof Error ? error.message : 'Connection failed'
        });
    }
}