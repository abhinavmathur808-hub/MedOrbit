import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const router = express.Router();

const handleOAuthCallback = (req, res) => {
    const user = req.user;
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    const userPayload = encodeURIComponent(
        JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo || '',
        })
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // The page the user came from is carried round-trip through the OAuth `state`
    // param and echoed back here as req.query.state. Only forward internal paths
    // (never an absolute or protocol-relative URL) so this can't become an open
    // redirect; the frontend callback re-validates before navigating.
    const state = req.query.state;
    const redirectParam = (typeof state === 'string' && state.startsWith('/') && !state.startsWith('//'))
        ? `&redirect=${encodeURIComponent(state)}`
        : '';

    res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${userPayload}${redirectParam}`);
};

router.get('/google', (req, res, next) => {
    // Carry the return path as OAuth `state`; the provider echoes it back to the
    // callback, where handleOAuthCallback forwards it to the frontend.
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: req.query.redirect || undefined,
    })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed`,
    }),
    handleOAuthCallback
);

// GitHub routes are only registered when the strategy is configured
// (same guard as the strategy registration in server.js)
if (process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_ID.startsWith('your-')) {
    router.get('/github', (req, res, next) => {
        passport.authenticate('github', {
            scope: ['user:email'],
            state: req.query.redirect || undefined,
        })(req, res, next);
    });

    router.get('/github/callback',
        passport.authenticate('github', {
            failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=github_failed`,
        }),
        handleOAuthCallback
    );
}

export default router;
