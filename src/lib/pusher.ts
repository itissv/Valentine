import PusherServer from 'pusher';
import Pusher from 'pusher-js';

const requiredEnvVars = [
    'PUSHER_APP_ID',
    'NEXT_PUBLIC_PUSHER_APP_KEY',
    'PUSHER_SECRET',
    'NEXT_PUBLIC_PUSHER_CLUSTER'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.warn(`⚠️ Warning: Missing Pusher environment variables: ${missingVars.join(', ')}. Real-time features will be disabled.`);
}

export const pusherServer = missingVars.length === 0 ? new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
}) : null;

// @ts-ignore - Pusher constructor type mismatch in NodeNext
export const pusherClient = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_APP_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
    ? new Pusher(
        process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
        {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            authEndpoint: '/api/pusher/auth',
        }
    ) : null;
