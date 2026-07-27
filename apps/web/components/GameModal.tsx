'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, Mic, MicOff, Volume2, X, RefreshCw, Sparkles, MessageCircle, Trophy, Crown, Play, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useCall } from '@/context/CallContext';

interface GameModalProps {
    onClose: () => void;
    partnerName: string;
    partnerId?: string;
    onSendChatMessage?: (msg: string) => void;
}

export default function GameModal({ onClose, partnerName, partnerId, onSendChatMessage }: GameModalProps) {
    const toast = useToast();
    const { startCall } = useCall();

    /* Voice Chat State */
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    /* ─── 2-PLAYER LUDO GAME STATE ─── */
    // Player 1 = Me (🔴 Red), Player 2 = Partner (🟢 Green)
    // Token positions: -1 = Yard, 0..51 = Track, 100 = Home Center
    const [p1Tokens, setP1Tokens] = useState<number[]>([-1, -1, -1, -1]);
    const [p2Tokens, setP2Tokens] = useState<number[]>([-1, -1, -1, -1]);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [turn, setTurn] = useState<'me' | 'partner'>('me');
    const [winner, setWinner] = useState<string | null>(null);
    const [gameLog, setGameLog] = useState<string>("Tap 'Roll Dice' to start your turn!");

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

    /* Start / Reset Game */
    const resetLudoGame = () => {
        setP1Tokens([-1, -1, -1, -1]);
        setP2Tokens([-1, -1, -1, -1]);
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

            const hasYard = p1Tokens.some(p => p === -1);
            const hasTrack = p1Tokens.some(p => p >= 0 && p < 100);

            // Rule 1: Roll 6 releases token from yard
            if (rolled === 6 && hasYard) {
                const yardIdx = p1Tokens.findIndex(p => p === -1);
                if (yardIdx !== -1) {
                    const newP1 = [...p1Tokens];
                    newP1[yardIdx] = 0; // Released to start square
                    setP1Tokens(newP1);
                    setGameLog("🎉 Rolled a 6! Token released onto safety track. Bonus roll!");
                    checkWinner(newP1, p2Tokens);
                    return; // Bonus turn on 6
                }
            }

            // Rule 2: Move active token on track
            if (hasTrack) {
                const trackIdx = p1Tokens.findIndex(p => p >= 0 && p < 100);
                if (trackIdx !== -1) {
                    const newP1 = [...p1Tokens];
                    const nextPos = newP1[trackIdx] + rolled;
                    newP1[trackIdx] = nextPos >= 52 ? 100 : nextPos; // 100 = Home Center
                    setP1Tokens(newP1);
                    setGameLog(`🎲 Rolled a ${rolled}! Advanced token forward.`);
                    checkWinner(newP1, p2Tokens);
                }
            } else if (rolled !== 6) {
                setGameLog(`🎲 Rolled a ${rolled}. Need a 6 to open a token from yard.`);
            }

            // Switch Turn if not a 6
            if (rolled !== 6) {
                setTurn('partner');
                setTimeout(() => simulatePartnerTurn(), 1200);
            }
        }, 500);
    };

    /* Simulate Partner Move */
    const simulatePartnerTurn = () => {
        const partnerRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(partnerRoll);

        setP2Tokens(prev => {
            const newP2 = [...prev];
            const hasYard = newP2.some(p => p === -1);
            const hasTrack = newP2.some(p => p >= 0 && p < 100);

            if (partnerRoll === 6 && hasYard) {
                const idx = newP2.findIndex(p => p === -1);
                if (idx !== -1) newP2[idx] = 0;
                setGameLog(`🟢 ${partnerName} rolled a 6 and opened a token!`);
            } else if (hasTrack) {
                const idx = newP2.findIndex(p => p >= 0 && p < 100);
                if (idx !== -1) {
                    const nextPos = newP2[idx] + partnerRoll;
                    newP2[idx] = nextPos >= 52 ? 100 : nextPos;
                    setGameLog(`🟢 ${partnerName} rolled a ${partnerRoll} and moved forward.`);
                }
            } else {
                setGameLog(`🟢 ${partnerName} rolled a ${partnerRoll}.`);
            }

            checkWinner(p1Tokens, newP2);
            return newP2;
        });

        if (partnerRoll !== 6) {
            setTurn('me');
        } else {
            setTimeout(() => simulatePartnerTurn(), 1200);
        }
    };

    /* Check Victory Condition */
    const checkWinner = (p1: number[], p2: number[]) => {
        if (p1.every(p => p === 100)) {
            setWinner('me');
            toast.success("🏆 Victory! You won the Ludo Match!");
        } else if (p2.every(p => p === 100)) {
            setWinner('partner');
            toast.error(`${partnerName} Won the Ludo Match!`);
        }
    };

    /* Share Result to Chat */
    const handleShareResult = (text: string) => {
        if (onSendChatMessage) {
            onSendChatMessage(text);
            toast.success("Game result posted to chat!");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 w-screen h-screen z-[3000] bg-slate-950/95 backdrop-blur-xl flex flex-col text-white font-sans overflow-hidden animate-in fade-in duration-200">

            {/* ─── FULL SCREEN TOP HEADER BAR ─── */}
            <div className="px-4 sm:px-8 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 via-orange-500 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-red-500/30">
                        🎲
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                            Couples Ludo Arena
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">LIVE</span>
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

            {/* Voice Status Toast Banner */}
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

            {/* ─── MAIN FULL SCREEN ARENA CONTAINER ─── */}
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-8 gap-8 overflow-y-auto">

                {/* LEFT/TOP: PLAYER STATUS PANEL */}
                <div className="w-full lg:w-72 flex flex-row lg:flex-col gap-4 justify-between shrink-0">
                    {/* You (Red) */}
                    <div className={`flex-1 p-4 rounded-3xl border-2 transition-all ${turn === 'me' ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-80'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white flex items-center justify-center font-bold text-sm shadow-md">
                                🔴
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-white">You (Red)</h3>
                                <p className="text-[11px] text-red-300 font-bold">{p1Tokens.filter(p => p === 100).length} / 4 Tokens Home</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {p1Tokens.map((pos, idx) => (
                                <div key={idx} className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${pos === 100 ? 'bg-emerald-500 border-white text-white' : (pos >= 0 ? 'bg-red-500 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500')}`}>
                                    {pos === 100 ? '🏆' : (pos >= 0 ? pos : '🏠')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Partner (Green) */}
                    <div className={`flex-1 p-4 rounded-3xl border-2 transition-all ${turn === 'partner' ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'bg-slate-900/60 border-slate-800 opacity-80'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center font-bold text-sm shadow-md">
                                🟢
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-white">{partnerName} (Green)</h3>
                                <p className="text-[11px] text-emerald-300 font-bold">{p2Tokens.filter(p => p === 100).length} / 4 Tokens Home</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {p2Tokens.map((pos, idx) => (
                                <div key={idx} className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${pos === 100 ? 'bg-emerald-500 border-white text-white' : (pos >= 0 ? 'bg-emerald-500 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500')}`}>
                                    {pos === 100 ? '🏆' : (pos >= 0 ? pos : '🏠')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER: CRYSTAL CLEAR LUDO BOARD */}
                <div className="w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] bg-slate-900 border-4 border-amber-500 rounded-3xl shadow-2xl overflow-hidden p-3 grid grid-cols-2 grid-rows-2 gap-3 relative shrink-0">

                    {/* RED YARD (YOU) */}
                    <div className="bg-red-600/90 rounded-2xl p-4 flex flex-col items-center justify-center border-2 border-red-400 relative shadow-inner">
                        <span className="text-white text-xs font-black uppercase tracking-wider mb-2 drop-shadow">RED YARD (YOU)</span>
                        <div className="grid grid-cols-2 gap-3">
                            {p1Tokens.map((pos, idx) => (
                                <div key={idx} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border-2 border-white flex items-center justify-center shadow-lg transition-all ${pos === -1 ? 'bg-white text-red-600 font-black text-sm scale-105' : 'bg-red-950/60 border-red-800 text-white/30'}`}>
                                    {pos === -1 ? '🔴' : '✓'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GREEN YARD (PARTNER) */}
                    <div className="bg-emerald-600/90 rounded-2xl p-4 flex flex-col items-center justify-center border-2 border-emerald-400 relative shadow-inner">
                        <span className="text-white text-xs font-black uppercase tracking-wider mb-2 drop-shadow">GREEN YARD ({partnerName})</span>
                        <div className="grid grid-cols-2 gap-3">
                            {p2Tokens.map((pos, idx) => (
                                <div key={idx} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border-2 border-white flex items-center justify-center shadow-lg transition-all ${pos === -1 ? 'bg-white text-emerald-600 font-black text-sm scale-105' : 'bg-emerald-950/60 border-emerald-800 text-white/30'}`}>
                                    {pos === -1 ? '🟢' : '✓'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER HOME TARGET & TRACK PATH */}
                    <div className="col-span-2 bg-slate-950 rounded-2xl p-4 flex items-center justify-between border-2 border-amber-500/50 shadow-inner">
                        <div className="text-left">
                            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Your Active Tokens</span>
                            <div className="text-lg font-black text-white">{p1Tokens.filter(p => p >= 0 && p < 100).length} on Track</div>
                        </div>

                        {/* Center Crown / Victory Trophy */}
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-500 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/40 border-2 border-white animate-bounce">
                                🏆
                            </div>
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">HOME TARGET</span>
                        </div>

                        <div className="text-right">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{partnerName}'s Active</span>
                            <div className="text-lg font-black text-white">{p2Tokens.filter(p => p >= 0 && p < 100).length} on Track</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT/BOTTOM: ACTION CONTROLLER & DICE ROLLER */}
                <div className="w-full lg:w-80 flex flex-col items-center text-center space-y-5 shrink-0 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-2xl">
                    <p className="text-xs sm:text-sm font-semibold text-slate-300 min-h-[40px] flex items-center justify-center">
                        {gameLog}
                    </p>

                    {/* 3D Animated Dice Roller */}
                    <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-3xl bg-slate-800 border-4 border-red-500 shadow-2xl flex items-center justify-center text-4xl font-black text-white transition-transform ${isRolling ? 'animate-spin scale-110' : ''}`}>
                            {diceValue !== null ? diceValue : '🎲'}
                        </div>

                        {!winner && (
                            <Button
                                onClick={handleRollDice}
                                disabled={isRolling || turn !== 'me'}
                                className="px-8 py-5 rounded-2xl font-black text-base bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
                            </Button>
                        )}
                    </div>

                    {/* Victory Dialog Overlay */}
                    {winner && (
                        <div className="w-full pt-4 border-t border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
                            <div className="text-2xl font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                                {winner === 'me' ? '🎉 Victory! You Won!' : `🏆 ${partnerName} Won!`}
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={resetLudoGame} variant="outline" className="flex-1 rounded-2xl font-bold border-slate-700 hover:bg-slate-800 text-white">
                                    <RefreshCw size={16} className="mr-2" /> Play Again
                                </Button>
                                <Button
                                    onClick={() => handleShareResult(`🎲 Played Ludo with ${partnerName}! Winner: ${winner === 'me' ? 'Me' : partnerName} 🏆`)}
                                    className="flex-1 rounded-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                                >
                                    <MessageCircle size={16} className="mr-2" /> Share to Chat
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
