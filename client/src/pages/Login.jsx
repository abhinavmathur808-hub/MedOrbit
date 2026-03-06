import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, reset } from '../redux/features/authSlice';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import heroBg from '../assets/hero-medical-bg.png';
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

    const { isLoading, isSuccess, isError, message, user } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isSuccess && user) {
            navigate('/');
        }

        return () => {
            dispatch(reset());
        };
    }, [isSuccess, user, navigate, dispatch]);

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
                style={{ backgroundImage: `url(${heroBg})` }}
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat bg-fixed z-0"
            ></div>

            <div className="absolute inset-0 w-full h-full bg-black/85 z-[1]"></div>

            <div className="w-full max-w-[400px] bg-[#09090b]/95 backdrop-blur-md border border-zinc-800/50 p-8 rounded-2xl shadow-2xl z-10 mx-4">
                <img
                    src={logo}
                    alt="MedOrbit"
                    className="h-[120px] w-auto mx-auto mb-3"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    loading="lazy"
                />

                <h2 className="text-xl font-bold text-white text-center mb-6">
                    Welcome 👋 Let's Get started!
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
                        className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors mb-4"
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
                            className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-4 py-3 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
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
                        className="w-full bg-rose-950/30 text-rose-500 hover:bg-rose-950/50 border border-rose-900/30 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
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
                    href={`${API_BASE}/auth/google`}
                    className="w-full flex items-center justify-center gap-2 bg-[#121212] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-lg text-sm transition-colors"
                >
                    <FcGoogle className="w-5 h-5" />
                    Continue with Google
                </a>

                <p className="text-center text-zinc-500 text-sm mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-rose-500 hover:text-rose-400 transition-colors">
                        Create one
                    </Link>
                </p>

                <div className="text-center mt-6">
                    <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors">
                        Skip & continue to <span className="text-rose-500">Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
