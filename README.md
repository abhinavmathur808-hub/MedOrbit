<p align="center">
  <img src="./client/public/favicon.png" alt="MedOrbit Logo" width="80" />
</p>

<h1 align="center">MedOrbit</h1>

<p align="center">
  <a href="https://medorbit.live" target="_blank">Live Demo</a>
</p>

<p align="center">
  A full-stack medical appointment platform with role-based access, secure payments, on-device and cloud AI assistance, and in-browser video consultations.
</p>

---

## Key Features

- **Role-Based Access Control** — Separate dashboards and permissions for Patients, Doctors, and Admins
- **Appointment Booking** — Browse doctors by specialty with faceted search, view availability, and book a slot; unpaid bookings hold the slot for 15 minutes before it is released
- **Secure Payments** — Razorpay checkout with server-side HMAC signature verification; the key secret never reaches the client
- **Video Consultations** — In-browser video calls via ZegoCloud UIKit, gated by server-minted tokens (1-hour validity) that are only issued to verified participants of the appointment
- **Three-Tier AI Assistant** — On-device symptom triage runs first (private, instant), falling back to Google Gemini for natural-language guidance, then to a server-side keyword matcher if Gemini is unavailable
- **AI Medical Scribe** — Doctor-only SOAP note generation from consultation transcripts, with drafts cached in Redis
- **AI Article Summaries** — Gemini-generated summaries for published health articles, with a graceful fallback when no API key is configured
- **Digital Prescriptions** — Doctors issue prescriptions against an appointment; patients view and print them from their appointment history
- **Reviews & Ratings** — Patients rate and review doctors after a consultation; ratings surface on doctor cards and profiles
- **Appointment Lifecycle Automation** — A background sweeper releases expired unpaid holds and marks past-due paid appointments as `no-show` (production only)
- **OAuth Login** — Google and GitHub sign-in alongside email/password, preserving the user's intended destination across the redirect
- **Automated Emails** — Appointment confirmations, OTP verification, and payment receipts via Resend
- **Admin Panel** — Doctor verification queue, platform statistics, recent activity feed, and article publishing behind admin-only routes
- **Health Articles** — Admins publish curated medical articles that all users can browse
- **Security Hardened** — Helmet, strict CORS, tiered rate limiting, JWT auth, bcrypt hashing, and NoSQL operator sanitization

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite 7 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling (design tokens live in `src/index.css` under `@theme`) |
| Redux Toolkit | Auth state (slices + async thunks) |
| React Router 7 | Client-side routing |
| Framer Motion 12 | Animation & shared-layout transitions |
| Transformers.js | On-device symptom triage (WebGPU/WASM) |
| ZegoCloud UIKit | Video consultation rooms |
| Lucide React / React Icons | Iconography |
| React Markdown | Rendering markdown content |
| Axios | HTTP client for the auth thunks (pages use the native `fetch` API) |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | Web framework |
| MongoDB / Mongoose 9 | Database & ODM |
| Razorpay SDK | Payment gateway |
| Google Generative AI | Gemini health guidance, SOAP notes, article summaries |
| Passport.js | OAuth (Google, GitHub) |
| Resend | Transactional emails |
| Redis | Doctors-list and SOAP-draft caching (optional) |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Helmet | Security headers |
| express-rate-limit | Tiered API rate limiting |
| compression | Gzip response compression |

---

## Architecture Highlights

**Three-tier AI ladder.** Symptom triage runs entirely in the browser first: a quantized `all-MiniLM-L6-v2` model (~23 MB) loads via Transformers.js behind a dynamic import — WebGPU when available, WASM otherwise — and cosine-matches the symptom text against per-specialty descriptors. The text never leaves the device for this tier. Only richer natural-language requests reach Gemini, and a server-side keyword matcher backs that up.

**Appointment state machine.** Appointments move through `pending → confirmed → completed`, with `cancelled` and `no-show` as terminal states. Slot times are normalized to a canonical `hh:mm A` format on write, so booking, display, and conflict detection all compare the same representation.

**Booking holds and the sweeper.** Creating an appointment reserves the slot for 15 minutes. A background sweeper — gated to `NODE_ENV=production` so it can never mutate a developer's database — releases holds that expired unpaid and marks past-due *paid* appointments as `no-show`.

**Caching with graceful degradation.** Redis fronts the doctors list and SOAP drafts. Every cache path is wrapped so that an unreachable Redis logs a warning and falls through to MongoDB rather than failing the request; the app boots and runs correctly with `REDIS_URL` unset.

---

## Environment Variables

Create a `.env` file in **each** directory with the variables listed below. **Never commit these files to Git.**

### `server/.env`

```env
PORT=5000
MONGO_URI=
JWT_SECRET=

# Set to "production" in deployment. Also arms the appointment sweeper.
NODE_ENV=development

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

# Email (Resend)
RESEND_API_KEY=

# Google Gemini AI
GEMINI_API_KEY=
# Optional: override the model (defaults to gemini-2.5-flash)
# GEMINI_MODEL=

# Redis cache (optional — the app falls back to database queries without it)
REDIS_URL=

# ZegoCloud video (tokens are minted server-side; keep the secret OFF the client)
ZEGO_APP_ID=
ZEGO_SERVER_SECRET=

# Frontend URL — also the CORS allowlist origin
CLIENT_URL=http://localhost:5173
```

### `client/.env.local`

```env
VITE_API_URL=http://localhost:5000
```

> The client needs no ZegoCloud credentials. Video tokens are minted server-side and fetched per appointment, so the app ID and server secret stay off the frontend entirely.

---

## Local Setup & Installation

### Prerequisites

- **Node.js 20.19+** (or 22.12+) and **npm** — required by Vite 7, Mongoose 9, and React Router 7
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Razorpay** test/live API keys
- **ZegoCloud** app credentials
- *(Optional)* Google & GitHub OAuth app credentials, and a Redis instance

### 1. Clone the repository

```bash
git clone https://github.com/abhinavmathur808-hub/MedOrbit.git
cd MedOrbit
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create `server/.env` with the variables listed above, then:

```bash
npm run dev
```

The server starts on **http://localhost:5000**.

> The `dev` script uses Windows `set` syntax. On macOS/Linux, run `npx nodemon server.js` (or `npm start`) instead.

### 3. Setup the Client

Open a **new terminal**:

```bash
cd client
npm install
```

Create a `.env.local` file in the **client** directory with the variables listed above, then:

```bash
npm run dev
```

The client starts on **http://localhost:5173**.

### 4. Seed Sample Doctor Data *(optional)*

```bash
cd server
node scripts/seedDoctors.js
```

---

## API Overview

All routes are prefixed as mounted in `server.js`. Protected routes require a `Bearer` JWT.

| Base | Endpoints |
|---|---|
| `/api/auth` | `POST /send-otp` · `POST /register` · `POST /login` · `GET /me` |
| `/api/doctor` | `GET /` · `GET /:id` · `GET /specialties` · `GET /related` · `GET /profile` · `PUT /profile` · `POST /add-review` · `POST /prescription` · `GET /prescription/:appointmentId` · `POST /cancel-appointment` |
| `/api/appointments` | `GET /` · `POST /` · `GET /doctor` · `PUT /:id` · `GET /:id/room-access` |
| `/api/users` | `GET /profile` · `PUT /update-profile` · `POST /medical-history` · `POST /cancel-appointment` |
| `/api/admin` | `GET /stats` · `GET /recent-activity` · `GET /doctors` · `GET /unverified-doctors` · `PUT /verify-doctor` |
| `/api/ai` | `POST /analyze` · `POST /soap` · `GET /soap/:appointmentId` |
| `/api/payment` | `GET /getkey` · `POST /checkout` · `POST /paymentVerification` |
| `/api/articles` | `GET /list` · `GET /:id` · `GET /:id/summary` · `POST /add` |
| `/auth` | `GET /google` · `GET /google/callback` · `GET /github` · `GET /github/callback` |

Rate limits in production: **100** requests/15 min globally, **10**/15 min on auth routes, **20**/15 min on AI routes.

---

## Project Structure

```
MedOrbit/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Static assets & favicon
│   └── src/
│       ├── assets/             # Bundled images (WebP)
│       ├── components/         # Reusable UI components
│       │   └── ui/             # Primitives: Toast, Skeleton, Avatar, StatusBadge…
│       ├── pages/              # Route-level page components
│       │   ├── Admin/
│       │   ├── Appointment/    # Booking & appointment history
│       │   ├── Doctor/         # Doctor dashboard & profile
│       │   ├── Doctors/        # Faceted doctor search
│       │   ├── Patient/
│       │   ├── Room/           # Video consultation
│       │   └── UserProfile/
│       ├── redux/              # Store & auth slice
│       └── utils/              # Triage model, Cloudinary URLs, payment handler
│
├── server/                     # Express backend
│   ├── config/                 # Env loading, MongoDB & Redis connections
│   ├── controllers/            # Route handlers
│   ├── middlewares/            # Auth, doctor RBAC, rate limiting, Mongo sanitization
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API route definitions
│   ├── scripts/                # Seed & maintenance scripts
│   └── utils/                  # Email, Zego tokens, appointment sweeper, caching
│
└── README.md
```

---

## Performance & Optimization

- **On-device inference** — The triage model is loaded through a dynamic import, keeping ~23 MB of ML runtime out of the main bundle until a user actually asks for triage.
- **Cloudinary dynamic delivery** — A URL helper injects `f_auto,q_auto` into Cloudinary image URLs, serving WebP/AVIF at browser-appropriate quality.
- **Asset compression** — Local assets ship as WebP. The brand logo was reduced from a 2.03 MB PNG to a 39.9 KB WebP (**98% smaller**) with no layout change.
- **Native lazy loading** — `loading="lazy"` and explicit dimensions on off-screen images cut initial load and prevent layout shift.
- **Render optimization** — `React.memo`, `useMemo`, and `useCallback` on list-heavy views; backdrop blur is gated behind `md:` so mobile GPUs skip it.
- **Server-side caching** — Redis fronts the doctors list and SOAP drafts, with automatic fallback to MongoDB.
- **Response compression** — Gzip via `compression` middleware.

---

## Security

- **Authentication** — JWT bearer tokens; passwords hashed with bcrypt; OTP-verified registration.
- **Authorization** — Route-level middleware for authentication, doctor-only, and admin-only access. Video room tokens are issued only after verifying the requester is a participant of that appointment.
- **NoSQL injection defense** — Controllers cast auth inputs to strings before they can reach a query, backed by a dependency-free middleware that strips `$`-prefixed and dotted keys from request bodies. (The common `express-mongo-sanitize` package is incompatible with Express 5's read-only `req.query`.)
- **CORS** — Locked to `CLIENT_URL` with credentials; localhost origins are excluded in production.
- **Rate limiting** — Tiered limits, with the strictest applied to auth and AI endpoints.
- **Secret hygiene** — The Razorpay key secret and ZegoCloud server secret are used server-side only and never reach the client bundle.

---

## License

This project is for educational and portfolio purposes.
