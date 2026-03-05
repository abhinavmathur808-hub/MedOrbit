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
    res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${userPayload}`);
};

router.get('/google', (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed`,
    }),
    handleOAuthCallback
);

export default router;
