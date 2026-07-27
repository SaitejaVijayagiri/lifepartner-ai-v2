'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, X, RefreshCw, MessageCircle, Trophy, Sparkles, UserCheck, UserX, VolumeX, Flame } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useCall } from '@/context/CallContext';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

interface GameModalProps {
    onClose: () => void;
    partnerName: string;
    partnerId?: string;
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

/* Helper to convert square number (1-100) to grid coordinates (0-9 col, 0-9 row from top) */
function getSquareCoords(num: number): { col: number; row: number } {
    const zeroBased = num - 1;
    const rowFromBottom = Math.floor(zeroBased / 10);
    const rowFromTop = 9 - rowFromBottom;
    const colFromLeft = rowFromBottom % 2 === 0 ? (zeroBased % 10) : (9 - (zeroBased % 10));
    return { col: colFromLeft, row: rowFromTop };
}

/* 3D Dice Face Dots Renderer */
const DICE_DOTS: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
};

export default function GameModal({ onClose, partnerName, partnerId, onSendChatMessage }: GameModalProps) {
    const toast = useToast();
    const { startCall } = useCall();
    const { socket } = useSocket();
    const { user } = useAuth();

    /* Presence & Connection State */
    const [partnerStatus, setPartnerStatus] = useState<'connected' | 'waiting' | 'left'>('connected');
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    /* ─── SNAKES & LADDERS GAME STATE ─── */
    const [myPos, setMyPos] = useState<number>(1);
    const [partnerPos, setPartnerPos] = useState<number>(1);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState<boolean>(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [gameLog, setGameLog] = useState<string>("Your turn! Tap 'Roll Dice' to begin.");

    /* Auto-Connect WebRTC Voice Stream on Mount */
    useEffect(() => {
        if (!partnerId) return;

        try {
            startCall({ id: partnerId, name: partnerName }, 'audio');
            setIsVoiceActive(true);
            toast.success(`🎙️ Live Audio Voice Connected with ${partnerName}!`);
        } catch (e) {
            console.error("Auto voice call error", e);
        }
    }, [partnerId, partnerName, startCall, toast]);

    /* Notify Partner on Mount & Unmount */
    useEffect(() => {
        if (!socket || !partnerId) return;

        socket.emit("game_invite", { to: partnerId, senderName: user?.full_name || 'Your Match', gameType: 'snakes' });

        return () => {
            socket.emit("game_leave", { to: partnerId });
        };
    }, [socket, partnerId, user?.full_name]);

    /* Real-Time Socket Listeners */
    useEffect(() => {
        if (!socket) return;

        const handleGameAccept = (data: { from: string }) => {
            if (data.from === partnerId) {
                setPartnerStatus('connected');
                toast.success(`🟢 ${partnerName} connected live to the board!`);
            }
        };

        const handleGameLeave = (data: { from: string }) => {
            if (data.from === partnerId) {
                setPartnerStatus('left');
                toast.error(`🔴 ${partnerName} left the game.`);
                setGameLog(`🔴 ${partnerName} left the game session.`);
            }
        };

        const handleRemoteMove = (data: { from?: string; senderId?: string; rolled: number; pos: number; nextPos: number; isWinner: boolean; nextTurnUserId: string }) => {
            const sender = data.from || data.senderId;
            if (sender === user?.id) return;

            setPartnerStatus('connected');
            setDiceValue(data.rolled);
            setIsRolling(true);

            setTimeout(() => {
                setIsRolling(false);
                setPartnerPos(data.nextPos);

                if (data.isWinner) {
                    setWinner('partner');
                    toast.error(`🏆 ${partnerName} reached Square 100 and won!`);
                    setGameLog(`🏆 ${partnerName} reached Square 100!`);
                } else {
                    const isNowMyTurn = data.nextTurnUserId === user?.id;
                    setIsMyTurn(isNowMyTurn);

                    if (LADDERS[data.pos]) {
                        setGameLog(`🪜 ${partnerName} landed on ${data.pos} & climbed to ${data.nextPos}!`);
                    } else if (SNAKES[data.pos]) {
                        setGameLog(`🐍 ${partnerName} bit on ${data.pos} & slid to ${data.nextPos}!`);
                    } else {
                        setGameLog(`🎲 ${partnerName} rolled a ${data.rolled} & moved to ${data.nextPos}.`);
                    }
                }
            }, 400);
        };

        const handleRemoteVoice = (data: { from?: string; senderId?: string; active: boolean }) => {
            const sender = data.from || data.senderId;
            if (sender !== user?.id) {
                setIsVoiceActive(data.active);
            }
        };

        socket.on('game_accept', handleGameAccept);
        socket.on('game_leave', handleGameLeave);
        socket.on('game_move', handleRemoteMove);
        socket.on('game_voice', handleRemoteVoice);

        return () => {
            socket.off('game_accept', handleGameAccept);
            socket.off('game_leave', handleGameLeave);
            socket.off('game_move', handleRemoteMove);
            socket.off('game_voice', handleRemoteVoice);
        };
    }, [socket, user?.id, partnerId, partnerName, toast]);

    /* Toggle Live Voice Chat */
    const toggleVoiceChat = () => {
        const nextState = !isVoiceActive;
        setIsVoiceActive(nextState);

        if (socket && partnerId) {
            socket.emit('game_voice', { to: partnerId, senderId: user?.id, active: nextState });
        }

        if (nextState) {
            toast.success("Voice Chat connected! Speak freely.");
            if (partnerId) {
                try { startCall({ id: partnerId, name: partnerName }, 'audio'); } catch (e) {}
            }
        } else {
            toast.success("Voice Chat muted.");
        }
    };

    /* Handle Player Roll */
    const handleRollDice = () => {
        if (isRolling || winner || !isMyTurn) return;
        setIsRolling(true);

        setTimeout(() => {
            const rolled = Math.floor(Math.random() * 6) + 1;
            setDiceValue(rolled);
            setIsRolling(false);

            let nextPos = myPos + rolled;
            let logMsg = `🎲 Rolled a ${rolled}! Advanced to square ${nextPos}.`;

            if (nextPos > 100) {
                setGameLog(`🎲 Rolled a ${rolled}. Over 100! Skipped turn.`);
                nextPos = myPos;
                const nextTurn = partnerId || 'partner';
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

            // Check Ladders / Snakes
            const landPos = nextPos;
            if (LADDERS[landPos]) {
                nextPos = LADDERS[landPos];
                logMsg = `🪜 LADDER! Landed on ${landPos} & climbed to ${nextPos}! 🎉`;
                toast.success(`Climbed Ladder to square ${nextPos}! 🪜`);
            } else if (SNAKES[landPos]) {
                nextPos = SNAKES[landPos];
                logMsg = `🐍 SNAKE! Bit on ${landPos} & slid to ${nextPos}! 😅`;
                toast.error(`Bit by Snake! Slid down to ${nextPos} 🐍`);
            }

            setMyPos(nextPos);
            setGameLog(logMsg);

            const isWin = nextPos === 100;
            if (isWin) {
                setWinner('me');
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

            {/* ─── PREMIUM HEADER WITH AUDIO WAVE VISUALIZER ─── */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-2xl z-20">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-emerald-500/30 border border-emerald-400/30">
                        🐍
                    </div>
                    <div>
                        <h1 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-2 leading-tight text-white">
                            Snakes & Ladders Arena
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

                {/* Seamless Voice Chat & Soundwave Visualizer */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleVoiceChat}
                        className={`px-3 sm:px-4 py-2 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold ${
                            isVoiceActive
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                    >
                        {isVoiceActive ? <Volume2 size={16} className="animate-pulse" /> : <VolumeX size={16} />}
                        <span className="hidden sm:inline">{isVoiceActive ? 'Voice Active' : 'Enable Voice'}</span>

                        {/* Live Audio Wave Visualizer Bars */}
                        {isVoiceActive && !isMuted && (
                            <div className="flex items-end gap-0.5 h-3.5 ml-1">
                                <span className="w-1 bg-white rounded-full animate-bounce h-full"></span>
                                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.15s] h-3/4"></span>
                                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.3s] h-full"></span>
                            </div>
                        )}
                    </button>

                    {isVoiceActive && (
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-2xl text-white transition-all ${isMuted ? 'bg-red-500 shadow-lg shadow-red-500/40' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'}`}
                            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl transition-colors border border-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Live Audio Banner */}
            {isVoiceActive && (
                <div className="bg-emerald-500/10 px-4 py-1.5 border-b border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-bold shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Voice Chat Connected • Speak freely with {partnerName}
                    </div>
                    <span className="bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">{isMuted ? 'Mic Muted' : 'Mic Active'}</span>
                </div>
            )}

            {/* ─── MAIN ARENA BOARD (HIGH VIBE UI) ─── */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto max-w-2xl mx-auto w-full">

                {/* INLINE PLAYER SCORE & TURN BAR */}
                <div className="w-full max-w-[360px] sm:max-w-[440px] flex items-center justify-between gap-2.5 mb-2.5">
                    <div className={`flex-1 p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${isMyTurn ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border-red-500 shadow-xl shadow-red-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                        <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-sm shadow-md">
                            🔴
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-black truncate text-white">You</div>
                            <div className="text-[11px] font-bold text-red-400">Square {myPos} / 100</div>
                        </div>
                    </div>

                    <div className={`flex-1 p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${!isMyTurn ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                        <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-sm shadow-md">
                            🟢
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-black truncate text-white">{partnerName}</div>
                            <div className="text-[11px] font-bold text-emerald-400">Square {partnerPos} / 100</div>
                        </div>
                    </div>
                </div>

                {/* 100-SQUARE BOARD CONTAINER WITH OVERLAY PATHS */}
                <div className="w-full max-w-[360px] sm:max-w-[440px] aspect-square bg-slate-900 border-4 border-amber-500/80 rounded-3xl shadow-2xl p-1.5 grid grid-cols-10 grid-rows-10 gap-0.5 relative shrink-0 overflow-hidden">
                    
                    {/* SVG PATHS OVERLAY FOR SNAKES & LADDERS */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {/* Ladders Paths (Glowing Emerald Lines) */}
                        {Object.entries(LADDERS).map(([start, end]) => {
                            const c1 = getSquareCoords(Number(start));
                            const c2 = getSquareCoords(Number(end));
                            const x1 = `${(c1.col + 0.5) * 10}%`;
                            const y1 = `${(c1.row + 0.5) * 10}%`;
                            const x2 = `${(c2.col + 0.5) * 10}%`;
                            const y2 = `${(c2.row + 0.5) * 10}%`;

                            return (
                                <g key={`ladder-${start}`}>
                                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth="4" strokeDasharray="5 3" opacity="0.8" />
                                </g>
                            );
                        })}

                        {/* Snakes Paths (Crimson Red Curved Lines) */}
                        {Object.entries(SNAKES).map(([head, tail]) => {
                            const c1 = getSquareCoords(Number(head));
                            const c2 = getSquareCoords(Number(tail));
                            const x1 = (c1.col + 0.5) * 10;
                            const y1 = (c1.row + 0.5) * 10;
                            const x2 = (c2.col + 0.5) * 10;
                            const y2 = (c2.row + 0.5) * 10;
                            const cx = (x1 + x2) / 2 + 10;
                            const cy = (y1 + y2) / 2;

                            return (
                                <path
                                    key={`snake-${head}`}
                                    d={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="4"
                                    opacity="0.85"
                                />
                            );
                        })}
                    </svg>

                    {/* 100 BOARD TILES */}
                    {Array.from({ length: 100 }, (_, index) => {
                        const row = Math.floor(index / 10);
                        const col = index % 10;
                        const actualRow = 9 - row;
                        const squareNum = actualRow % 2 === 1
                            ? (actualRow * 10) + (10 - col)
                            : (actualRow * 10) + col + 1;

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

                {/* BOTTOM ACTION CONTROLLER & 3D DICE CUBE */}
                <div className="w-full max-w-[360px] sm:max-w-[440px] mt-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-3xl shadow-2xl flex flex-col items-center space-y-2.5">
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 text-center min-h-[24px]">
                        {gameLog}
                    </p>

                    <div className="flex items-center justify-between w-full gap-3">
                        {/* 3D Animated Dice Cube */}
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

            </div>
        </div>
    );
}
