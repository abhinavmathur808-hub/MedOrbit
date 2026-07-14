import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Loader2, ShieldX, Mic, Square } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Feature-detect the Web Speech API once. It's Chrome/Edge-first; Firefox and
// Safari don't expose it, so the scribe UI degrades away gracefully there.
const SpeechRecognitionAPI =
    typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

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

    // AI scribe (doctor-side transcription of their own microphone)
    const [isDoctor, setIsDoctor] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');       // accumulated final transcript
    const shouldTranscribeRef = useRef(false); // controls auto-restart on Chrome
    const isDoctorRef = useRef(false);      // read inside the Zego leave callback

    const getReturnPath = useCallback(() => {
        if (user?.role === 'doctor') return '/doctor/dashboard';
        return '/appointments';
    }, [user]);

    const startTranscription = useCallback(() => {
        if (!SpeechRecognitionAPI || recognitionRef.current) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    transcriptRef.current += chunk + ' ';
                } else {
                    interim += chunk;
                }
            }
            setInterimText(interim);
        };

        // Chrome ends recognition after a pause — restart while still enabled
        recognition.onend = () => {
            if (shouldTranscribeRef.current && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch { /* already starting */ }
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                shouldTranscribeRef.current = false;
                setTranscribing(false);
            }
        };

        recognitionRef.current = recognition;
        shouldTranscribeRef.current = true;
        try {
            recognition.start();
            setTranscribing(true);
        } catch { /* start may throw if called twice */ }
    }, []);

    const stopTranscription = useCallback(() => {
        shouldTranscribeRef.current = false;
        setTranscribing(false);
        setInterimText('');
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* noop */ }
        }
    }, []);

    // Stop capture and send the transcript for SOAP structuring. keepalive lets
    // the request survive the navigation that follows leaving the room.
    const finalizeTranscript = useCallback(async () => {
        shouldTranscribeRef.current = false;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* noop */ }
            recognitionRef.current = null;
        }

        const text = transcriptRef.current.trim();
        if (!isDoctorRef.current || !text) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/api/ai/soap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ appointmentId: roomId, transcript: text }),
                keepalive: true,
            });
        } catch {
            // Non-fatal: the doctor can still write the prescription manually
        }
    }, [roomId]);

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
                    const doctor = data.role === 'doctor';
                    setIsDoctor(doctor);
                    isDoctorRef.current = doctor;
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
                // Signature (per index.d.ts): (appID, token, roomID, userID, userName)
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    zegoSession.appId,
                    zegoSession.token,
                    zegoSession.roomId || roomId,
                    zegoSession.userId,
                    zegoSession.userName
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
                    onLeaveRoom: async () => {
                        // Send the transcript for SOAP structuring before leaving
                        await finalizeTranscript();
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
            // Stop any in-flight recognition if we unmount without a clean leave
            shouldTranscribeRef.current = false;
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch { /* noop */ }
                recognitionRef.current = null;
            }
        };
    }, [accessState, zegoSession, roomId, user, navigate, destroyZego, getReturnPath, finalizeTranscript]);

    if (accessState === 'checking') {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                    <p className="text-neutral-400">Verifying consultation access...</p>
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
                    <p className="text-neutral-400 mb-6">{denyMessage}</p>
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

            {/* AI Scribe — doctor only, and only where the Web Speech API exists */}
            {isDoctor && SpeechRecognitionAPI && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)]">
                    {!transcribing ? (
                        <button
                            onClick={startTranscription}
                            className="mx-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0c0c0e]/90 backdrop-blur border border-white/10 text-neutral-200 text-sm font-medium shadow-lg hover:border-rose-500/40 hover:text-white transition-all"
                        >
                            <Mic className="w-4 h-4 text-rose-400" />
                            Start AI Scribe
                        </button>
                    ) : (
                        <div className="rounded-2xl bg-[#0c0c0e]/90 backdrop-blur border border-white/10 shadow-xl px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-white">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-70"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                    </span>
                                    Transcribing your mic
                                </div>
                                <button
                                    onClick={stopTranscription}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-300 hover:text-white text-xs transition-all"
                                >
                                    <Square className="w-3 h-3" />
                                    Stop
                                </button>
                            </div>
                            {interimText && (
                                <p className="mt-2 text-xs text-neutral-400 line-clamp-2 italic">“{interimText}”</p>
                            )}
                            <p className="mt-2 text-[10px] text-neutral-600">
                                Only your microphone is transcribed. Notes are drafted for your review after the call.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Room;
