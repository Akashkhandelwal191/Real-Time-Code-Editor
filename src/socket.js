import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        path: '/socket.io',
    };
    const url = process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL !== '/'
        ? process.env.REACT_APP_BACKEND_URL
        : undefined; // same-origin
    return io(url, options);
};