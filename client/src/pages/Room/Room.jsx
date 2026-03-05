import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

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

    useEffect(() => {
        if (!roomId || !containerRef.current || !user) return;

        const initMeeting = async () => {
            const userID = user._id || user.id || Date.now().toString();
            const userName = user.name || 'Guest';

            try {
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appID,
                    serverSecret,
                    roomId,
                    userID,
                    userName
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
    }, [roomId, user, navigate, destroyZego, getReturnPath]);

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
