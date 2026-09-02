
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<{
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: string[];
    incomingCall: {
        isReceivingCall: boolean;
        from: string;
        name: string;
        signal: any;
        type: 'video' | 'audio' | 'speed_date';
        location?: string;
        photoUrl?: string | null;
        avatarUrl?: string | null;
        photo?: string | null;
    } | null;
    clearIncomingCall: () => void;
    publicStats: { onlineCount: number };
} | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        return {
            socket: null,
            isConnected: false,
            onlineUsers: [],
            incomingCall: null,
            clearIncomingCall: () => { },
            publicStats: { onlineCount: 0 }
        };
    }
    return context;
};

export const SocketProvider = ({ children, userId }: { children: React.ReactNode, userId?: string }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [incomingCall, setIncomingCall] = useState<{
        isReceivingCall: boolean;
        from: string;
        name: string;
        signal: any;
        type: 'video' | 'audio' | 'speed_date';
        location?: string;
        photoUrl?: string | null;
        avatarUrl?: string | null;
        photo?: string | null;
    } | null>(null);
    const [publicStats, setPublicStats] = useState({ onlineCount: 0 });

    useEffect(() => {
        // Connect to Backend URL
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        // Dynamically get token right before connecting
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const newSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket'], // Force WebSocket only to avoid polling issues
            auth: {
                token: token
            },
            withCredentials: true,
            reconnectionDelay: 1000,
        });

        // Connection Events
        newSocket.on('connect', () => {
            setIsConnected(true);
            const freshToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (freshToken) {
                newSocket.emit('authenticate', { token: freshToken });
            }
            if (userId) {
                newSocket.emit('join-room', userId);
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket Error:", err.message);
            setIsConnected(false);
        });

        // Online Status Events
        newSocket.on('onlineUsers', (users: string[]) => {
            setOnlineUsers(users);
        });

        newSocket.on('userOnline', (userId: string) => {
            setOnlineUsers(prev => {
                if (!prev.includes(userId)) return [...prev, userId];
                return prev;
            });
        });

        newSocket.on('userOffline', (userId: string) => {
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        // Public Stats
        newSocket.on('public_stats', (data: { onlineCount: number }) => {
            setPublicStats(data);
        });

        // CALL EVENTS
        newSocket.on("callUser", ({ from, name: callerName, signal, type, location, photoUrl, avatarUrl }: any) => {
            console.log("Incoming Call from", callerName, location);
            setIncomingCall({
                isReceivingCall: true,
                from,
                name: callerName,
                signal,
                type,
                location,
                photoUrl: photoUrl || avatarUrl || null
            });
        });

        // Global message receipt event - always mark as delivered when a message hits any open client
        newSocket.on("receiveMessage", (msg: any) => {
            if (msg && msg.id && msg.senderId) {
                newSocket.emit("messageDelivered", {
                    messageId: msg.id,
                    senderId: msg.senderId
                });
            }
        });

        setSocket(newSocket);

        // Join Personal Room if UserID exists (Legacy fallback)
        if (userId) {
            newSocket.emit('join-room', userId);
        }

        return () => {
            newSocket.disconnect();
        };
    }, [userId]);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            onlineUsers,
            incomingCall,
            clearIncomingCall: () => setIncomingCall(null),
            publicStats
        }}>
            {children}
        </SocketContext.Provider>
    );
};
