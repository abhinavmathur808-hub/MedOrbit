// One-off: overhaul the seeded demo doctors into production-quality mock data —
// premium avatars (User.photo) plus specialty-specific degrees, correlated
// experience/fees, and professional bios (Doctor.qualifications/experience/
// fees/about).
//
// SAFETY
//   • server/.env MONGO_URI points at the PRODUCTION Atlas cluster, so a commit
//     changes the live site. This script is a DRY RUN unless you pass --commit.
//   • Scoped to the seeded demo accounts (doctorN@healthconnect.com) via
//     SEED_FILTER, so real doctor signups are never touched.
//   • Every run backs up the current User.photo AND Doctor fields to a
//     timestamped JSON first, so the change is fully reversible
//     (roll back with --restore <backup.json>).
//   • Field names verified against the schema: the portrait is User.photo (there
//     is no Doctor.image); "degrees" is Doctor.qualifications ([String]); the
//     bio is Doctor.about (added to the schema for this overhaul).
//
//   node scripts/updateDoctorPhotos.js                    # dry run: backup + plan only
//   node scripts/updateDoctorPhotos.js --commit           # apply the update
//   node scripts/updateDoctorPhotos.js --restore <file>   # roll back from a backup

import '../config/env.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes('--commit');
const RESTORE_IDX = process.argv.indexOf('--restore');
const RESTORE_FILE = RESTORE_IDX !== -1 ? process.argv[RESTORE_IDX + 1] : null;

// Only the seeded demo doctors — never real signups.
const SEED_FILTER = { role: 'doctor', email: { $regex: /^doctor\d+@healthconnect\.com$/ } };

// Custom prioritized portrait URLs from the brief, each DOWNLOADED AND VISUALLY
// VERIFIED (contact sheets) to be an adult medical professional of the right
// gender. One brief entry was dropped: a Pixabay /images/download/ link that
// returns HTML, not an image. Bare Pexels links serve 2–4 MB originals, so they
// get CDN sizing params appended (same photo, ~20 KB delivery) — sane for a 96px
// avatar; Unsplash links already carry width params and pass through untouched.
const sizePexels = (url) =>
    url.includes('images.pexels.com')
        ? `${url}?auto=compress&cs=tinysrgb&fit=crop&w=600&h=600`
        : url;

const MALE_URLS = [
    'https://images.pexels.com/photos/32115962/pexels-photo-32115962.jpeg',
    'https://images.pexels.com/photos/15962798/pexels-photo-15962798.jpeg',
    'https://images.pexels.com/photos/5452292/pexels-photo-5452292.jpeg',
    'https://images.pexels.com/photos/7966285/pexels-photo-7966285.jpeg',
    'https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg',
    'https://images.pexels.com/photos/6129500/pexels-photo-6129500.jpeg',
    'https://images.pexels.com/photos/4270371/pexels-photo-4270371.jpeg',
    'https://images.pexels.com/photos/5867737/pexels-photo-5867737.jpeg',
    'https://images.pexels.com/photos/6762869/pexels-photo-6762869.jpeg',
    'https://images.pexels.com/photos/5888160/pexels-photo-5888160.jpeg',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=764&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1712215544003-af10130f8eb3?q=80&w=687&auto=format&fit=crop',
    'https://plus.unsplash.com/premium_photo-1723514536306-26fe5c4adeb7?q=80&w=687&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1645066928295-2506defde470?q=80&w=679&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?q=80&w=687&auto=format&fit=crop',
    'https://plus.unsplash.com/premium_photo-1661492071612-98d26885614a?q=80&w=1170&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1700041785712-649e859d9909?q=80&w=1170&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1758691463582-11aea602cd4a?q=80&w=1332&auto=format&fit=crop',
    'https://images.pexels.com/photos/8460094/pexels-photo-8460094.jpeg',
    'https://images.pexels.com/photos/6129573/pexels-photo-6129573.jpeg',
    'https://images.pexels.com/photos/6303777/pexels-photo-6303777.jpeg',
    'https://images.pexels.com/photos/28755708/pexels-photo-28755708.jpeg',
    'https://images.pexels.com/photos/17686803/pexels-photo-17686803.jpeg',
    'https://images.pexels.com/photos/37407192/pexels-photo-37407192.jpeg',
    'https://images.pexels.com/photos/6010869/pexels-photo-6010869.jpeg',
    'https://images.pexels.com/photos/19438561/pexels-photo-19438561.jpeg',
    'https://images.pexels.com/photos/5722163/pexels-photo-5722163.jpeg',
    'https://images.pexels.com/photos/17221170/pexels-photo-17221170.jpeg',
    'https://images.pexels.com/photos/5888144/pexels-photo-5888144.jpeg',
    'https://images.unsplash.com/photo-1758691461530-b215ed4ede6a?q=80&w=1332&auto=format&fit=crop',
].map(sizePexels);

// Pixabay entry (diana73-dentist-1191671) removed — it 404s to an HTML page.
const FEMALE_URLS = [
    'https://images.pexels.com/photos/6749765/pexels-photo-6749765.jpeg',
    'https://images.pexels.com/photos/5407222/pexels-photo-5407222.jpeg',
    'https://images.pexels.com/photos/32254667/pexels-photo-32254667.jpeg',
    'https://images.pexels.com/photos/5407243/pexels-photo-5407243.jpeg',
    'https://images.pexels.com/photos/5215009/pexels-photo-5215009.jpeg',
    'https://plus.unsplash.com/premium_photo-1661580574627-9211124e5c3f?q=80&w=687&auto=format&fit=crop',
    'https://plus.unsplash.com/premium_photo-1702598520071-60c9b9fd0d49?q=80&w=688&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1659353888906-adb3e0041693?q=80&w=1170&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?q=80&w=687&auto=format&fit=crop',
    'https://plus.unsplash.com/premium_photo-1661422067312-e54baf69b82b?q=80&w=1170&auto=format&fit=crop',
    'https://images.pexels.com/photos/5998465/pexels-photo-5998465.jpeg',
    'https://images.pexels.com/photos/37406588/pexels-photo-37406588.jpeg',
    'https://images.pexels.com/photos/5327582/pexels-photo-5327582.jpeg',
    'https://images.pexels.com/photos/15962796/pexels-photo-15962796.jpeg',
].map(sizePexels);

// randomuser.me fallback once a gender's custom set is exhausted — gender-matched
// and a unique index per doctor, so remaining placeholders never repeat.
const fallbackUrl = (gender, idx) =>
    `https://randomuser.me/api/portraits/${gender === 'female' ? 'women' : 'men'}/${idx}.jpg`;

// First-name gender heuristic — FALLBACK only; User.gender is primary.
const MALE_NAMES = new Set(['Aarav', 'Rahul', 'Vikram', 'Arjun', 'Rohan', 'Aditya', 'Karthik', 'Suresh', 'Manoj', 'Ankit', 'Sanjay', 'Rakesh', 'Deepak', 'Nikhil', 'Amit', 'Vivek', 'Harsh', 'Gaurav', 'Ashish', 'Rajesh', 'Pranav', 'Siddharth', 'Abhishek', 'Varun', 'Mohit']);
const FEMALE_NAMES = new Set(['Priya', 'Sneha', 'Ananya', 'Kavya', 'Meera', 'Pooja', 'Shruti', 'Neha', 'Divya', 'Ritika', 'Swati', 'Nisha', 'Tanvi', 'Aishwarya', 'Pallavi', 'Rashmi', 'Sonali', 'Deepika', 'Anjali', 'Vandana', 'Kriti', 'Bhavna', 'Shalini', 'Aditi', 'Rekha']);
const firstNameOf = (name) => (name || '').replace(/^dr\.?\s*/i, '').trim().split(/\s+/)[0] || '';
const genderOf = (user) => {
    const g = (user.gender || '').toLowerCase();
    if (g === 'male' || g === 'female') return g;
    const fn = firstNameOf(user.name);
    if (MALE_NAMES.has(fn)) return 'male';
    if (FEMALE_NAMES.has(fn)) return 'female';
    return 'unknown';
};

// Per-specialty realistic data. `tier` drives the fee band; `focus` seeds the
// bio. qualifications are stored as an array ([String]) per the schema.
const SPECIALTY_DATA = {
    Cardiologist:        { tier: 'high', qualifications: ['MBBS', 'MD - General Medicine', 'DM - Cardiology'],        focus: 'the diagnosis and management of complex cardiovascular and heart-rhythm disorders' },
    Neurologist:         { tier: 'high', qualifications: ['MBBS', 'MD - General Medicine', 'DM - Neurology'],         focus: 'treating disorders of the brain, spine, and nervous system' },
    Gastroenterologist:  { tier: 'high', qualifications: ['MBBS', 'MD - General Medicine', 'DM - Gastroenterology'],  focus: 'diagnosing and treating digestive, liver, and pancreatic conditions' },
    Orthopedic:          { tier: 'mid',  qualifications: ['MBBS', 'MS - Orthopaedics', 'FRCS'],                       focus: 'joint replacement, sports injuries, and complex trauma surgery' },
    Gynecologist:        { tier: 'mid',  qualifications: ['MBBS', 'MS - Obstetrics & Gynaecology'],                   focus: "women's health, high-risk pregnancy, and minimally invasive gynaecological surgery" },
    ENT:                 { tier: 'mid',  qualifications: ['MBBS', 'MS - ENT'],                                        focus: 'disorders of the ear, nose, and throat' },
    'ENT Specialist':    { tier: 'mid',  qualifications: ['MBBS', 'MS - ENT'],                                        focus: 'disorders of the ear, nose, and throat' },
    Dermatologist:       { tier: 'mid',  qualifications: ['MBBS', 'MD - Dermatology'],                               focus: 'medical and cosmetic dermatology and skin health' },
    Pediatrician:        { tier: 'mid',  qualifications: ['MBBS', 'MD - Paediatrics'],                               focus: 'newborn, child, and adolescent health' },
    Psychiatrist:        { tier: 'mid',  qualifications: ['MBBS', 'MD - Psychiatry'],                                focus: 'mood, anxiety, and behavioural health across all ages' },
    'General Physician': { tier: 'low',  qualifications: ['MBBS', 'MD - Internal Medicine'],                         focus: 'preventive care and the management of common and chronic conditions' },
};
const FALLBACK = SPECIALTY_DATA['General Physician'];

// Fees tie to specialty tier AND seniority; values land on the ₹800 / ₹1500 /
// ₹2500 kind of ladder the brief calls for.
const FEE_TABLE = {
    low:  [500, 700, 800],
    mid:  [800, 1200, 1500],
    high: [1500, 2000, 2500],
};
const TIER_EXP = {
    low:  { base: 3,  spread: 20 },
    mid:  { base: 6,  spread: 22 },
    high: { base: 10, spread: 20 },
};
const seniority = (exp) => (exp >= 20 ? 2 : exp >= 12 ? 1 : 0);
// Deterministic per doctor (seeded by the number in doctorN@…) so a re-run is stable.
const expFor = (tier, n) => {
    const t = TIER_EXP[tier] || TIER_EXP.low;
    return t.base + ((n * 7 + 3) % t.spread);
};

const BIO_CLOSERS = [
    'Known for a patient-first approach, they pair advanced diagnostics with clear, compassionate communication at every visit.',
    'Committed to evidence-based care, they have helped thousands of patients achieve lasting, meaningful outcomes.',
    'Their practice blends the latest clinical techniques with a warm, reassuring bedside manner trusted by patients and peers alike.',
];
const makeBio = (name, specialty, exp, focus, n) => {
    const displayName = /^dr/i.test(name) ? name : `Dr. ${name}`;
    const seniorityWord = exp >= 20 ? 'highly experienced' : exp >= 12 ? 'renowned' : 'dedicated';
    return `${displayName} is a ${seniorityWord} ${specialty} with over ${exp} years of clinical expertise in ${focus}. ${BIO_CLOSERS[n % BIO_CLOSERS.length]}`;
};

const connect = () =>
    mongoose.connect(process.env.MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false });

// The doctors-list endpoint caches pages in Redis; writing straight to Mongo
// bypasses the API's own invalidation, so bust it or the UI serves stale pages.
const bustCache = async () => {
    try {
        const redisClient = (await import('../config/redis.js')).default;
        const { invalidateDoctorsListCache } = await import('../utils/doctorsCache.js');
        if (!redisClient.isReady) {
            await new Promise((r) => { redisClient.once('ready', r); setTimeout(r, 4000); });
        }
        await invalidateDoctorsListCache();
        await redisClient.quit().catch(() => {});
        console.log('Doctors-list cache invalidated.');
    } catch (e) {
        console.warn('Cache invalidation skipped:', e.message);
    }
};

const buildPlan = async () => {
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const users = await User.find(SEED_FILTER).select('_id name email gender photo').sort({ email: 1 }).lean();
    const doctors = await Doctor.find({ userId: { $in: users.map((u) => u._id) } })
        .select('_id userId specialization qualifications experience fees about')
        .lean();
    const doctorByUser = Object.fromEntries(doctors.map((d) => [String(d.userId), d]));

    // Sequential, strictly gender-matched assignment; overflow → randomuser,
    // with a unique index per gender so nothing repeats.
    let mSeq = 0, fSeq = 0, mFall = 1, fFall = 1;
    const assignPhoto = (u) => {
        if (genderOf(u) === 'female') {
            return fSeq < FEMALE_URLS.length ? FEMALE_URLS[fSeq++] : fallbackUrl('female', fFall++);
        }
        return mSeq < MALE_URLS.length ? MALE_URLS[mSeq++] : fallbackUrl('male', mFall++);
    };

    const plan = users.map((u) => {
        const doc = doctorByUser[String(u._id)];
        const spec = doc?.specialization || 'General Physician';
        const cfg = SPECIALTY_DATA[spec] || FALLBACK;
        const n = parseInt(u.email.match(/\d+/)?.[0] || '0', 10);
        const experience = expFor(cfg.tier, n);
        const fees = FEE_TABLE[cfg.tier][seniority(experience)];
        return {
            userId: String(u._id),
            email: u.email,
            name: u.name,
            specialization: spec,
            gender: genderOf(u),
            doctorId: doc ? String(doc._id) : null,
            before: {
                photo: u.photo,
                qualifications: doc?.qualifications,
                experience: doc?.experience,
                fees: doc?.fees,
                about: doc?.about,
            },
            after: {
                photo: assignPhoto(u),
                qualifications: cfg.qualifications,
                experience,
                fees,
                about: makeBio(u.name, spec, experience, cfg.focus, n),
            },
        };
    });

    return { totalDoctors, plan };
};

const restore = async () => {
    const backup = JSON.parse(fs.readFileSync(path.resolve(RESTORE_FILE), 'utf8'));
    console.log(`Restoring ${backup.length} doctors from ${RESTORE_FILE}…`);
    const userOps = backup.map((b) => ({
        updateOne: { filter: { _id: b.userId }, update: { $set: { photo: b.before.photo ?? '' } } },
    }));
    const docOps = backup.filter((b) => b.doctorId).map((b) => ({
        updateOne: {
            filter: { _id: b.doctorId },
            update: { $set: {
                qualifications: b.before.qualifications ?? [],
                experience: b.before.experience ?? 0,
                fees: b.before.fees ?? 0,
                about: b.before.about ?? '',
            } },
        },
    }));
    const u = await User.bulkWrite(userOps);
    const d = docOps.length ? await Doctor.bulkWrite(docOps) : { modifiedCount: 0 };
    console.log(`Restored. Users: ${u.modifiedCount}, Doctors: ${d.modifiedCount}.`);
    await bustCache();
};

const run = async () => {
    await connect();

    if (RESTORE_FILE) {
        await restore();
        await mongoose.disconnect();
        return;
    }

    const { totalDoctors, plan } = await buildPlan();
    console.log(`Doctors (role:doctor) total: ${totalDoctors}`);
    console.log(`Seeded demo doctors matched : ${plan.length}  (real signups left untouched: ${totalDoctors - plan.length})`);

    // Back up current values before any change.
    const backup = plan.map((p) => ({ userId: p.userId, email: p.email, doctorId: p.doctorId, before: p.before }));
    const backupPath = path.resolve(__dirname, `doctor-data-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`Backup written: ${backupPath}`);

    // Gender + assignment summary.
    const genderCounts = plan.reduce((m, p) => ((m[p.gender] = (m[p.gender] || 0) + 1), m), {});
    const fallbackCount = plan.filter((p) => p.after.photo.includes('randomuser')).length;
    const uniquePhotos = new Set(plan.map((p) => p.after.photo)).size;
    console.log('\nGender distribution:', genderCounts);
    console.log(`Custom portraits: ${plan.length - fallbackCount} · randomuser fallback: ${fallbackCount} · unique photos: ${uniquePhotos}/${plan.length}`);

    // Show one example per specialty so the plan is easy to eyeball.
    const seen = new Set();
    console.log('\nSample plan (one per specialty):');
    for (const p of plan) {
        if (seen.has(p.specialization)) continue;
        seen.add(p.specialization);
        console.log(`\n  ${p.name} — ${p.specialization}`);
        console.log(`     photo : ${p.after.photo}`);
        console.log(`     degree: ${p.after.qualifications.join(', ')}`);
        console.log(`     exp   : ${p.before.experience} → ${p.after.experience} yrs      fees: ₹${p.before.fees} → ₹${p.after.fees}`);
        console.log(`     about : ${p.after.about}`);
    }

    if (!COMMIT) {
        console.log(`\nDRY RUN — no database writes performed. Re-run with --commit to apply to ${plan.length} doctors.`);
        await mongoose.disconnect();
        return;
    }

    const userOps = plan.map((p) => ({
        updateOne: { filter: { _id: p.userId }, update: { $set: { photo: p.after.photo } } },
    }));
    const docOps = plan.filter((p) => p.doctorId).map((p) => ({
        updateOne: {
            filter: { _id: p.doctorId },
            update: { $set: {
                qualifications: p.after.qualifications,
                experience: p.after.experience,
                fees: p.after.fees,
                about: p.after.about,
            } },
        },
    }));

    const u = await User.bulkWrite(userOps);
    const d = await Doctor.bulkWrite(docOps);
    console.log(`\nCOMMIT complete. Users (photo): ${u.modifiedCount}, Doctors (data): ${d.modifiedCount}.`);
    await bustCache();
    await mongoose.disconnect();
};

run().catch(async (e) => {
    console.error('Failed:', e.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
