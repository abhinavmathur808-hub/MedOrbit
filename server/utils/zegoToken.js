import crypto from 'crypto';

// Server-side implementation of ZegoCloud's Token04 algorithm. This is the
// exact token format that ZegoUIKitPrebuilt.create() consumes, and it keeps the
// Zego ServerSecret on the backend — the secret must never ship in the client
// bundle. ZegoCloud distributes this only as source (no npm package), so it is
// reproduced here against the built-in crypto module (zero extra dependencies).

const getAlgorithm = (keyBuffer) => {
    switch (keyBuffer.length) {
        case 16: return 'aes-128-cbc';
        case 24: return 'aes-192-cbc';
        case 32: return 'aes-256-cbc';
        default:
            throw new Error(`Invalid Zego secret length: ${keyBuffer.length} (expected 16, 24, or 32 bytes)`);
    }
};

const aesEncrypt = (plainText, keyBuffer, ivBuffer) => {
    const cipher = crypto.createCipheriv(getAlgorithm(keyBuffer), keyBuffer, ivBuffer);
    cipher.setAutoPadding(true);
    return Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
};

// 16-byte IV drawn from the alphanumeric set (matches Zego's reference impl)
const makeRandomIv = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let iv = '';
    for (let i = 0; i < 16; i++) {
        iv += chars[Math.floor(Math.random() * chars.length)];
    }
    return iv;
};

// Random signed 32-bit integer nonce
const makeNonce = () =>
    Math.floor(Math.random() * (2147483647 - (-2147483648) + 1)) + (-2147483648);

export const generateToken04 = (appId, userId, secret, effectiveTimeInSeconds, payload = '') => {
    if (!appId || typeof appId !== 'number') {
        throw new Error('appId must be a number');
    }
    if (!userId || typeof userId !== 'string') {
        throw new Error('userId must be a non-empty string');
    }
    if (!secret || typeof secret !== 'string' || ![16, 24, 32].includes(Buffer.from(secret).length)) {
        throw new Error('secret must be a 16, 24, or 32 byte string');
    }
    if (!(effectiveTimeInSeconds > 0)) {
        throw new Error('effectiveTimeInSeconds must be a positive number');
    }

    const createTime = Math.floor(Date.now() / 1000);
    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce: makeNonce(),
        ctime: createTime,
        expire: createTime + effectiveTimeInSeconds,
        payload: payload || '',
    };

    const plainText = JSON.stringify(tokenInfo);
    const iv = makeRandomIv();
    const ivBuffer = Buffer.from(iv);
    const keyBuffer = Buffer.from(secret);
    const encryptBuf = aesEncrypt(plainText, keyBuffer, ivBuffer);

    // Binary packing: expire(8B, BE) | ivLen(2B, BE) | iv | encLen(2B, BE) | encrypted
    const expireBuf = Buffer.alloc(8);
    expireBuf.writeBigInt64BE(BigInt(tokenInfo.expire), 0);

    const ivLenBuf = Buffer.alloc(2);
    ivLenBuf.writeUInt16BE(ivBuffer.length, 0);

    const encLenBuf = Buffer.alloc(2);
    encLenBuf.writeUInt16BE(encryptBuf.length, 0);

    const packed = Buffer.concat([expireBuf, ivLenBuf, ivBuffer, encLenBuf, encryptBuf]);

    // '04' version prefix + base64 of the packed payload
    return '04' + packed.toString('base64');
};
