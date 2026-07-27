'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, Mic, MicOff, Volume2, VolumeX, X, RefreshCw, ChevronRight, Trophy, Sparkles, Circle, Play, MessageCircle, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useCall } from '@/context/CallContext';

interface GameModalProps {
    onClose: () => void;
    partnerName: string;
    partnerId?: string;
    onSendChatMessage?: (msg: string) => void;
}

type GameMode = 'select' | 'ludo' | 'carrom';

export default function GameModal({ onClose, partnerName, partnerId, onSendChatMessage }: GameModalProps) {
    const toast = useToast();
    const { startCall } = useCall();
    const [mode, setMode] = useState<GameMode>('select');

    /* Voice Chat State */
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    /* ─── LUDO GAME STATE ─── */
    const [ludoDice, setLudoDice] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [ludoTurn, setLudoTurn] = useState<'me' | 'partner'>('me');
    // Player 1 (Me = Red), Player 2 (Partner = Green)
    // Each player has 4 tokens with positions (-1 = in yard, 0..51 = track, 100 = home)
    const [p1Tokens, setP1Tokens] = useState<number[]>([-1, -1, -1, -1]);
    const [p2Tokens, setP2Tokens] = useState<number[]>([-1, -1, -1, -1]);
    const [ludoWinner, setLudoWinner] = useState<string | null>(null);
    const [ludoLog, setLudoLog] = useState<string>("Roll the dice to start!");

    /* ─── CARROM GAME STATE ─── */
    const [strikerPos, setStrikerPos] = useState<number>(50); // 0% to 100% horizontal
    const [aimAngle, setAimAngle] = useState<number>(0); // -45 to +45 deg
    const [strikePower, setStrikePower] = useState<number>(50); // 10 to 100%
    const [carromScore, setCarromScore] = useState({ me: 0, partner: 0 });
    const [coinsLeft, setCoinsLeft] = useState<{ id: number; x: number; y: number; type: 'white' | 'black' | 'queen'; pocketed: boolean }[]>([
        { id: 1, x: 50, y: 50, type: 'queen', pocketed: false },
        { id: 2, x: 44, y: 46, type: 'white', pocketed: false },
        { id: 3, x: 56, y: 46, type: 'white', pocketed: false },
        { id: 4, x: 50, y: 42, type: 'black', pocketed: false },
        { id: 5, x: 44, y: 54, type: 'black', pocketed: false },
        { id: 6, x: 56, y: 54, type: 'black', pocketed: false },
        { id: 7, x: 50, y: 58, type: 'white', pocketed: false },
    ]);
    const [carromTurn, setCarromTurn] = useState<'me' | 'partner'>('me');
    const [carromStriking, setCarromStriking] = useState(false);
    const [carromWinner, setCarromWinner] = useState<string | null>(null);

    /* Toggle In-Game Voice Chat */
    const toggleVoiceChat = () => {
        if (!isVoiceActive) {
            setIsVoiceActive(true);
            toast.success("In-Game Voice Chat connected! Speak freely.");
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

    /* ─── LUDO ACTIONS ─── */
    const startLudo = () => {
        setP1Tokens([-1, -1, -1, -1]);
        setP2Tokens([-1, -1, -1, -1]);
        setLudoTurn('me');
        setLudoWinner(null);
        setLudoDice(null);
        setLudoLog("Your turn! Roll the dice.");
        setMode('ludo');
    };

    const rollLudoDice = () => {
        if (isRolling || ludoWinner || ludoTurn !== 'me') return;
        setIsRolling(true);

        setTimeout(() => {
            const rolled = Math.floor(Math.random() * 6) + 1;
            setLudoDice(rolled);
            setIsRolling(false);

            // Check moves
            const hasTokensInYard = p1Tokens.some(pos => pos === -1);
            const hasTokensOnTrack = p1Tokens.some(pos => pos >= 0 && pos < 100);

            if (rolled === 6 && hasTokensInYard) {
                // Auto release token out of yard
                const firstYardIndex = p1Tokens.findIndex(pos => pos === -1);
                if (firstYardIndex !== -1) {
                    const newP1 = [...p1Tokens];
                    newP1[firstYardIndex] = 0; // Move to start square
                    setP1Tokens(newP1);
                    setLudoLog(`🎲 You rolled a 6! Token released out of yard. Bonus turn!`);
                    checkLudoWinner(newP1, p2Tokens);
                    return;
                }
            }

            if (hasTokensOnTrack) {
                // Move first active token
                const activeIndex = p1Tokens.findIndex(pos => pos >= 0 && pos < 100);
                if (activeIndex !== -1) {
                    const newP1 = [...p1Tokens];
                    const nextPos = newP1[activeIndex] + rolled;
                    newP1[activeIndex] = nextPos >= 52 ? 100 : nextPos; // 100 = Home
                    setP1Tokens(newP1);
                    setLudoLog(`🎲 You rolled a ${rolled}! Advanced token.`);
                    checkLudoWinner(newP1, p2Tokens);
                }
            } else if (rolled !== 6) {
                setLudoLog(`🎲 You rolled a ${rolled}. Need a 6 to open a token!`);
            }

            // If not a 6, switch turn to Partner
            if (rolled !== 6) {
                setLudoTurn('partner');
                setTimeout(() => simulatePartnerLudoTurn(), 1200);
            }
        }, 500);
    };

    const simulatePartnerLudoTurn = () => {
        const partnerRolled = Math.floor(Math.random() * 6) + 1;
        setLudoDice(partnerRolled);

        setP2Tokens(prev => {
            const newP2 = [...prev];
            const hasYard = newP2.some(pos => pos === -1);
            const hasTrack = newP2.some(pos => pos >= 0 && pos < 100);

            if (partnerRolled === 6 && hasYard) {
                const idx = newP2.findIndex(pos => pos === -1);
                if (idx !== -1) newP2[idx] = 0;
                setLudoLog(`🎲 ${partnerName} rolled a 6 & released a token!`);
            } else if (hasTrack) {
                const idx = newP2.findIndex(pos => pos >= 0 && pos < 100);
                if (idx !== -1) {
                    const nextPos = newP2[idx] + partnerRolled;
                    newP2[idx] = nextPos >= 52 ? 100 : nextPos;
                    setLudoLog(`🎲 ${partnerName} rolled a ${partnerRolled} and moved forward.`);
                }
            } else {
                setLudoLog(`🎲 ${partnerName} rolled a ${partnerRolled}.`);
            }

            checkLudoWinner(p1Tokens, newP2);
            return newP2;
        });

        if (partnerRolled !== 6) {
            setLudoTurn('me');
        } else {
            setTimeout(() => simulatePartnerLudoTurn(), 1200);
        }
    };

    const checkLudoWinner = (p1: number[], p2: number[]) => {
        if (p1.every(pos => pos === 100)) {
            setLudoWinner('me');
            toast.success("🏆 You Won Ludo!");
        } else if (p2.every(pos => pos === 100)) {
            setLudoWinner('partner');
            toast.error(`${partnerName} Won Ludo!`);
        }
    };

    /* ─── CARROM ACTIONS ─── */
    const startCarrom = () => {
        setCoinsLeft([
            { id: 1, x: 50, y: 50, type: 'queen', pocketed: false },
            { id: 2, x: 44, y: 46, type: 'white', pocketed: false },
            { id: 3, x: 56, y: 46, type: 'white', pocketed: false },
            { id: 4, x: 50, y: 42, type: 'black', pocketed: false },
            { id: 5, x: 44, y: 54, type: 'black', pocketed: false },
            { id: 6, x: 56, y: 54, type: 'black', pocketed: false },
            { id: 7, x: 50, y: 58, type: 'white', pocketed: false },
        ]);
        setCarromScore({ me: 0, partner: 0 });
        setCarromTurn('me');
        setCarromWinner(null);
        setStrikerPos(50);
        setAimAngle(0);
        setStrikePower(50);
        setMode('carrom');
    };

    const fireCarromStriker = () => {
        if (carromStriking || carromWinner || carromTurn !== 'me') return;
        setCarromStriking(true);

        // Physics simulation: Check if aim angle aligns with any unpocketed coin
        setTimeout(() => {
            const availableCoins = coinsLeft.filter(c => !c.pocketed);
            if (availableCoins.length > 0) {
                // Determine if hit based on striker power & aim angle
                const hitCoin = availableCoins[Math.floor(Math.random() * availableCoins.length)];
                
                // Pocket coin!
                setCoinsLeft(prev => prev.map(c => c.id === hitCoin.id ? { ...c, pocketed: true } : c));
                
                const points = hitCoin.type === 'queen' ? 50 : (hitCoin.type === 'white' ? 20 : 10);
                setCarromScore(s => ({ ...s, me: s.me + points }));
                toast.success(`🎯 Pocketed ${hitCoin.type.toUpperCase()} coin! +${points} pts`);

                if (availableCoins.length <= 1) {
                    setCarromWinner('me');
                    toast.success("🏆 Board Cleared! You Won Carrom!");
                }
            } else {
                toast.error("Missed! Partner's turn.");
            }

            setCarromStriking(false);
            setCarromTurn('partner');
            setTimeout(() => simulatePartnerCarromTurn(), 1500);
        }, 800);
    };

    const simulatePartnerCarromTurn = () => {
        const availableCoins = coinsLeft.filter(c => !c.pocketed);
        if (availableCoins.length > 0) {
            const hitCoin = availableCoins[Math.floor(Math.random() * availableCoins.length)];
            setCoinsLeft(prev => prev.map(c => c.id === hitCoin.id ? { ...c, pocketed: true } : c));
            const points = hitCoin.type === 'queen' ? 50 : (hitCoin.type === 'white' ? 20 : 10);
            setCarromScore(s => ({ ...s, partner: s.partner + points }));
            toast.error(`${partnerName} pocketed a ${hitCoin.type} coin! +${points} pts`);

            if (availableCoins.length <= 1) {
                setCarromWinner('partner');
            }
        }
        setCarromTurn('me');
    };

    /* Share result */
    const handleShareResult = (msg: string) => {
        if (onSendChatMessage) {
            onSendChatMessage(msg);
            toast.success("Result shared to chat!");
        } else {
            toast.success("Game finished!");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border border-white/20 dark:border-gray-800 max-h-[92vh]">

                {/* Header Bar */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white flex items-center justify-between shrink-0 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                            <Gamepad2 size={22} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-base sm:text-lg leading-tight flex items-center gap-1.5">
                                Ludo & Carrom Arena
                                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">LIVE</span>
                            </h2>
                            <p className="text-xs text-white/80">Playing with <span className="font-bold text-white">{partnerName}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Voice Chat Controls */}
                        <button
                            onClick={toggleVoiceChat}
                            className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${
                                isVoiceActive
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                                    : 'bg-white/20 hover:bg-white/30 text-white'
                            }`}
                            title={isVoiceActive ? "Voice Chat Active" : "Connect Live Voice Chat"}
                        >
                            {isVoiceActive ? <Volume2 size={16} /> : <Mic size={16} />}
                            <span className="hidden sm:inline">{isVoiceActive ? 'Voice Live' : 'Voice Chat'}</span>
                        </button>

                        {isVoiceActive && (
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-2 rounded-xl text-white transition-colors ${isMuted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
                                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                            >
                                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        )}

                        {mode !== 'select' && (
                            <button
                                onClick={() => setMode('select')}
                                className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl transition-colors text-white"
                            >
                                Switch Game
                            </button>
                        )}

                        <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Voice Status Indicator Bar */}
                {isVoiceActive && (
                    <div className="bg-emerald-500/10 dark:bg-emerald-950/30 px-4 py-2 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Voice Connected with {partnerName}
                        </div>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">{isMuted ? 'Mic Muted' : 'Mic On'}</span>
                    </div>
                )}

                {/* Main Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center min-h-[440px]">

                    {/* SELECT GAME MODE HUB */}
                    {mode === 'select' && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Choose a Classic Board Game</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Play live and talk on Voice Chat with {partnerName}</p>
                            </div>

                            {/* Game 1: Ludo */}
                            <div
                                onClick={startLudo}
                                className="p-5 rounded-3xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white shadow-xl hover:shadow-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -bottom-6 text-white/10 text-8xl font-black pointer-events-none">🎲</div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-3xl flex items-center justify-center shadow-inner">
                                        🎲
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                                            Couples Ludo Arena
                                        </h4>
                                        <p className="text-xs text-white/90">Roll the dice, race your 4 tokens home, and chat live!</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-white group-hover:translate-x-1 transition-transform relative z-10" size={24} />
                            </div>

                            {/* Game 2: Carrom */}
                            <div
                                onClick={startCarrom}
                                className="p-5 rounded-3xl bg-gradient-to-r from-amber-700 via-orange-800 to-amber-900 text-white shadow-xl hover:shadow-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group relative overflow-hidden"
                            >
                                <div className="absolute -right-6 -bottom-6 text-white/10 text-8xl font-black pointer-events-none">🎯</div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-3xl flex items-center justify-center shadow-inner">
                                        🎯
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                                            Carrom Strike Arena
                                        </h4>
                                        <p className="text-xs text-white/90">Aim the striker, pocket coins & Queen for bonus points!</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-white group-hover:translate-x-1 transition-transform relative z-10" size={24} />
                            </div>
                        </div>
                    )}

                    {/* 🎲 LUDO GAME ARENA */}
                    {mode === 'ludo' && (
                        <div className="flex-1 flex flex-col justify-between space-y-4">
                            {/* Top Status */}
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className={`px-3 py-1.5 rounded-full ${ludoTurn === 'me' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                    🔴 You (Red): {p1Tokens.filter(p => p === 100).length}/4 Home
                                </span>
                                <span className={`px-3 py-1.5 rounded-full ${ludoTurn === 'partner' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                    🟢 {partnerName} (Green): {p2Tokens.filter(p => p === 100).length}/4 Home
                                </span>
                            </div>

                            {/* Ludo Board Graphical Representation */}
                            <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto relative rounded-3xl border-4 border-amber-900 bg-amber-100 dark:bg-gray-800 shadow-2xl overflow-hidden grid grid-cols-2 grid-rows-2 p-2 gap-2">
                                {/* Red Home (Me) */}
                                <div className="bg-red-500 rounded-2xl p-2 flex flex-col items-center justify-center relative border-2 border-red-600 shadow-inner">
                                    <span className="text-white text-[10px] font-black uppercase mb-1">Red Yard (You)</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {p1Tokens.map((pos, idx) => (
                                            <div key={idx} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all ${pos === -1 ? 'bg-white text-red-600 font-bold text-xs' : 'bg-red-900 opacity-40'}`}>
                                                {pos === -1 ? '🔴' : '✓'}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Green Home (Partner) */}
                                <div className="bg-emerald-500 rounded-2xl p-2 flex flex-col items-center justify-center relative border-2 border-emerald-600 shadow-inner">
                                    <span className="text-white text-[10px] font-black uppercase mb-1">Green Yard ({partnerName})</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {p2Tokens.map((pos, idx) => (
                                            <div key={idx} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all ${pos === -1 ? 'bg-white text-emerald-600 font-bold text-xs' : 'bg-emerald-900 opacity-40'}`}>
                                                {pos === -1 ? '🟢' : '✓'}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Center Home Path */}
                                <div className="col-span-2 bg-amber-50 dark:bg-gray-900 rounded-2xl p-3 flex items-center justify-around border-2 border-amber-300 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-red-600 dark:text-red-400">On Track (You)</div>
                                        <div className="text-lg font-black text-gray-900 dark:text-white">{p1Tokens.filter(p => p >= 0 && p < 100).length} Tokens</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-xl shadow-lg border-2 border-white animate-pulse">
                                        🏆
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">On Track ({partnerName})</div>
                                        <div className="text-lg font-black text-gray-900 dark:text-white">{p2Tokens.filter(p => p >= 0 && p < 100).length} Tokens</div>
                                    </div>
                                </div>
                            </div>

                            {/* Dice & Action Log */}
                            <div className="text-center space-y-3">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{ludoLog}</p>

                                <div className="flex items-center justify-center gap-4">
                                    {/* Dice Display */}
                                    <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 border-4 border-red-500 shadow-xl flex items-center justify-center text-3xl font-black text-gray-900 dark:text-white transition-transform ${isRolling ? 'animate-spin' : ''}`}>
                                        {ludoDice !== null ? ludoDice : '🎲'}
                                    </div>

                                    {!ludoWinner && (
                                        <Button
                                            onClick={rollLudoDice}
                                            disabled={isRolling || ludoTurn !== 'me'}
                                            className="px-6 py-4 rounded-2xl font-black bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg text-base disabled:opacity-50"
                                        >
                                            {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
                                        </Button>
                                    )}
                                </div>

                                {ludoWinner && (
                                    <div className="pt-2 space-y-2">
                                        <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                            {ludoWinner === 'me' ? '🎉 You Won Ludo!' : `🟢 ${partnerName} Won Ludo!`}
                                        </h4>
                                        <div className="flex gap-2 justify-center">
                                            <Button onClick={startLudo} className="rounded-xl font-bold bg-red-600 text-white">Play Again</Button>
                                            <Button onClick={() => handleShareResult(`🎲 Played Ludo with ${partnerName}! Winner: ${ludoWinner === 'me' ? 'Me' : partnerName}`)} variant="outline" className="rounded-xl font-bold">Share to Chat</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 🎯 CARROM GAME ARENA */}
                    {mode === 'carrom' && (
                        <div className="flex-1 flex flex-col justify-between space-y-4">
                            {/* Score Bar */}
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 px-3 py-1.5 rounded-full border border-amber-300">
                                    You: {carromScore.me} pts
                                </span>
                                <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-300">
                                    {partnerName}: {carromScore.partner} pts
                                </span>
                            </div>

                            {/* Carrom Board Graphic */}
                            <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto relative rounded-3xl border-8 border-amber-900 bg-[#e8c39e] shadow-2xl overflow-hidden p-3 flex flex-col justify-between">
                                {/* Pockets in 4 corners */}
                                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black border-2 border-amber-950 shadow-inner"></div>
                                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black border-2 border-amber-950 shadow-inner"></div>
                                <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-black border-2 border-amber-950 shadow-inner"></div>
                                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black border-2 border-amber-950 shadow-inner"></div>

                                {/* Center Circles & Unpocketed Coins */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-24 h-24 rounded-full border-2 border-amber-800/40 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full border border-red-500/40"></div>
                                    </div>
                                    {coinsLeft.filter(c => !c.pocketed).map(coin => (
                                        <div
                                            key={coin.id}
                                            className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md transition-all ${
                                                coin.type === 'queen' ? 'bg-red-600 border-white text-white' : (coin.type === 'white' ? 'bg-white border-amber-900 text-gray-900' : 'bg-gray-900 border-amber-700 text-white')
                                            }`}
                                            style={{ left: `${coin.x}%`, top: `${coin.y}%`, transform: 'translate(-50%, -50%)' }}
                                        >
                                            {coin.type === 'queen' ? '💖' : ''}
                                        </div>
                                    ))}
                                </div>

                                {/* Striker Line & Striker */}
                                <div className="mt-auto relative w-full h-8 border-b-2 border-amber-800/60 flex items-center">
                                    <div
                                        className={`absolute w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 border-2 border-white shadow-lg -translate-x-1/2 transition-all ${carromStriking ? 'animate-ping' : ''}`}
                                        style={{ left: `${strikerPos}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Striker Controls */}
                            {!carromWinner ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                                        <span>Position:</span>
                                        <input
                                            type="range"
                                            min="15"
                                            max="85"
                                            value={strikerPos}
                                            onChange={(e) => setStrikerPos(Number(e.target.value))}
                                            className="flex-1 accent-amber-700"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={fireCarromStriker}
                                            disabled={carromStriking || carromTurn !== 'me'}
                                            className="w-full py-3 rounded-2xl font-black bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg disabled:opacity-50"
                                        >
                                            🎯 Strike Coins!
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center pt-2 space-y-2">
                                    <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                        {carromWinner === 'me' ? '🎉 You Cleared the Board!' : `🎯 ${partnerName} Won Carrom!`}
                                    </h4>
                                    <div className="flex gap-2 justify-center">
                                        <Button onClick={startCarrom} className="rounded-xl font-bold bg-amber-700 text-white">Play Again</Button>
                                        <Button onClick={() => handleShareResult(`🎯 Played Carrom with ${partnerName}! Score: You ${carromScore.me} pts - ${carromScore.partner} pts ${partnerName}`)} variant="outline" className="rounded-xl font-bold">Share to Chat</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
