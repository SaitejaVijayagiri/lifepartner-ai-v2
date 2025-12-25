
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
        type: 'video' | 'audio';
    } | null;
    clearIncomingCall: () => void;
} | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        return {
            socket: null,
            isConnected: false,
            onlineUsers: [],
            incomingCall: null,
            clearIncomingCall: () => { }
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
        type: 'video' | 'audio';
    } | null>(null);

    useEffect(() => {
        // Connect to Backend URL
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const newSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            auth: {
                token: localStorage.getItem('token')
            }
        });

        // Connection Events
        newSocket.on('connect', () => {
            setIsConnected(true);
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

        // CALL EVENTS
        newSocket.on("callUser", ({ from, name: callerName, signal, type }) => {
            console.log("Incoming Call from", callerName);
            setIncomingCall({
                isReceivingCall: true,
                from,
                name: callerName,
                signal,
                type
            });
        });

        setSocket(newSocket);

        // Join Personal Room if UserID exists
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
            clearIncomingCall: () => setIncomingCall(null)
        }}>
            {children}
        </SocketContext.Provider>
    );
};
