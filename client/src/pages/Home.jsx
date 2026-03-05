import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Video,
    Shield,
    Clock,
    Heart,
    Users,
    ArrowRight,
    Star,
    Search,
} from 'lucide-react';
import { getRandomHealthQuote } from '../utils/healthQuotes';
import Footer from '../components/Footer';
import SpecialityMenu from '../components/SpecialityMenu';
import TopArticles from '../components/TopArticles';
import UserReviews from '../components/UserReviews';
import FAQ from '../components/FAQ';
import CurvedWrapper from '../components/CurvedWrapper';
import heroBg from '../assets/hero-medical-bg.png';

const Home = () => {
    const { user } = useSelector((state) => state.auth);
    const [healthQuote, setHealthQuote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setHealthQuote(getRandomHealthQuote());
    }, []);

    const SYMPTOM_MAP = {
        Neurologist: ['headache', 'migraine', 'seizure', 'dizziness', 'numbness', 'memory', 'brain'],
        Dentist: ['tooth', 'teeth', 'gum', 'dental', 'cavity', 'jaw', 'mouth'],
        Dermatologist: ['skin', 'rash', 'acne', 'eczema', 'itching', 'allergy', 'hair loss'],
        Cardiologist: ['chest pain', 'heart', 'palpitation', 'blood pressure', 'bp', 'cholesterol'],
        Orthopedic: ['bone', 'fracture', 'joint', 'knee', 'back pain', 'spine', 'shoulder'],
        ENT: ['ear', 'nose', 'throat', 'sinus', 'hearing', 'tonsil', 'snoring'],
        Gastroenterologist: ['stomach', 'digestion', 'nausea', 'vomiting', 'acid', 'liver', 'abdomen'],
        Ophthalmologist: ['eye', 'vision', 'blurry', 'cataract', 'glasses', 'sight'],
        Psychiatrist: ['anxiety', 'depression', 'stress', 'insomnia', 'sleep', 'panic', 'mental'],
        Pulmonologist: ['breathing', 'cough', 'asthma', 'lung', 'wheezing', 'shortness of breath'],
        Urologist: ['kidney', 'urine', 'bladder', 'prostate'],
        Gynecologist: ['period', 'pregnancy', 'menstrual', 'pcos', 'ovary'],
        Pediatrician: ['child', 'baby', 'infant', 'fever', 'vaccination', 'growth'],
        'General Physician': ['cold', 'flu', 'fever', 'fatigue', 'weakness', 'body pain'],
    };

    const handleSymptomSearch = () => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            navigate('/doctors');
            return;
        }

        let matchedSpeciality = null;
        for (const [speciality, keywords] of Object.entries(SYMPTOM_MAP)) {
            if (keywords.some((kw) => query.includes(kw))) {
                matchedSpeciality = speciality;
                break;
            }
        }

        navigate('/doctors', { state: { speciality: matchedSpeciality } });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSymptomSearch();
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
            <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden pb-20 pt-32">
                <div
                    style={{ backgroundImage: `url(${heroBg})` }}
                    className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 scale-105"
                ></div>

                <div className="absolute inset-0 w-full h-full bg-black/85 z-10"></div>

                <div className="relative z-20 w-full max-w-6xl mx-auto flex flex-col items-center text-center px-4 md:px-8">

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-none text-white mb-6">
                        Bring <span className="relative inline-block border border-rose-700/50 bg-rose-900/20 text-zinc-200 px-3 py-1 mx-2">
                            <span className="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            <span className="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            <span className="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            <span className="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            Doctors
                        </span><br />
                        Into Your Orbit!
                    </h1>

                    <p className="text-lg sm:text-xl leading-relaxed text-zinc-300 max-w-xl mx-auto mb-14">
                        Find the right doctor and book your appointment instantly. Scheduling made
                        simple, reliable and fast.
                    </p>

                    <div
                        className="w-full max-w-2xl mx-auto rounded-2xl px-5 py-5"
                        style={{
                            background: 'rgba(9,9,11,0.6)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center bg-black/50 rounded-xl p-4 border border-zinc-800 focus-within:border-zinc-500 transition-colors duration-200">
                                <Search className="w-6 h-6 text-zinc-600 mr-3 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Describe your symptoms... e.g. headache, skin rash"
                                    className="w-full outline-none text-lg bg-transparent text-white placeholder-zinc-600"
                                />
                            </div>
                            <button
                                onClick={handleSymptomSearch}
                                className="bg-white text-black rounded-full px-8 py-4 font-medium text-lg hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex-shrink-0 cursor-pointer"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {healthQuote && (
                        <p className="mt-10 text-sm sm:text-base w-full leading-relaxed text-center text-zinc-200">
                            <span className="drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] text-lg inline-block mr-2">💡</span>{healthQuote}
                        </p>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#09090b] to-transparent z-10 pointer-events-none"></div>
            </section>

            <div className="relative z-10 bg-[#09090b] pt-16 pb-24 px-6 md:px-12 w-full">

                <SpecialityMenu />

                <TopArticles />

                <UserReviews />

                <FAQ />

                <Footer />
            </div>
        </div >
    );
};

export default Home;
