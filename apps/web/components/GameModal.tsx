'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, X, RefreshCw, Sparkles, MessageCircle, Trophy, Crown, Play, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useCall } from '@/context/CallContext';

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

    /* Voice Chat State */
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    /* ─── SNAKES & LADDERS GAME STATE ─── */
    // Positions range from 1 to 100
    const [p1Pos, setP1Pos] = useState<number>(1);
    const [p2Pos, setP2Pos] = useState<number>(1);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [turn, setTurn] = useState<'me' | 'partner'>('me');
    const [winner, setWinner] = useState<string | null>(null);
    const [gameLog, setGameLog] = useState<string>("Tap 'Roll Dice' to begin your turn!");

    /* Toggle In-Game Voice Chat */
    const toggleVoiceChat = () => {
        if (!isVoiceActive) {
            setIsVoiceActive(true);
            toast.success("In-Game Voice Chat connected! You can now speak live.");
            if (partnerId) {
                try {
                    startCall({ id: partnerId, name: partnerName }, 'audio');
                } catch (e) { console.error(e); }
            }
        } else {
            setIsVoiceActive(false);
            toast.success("Voice Chat disconnected.");
        }
    };

    /* Reset Game */
    const resetGame = () => {
        setP1Pos(1);
        setP2Pos(1);
        setDiceValue(null);
        setIsRolling(false);
        setTurn('me');
        setWinner(null);
        setGameLog("Your turn! Tap 'Roll Dice'.");
    };

    /* Handle Player Roll */
    const handleRollDice = () => {
        if (isRolling || winner || turn !== 'me') return;
        setIsRolling(true);

        setTimeout(() => {
            const rolled = Math.floor(Math.random() * 6) + 1;
            setDiceValue(rolled);
            setIsRolling(false);

            let nextPos = p1Pos + rolled;

            if (nextPos > 100) {
                setGameLog(`🎲 Rolled a ${rolled}. Over 100! Skip turn.`);
                setTurn('partner');
                setTimeout(() => simulatePartnerTurn(), 1200);
                return;
            }

            // Check Ladder or Snake
            if (LADDERS[nextPos]) {
                const climbTo = LADDERS[nextPos];
                setGameLog(`🪜 LADDER! Landed on ${nextPos} & climbed up to ${climbTo}! 🎉`);
                nextPos = climbTo;
                toast.success(`Climbed Ladder to square ${climbTo}! 🪜`);
            } else if (SNAKES[nextPos]) {
                const slideTo = SNAKES[nextPos];
                setGameLog(`🐍 SNAKE! Bit on ${nextPos} & slid down to ${slideTo}! 😅`);
                nextPos = slideTo;
                toast.error(`Bit by Snake! Slid down to ${slideTo} 🐍`);
            } else {
                setGameLog(`🎲 Rolled a ${rolled}! Advanced to square ${nextPos}.`);
            }

            setP1Pos(nextPos);

            if (nextPos === 100) {
                setWinner('me');
                toast.success("🏆 VICTORY! Reached Square 100!");
                return;
            }

            // Bonus turn on 6, else switch to Partner
            if (rolled !== 6) {
                setTurn('partner');
                setTimeout(() => simulatePartnerTurn(), 1200);
            } else {
                setGameLog(prev => `${prev} Rolled a 6! Bonus turn!`);
            }
        }, 500);
    };

    /* Simulate Partner Turn */
    const simulatePartnerTurn = () => {
        const partnerRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(partnerRoll);

        setP2Pos(prev => {
            let nextPos = prev + partnerRoll;

            if (nextPos > 100) {
                setGameLog(`🎲 ${partnerName} rolled a ${partnerRoll}. Over 100! Skipped turn.`);
                setTurn('me');
                return prev;
            }

            if (LADDERS[nextPos]) {
                const climbTo = LADDERS[nextPos];
                setGameLog(`🪜 ${partnerName} landed on ${nextPos} & climbed ladder to ${climbTo}!`);
                nextPos = climbTo;
            } else if (SNAKES[nextPos]) {
                const slideTo = SNAKES[nextPos];
                setGameLog(`🐍 ${partnerName} bit on ${nextPos} & slid to ${slideTo}!`);
                nextPos = slideTo;
            } else {
                setGameLog(`🎲 ${partnerName} rolled a ${partnerRoll} & moved to ${nextPos}.`);
            }

            if (nextPos === 100) {
                setWinner('partner');
                toast.error(`${partnerName} reached Square 100!`);
            }

            if (partnerRoll !== 6) {
                setTurn('me');
            } else {
                setTimeout(() => simulatePartnerTurn(), 1200);
            }

            return nextPos;
        });
    };

    /* Share Result to Chat */
    const handleShareResult = (text: string) => {
        if (onSendChatMessage) {
            onSendChatMessage(text);
            toast.success("Result posted to chat!");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 w-screen h-screen z-[3000] bg-slate-950/95 backdrop-blur-xl flex flex-col text-white font-sans overflow-hidden animate-in fade-in duration-200">

            {/* ─── HEADER BAR ─── */}
            <div className="px-4 sm:px-8 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30">
                        🐍
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                            Snakes & Ladders Arena
                            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">LIVE</span>
                        </h1>
                        <p className="text-xs text-slate-400">Playing live with <span className="font-bold text-white">{partnerName}</span></p>
                    </div>
                </div>

                {/* Voice Chat & Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleVoiceChat}
                        className={`px-3 sm:px-4 py-2 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold ${
                            isVoiceActive
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                    >
                        {isVoiceActive ? <Volume2 size={16} /> : <Mic size={16} />}
                        <span>{isVoiceActive ? 'Voice Live' : 'Connect Voice Chat'}</span>
                    </button>

                    {isVoiceActive && (
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-2xl text-white transition-colors ${isMuted ? 'bg-red-500' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'}`}
                            title={isMuted ? "Unmute Mic" : "Mute Mic"}
                        >
                            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 sm:p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl transition-colors border border-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Voice Toast Banner */}
            {isVoiceActive && (
                <div className="bg-emerald-500/10 px-6 py-2 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400 font-bold shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Voice Chat Connected • Talk freely with {partnerName}
                    </div>
                    <span>{isMuted ? 'Microphone Muted' : 'Microphone Active'}</span>
                </div>
            )}

            {/* ─── FULL SCREEN SNAKES & LADDERS ARENA ─── */}
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 gap-6 overflow-y-auto">

                {/* LEFT/TOP: STATUS PANEL */}
                <div className="w-full lg:w-72 flex flex-row lg:flex-col gap-4 justify-between shrink-0">
                    {/* You (Red) */}
                    <div className={`flex-1 p-4 rounded-3xl border-2 transition-all ${turn === 'me' ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-80'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white flex items-center justify-center font-bold text-sm shadow-md">
                                🔴
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-white">You (Red)</h3>
                                <p className="text-xs text-red-300 font-bold">Square {p1Pos} / 100</p>
                            </div>
                        </div>
                    </div>

                    {/* Partner (Green) */}
                    <div className={`flex-1 p-4 rounded-3xl border-2 transition-all ${turn === 'partner' ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-80'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center font-bold text-sm shadow-md">
                                🟢
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-white">{partnerName} (Green)</h3>
                                <p className="text-xs text-emerald-300 font-bold">Square {p2Pos} / 100</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: 100-SQUARE BOARD GRID (10x10) */}
                <div className="w-72 h-72 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] bg-slate-900 border-4 border-emerald-500 rounded-3xl shadow-2xl overflow-hidden p-2 grid grid-cols-10 grid-rows-10 gap-1 relative shrink-0">
                    {Array.from({ length: 100 }, (_, index) => {
                        // Calculate 1-100 boustrophedon (snake-like) number
                        const row = Math.floor(index / 10);
                        const col = index % 10;
                        const actualRow = 9 - row; // 100 at top
                        const squareNum = actualRow % 2 === 1
                            ? (actualRow * 10) + (10 - col)
                            : (actualRow * 10) + col + 1;

                        const isLadderStart = LADDERS[squareNum];
                        const isSnakeHead = SNAKES[squareNum];
                        const hasP1 = p1Pos === squareNum;
                        const hasP2 = p2Pos === squareNum;

                        return (
                            <div
                                key={squareNum}
                                className={`rounded-lg flex flex-col items-center justify-between p-0.5 text-[9px] font-extrabold relative transition-all border ${
                                    squareNum === 100
                                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-md animate-pulse'
                                        : (isLadderStart
                                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                                            : (isSnakeHead
                                                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                                                : 'bg-slate-850 dark:bg-slate-800/60 border-slate-800 text-slate-400'))
                                }`}
                            >
                                <span className="opacity-60">{squareNum}</span>

                                {/* Ladder / Snake Icons */}
                                {isLadderStart && <span className="text-xs text-emerald-400 animate-bounce">🪜</span>}
                                {isSnakeHead && <span className="text-xs text-rose-400 animate-pulse">🐍</span>}
                                {squareNum === 100 && <span className="text-xs">🏆</span>}

                                {/* Player Tokens */}
                                <div className="flex gap-0.5 z-10">
                                    {hasP1 && <span className="text-xs drop-shadow-md animate-bounce">🔴</span>}
                                    {hasP2 && <span className="text-xs drop-shadow-md animate-bounce">🟢</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT/BOTTOM: ACTION CONTROLLER & DICE */}
                <div className="w-full lg:w-80 flex flex-col items-center text-center space-y-5 shrink-0 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-2xl">
                    <p className="text-xs sm:text-sm font-semibold text-slate-300 min-h-[40px] flex items-center justify-center">
                        {gameLog}
                    </p>

                    {/* 3D Dice Roller */}
                    <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-3xl bg-slate-800 border-4 border-emerald-500 shadow-2xl flex items-center justify-center text-4xl font-black text-white transition-transform ${isRolling ? 'animate-spin scale-110' : ''}`}>
                            {diceValue !== null ? diceValue : '🎲'}
                        </div>

                        {!winner && (
                            <Button
                                onClick={handleRollDice}
                                disabled={isRolling || turn !== 'me'}
                                className="px-8 py-5 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
                            </Button>
                        )}
                    </div>

                    {/* Victory Dialog */}
                    {winner && (
                        <div className="w-full pt-4 border-t border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
                            <div className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                {winner === 'me' ? '🎉 Victory! Reached Square 100!' : `🟢 ${partnerName} Won!`}
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={resetGame} variant="outline" className="flex-1 rounded-2xl font-bold border-slate-700 hover:bg-slate-800 text-white">
                                    <RefreshCw size={16} className="mr-2" /> Play Again
                                </Button>
                                <Button
                                    onClick={() => handleShareResult(`🐍 Played Snakes & Ladders with ${partnerName}! Winner: ${winner === 'me' ? 'Me' : partnerName} 🏆`)}
                                    className="flex-1 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                                >
                                    <MessageCircle size={16} className="mr-2" /> Share Result
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
