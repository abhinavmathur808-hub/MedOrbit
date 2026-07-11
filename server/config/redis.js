import { createClient } from 'redis';

// Redis is an optional read cache, never a boot dependency. Connection is
// attempted in the background; if it fails, callers fall back to database
// queries (guard call sites with redisClient.isReady).
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        // Bounded backoff: give up after 10 attempts instead of retrying
        // (and logging errors) forever when Redis is permanently unreachable.
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis unreachable after 10 attempts — running without cache');
                return false;
            }
            return Math.min(retries * 500, 3000);
        },
    },
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});

redisClient.on('ready', () => {
    console.log('Redis connected successfully');
});

// Deliberately NOT awaited at top level: a failed or slow connection must not
// crash or block server startup.
redisClient.connect().catch((err) => {
    console.error('Redis connection failed, falling back to database queries:', err.message);
});

export default redisClient;
