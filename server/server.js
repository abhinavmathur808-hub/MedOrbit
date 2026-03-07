import './config/env.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import User from './models/User.js';

import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import articleRoutes from './routes/articleRoute.js';
import oauthRoutes from './routes/oauthRoutes.js';

const findOrCreateUser = async (profile, provider) => {
    const idField = provider === 'google' ? 'googleId' : 'githubId';
    const providerId = profile.id;

    let user = await User.findOne({ [idField]: providerId });
    if (user) return user;

    const email =
        profile.emails && profile.emails.length > 0
            ? profile.emails[0].value.toLowerCase()
            : null;

    if (email) {
        user = await User.findOne({ email });
        if (user) {
            user[idField] = providerId;
            if (!user.photo && profile.photos?.[0]?.value) {
                user.photo = profile.photos[0].value;
            }
            await user.save();
            return user;
        }
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    const name =
        profile.displayName ||
        `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
        'User';

    user = await User.create({
        name,
        email: email || `${provider}_${providerId}@oauth.local`,
        password: hashedPassword,
        role: 'patient',
        [idField]: providerId,
        photo: profile.photos?.[0]?.value || '',
    });

    return user;
};

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
            scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await findOrCreateUser(profile, 'google');
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

if (process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_ID.startsWith('your-')) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback',
                scope: ['user:email'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const user = await findOrCreateUser(profile, 'github');
                    done(null, user);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );
}


passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

connectDB();

const app = express();

// Trust the reverse proxy (Render) so rate limiting works correctly
app.set('trust proxy', 1);

app.use(helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

app.use(globalLimiter);

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
];
app.use(
    cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    })
);

app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 60000 },
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/articles', articleRoutes);

app.use('/auth', oauthRoutes);

app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
});
