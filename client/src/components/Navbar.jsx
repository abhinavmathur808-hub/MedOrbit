import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/features/authSlice';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logoDark from '../assets/logo-light-mode.png';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        setIsMenuOpen(false);
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav
            className="fixed top-6 left-0 right-0 z-50 mx-auto max-w-6xl w-[calc(100%-2rem)] bg-[#09090b]/80 backdrop-blur-2xl border border-rose-600/50 rounded-full shadow-[0_0_30px_-5px_rgba(225,29,72,0.2)] transition-all duration-300 px-8 py-2 flex items-center justify-between"
        >
            <div className="flex-1 flex items-center justify-start h-full">
                <Link to="/" className="flex items-center">
                    <img
                        src={logoDark}
                        alt="MedOrbit"
                        className="block h-10 w-auto object-contain scale-[1.75] translate-y-[2px] transition-all duration-300"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                </Link>
            </div>

            <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
                <li>
                    <Link to="/" className={`transition-colors duration-200 ${location.pathname === '/' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}>
                        Home
                    </Link>
                </li>
                <li>
                    {user?.role === 'doctor' ? (
                        <Link to="/doctor/profile/edit" className={`transition-colors duration-200 ${location.pathname === '/doctor/profile/edit' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}>
                            Edit Profile
                        </Link>
                    ) : (
                        <Link to="/doctors" className={`transition-colors duration-200 ${location.pathname === '/doctors' || location.pathname.startsWith('/doctors') ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}>
                            Find Doctors
                        </Link>
                    )}
                </li>

                {user && (
                    <li>
                        <Link
                            to={user?.role === 'doctor' ? '/doctor/dashboard' : '/appointments'}
                            className={`transition-colors duration-200 ${(location.pathname === '/doctor/dashboard' || location.pathname === '/appointments') ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            Appointments
                        </Link>
                    </li>
                )}
                {user?.role === 'admin' && (
                    <li>
                        <Link
                            to="/admin"
                            className={`transition-colors duration-200 ${location.pathname.startsWith('/admin') ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            Admin Panel
                        </Link>
                    </li>
                )}
            </ul>

            <div className="flex-1 hidden md:flex justify-end">
                {user ? (
                    <div className="flex items-center gap-4">
                        <Link
                            to={user?.role === 'doctor' ? '/doctor/profile' : '/profile'}
                            className="text-zinc-300 hover:text-white font-medium text-sm transition-colors duration-200"
                        >
                            {user?.name || 'Profile'}
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-zinc-300 hover:text-white font-medium text-sm px-4 py-2 rounded-full border border-transparent hover:border-zinc-700 transition-all duration-200"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="text-zinc-300 hover:text-white font-medium text-sm px-4 py-2 rounded-full border border-transparent hover:border-zinc-700 transition-all duration-200"
                    >
                        Sign In
                    </Link>
                )}
            </div>

            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
            >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {isMenuOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-2 md:hidden py-4 space-y-1 rounded-2xl px-2 mx-4"
                    style={{
                        background: 'rgba(9,9,11,0.95)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(225,29,72,0.3)',
                        boxShadow: '0 0 20px -5px rgba(225,29,72,0.15)',
                    }}
                >
                    <Link to="/" onClick={closeMenu} className={`block px-4 py-2.5 rounded-lg hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200 ${location.pathname === '/' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}>Home</Link>
                    {user?.role === 'doctor' ? (
                        <Link to="/doctor/profile/edit" onClick={closeMenu} className={`block px-4 py-2.5 rounded-lg hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200 ${location.pathname === '/doctor/profile/edit' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}>Edit Profile</Link>
                    ) : (
                        <Link to="/doctors" onClick={closeMenu} className={`block px-4 py-2.5 rounded-lg hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200 ${location.pathname === '/doctors' || location.pathname.startsWith('/doctors') ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}>Find Doctors</Link>
                    )}

                    {user && (
                        <Link
                            to={user?.role === 'doctor' ? '/doctor/dashboard' : '/appointments'}
                            onClick={closeMenu}
                            className={`block px-4 py-2.5 rounded-lg hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200 ${(location.pathname === '/doctor/dashboard' || location.pathname === '/appointments') ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            Appointments
                        </Link>
                    )}
                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            onClick={closeMenu}
                            className={`block px-4 py-2.5 rounded-lg hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200 ${location.pathname.startsWith('/admin') ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            Admin Panel
                        </Link>
                    )}

                    <div className="border-t border-zinc-800/60 pt-2 mt-2">
                        {user ? (
                            <>
                                <Link to={user?.role === 'doctor' ? '/doctor/profile' : '/profile'} onClick={closeMenu} className="block px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200">
                                    Profile ({user?.name || 'User'})
                                </Link>
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200">Logout</button>
                            </>
                        ) : (
                            <Link to="/login" onClick={closeMenu} className="block px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors duration-200">Sign In</Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
