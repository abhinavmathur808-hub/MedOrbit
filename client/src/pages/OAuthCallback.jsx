import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/features/authSlice';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                dispatch(setCredentials({ token, user }));

                navigate('/', { replace: true });
            } catch (error) {
                navigate('/login?error=oauth_failed', { replace: true });
            }
        } else {
            navigate('/login?error=missing_token', { replace: true });
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
            <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-sm">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Signing you in...</h2>
                <p className="text-gray-500 text-sm">Please wait while we complete your login.</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
