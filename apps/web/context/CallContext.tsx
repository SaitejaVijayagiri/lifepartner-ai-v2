'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';

interface CallState {
    isOpen: boolean;
    mode: 'audio' | 'video' | 'speed_date';
    partner: any;
    connectionId?: string;
    incomingCallData?: any; // { signal, from, name, type }
}

interface CallContextType {
    callState: CallState;
    startCall: (partner: any, mode: 'audio' | 'video' | 'speed_date', connectionId?: string) => void;
    endCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
    const { incomingCall, clearIncomingCall } = useSocket();
    const [callState, setCallState] = useState<CallState>({
        isOpen: false,
        mode: 'video',
        partner: null
    });

    // Sync with SocketContext for Incoming Calls
    useEffect(() => {
        if (incomingCall) {
            console.log("CallContext: Received Incoming Call", incomingCall);
            setCallState({
                isOpen: true,
                mode: incomingCall.type,
                partner: {
                    id: incomingCall.from,
                    name: incomingCall.name,
                    photoUrl: 'https://ui-avatars.com/api/?name=' + (incomingCall.name || 'U')
                },
                incomingCallData: incomingCall
            });
        }
    }, [incomingCall]);

    const startCall = useCallback((partner: any, mode: 'audio' | 'video' | 'speed_date', connectionId?: string) => {
        console.log("CallContext: Starting Call", partner.name);
        setCallState({
            isOpen: true,
            mode,
            partner,
            connectionId
        });
    }, []);

    const endCall = useCallback(() => {
        console.log("CallContext: Ending Call");
        setCallState(prev => ({ ...prev, isOpen: false, incomingCallData: undefined }));
        clearIncomingCall(); // Clear socket state too
    }, [clearIncomingCall]);

    return (
        <CallContext.Provider value={{ callState, startCall, endCall }}>
            {children}
        </CallContext.Provider>
    );
};
