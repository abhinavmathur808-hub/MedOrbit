import redisClient from '../config/redis.js';

// Deletes every cached page of the doctors list (keys look like
// doctorsList:page:1:limit:10). Call after any change that affects the list:
// profile/fee updates or a doctor getting verified. Best-effort — the cache
// also expires on its own TTL, so failures here are logged, never thrown.
export const invalidateDoctorsListCache = async () => {
    if (!redisClient.isReady) return;

    try {
        for await (const batch of redisClient.scanIterator({ MATCH: 'doctorsList:*', COUNT: 100 })) {
            // node-redis v5 yields arrays of keys per iteration; guard for
            // single-key yields to stay compatible across versions
            const keys = Array.isArray(batch) ? batch : [batch];
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    } catch (err) {
        console.error('Doctors cache invalidation error:', err.message);
    }
};
