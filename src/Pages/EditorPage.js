import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import toast from 'react-hot-toast';
import ACTIONS from '../Action';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {useNavigate,Navigate,useParams} from 'react-router-dom';
import './EditorPage.css';

const EditorPage = () => {
    const { t } = useTranslation();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [joining, setJoining] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const response = await fetch('/login/success');
                const data = await response.json();
                if (!data.success) {
                    reactNavigator('/');
                    return;
                }
                setUser(data.user);

                // Only initialize socket after auth success
                socketRef.current = await initSocket();
                socketRef.current.on('connect_error', (err) => handleErrors(err));
                socketRef.current.on('connect_failed', (err) => handleErrors(err));
                socketRef.current.on('connect', () => {
                    setJoining(true);
                });

                function handleErrors(e) {
                    console.log('socket error', e);
                    toast.error(t('socket_connection_failed'));
                    reactNavigator('/');
                }

                socketRef.current.emit(ACTIONS.JOIN, { 
                    roomId,
                    username: data.user.displayName,
                    avatar: data.user?.photos?.[0]?.value,
                });

                // Listening for joined event
                socketRef.current.on(
                    ACTIONS.JOINED,
                    ({ clients, username, socketId }) => {
                        const audio = new Audio('/ding.mp3');
                        try { audio.play(); } catch(e) {}
                        if (username !== data.user.displayName) {
                            toast.success(t('user_joined_room', { username }));
                        }
                        setClients(clients);
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                            code: codeRef.current,
                            socketId,
                        });
                        setJoining(false);
                    }
                );

                // Listening for disconnected
                socketRef.current.on(
                    ACTIONS.DISCONNECTED,
                    ({ socketId, username }) => {
                        toast.success(t('user_left_room', { username }));
                        setClients((prev) => {
                            return prev.filter(
                                (client) => client.socketId !== socketId
                            );
                        });
                    }
                );
            } finally {
                setAuthChecked(true);
            }
        };
        init();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success(t('room_id_copied'));
        } catch (err) {
            toast.error(t('room_id_copy_error'));
            console.error(err);
        }
    }

    async function leaveRoom() {
        try {
            await fetch('/logout', { method: 'GET', credentials: 'include' });
        } catch (e) {
            // ignore network errors, still navigate away
        } finally {
            reactNavigator('/');
        }
    }

    if (!authChecked) {
        return null;
    }
    if (!user) {
        return <Navigate to="/" />;
    }

    return (
        <div className="pageWrap">
            <div className="topBar">
                <div className="topRight">
                    <div className="language-switcher">
                        <select onChange={(e) => i18n.changeLanguage(e.target.value)} value={i18n.language}>
                            <option value="en">English</option>
                            <option value="hi">हिन्दी</option>
                        </select>
                    </div>
                    <img className="topUserAvatar" src={user?.photos?.[0]?.value || '/logo192.png'} alt={user?.displayName} />
                    <button className="iconTextBtn" onClick={copyRoomId}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 15H8V7h11v13z"></path>
                        </svg>
                        <span>{t('copy_room_id')}</span>
                    </button>
                    <button className="iconTextBtn danger" onClick={leaveRoom}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path d="M10 17l1.41-1.41L8.83 13H21v-2H8.83l2.58-2.59L10 7l-5 5 5 5z"></path>
                            <path d="M3 19h6v2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6v2H3v14z"></path>
                        </svg>
                        <span>{t('leave')}</span>
                    </button>
                </div>
            </div>
            <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                        <h3>{t('connected')}</h3>
                    <div className="clientsList">
                        {
                            clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                                avatar={client.avatar}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="editorWrap">
                {joining && <div className="connectingOverlay"><div className="spinner"/><div className="connectingText">{t('connecting')}</div></div>}
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    username={user.displayName}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
            </div>
        </div>
    );
};

export default EditorPage;
