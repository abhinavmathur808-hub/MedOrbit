export const optimizeCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const marker = '/image/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const insertPos = idx + marker.length;
    if (url.includes('f_auto') || url.includes('q_auto')) return url;
    return url.slice(0, insertPos) + 'f_auto,q_auto/' + url.slice(insertPos);
};
