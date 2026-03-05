import { Link } from 'react-router-dom';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import logoDark from '../assets/logo-light-mode.png';

const Footer = () => {
    return (
        <footer className="w-full bg-[#09090b] border-t border-zinc-800/50 mt-16">

            <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-16">
                <div className="flex flex-col md:flex-row items-start justify-between gap-10">

                    <div>
                        <p className="text-zinc-500 text-base leading-relaxed mb-6 max-w-md">
                            Your health, accessible anywhere. Connecting patients with
                            top-tier certified doctors instantly.
                        </p>

                        <div className="flex items-center gap-4 mb-4">
                            <a
                                href="https://www.linkedin.com/in/abhinav-mathur-669414356"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                            >
                                <FaLinkedin className="w-7 h-7 text-zinc-400 hover:text-white transition-colors duration-200" />
                            </a>
                            <a
                                href="https://github.com/abhinavmathur808-hub"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                            >
                                <FaGithub className="w-7 h-7 text-zinc-400 hover:text-white transition-colors duration-200" />
                            </a>
                        </div>

                        <a
                            href="mailto:abhinavmathur808@gmail.com"
                            className="text-sm text-zinc-500 hover:text-white transition-colors duration-200"
                        >
                            abhinavmathur808@gmail.com
                        </a>
                    </div>

                    <div className="flex-shrink-0 md:ml-auto">
                        <Link to="/" className="inline-block">
                            <img
                                src={logoDark}
                                alt="MedOrbit"
                                className="h-36 w-auto object-contain"
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full px-4 md:px-8 mt-6 pb-2">
                <hr className="border-zinc-800 mb-4" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-2">

                    <p className="text-sm text-zinc-600">
                        &copy; 2026 MedOrbit. All rights reserved.
                    </p>

                    <p className="text-sm text-zinc-600">
                        Designed &amp; Built by{' '}
                        <a
                            href="https://www.linkedin.com/in/abhinav-mathur-669414356"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-zinc-400 hover:text-white transition-colors duration-200"
                        >
                            Abhinav Mathur
                        </a>{' '}
                        🇮🇳
                    </p>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
