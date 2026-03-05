<p align="center">
  <img src="./client/public/favicon.png" alt="MedOrbit Logo" width="80" />
</p>

<h1 align="center">MedOrbit</h1>

<p align="center">
  A full-stack medical appointment platform with role-based access, secure payments, AI-assisted health guidance, and real-time video consultations.
</p>

---

## Key Features

- **Role-Based Access Control** — Separate dashboards and permissions for Patients, Doctors, and Admins
- **Appointment Booking** — Browse doctors by specialty, view availability, and book appointments with ease
- **Secure Payments** — Razorpay integration for consultation fee payments with order verification
- **Video Consultations** — 35-minute in-browser video calls powered by ZegoCloud UIKit
- **AI Health Assistant** — Google Gemini–powered chatbot for preliminary health guidance
- **OAuth Login** — Sign in with Google or GitHub alongside traditional email/password auth
- **Automated Emails** — Appointment confirmations, OTP verification, and payment receipts via Nodemailer
- **Doctor Profiles** — Detailed profiles with specialization, experience, fees, and profile images (Cloudinary)
- **Admin Panel** — User management and global link oversight with admin-only routes
- **Health Articles** — Doctors can publish and patients can browse medical articles
- **Security Hardened** — Helmet, CORS, rate limiting, JWT authentication, and bcrypt password hashing

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Redux Toolkit (RTK Query) | State management & API caching |
| React Router 7 | Client-side routing |
| ZegoCloud UIKit | Video consultation rooms |
| Lucide React / React Icons | Iconography |
| React Markdown | Rendering markdown content |
| Axios | HTTP client |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | Web framework |
| MongoDB / Mongoose 9 | Database & ODM |
| Razorpay SDK | Payment gateway |
| Google Generative AI | AI health assistant (Gemini) |
| Passport.js | OAuth (Google, GitHub) |
| Nodemailer | Transactional emails |
| Cloudinary | Image hosting |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Helmet | Security headers |
| express-rate-limit | API rate limiting |
| Multer | File uploads |

---

## Environment Variables

Create a `.env` file in **each** directory with the variables listed below. **Never commit these files to Git.**

### `server/.env`

```env
PORT=5000
MONGO_URI=
JWT_SECRET=

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

# Email (Nodemailer)
PAYMENT_EMAIL_USER=
PAYMENT_EMAIL_PASS=

# Google Gemini AI
GEMINI_API_KEY=

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### `client/.env.local`

```env
VITE_API_URL=http://localhost:5000
VITE_ZEGO_APP_ID=
VITE_ZEGO_SERVER_SECRET=
```

---

## Local Setup & Installation

### Prerequisites

- **Node.js** v18+ and **npm**
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Razorpay** test/live API keys
- **ZegoCloud** app credentials
- *(Optional)* Google & GitHub OAuth app credentials

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/MedOrbit.git
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

## Project Structure

```
MedOrbit/
├── client/                 # React frontend (Vite)
│   ├── public/             # Static assets & favicon
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── config/         # API configuration
│       ├── pages/          # Route-level page components
│       │   ├── Appointment/
│       │   ├── Doctor/
│       │   ├── Patient/
│       │   ├── Room/       # Video consultation
│       │   └── Admin/
│       └── redux/          # Store, slices, & API queries
│
├── server/                 # Express backend
│   ├── config/             # Database connection
│   ├── controllers/        # Route handlers
│   ├── middlewares/         # Auth, RBAC, rate-limiting
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── scripts/            # Seed scripts
│   └── utils/              # Email & helper utilities
│
└── README.md
```

---

## License

This project is for educational and portfolio purposes.
