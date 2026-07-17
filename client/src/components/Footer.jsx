import { Link } from 'react-router-dom';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import logoDark from '../assets/logo-light-mode.png';

// Shared hover treatment for every contact affordance: lift and brighten.
const CONTACT_HOVER =
    'text-zinc-500 hover:text-zinc-200 hover:-translate-y-1 transition-all duration-300';

const Footer = () => {
    return (
        <footer className="relative border-t border-zinc-800/50 bg-zinc-950 pt-16 pb-8 overflow-hidden">

            {/* Ambient separator: a hairline that fades at both ends, over a soft
                rose bloom, so the footer detaches from the content above it. */}
            <div
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] max-w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
            />
            <div
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] max-w-full h-[200px] bg-rose-900/10 blur-[100px] pointer-events-none"
            />

            {/* relative + z-10 lifts the content above the absolutely-positioned
                glows regardless of DOM order. */}
            <div className="relative z-10 max-w-6xl mx-auto w-full px-4 md:px-8">

                {/* ── Main content ── */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">

                    {/* Brand column */}
                    <div>
                        <Link to="/" className="inline-block" aria-label="MedOrbit home">
                            <img
                                src={logoDark}
                                alt="MedOrbit"
                                className="w-48 md:w-56 h-auto object-contain -mt-10 -mb-14"
                                style={{ filter: 'brightness(0) invert(1)' }}
                                loading="lazy"
                            />
                        </Link>

                        <p className="text-zinc-400 leading-relaxed max-w-sm mt-6">
                            Your health, accessible anywhere. Connecting patients with
                            top-tier certified doctors instantly.
                        </p>

                        <div className="flex items-center gap-5 mt-6">
                            <a
                                href="https://www.linkedin.com/in/abhinav-mathur-669414356"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className={CONTACT_HOVER}
                            >
                                <FaLinkedin className="w-6 h-6" />
                            </a>
                            <a
                                href="https://github.com/abhinavmathur808-hub"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className={CONTACT_HOVER}
                            >
                                <FaGithub className="w-6 h-6" />
                            </a>
                            <a
                                href="mailto:abhinavmathur808@gmail.com"
                                className={`text-sm ${CONTACT_HOVER}`}
                            >
                                abhinavmathur808@gmail.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Developer signature ── */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-800/50">
                    <p className="text-zinc-500 text-sm">
                        &copy; 2026 MedOrbit. All rights reserved.
                    </p>

                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-4 md:mt-0">
                        <span>Designed &amp; Built by</span>
                        <span className="text-zinc-200 font-medium">Abhinav Mathur</span>
                        <span className="relative flex h-2 w-2 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
