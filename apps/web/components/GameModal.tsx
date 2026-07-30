'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, X, RefreshCw, MessageCircle, Trophy, Gamepad2, HelpCircle, Sparkles, Heart, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export type GameMode = 'snakes' | 'quiz' | 'scenario';

interface GameModalProps {
    onClose: () => void;
    partnerName: string;
    partnerId?: string;
    initialMode?: GameMode;
    onSendChatMessage?: (msg: string) => void;
}

/* 🪜 LADDERS (Bottom -> Top) */
const LADDERS: Record<number, number> = {
    4: 14,
    9: 31,
    20: 38,
    28: 84,
    51: 67,
    71: 91
};

/* 🐍 SNAKES (Head -> Tail) */
const SNAKES: Record<number, number> = {
    17: 7,
    54: 34,
    62: 19,
    87: 24,
    95: 75,
    98: 79
};

/* Quiz Questions Fallback / Preset */
const QUIZ_QUESTIONS = [
    { id: 1, text: "What is your ideal weekend vacation style?", options: ["Relaxing Sun Beach 🏖️", "Mountain Trekking 🏔️", "Luxury City Tour 🏙️", "Cozy Cabin Stay 🌲"] },
    { id: 2, text: "How do you prefer spending Friday nights?", options: ["Netflix & Home Dinner 🍿", "Party & Dancing 💃", "Late Night Long Drive 🚗", "Gaming / Reading 📚"] },
    { id: 3, text: "What is your financial planning philosophy?", options: ["Save 70% for the Future 💰", "Balance 50/50 ⚖️", "Live in the Moment 💸", "Invest in Experiences ✈️"] },
    { id: 4, text: "When a small disagreement happens, you usually...", options: ["Talk and resolve immediately 🗣️", "Take space to cool down first 🧊", "Write out thoughts 📝", "Use humor to break tension 😊"] },
    { id: 5, text: "What is your ultimate love language?", options: ["Quality Time Together ⏳", "Words of Affirmation 💌", "Thoughtful Surprise Gifts 🎁", "Physical Touch & Hugs 🫂"] }
];

function getSquareCoords(num: number): { col: number; row: number } {
    const zeroBased = num - 1;
    const rowFromBottom = Math.floor(zeroBased / 10);
    const rowFromTop = 9 - rowFromBottom;
    const colFromLeft = rowFromBottom % 2 === 0 ? (zeroBased % 10) : (9 - (zeroBased % 10));
    return { col: colFromLeft, row: rowFromTop };
}

const DICE_DOTS: Record<number, string> = {
    1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
};

/* 🎵 Web Audio API Synthesized Sound Effects (Zero External Assets) */
function playSFX(type: 'roll' | 'ladder' | 'snake' | 'win' | 'select') {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'roll') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'ladder') {
            [261, 329, 392, 523].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + (idx + 1) * 0.08);
            });
        } else if (type === 'snake') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(360, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'win') {
            [440, 554, 659, 880].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
            });
        } else if (type === 'select') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        }
    } catch (e) {
        // AudioContext not allowed or unsupported in environment
    }
}

export default function GameModal({ onClose, partnerName, partnerId, initialMode = 'snakes', onSendChatMessage }: GameModalProps) {
    const toast = useToast();
    const { socket } = useSocket();
    const { user } = useAuth();

    /* Game Mode State */
    const [activeMode, setActiveMode] = useState<GameMode>(initialMode);

    /* Presence & Microphone State */
    const [partnerStatus, setPartnerStatus] = useState<'connected' | 'waiting' | 'left'>('connected');
    const [isMicOn, setIsMicOn] = useState<boolean>(false);
    const [isPartnerMicOn, setIsPartnerMicOn] = useState<boolean>(false);
    const localStreamRef = useRef<MediaStream | null>(null);

    /* Turn Determination: Deterministic order so both sides agree who starts */
    const isHost = !partnerId || (user?.id ? user.id < partnerId : true);

    /* ─── SNAKES & LADDERS GAME STATE ─── */
    const [myPos, setMyPos] = useState<number>(1);
    const [partnerPos, setPartnerPos] = useState<number>(1);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState<boolean>(isHost);
    const [winner, setWinner] = useState<string | null>(null);
    const [gameLog, setGameLog] = useState<string>(
        isHost ? "Your turn! Tap 'Roll 3D Dice' to begin." : `Waiting for ${partnerName} to roll...`
    );

    /* ─── COUPLE QUIZ GAME STATE ─── */
    const [quizIndex, setQuizIndex] = useState(0);
    const [myAnswers, setMyAnswers] = useState<Record<number, number>>({});
    const [partnerAnswers, setPartnerAnswers] = useState<Record<number, number>>({});
    const [quizFinished, setQuizFinished] = useState(false);

    /* ─── AI SCENARIO GAME STATE ─── */
    const [scenarioText, setScenarioText] = useState<string | null>(null);
    const [loadingScenario, setLoadingScenario] = useState(false);
    const [myChoice, setMyChoice] = useState<string | null>(null);

    /* WebRTC Audio Peer Connection Refs */
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

    const createPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) return peerConnectionRef.current;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        });

        pc.ontrack = (event) => {
            if (remoteAudioRef.current && event.streams[0]) {
                remoteAudioRef.current.srcObject = event.streams[0];
                remoteAudioRef.current.play().catch(console.error);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && partnerId) {
                socket.emit('game_audio_signal', { to: partnerId, candidate: event.candidate });
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket, partnerId]);

    /* Ultra-Low Latency Direct Local Microphone Handler */
    const toggleMicrophone = async () => {
        if (!isMicOn) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 48000
                    }
                });
                localStreamRef.current = stream;
                setIsMicOn(true);
                toast.success("Microphone On - Ultra Low Latency Live 🎙️");

                const pc = createPeerConnection();
                stream.getTracks().forEach(track => {
                    const sender = pc.addTrack(track, stream);
                    try {
                        const params = sender.getParameters();
                        if (params.encodings && params.encodings[0]) {
                            (params.encodings[0] as any).maxBitrate = 64000;
                            sender.setParameters(params).catch(() => {});
                        }
                    } catch (e) {}
                });

                const offer = await pc.createOffer({ offerToReceiveAudio: true });
                await pc.setLocalDescription(offer);

                if (socket && partnerId) {
                    socket.emit('game_audio_signal', { to: partnerId, sdp: pc.localDescription });
                    socket.emit('game_voice', { to: partnerId, senderId: user?.id, active: true });
                }
            } catch (err) {
                console.error("Mic access error", err);
                toast.error("Could not access microphone.");
            }
        } else {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            setIsMicOn(false);
            toast.success("Microphone Muted 🎤");

            if (socket && partnerId) {
                socket.emit('game_voice', { to: partnerId, senderId: user?.id, active: false });
            }
        }
    };

    /* Cleanup Microphone Tracks & Peer Connection on Unmount */
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        };
    }, []);

    /* Board Sync Request on Mount */
    useEffect(() => {
        if (!socket || !partnerId) return;

        // Request initial board & mode synchronization from partner if active
        socket.emit("game_sync_request", { to: partnerId });

        return () => {
            socket.emit("game_leave", { to: partnerId });
        };
    }, [socket, partnerId]);

    /* Fetch AI Scenario if mode active */
    const loadAIScenario = useCallback(async () => {
        if (!partnerId) return;
        setLoadingScenario(true);
        try {
            const res = await api.games.startScenario(partnerId);
            if (res.success && res.scenario) {
                setScenarioText(res.scenario);
            } else {
                setScenarioText("Imagine you both go on a spontaneous weekend getaway without a plan. What's your first priority?");
            }
        } catch (e) {
            setScenarioText("You win two tickets to any destination in the world tomorrow. Where do you choose to go together?");
        } finally {
            setLoadingScenario(false);
        }
    }, [partnerId]);

    useEffect(() => {
        if (activeMode === 'scenario' && !scenarioText && !loadingScenario) {
            loadAIScenario();
        }
    }, [activeMode, scenarioText, loadingScenario, loadAIScenario]);

    /* Real-Time Socket Listeners */
    useEffect(() => {
        if (!socket) return;

        const handleGameAccept = (data: { from: string }) => {
            if (data.from === partnerId) {
                setPartnerStatus('connected');
                toast.success(`🟢 ${partnerName} joined live!`);
            }
        };

        const handleGameLeave = (data: { from: string }) => {
            if (data.from === partnerId) {
                setPartnerStatus('left');
                toast.error(`🔴 ${partnerName} left the game.`);
                setGameLog(`🔴 ${partnerName} left the session.`);
            }
        };

        const handleSyncRequest = (data: { from: string }) => {
            if (data.from === partnerId && socket) {
                socket.emit("game_sync_response", {
                    to: partnerId,
                    myPos,
                    partnerPos: myPos,
                    isMyTurn,
                    winner,
                    gameLog,
                    mode: activeMode,
                    myAnswers,
                    quizFinished
                });
            }
        };

        const handleSyncResponse = (data: any) => {
            if (data.from === partnerId) {
                setPartnerPos(data.myPos);
                setIsMyTurn(!data.isMyTurn);
                if (data.winner) setWinner(data.winner);
                if (data.gameLog) setGameLog(data.gameLog);
                if (data.mode) setActiveMode(data.mode);
                if (data.myAnswers) setPartnerAnswers(data.myAnswers);
                if (data.quizFinished) setQuizFinished(data.quizFinished);
                setPartnerStatus('connected');
            }
        };

        const handleRemoteMove = (data: { from?: string; senderId?: string; rolled: number; pos: number; nextPos: number; isWinner: boolean; nextTurnUserId: string }) => {
            const sender = data.from || data.senderId;
            if (user?.id && sender === user.id) return;

            setPartnerStatus('connected');
            setDiceValue(data.rolled);
            setIsRolling(true);
            playSFX('roll');

            setTimeout(() => {
                setIsRolling(false);
                setPartnerPos(data.nextPos);

                if (data.isWinner) {
                    setWinner('partner');
                    playSFX('win');
                    toast.error(`🏆 ${partnerName} reached Square 100 and won!`);
                    setGameLog(`🏆 ${partnerName} reached Square 100!`);
                } else {
                    const isNowMyTurn = data.nextTurnUserId === user?.id;
                    setIsMyTurn(isNowMyTurn);

                    if (LADDERS[data.pos]) {
                        playSFX('ladder');
                        setGameLog(`🪜 ${partnerName} landed on ${data.pos} & climbed to ${data.nextPos}!`);
                    } else if (SNAKES[data.pos]) {
                        playSFX('snake');
                        setGameLog(`🐍 ${partnerName} bit on ${data.pos} & slid to ${data.nextPos}!`);
                    } else {
                        setGameLog(`🎲 ${partnerName} rolled a ${data.rolled} & moved to ${data.nextPos}.`);
                    }
                }
            }, 400);
        };

        const handleRemoteQuizAnswer = (data: { from?: string; questionId: number; optionIndex: number }) => {
            if (data.from === partnerId) {
                setPartnerAnswers(prev => ({ ...prev, [data.questionId]: data.optionIndex }));
                toast.info(`✨ ${partnerName} answered Question ${data.questionId}!`);
            }
        };

        const handleRemoteVoice = (data: { from?: string; senderId?: string; active: boolean }) => {
            const sender = data.from || data.senderId;
            if (user?.id && sender !== user.id) {
                setIsPartnerMicOn(data.active);
            }
        };

        const handleAudioSignal = async (data: { from?: string; sdp?: any; candidate?: any }) => {
            const sender = data.from;
            if (sender !== partnerId) return;

            const pc = createPeerConnection();
            try {
                if (data.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

                    // Process buffered ICE candidates safely after remote description set
                    while (iceCandidateQueueRef.current.length > 0) {
                        const candidate = iceCandidateQueueRef.current.shift();
                        if (candidate) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
                        }
                    }

                    if (data.sdp.type === 'offer') {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        if (socket && partnerId) {
                            socket.emit('game_audio_signal', { to: partnerId, sdp: pc.localDescription });
                        }
                    }
                } else if (data.candidate) {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } else {
                        iceCandidateQueueRef.current.push(data.candidate);
                    }
                }
            } catch (err) {
                console.error("WebRTC Audio Signal Error", err);
            }
        };

        socket.on('game_accept', handleGameAccept);
        socket.on('game_leave', handleGameLeave);
        socket.on('game_sync_request', handleSyncRequest);
        socket.on('game_sync_response', handleSyncResponse);
        socket.on('game_move', handleRemoteMove);
        socket.on('quiz_answer', handleRemoteQuizAnswer);
        socket.on('game_voice', handleRemoteVoice);
        socket.on('game_audio_signal', handleAudioSignal);

        return () => {
            socket.off('game_accept', handleGameAccept);
            socket.off('game_leave', handleGameLeave);
            socket.off('game_sync_request', handleSyncRequest);
            socket.off('game_sync_response', handleSyncResponse);
            socket.off('game_move', handleRemoteMove);
            socket.off('quiz_answer', handleRemoteQuizAnswer);
            socket.off('game_voice', handleRemoteVoice);
            socket.off('game_audio_signal', handleAudioSignal);
        };
    }, [socket, user?.id, partnerId, partnerName, myPos, isMyTurn, winner, gameLog, activeMode, myAnswers, quizFinished, createPeerConnection, toast]);

    /* Handle Player Roll */
    const handleRollDice = () => {
        if (isRolling || winner || !isMyTurn) return;
        setIsRolling(true);
        playSFX('roll');

        setTimeout(() => {
            const rolled = Math.floor(Math.random() * 6) + 1;
            setDiceValue(rolled);
            setIsRolling(false);

            let nextPos = myPos + rolled;
            let logMsg = `🎲 Rolled a ${rolled}! Advanced to square ${nextPos}.`;

            if (nextPos > 100) {
                setGameLog(`🎲 Rolled a ${rolled}. Over 100! Skip turn.`);
                nextPos = myPos;
                setIsMyTurn(false);

                if (socket && partnerId) {
                    socket.emit('game_move', {
                        to: partnerId,
                        senderId: user?.id,
                        rolled,
                        pos: myPos,
                        nextPos: myPos,
                        isWinner: false,
                        nextTurnUserId: partnerId
                    });
                }
                return;
            }

            const landPos = nextPos;
            if (LADDERS[landPos]) {
                nextPos = LADDERS[landPos];
                logMsg = `🪜 LADDER! Landed on ${landPos} & climbed to ${nextPos}! 🎉`;
                playSFX('ladder');
                toast.success(`Climbed Ladder to square ${nextPos}! 🪜`);
            } else if (SNAKES[landPos]) {
                nextPos = SNAKES[landPos];
                logMsg = `🐍 SNAKE! Bit on ${landPos} & slid to ${nextPos}! 😅`;
                playSFX('snake');
                toast.error(`Bit by Snake! Slid down to ${nextPos} 🐍`);
            }

            setMyPos(nextPos);
            setGameLog(logMsg);

            const isWin = nextPos === 100;
            if (isWin) {
                setWinner('me');
                playSFX('win');
                toast.success("🏆 VICTORY! Reached Square 100!");
            }

            const keepTurn = rolled === 6 && !isWin;
            const nextTurnUser = keepTurn ? (user?.id || 'me') : (partnerId || 'partner');
            setIsMyTurn(keepTurn);

            if (socket && partnerId) {
                socket.emit('game_move', {
                    to: partnerId,
                    senderId: user?.id,
                    rolled,
                    pos: landPos,
                    nextPos,
                    isWinner: isWin,
                    nextTurnUserId: nextTurnUser
                });
            }
        }, 400);
    };

    /* Submit Quiz Option Choice */
    const handleSelectQuizOption = (qId: number, optionIdx: number) => {
        playSFX('select');
        const updated = { ...myAnswers, [qId]: optionIdx };
        setMyAnswers(updated);

        if (socket && partnerId) {
            socket.emit('quiz_answer', { to: partnerId, questionId: qId, optionIndex: optionIdx });
        }

        if (qId < QUIZ_QUESTIONS.length) {
            setQuizIndex(qId);
        } else {
            setQuizFinished(true);
            playSFX('win');
        }
    };

    /* Calculate Quiz Match Score */
    const calculateQuizMatchScore = () => {
        let matches = 0;
        let answered = 0;
        QUIZ_QUESTIONS.forEach(q => {
            if (myAnswers[q.id] !== undefined && partnerAnswers[q.id] !== undefined) {
                answered++;
                if (myAnswers[q.id] === partnerAnswers[q.id]) matches++;
            }
        });
        if (answered === 0) return 80; // Default compatibility preview
        return Math.round((matches / answered) * 100);
    };

    /* Share Result to Chat */
    const handleShareResult = (text: string) => {
        if (onSendChatMessage) {
            onSendChatMessage(text);
            toast.success("Result shared to chat!");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 w-screen h-screen z-[3000] bg-slate-950 backdrop-blur-2xl flex flex-col justify-between text-white font-sans overflow-hidden animate-in fade-in duration-200">
            {/* Hidden Remote Audio Element for Live Audio Stream */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* ─── HEADER BAR WITH DIRECT MIC TOGGLE & GAME SELECTOR ─── */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-2xl z-20">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-emerald-500/30 border border-emerald-400/30">
                        {activeMode === 'snakes' ? '🐍' : activeMode === 'quiz' ? '❓' : '🔮'}
                    </div>
                    <div>
                        <h1 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-2 leading-tight text-white">
                            {activeMode === 'snakes' ? 'Snakes & Ladders Arena' : activeMode === 'quiz' ? 'Couple Compatibility Quiz' : 'AI Romantic Scenario'}
                            <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shadow-sm">LIVE 2P</span>
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
                            <span>Playing with <strong className="text-white font-bold">{partnerName}</strong></span>
                            <span>•</span>
                            {partnerStatus === 'connected' ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                                </span>
                            ) : (
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Connecting...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Direct Microphone Toggle (No Phone Ringing) */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMicrophone}
                        className={`px-3 sm:px-4 py-2 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold ${
                            isMicOn
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                    >
                        {isMicOn ? <Mic size={16} className="text-white" /> : <MicOff size={16} className="text-slate-400" />}
                        <span className="hidden sm:inline">{isMicOn ? 'Mic ON (Live)' : 'Turn ON Mic 🎤'}</span>

                        {isMicOn && (
                            <div className="flex items-end gap-0.5 h-3.5 ml-1">
                                <span className="w-1 bg-white rounded-full animate-bounce h-full"></span>
                                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.15s] h-3/4"></span>
                                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.3s] h-full"></span>
                            </div>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl transition-colors border border-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* In-Game Status Banner & Mode Tabs */}
            <div className="bg-slate-900/80 px-3 sm:px-6 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-bold shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                        onClick={() => setActiveMode('snakes')}
                        className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${activeMode === 'snakes' ? 'bg-emerald-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Gamepad2 size={14} /> Snakes & Ladders
                    </button>
                    <button
                        onClick={() => setActiveMode('quiz')}
                        className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${activeMode === 'quiz' ? 'bg-pink-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
                    >
                        <HelpCircle size={14} /> Couple Quiz
                    </button>
                    <button
                        onClick={() => setActiveMode('scenario')}
                        className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${activeMode === 'scenario' ? 'bg-amber-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Sparkles size={14} /> AI Scenario
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMicOn ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                        Your Mic: {isMicOn ? 'ON 🎙️' : 'OFF 🎤'}
                    </span>
                    {isPartnerMicOn && (
                        <span className="bg-teal-950 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full text-[10px]">
                            {partnerName}'s Mic: ON 🔊
                        </span>
                    )}
                </div>
            </div>

            {/* ─── MAIN ARENA CONTENT DEPENDING ON ACTIVE MODE ─── */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto max-w-2xl mx-auto w-full">

                {/* 🐍 MODE 1: SNAKES & LADDERS ARENA */}
                {activeMode === 'snakes' && (
                    <>
                        <div className="w-full max-w-[360px] sm:max-w-[440px] flex items-center justify-between gap-2.5 mb-2.5">
                            <div className={`flex-1 p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${isMyTurn ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border-red-500 shadow-xl shadow-red-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                                <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-sm shadow-md">🔴</div>
                                <div className="min-w-0">
                                    <div className="text-xs font-black truncate text-white">You</div>
                                    <div className="text-[11px] font-bold text-red-400">Square {myPos} / 100</div>
                                </div>
                            </div>

                            <div className={`flex-1 p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${!isMyTurn ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-sm shadow-md">🟢</div>
                                <div className="min-w-0">
                                    <div className="text-xs font-black truncate text-white">{partnerName}</div>
                                    <div className="text-[11px] font-bold text-emerald-400">Square {partnerPos} / 100</div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-[360px] sm:max-w-[440px] aspect-square bg-slate-900 border-4 border-amber-500/80 rounded-3xl shadow-2xl p-1.5 grid grid-cols-10 grid-rows-10 gap-0.5 relative shrink-0 overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {Object.entries(LADDERS).map(([start, end]) => {
                                    const c1 = getSquareCoords(Number(start));
                                    const c2 = getSquareCoords(Number(end));
                                    return (
                                        <line
                                            key={`ladder-${start}`}
                                            x1={c1.col * 10 + 5}
                                            y1={c1.row * 10 + 5}
                                            x2={c2.col * 10 + 5}
                                            y2={c2.row * 10 + 5}
                                            stroke="#10b981"
                                            strokeWidth="1.2"
                                            strokeDasharray="1.5 1"
                                            opacity="0.85"
                                        />
                                    );
                                })}

                                {Object.entries(SNAKES).map(([head, tail]) => {
                                    const c1 = getSquareCoords(Number(head));
                                    const c2 = getSquareCoords(Number(tail));
                                    const cx = (c1.col * 10 + 5 + c2.col * 10 + 5) / 2 + 3;
                                    const cy = (c1.row * 10 + 5 + c2.row * 10 + 5) / 2;
                                    return (
                                        <path
                                            key={`snake-${head}`}
                                            d={`M ${c1.col * 10 + 5} ${c1.row * 10 + 5} Q ${cx} ${cy} ${c2.col * 10 + 5} ${c2.row * 10 + 5}`}
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="1.2"
                                            opacity="0.85"
                                        />
                                    );
                                })}
                            </svg>

                            {Array.from({ length: 100 }, (_, index) => {
                                const row = Math.floor(index / 10);
                                const col = index % 10;
                                const actualRow = 9 - row;
                                const squareNum = actualRow % 2 === 1 ? (actualRow * 10) + (10 - col) : (actualRow * 10) + col + 1;
                                const isLadderStart = LADDERS[squareNum];
                                const isSnakeHead = SNAKES[squareNum];
                                const hasP1 = myPos === squareNum;
                                const hasP2 = partnerPos === squareNum;
                                const isEven = (row + col) % 2 === 0;

                                return (
                                    <div
                                        key={squareNum}
                                        className={`rounded-lg flex flex-col items-center justify-between p-0.5 text-[8px] sm:text-[10px] font-extrabold relative border z-10 ${
                                            squareNum === 100
                                                ? 'bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 shadow-xl animate-pulse'
                                                : (isLadderStart
                                                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-inner'
                                                    : (isSnakeHead
                                                        ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-inner'
                                                        : (isEven ? 'bg-slate-900/90 border-slate-800/80 text-slate-400' : 'bg-slate-800/90 border-slate-700/80 text-slate-300')))
                                        }`}
                                    >
                                        <span className="opacity-60 leading-none">{squareNum}</span>
                                        {isLadderStart && <span className="text-[10px] sm:text-xs text-emerald-400 drop-shadow">🪜</span>}
                                        {isSnakeHead && <span className="text-[10px] sm:text-xs text-rose-400 drop-shadow">🐍</span>}
                                        {squareNum === 100 && <span className="text-[11px] sm:text-xs">🏆</span>}

                                        <div className="flex gap-0.5 z-20">
                                            {hasP1 && <span className="text-[11px] sm:text-xs drop-shadow-md animate-bounce">🔴</span>}
                                            {hasP2 && <span className="text-[11px] sm:text-xs drop-shadow-md animate-bounce">🟢</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="w-full max-w-[360px] sm:max-w-[440px] mt-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-3xl shadow-2xl flex flex-col items-center space-y-2.5">
                            <p className="text-xs sm:text-sm font-semibold text-slate-200 text-center min-h-[24px]">{gameLog}</p>

                            <div className="flex items-center justify-between w-full gap-3">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border-4 border-amber-500 shadow-2xl flex items-center justify-center text-4xl font-black text-amber-400 transition-transform ${isRolling ? 'animate-bounce scale-110' : ''}`}>
                                    {diceValue !== null ? (DICE_DOTS[diceValue] || diceValue) : '🎲'}
                                </div>

                                {!winner ? (
                                    <Button
                                        onClick={handleRollDice}
                                        disabled={isRolling || !isMyTurn}
                                        className="flex-1 py-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isRolling ? 'Rolling...' : (isMyTurn ? '🎲 Roll 3D Dice' : `Waiting for ${partnerName}...`)}
                                    </Button>
                                ) : (
                                    <div className="flex-1 flex gap-2">
                                        <Button onClick={() => { setMyPos(1); setPartnerPos(1); setWinner(null); setIsMyTurn(true); }} variant="outline" className="flex-1 text-xs font-bold border-slate-700 text-white rounded-xl">
                                            Play Again
                                        </Button>
                                        <Button onClick={() => handleShareResult(`🐍 Played Snakes & Ladders with ${partnerName}! Winner: ${winner === 'me' ? 'Me' : partnerName} 🏆`)} className="flex-1 text-xs font-bold bg-emerald-600 text-white rounded-xl">
                                            Share Result
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ❓ MODE 2: COUPLE COMPATIBILITY QUIZ */}
                {activeMode === 'quiz' && (
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
                        {!quizFinished ? (
                            <>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                                    <span>Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                                    <span className="text-pink-400">Match Quiz 💖</span>
                                </div>

                                <h3 className="text-base sm:text-lg font-black text-white px-2">
                                    {QUIZ_QUESTIONS[quizIndex].text}
                                </h3>

                                <div className="space-y-2.5 text-left">
                                    {QUIZ_QUESTIONS[quizIndex].options.map((opt, idx) => {
                                        const isMySelected = myAnswers[QUIZ_QUESTIONS[quizIndex].id] === idx;
                                        const isPartnerSelected = partnerAnswers[QUIZ_QUESTIONS[quizIndex].id] === idx;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectQuizOption(QUIZ_QUESTIONS[quizIndex].id, idx)}
                                                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs sm:text-sm font-bold ${
                                                    isMySelected
                                                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white shadow-lg shadow-pink-600/30'
                                                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                                                }`}
                                            >
                                                <span>{opt}</span>
                                                <div className="flex items-center gap-1">
                                                    {isMySelected && <CheckCircle2 size={16} className="text-white" />}
                                                    {isPartnerSelected && <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md">{partnerName}</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <Button
                                        onClick={() => setQuizIndex(prev => Math.max(0, prev - 1))}
                                        disabled={quizIndex === 0}
                                        variant="outline"
                                        className="text-xs border-slate-700 text-slate-300 rounded-xl"
                                    >
                                        Previous
                                    </Button>

                                    {myAnswers[QUIZ_QUESTIONS[quizIndex].id] !== undefined && (
                                        <Button
                                            onClick={() => {
                                                if (quizIndex < QUIZ_QUESTIONS.length - 1) {
                                                    setQuizIndex(prev => prev + 1);
                                                } else {
                                                    setQuizFinished(true);
                                                    playSFX('win');
                                                }
                                            }}
                                            className="text-xs bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold"
                                        >
                                            {quizIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question ➡️' : 'See Results 🏆'}
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 py-4 animate-in zoom-in-95">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-4xl mx-auto shadow-xl shadow-pink-500/30">
                                    ❤️
                                </div>
                                <h3 className="text-xl font-black text-white">Quiz Completed!</h3>
                                <p className="text-sm text-slate-300">
                                    Your Compatibility Score with <strong>{partnerName}</strong>:
                                </p>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400">
                                    {calculateQuizMatchScore()}% Match!
                                </div>

                                <div className="flex gap-2 pt-3">
                                    <Button onClick={() => { setQuizFinished(false); setQuizIndex(0); setMyAnswers({}); }} variant="outline" className="flex-1 border-slate-700 text-white rounded-xl text-xs font-bold">
                                        Retake Quiz
                                    </Button>
                                    <Button onClick={() => handleShareResult(`❓ Took Couple Compatibility Quiz with ${partnerName}! Score: ${calculateQuizMatchScore()}% Match! ❤️`)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold">
                                        Share to Chat
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 🔮 MODE 3: AI ROMANTIC SCENARIO */}
                {activeMode === 'scenario' && (
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                            <Sparkles size={16} /> AI Relationship Scenario Generator
                        </div>

                        {loadingScenario ? (
                            <div className="py-8 space-y-3">
                                <RefreshCw size={28} className="animate-spin text-amber-400 mx-auto" />
                                <p className="text-xs text-slate-400 font-semibold">Generating personalized icebreaker scenario...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-sm text-slate-200 leading-relaxed text-left shadow-inner">
                                    "{scenarioText}"
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 text-left">Your Reaction / Choice:</p>
                                    <textarea
                                        value={myChoice || ''}
                                        onChange={(e) => setMyChoice(e.target.value)}
                                        placeholder={`Type your response to ${partnerName}...`}
                                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[70px]"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={loadAIScenario} variant="outline" className="border-slate-700 text-slate-300 rounded-xl text-xs font-bold">
                                        New Scenario 🔄
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (myChoice?.trim()) {
                                                handleShareResult(`🔮 AI Scenario Question: "${scenarioText}"\nMy Answer: ${myChoice}`);
                                            } else {
                                                toast.error("Type your answer before sharing!");
                                            }
                                        }}
                                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                                    >
                                        Share Choice 💬
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
