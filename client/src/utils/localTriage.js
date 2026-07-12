// On-device symptom triage — tier 1 of the assistant's three-tier ladder:
//   1. this module: instant, private specialty match in the browser
//   2. Gemini (/api/ai/analyze): full natural-language advice
//   3. server keyword fallback: when Gemini is unavailable
//
// A quantized all-MiniLM-L6-v2 (~23 MB) runs via Transformers.js (WebGPU when
// available, WASM otherwise). The user's symptom text is embedded locally and
// cosine-matched against symptom descriptors for each specialty MedOrbit
// offers — the text never leaves the device for this tier. The heavy library
// is loaded with a dynamic import so it stays out of the main bundle, and the
// model files are cached by the browser after the first download.

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

// Several descriptor phrases per specialty; a specialty's score is the max
// similarity across its phrases, so distinct symptom clusters each get a voice.
// Specialty names must exactly match the `specialization` values used by
// doctor profiles (see /api/doctor/related).
const SPECIALTY_DESCRIPTORS = {
    'General Physician': [
        'fever, chills, cold, cough, sore throat, flu, runny nose and body aches',
        'fatigue, weakness, general checkup, weight loss, loss of appetite',
        'vomiting, diarrhoea, stomach upset, food poisoning, indigestion, dehydration',
    ],
    'Cardiologist': [
        'chest pain, tightness or pressure in the chest, pain spreading to the arm or jaw',
        'heart palpitations, irregular or racing heartbeat, shortness of breath',
        'high blood pressure, hypertension, swelling in the legs, breathlessness on exertion',
    ],
    'Dermatologist': [
        'skin rash, itching, redness, hives or eczema on the skin',
        'acne, pimples, dark spots, oily skin, blackheads',
        'hair loss, dandruff, brittle nails, fungal infection, moles or warts',
    ],
    'Neurologist': [
        'severe headache, migraine, throbbing head pain, sensitivity to light',
        'dizziness, vertigo, fainting, seizures, tremors',
        'numbness, tingling in hands or feet, weakness on one side of the body, memory problems',
    ],
    'Orthopedic': [
        'joint pain, knee pain, shoulder pain, hip pain, arthritis and stiffness',
        'back pain, neck pain, spine problems, slipped disc',
        'fracture, broken bone, sprain, sports injury, swelling after an injury',
    ],
    'Psychiatrist': [
        'anxiety, panic attacks, constant worry, restlessness',
        'depression, sadness, low mood, loss of interest, hopelessness',
        'insomnia, trouble sleeping, stress, mood swings, anger issues',
    ],
};

// Cosine-similarity confidence gates (embeddings are L2-normalized, so the
// dot product IS the cosine). Calibrated against test phrases in Node.
const HIGH_CONFIDENCE = 0.45;
const MODERATE_CONFIDENCE = 0.28;

let status = 'idle'; // 'idle' | 'loading' | 'ready' | 'unavailable'
let enginePromise = null;

export const getTriageStatus = () => status;

const dot = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
};

const buildEngine = async (onProgress) => {
    const { pipeline } = await import('@huggingface/transformers');

    const createExtractor = async (device) => {
        return pipeline('feature-extraction', MODEL_ID, {
            dtype: 'q8',
            ...(device ? { device } : {}),
            progress_callback: (p) => {
                // Report download progress of the main model weights only
                if (p.status === 'progress' && p.file?.endsWith('.onnx') && onProgress) {
                    onProgress(Math.round(p.progress || 0));
                }
            },
        });
    };

    let extractor;
    const wantsWebGpu = typeof navigator !== 'undefined' && !!navigator.gpu;
    if (wantsWebGpu) {
        try {
            extractor = await createExtractor('webgpu');
        } catch {
            extractor = await createExtractor(); // WASM fallback
        }
    } else {
        extractor = await createExtractor();
    }

    // Embed every descriptor phrase once; queries only embed the user's text
    const specialties = Object.keys(SPECIALTY_DESCRIPTORS);
    const phrases = specialties.flatMap((s) => SPECIALTY_DESCRIPTORS[s]);
    const output = await extractor(phrases, { pooling: 'mean', normalize: true });
    const [, dim] = output.dims;

    const descriptorVectors = [];
    let row = 0;
    for (const specialty of specialties) {
        for (const phrase of SPECIALTY_DESCRIPTORS[specialty]) {
            descriptorVectors.push({
                specialty,
                phrase,
                vector: output.data.slice(row * dim, (row + 1) * dim),
            });
            row++;
        }
    }

    return { extractor, descriptorVectors, specialties };
};

// Loads the model + descriptor embeddings once; safe to call repeatedly.
export const preloadLocalTriage = (onProgress) => {
    if (!enginePromise) {
        status = 'loading';
        enginePromise = buildEngine(onProgress)
            .then((engine) => {
                status = 'ready';
                return engine;
            })
            .catch((err) => {
                status = 'unavailable';
                enginePromise = null; // allow a retry on the next call
                throw err;
            });
    }
    return enginePromise;
};

// Embeds `text` on-device and returns specialties ranked by similarity.
export const matchSpecialty = async (text) => {
    const engine = await preloadLocalTriage();

    const output = await engine.extractor(text, { pooling: 'mean', normalize: true });
    const query = output.data;

    const bestPerSpecialty = new Map();
    for (const { specialty, vector } of engine.descriptorVectors) {
        const score = dot(query, vector);
        if (!bestPerSpecialty.has(specialty) || score > bestPerSpecialty.get(specialty)) {
            bestPerSpecialty.set(specialty, score);
        }
    }

    const ranked = [...bestPerSpecialty.entries()]
        .map(([specialty, score]) => ({ specialty, score }))
        .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    const confidence =
        top.score >= HIGH_CONFIDENCE ? 'high'
            : top.score >= MODERATE_CONFIDENCE ? 'moderate'
                : 'low';

    return { top, ranked, confidence };
};
