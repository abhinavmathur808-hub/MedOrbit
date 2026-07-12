import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Loader2, ShieldX } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    // 'checking' -> 'granted' | 'denied'
    const [accessState, setAccessState] = useState('checking');
    const [denyMessage, setDenyMessage] = useState('');
    // Zego session details minted server-side (token, appId, ids) — the
    // ServerSecret is never exposed to the client
    const [zegoSession, setZegoSession] = useState(null);

    const getReturnPath = useCallback(() => {
        if (user?.role === 'doctor') return '/doctor/dashboard';
        return '/appointments';
    }, [user]);

    const destroyZego = useCallback(() => {
        try {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        } catch (err) {
        }
    }, []);

    // Verify with the server that this user is a participant of the
    // appointment behind this room id before any Zego setup happens
    useEffect(() => {
        if (!roomId) return;
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        let cancelled = false;

        const checkAccess = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/api/appointments/${roomId}/room-access`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();

                if (cancelled) return;

                if (data.success && data.zego?.token) {
                    setZegoSession(data.zego);
                    setAccessState('granted');
                } else {
                    setAccessState('denied');
                    setDenyMessage(data.message || 'You are not authorized to join this consultation.');
                }
            } catch (err) {
                if (!cancelled) {
                    setAccessState('denied');
                    setDenyMessage('Could not verify access to this consultation. Please try again.');
                }
            }
        };

        checkAccess();

        return () => {
            cancelled = true;
        };
    }, [roomId, user, navigate]);

    useEffect(() => {
        if (accessState !== 'granted' || !zegoSession || !roomId || !containerRef.current || !user) return;

        const initMeeting = async () => {
            try {
                // Build the UIKit token from the server-minted Zego token. The
                // userID must match the id the token was signed for.
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    zegoSession.appId,
                    zegoSession.roomId || roomId,
                    zegoSession.userId,
                    zegoSession.userName,
                    zegoSession.token
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current,
                    sharedLinks: [
                        {
                            name: 'Copy Link',
                            url: window.location.href,
                        },
                    ],
                    scenario: {
                        mode: ZegoUIKitPrebuilt.OneONoneCall, // 1-on-1 video call
                    },
                    showScreenSharingButton: true,
                    showPreJoinView: true,
                    turnOnMicrophoneWhenJoining: true,
                    turnOnCameraWhenJoining: true,
                    showLeaveRoomConfirmDialog: true,
                    onLeaveRoom: () => {
                        destroyZego();
                        navigate(getReturnPath());
                    },
                    onUserLeave: (users) => {
                    },
                });

            } catch (error) {
            }
        };

        initMeeting();

        return () => {
            destroyZego();
        };
    }, [accessState, zegoSession, roomId, user, navigate, destroyZego, getReturnPath]);

    if (accessState === 'checking') {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Verifying consultation access...</p>
                </div>
            </div>
        );
    }

    if (accessState === 'denied') {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="text-center p-8 max-w-md">
                    <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-zinc-400 mb-6">{denyMessage}</p>
                    <button
                        onClick={() => navigate(getReturnPath())}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all"
                    >
                        Back to Appointments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 overflow-hidden">
            <div
                ref={containerRef}
                className="w-full h-full"
            />
        </div>
    );
};

export default Room;
