import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser, reset } from '../redux/features/authSlice';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

import logo from '../assets/logo-light-mode.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const { email, password } = formData;

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Where to land after login: the page that sent the user here (e.g. a
    // booking page), falling back to Home. Only internal paths are honored.
    const from = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/')
        && !location.state.from.startsWith('//') // reject protocol-relative → open redirect
        ? location.state.from
        : '/';

    const { isLoading, isSuccess, isError, message, user } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isSuccess && user) {
            navigate(from, { replace: true });
        }

        return () => {
            dispatch(reset());
        };
    }, [isSuccess, user, navigate, dispatch, from]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(loginUser({ email, password }));
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative m-0 p-0 overflow-x-hidden">
            <div
                style={{ backgroundImage: "url('/hero-medical-bg.webp')" }}
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat bg-fixed z-0"
            ></div>

            <div className="absolute inset-0 w-full h-full bg-zinc-950/85 z-[1]"></div>

            <div className="w-full max-w-[400px] bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/50 shadow-2xl shadow-black/50 p-8 rounded-2xl z-10 mx-4">
                <img
                    src={logo}
                    alt="MedOrbit"
                    className="h-[120px] w-auto mx-auto mb-3"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    loading="lazy"
                />

                <h2 className="text-xl font-bold text-white text-center mb-6">
                    Welcome 👋 Let's Get Started!
                </h2>

                {isError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        required
                        placeholder="example@gmail.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all mb-4"
                    />

                    <div className="relative mb-4">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-zinc-800/50"></div>
                    <span className="mx-4 text-zinc-600 text-[10px] uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-zinc-800/50"></div>
                </div>

                <a
                    href={`${API_BASE}/auth/google?redirect=${encodeURIComponent(from)}`}
                    className="w-full flex items-center justify-center gap-2 bg-[#121212] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-lg text-sm transition-colors"
                >
                    <FcGoogle className="w-5 h-5" />
                    Continue with Google
                </a>

                <a
                    href={`${API_BASE}/auth/github?redirect=${encodeURIComponent(from)}`}
                    className="w-full flex items-center justify-center gap-2 bg-[#121212] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-lg text-sm transition-colors mt-3"
                >
                    <FaGithub className="w-5 h-5" />
                    Continue with GitHub
                </a>

                <p className="text-center text-zinc-500 text-sm mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" state={{ from }} className="text-rose-500 hover:text-rose-400 transition-colors">
                        Create one
                    </Link>
                </p>

                <div className="text-center mt-6">
                    <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-300 hover:underline transition-colors">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
