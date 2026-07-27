'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, X, RefreshCw, MessageCircle, Trophy, Sparkles } from 'lucide-react';
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

export default function GameModal({ onClose, partnerName, partnerId, onSendChatMessage }: GameModalProps) {
    const toast = useToast();
    const { startCall } = useCall();
    const { socket } = useSocket();
    const { user } = useAuth();

    /* Voice Chat State */
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

    /* Real-Time Socket Listener for 2-Player Synced Game Moves */
    useEffect(() => {
        if (!socket) return;

        const handleRemoteMove = (data: { senderId: string; rolled: number; pos: number; nextPos: number; isWinner: boolean; nextTurnUserId: string }) => {
            if (data.senderId === user?.id) return; // Ignore own echoes

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

        const handleRemoteVoice = (data: { senderId: string; active: boolean }) => {
            if (data.senderId !== user?.id) {
                setIsVoiceActive(data.active);
            }
        };

        socket.on('snake_game_move', handleRemoteMove);
        socket.on('snake_game_voice', handleRemoteVoice);

        return () => {
            socket.off('snake_game_move', handleRemoteMove);
            socket.off('snake_game_voice', handleRemoteVoice);
        };
    }, [socket, user?.id, partnerName, toast]);

    /* Toggle Live Voice Chat for Both Users */
    const toggleVoiceChat = () => {
        const nextState = !isVoiceActive;
        setIsVoiceActive(nextState);

        if (socket && partnerId) {
            socket.emit('snake_game_voice', { targetUserId: partnerId, senderId: user?.id, active: nextState });
        }

        if (nextState) {
            toast.success("In-Game Voice Chat connected! Speak freely.");
            if (partnerId) {
                try {
                    startCall({ id: partnerId, name: partnerName }, 'audio');
                } catch (e) { console.error(e); }
            }
        } else {
            toast.success("Voice Chat disconnected.");
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
                    socket.emit('snake_game_move', {
                        targetUserId: partnerId,
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

            // Bonus turn on 6, else switch turn to Partner
            const keepTurn = rolled === 6 && !isWin;
            const nextTurnUser = keepTurn ? (user?.id || 'me') : (partnerId || 'partner');
            setIsMyTurn(keepTurn);

            if (socket && partnerId) {
                socket.emit('snake_game_move', {
                    targetUserId: partnerId,
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

            {/* ─── FULL-SCREEN HEADER ─── */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg z-20">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xl sm:text-2xl shadow-md">
                        🐍
                    </div>
                    <div>
                        <h1 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-1.5 leading-tight">
                            Snakes & Ladders
                            <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">LIVE 2P</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs text-slate-400">Match: <span className="font-bold text-white">{partnerName}</span></p>
                    </div>
                </div>

                {/* Voice Chat & Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleVoiceChat}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                            isVoiceActive
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                    >
                        {isVoiceActive ? <Volume2 size={15} /> : <Mic size={15} />}
                        <span className="text-[11px] sm:text-xs">{isVoiceActive ? 'Voice Live' : 'Voice Chat'}</span>
                    </button>

                    {isVoiceActive && (
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-1.5 sm:p-2 rounded-xl text-white transition-colors ${isMuted ? 'bg-red-500' : 'bg-slate-800 border border-slate-700'}`}
                            title={isMuted ? "Unmute Mic" : "Mute Mic"}
                        >
                            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Voice Toast Banner */}
            {isVoiceActive && (
                <div className="bg-emerald-500/10 px-4 py-1.5 border-b border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-bold shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Voice Chat Active • Talk live with {partnerName}
                    </div>
                    <span>{isMuted ? 'Muted' : 'Mic Active'}</span>
                </div>
            )}

            {/* ─── MAIN ARENA & BOARD (MOBILE ALIGNED) ─── */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto max-w-2xl mx-auto w-full">

                {/* INLINE PLAYER SCORE & TURN BAR */}
                <div className="w-full max-w-[360px] sm:max-w-[440px] flex items-center justify-between gap-2 mb-2">
                    <div className={`flex-1 p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center gap-2 ${isMyTurn ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                        <span className="text-base sm:text-lg">🔴</span>
                        <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs font-black truncate text-white">You</div>
                            <div className="text-[10px] sm:text-[11px] font-bold text-red-400">Sq {myPos} / 100</div>
                        </div>
                    </div>

                    <div className={`flex-1 p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center gap-2 ${!isMyTurn ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/60 border-slate-800 opacity-75'}`}>
                        <span className="text-base sm:text-lg">🟢</span>
                        <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs font-black truncate text-white">{partnerName}</div>
                            <div className="text-[10px] sm:text-[11px] font-bold text-emerald-400">Sq {partnerPos} / 100</div>
                        </div>
                    </div>
                </div>

                {/* DYNAMIC RESPONSIVE BOARD GRID (PERFECT MOBILE ALIGNMENT) */}
                <div className="w-full max-w-[360px] sm:max-w-[440px] aspect-square bg-slate-900 border-2 sm:border-4 border-emerald-500 rounded-2xl sm:rounded-3xl shadow-2xl p-1 sm:p-1.5 grid grid-cols-10 grid-rows-10 gap-0.5 relative shrink-0">
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

                        return (
                            <div
                                key={squareNum}
                                className={`rounded-md sm:rounded-lg flex flex-col items-center justify-between p-0.5 text-[7px] sm:text-[9px] font-extrabold relative border ${
                                    squareNum === 100
                                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-md animate-pulse'
                                        : (isLadderStart
                                            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                                            : (isSnakeHead
                                                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                                                : 'bg-slate-850 dark:bg-slate-800/60 border-slate-800/80 text-slate-400'))
                                }`}
                            >
                                <span className="opacity-70 leading-none">{squareNum}</span>

                                {isLadderStart && <span className="text-[10px] sm:text-xs text-emerald-400">🪜</span>}
                                {isSnakeHead && <span className="text-[10px] sm:text-xs text-rose-400">🐍</span>}
                                {squareNum === 100 && <span className="text-[10px] sm:text-xs">🏆</span>}

                                <div className="flex gap-0.5 z-10">
                                    {hasP1 && <span className="text-[10px] sm:text-xs drop-shadow-md animate-bounce">🔴</span>}
                                    {hasP2 && <span className="text-[10px] sm:text-xs drop-shadow-md animate-bounce">🟢</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* BOTTOM ACTION BAR & DICE ROLLER */}
                <div className="w-full max-w-[360px] sm:max-w-[440px] mt-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-xl flex flex-col items-center space-y-2">
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-300 text-center min-h-[24px]">
                        {gameLog}
                    </p>

                    <div className="flex items-center justify-between w-full gap-3">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 sm:border-4 border-emerald-500 shadow-lg flex items-center justify-center text-2xl sm:text-3xl font-black text-white ${isRolling ? 'animate-spin' : ''}`}>
                            {diceValue !== null ? diceValue : '🎲'}
                        </div>

                        {!winner ? (
                            <Button
                                onClick={handleRollDice}
                                disabled={isRolling || !isMyTurn}
                                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
                            >
                                {isRolling ? 'Rolling...' : (isMyTurn ? '🎲 Roll Dice' : `Waiting for ${partnerName}...`)}
                            </Button>
                        ) : (
                            <div className="flex-1 flex gap-2">
                                <Button onClick={() => { setMyPos(1); setPartnerPos(1); setWinner(null); setIsMyTurn(true); }} variant="outline" className="flex-1 text-xs font-bold border-slate-700 text-white">
                                    Play Again
                                </Button>
                                <Button onClick={() => handleShareResult(`🐍 Played Snakes & Ladders with ${partnerName}! Winner: ${winner === 'me' ? 'Me' : partnerName} 🏆`)} className="flex-1 text-xs font-bold bg-emerald-600 text-white">
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
