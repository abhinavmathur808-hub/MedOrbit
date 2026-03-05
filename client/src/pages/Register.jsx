import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, reset } from '../redux/features/authSlice';
import { User, Mail, Lock, ArrowRight, Stethoscope, Send, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import heroBg from '../assets/hero-medical-bg.png';
import logo from '../assets/logo-light-mode.png';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient',
        otp: '',
    });

    const [formError, setFormError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { firstName, lastName, email, password, confirmPassword, role, otp } = formData;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading, isSuccess, isError, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isSuccess) {
            navigate('/');
        }

        return () => {
            dispatch(reset());
        };
    }, [isSuccess, navigate, dispatch]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setFormError('');
    };

    const startCooldown = (seconds = 30) => {
        setOtpCooldown(seconds);
        const interval = setInterval(() => {
            setOtpCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async () => {
        if (!email) {
            setFormError('Please enter your email first');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setFormError('Please enter a valid email address');
            return;
        }

        setOtpLoading(true);
        setFormError('');
        setOtpMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setOtpSent(true);
                setOtpMessage(otpSent ? 'New OTP sent! Check your email.' : 'OTP sent! Check your email.');
                setFormData((prev) => ({ ...prev, otp: '' })); // Clear old OTP input
                startCooldown(30);
            } else {
                setFormError(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            setFormError('Failed to send OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }

        if (!otp) {
            setFormError('Please enter the OTP sent to your email');
            return;
        }

        if (otp.length !== 6) {
            setFormError('OTP must be 6 digits');
            return;
        }

        const fullName = lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim();
        dispatch(registerUser({ name: fullName, email, password, role, otp }));
    };

    const inputClass = "w-full bg-[#121212] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors mb-4";

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative m-0 py-12 overflow-x-hidden">
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
                />

                <h2 className="text-xl font-bold text-white text-center mb-6">
                    Create your account ✨
                </h2>

                {(isError || formError) && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                        {formError || message}
                    </div>
                )}

                {isSuccess && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                {otpMessage && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {otpMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <input type="text" id="firstName" name="firstName" value={firstName} onChange={handleChange} required placeholder="First name" className={`${inputClass} mb-0`} />
                        <input type="text" id="lastName" name="lastName" value={lastName} onChange={handleChange} placeholder="Last name (optional)" className={`${inputClass} mb-0`} />
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input type="email" id="email" name="email" value={email} onChange={handleChange} required placeholder="example@gmail.com" className={`${inputClass} flex-1 mb-0`} />
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading || otpCooldown > 0}
                            className={`px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${otpSent && otpCooldown > 0
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-rose-950/30 text-rose-500 hover:bg-rose-950/50 border border-rose-900/30'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {otpLoading ? (
                                <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : otpCooldown > 0 ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    {otpCooldown}s
                                </>
                            ) : otpSent ? (
                                <>
                                    <Send className="w-4 h-4" />
                                    Resend
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    OTP
                                </>
                            )}
                        </button>
                    </div>

                    {otpSent && (
                        <div className="mb-4">
                            <input type="text" id="otp" name="otp" value={otp} onChange={handleChange} required maxLength={6} placeholder="Enter 6-digit OTP" className={`${inputClass} text-center text-lg tracking-widest mb-0`} />
                            <p className="text-[10px] text-zinc-600 mt-1">OTP valid for 10 minutes • Check your email for the code</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'patient' })}
                            className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm ${role === 'patient'
                                ? 'border-rose-900/50 bg-rose-950/30 text-rose-500'
                                : 'border-zinc-800 bg-[#121212] hover:border-zinc-700 text-zinc-500'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Patient
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'doctor' })}
                            className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm ${role === 'doctor'
                                ? 'border-rose-900/50 bg-rose-950/30 text-rose-500'
                                : 'border-zinc-800 bg-[#121212] hover:border-zinc-700 text-zinc-500'
                                }`}
                        >
                            <Stethoscope className="w-4 h-4" />
                            Doctor
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <input type={showPassword ? "text" : "password"} id="password" name="password" value={password} onChange={handleChange} required placeholder="Password" className={`${inputClass} mb-0 pr-10`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" tabIndex={-1}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={handleChange} required placeholder="Confirm password" className={`${inputClass} mb-0 pr-10`} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" tabIndex={-1}>
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !otpSent}
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
                    href="http://localhost:5000/auth/google"
                    className="w-full flex items-center justify-center gap-2 bg-[#121212] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-lg text-sm transition-colors"
                >
                    <FcGoogle className="w-5 h-5" />
                    Continue with Google
                </a>

                <p className="text-center text-zinc-500 text-sm mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
                        Sign in
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

export default Register;
