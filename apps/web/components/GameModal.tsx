'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Gamepad2, Heart, Zap, RefreshCw, Trophy, MessageCircle, X, ChevronRight, Flame, Smile } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface GameModalProps {
    onClose: () => void;
    partnerName: string;
    onSendChatMessage?: (msg: string) => void;
}

type GameMode = 'select' | 'vibe' | 'tictactoe' | 'truth';

/* Vibe Match Questions */
const VIBE_QUESTIONS = [
    { id: 1, text: "Ideal Weekend Getaway?", optionA: "Relaxing Beach 🏖️", optionB: "Mountain Hike 🏔️" },
    { id: 2, text: "Friday Night Vibe?", optionA: "Cozy Movie Night 🍿", optionB: "Party & Clubbing 💃" },
    { id: 3, text: "Food Philosophy?", optionA: "Cook Together 👩‍🍳", optionB: "Order Gourmet Delivery 🍕" },
    { id: 4, text: "Daily Rhythm?", optionA: "Early Bird 🌅", optionB: "Night Owl 🌙" },
    { id: 5, text: "Vacation Style?", optionA: "Spontaneous Road Trip 🚗", optionB: "Detailed Planned Itinerary 🗺️" }
];

/* Truth or Date Cards */
const TRUTH_CARDS = [
    { category: "Fun Truth", icon: "🤭", text: "What's your most embarrassing guilty pleasure song or movie?" },
    { category: "Ideal Date", icon: "🕯️", text: "If we had 24 hours in any city in the world together, where would we go?" },
    { category: "Hot Take", icon: "🌶️", text: "What is a popular trend or opinion that you completely disagree with?" },
    { category: "Fun Truth", icon: "⭐", text: "What was your very first impression of my profile?" },
    { category: "Ideal Date", icon: "🍿", text: "What's your dream late-night date activity: stargazing or midnight street food?" },
    { category: "Hot Take", icon: "🍕", text: "Is pineapple on pizza acceptable or illegal?" }
];

export default function GameModal({ onClose, partnerName, onSendChatMessage }: GameModalProps) {
    const toast = useToast();
    const [mode, setMode] = useState<GameMode>('select');

    /* Vibe Match State */
    const [vibeIndex, setVibeIndex] = useState(0);
    const [vibeScore, setVibeScore] = useState(0);
    const [vibeMyChoices, setVibeMyChoices] = useState<number[]>([]);
    const [vibePartnerChoices, setVibePartnerChoices] = useState<number[]>([]);
    const [vibeShowMatch, setVibeShowMatch] = useState(false);
    const [vibeFinished, setVibeFinished] = useState(false);

    /* Tic-Tac-Toe State */
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [turn, setTurn] = useState<'me' | 'partner'>('me');
    const [winner, setWinner] = useState<string | null>(null); // 'me' | 'partner' | 'draw' | null
    const [scores, setScores] = useState({ me: 0, partner: 0 });

    /* Truth or Date State */
    const [truthIndex, setTruthIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);

    /* Reset Games */
    const startVibeMatch = () => {
        setVibeIndex(0);
        setVibeScore(0);
        setVibeMyChoices([]);
        const simulatedPartner = VIBE_QUESTIONS.map(() => Math.floor(Math.random() * 2));
        setVibePartnerChoices(simulatedPartner);
        setVibeShowMatch(false);
        setVibeFinished(false);
        setMode('vibe');
    };

    const startTicTacToe = () => {
        setBoard(Array(9).fill(null));
        setTurn('me');
        setWinner(null);
        setMode('tictactoe');
    };

    const startTruthOrDate = () => {
        setTruthIndex(Math.floor(Math.random() * TRUTH_CARDS.length));
        setMode('truth');
    };

    /* TicTacToe Win Checker */
    const checkTicTacToeWinner = (currentBoard: (string | null)[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (currentBoard.every(square => square !== null)) return 'draw';
        return null;
    };

    /* Handle TicTacToe Move */
    const handleSquareClick = (index: number) => {
        if (board[index] || winner || turn !== 'me') return;

        const newBoard = [...board];
        newBoard[index] = '💗';
        setBoard(newBoard);

        const result = checkTicTacToeWinner(newBoard);
        if (result === '💗') {
            setWinner('me');
            setScores(s => ({ ...s, me: s.me + 1 }));
            toast.success("You Won! 🎉");
            return;
        } else if (result === 'draw') {
            setWinner('draw');
            return;
        }

        setTurn('partner');
        setTimeout(() => {
            const emptyIndices = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
            if (emptyIndices.length > 0) {
                const partnerChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                newBoard[partnerChoice] = '💙';
                setBoard([...newBoard]);

                const partnerResult = checkTicTacToeWinner(newBoard);
                if (partnerResult === '💙') {
                    setWinner('partner');
                    setScores(s => ({ ...s, partner: s.partner + 1 }));
                } else if (partnerResult === 'draw') {
                    setWinner('draw');
                } else {
                    setTurn('me');
                }
            }
        }, 700);
    };

    /* Handle Vibe Answer */
    const handleVibeAnswer = (optionIdx: number) => {
        const newMyChoices = [...vibeMyChoices, optionIdx];
        setVibeMyChoices(newMyChoices);

        const isMatch = vibePartnerChoices[vibeIndex] === optionIdx;
        if (isMatch) {
            setVibeScore(s => s + 1);
            setVibeShowMatch(true);
        }

        setTimeout(() => {
            setVibeShowMatch(false);
            if (vibeIndex < VIBE_QUESTIONS.length - 1) {
                setVibeIndex(i => i + 1);
            } else {
                setVibeFinished(true);
            }
        }, 1200);
    };

    /* Handle Truth Card Flip */
    const drawNextTruthCard = () => {
        setIsFlipping(true);
        setTimeout(() => {
            setTruthIndex((prev) => (prev + 1) % TRUTH_CARDS.length);
            setIsFlipping(false);
        }, 250);
    };

    /* Share result to chat */
    const handleShareToChat = (text: string) => {
        if (onSendChatMessage) {
            onSendChatMessage(text);
            toast.success("Result shared to chat!");
        } else {
            toast.success("Game result saved!");
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border border-white/20 dark:border-gray-800 max-h-[90vh]">

                {/* Header Bar */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                            <Gamepad2 size={22} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-1.5">
                                Duo Play Arena
                                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">LIVE</span>
                            </h2>
                            <p className="text-xs text-white/80">Playing with <span className="font-semibold text-white">{partnerName}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode !== 'select' && (
                            <button
                                onClick={() => setMode('select')}
                                className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors text-white"
                            >
                                Change Game
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center min-h-[420px]">

                    {/* MODE SELECTOR HUB */}
                    {mode === 'select' && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Pick a game to play together!</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Connect, have fun, and spend quality time with {partnerName}</p>
                            </div>

                            {/* Game 1: Vibe Match */}
                            <div
                                onClick={startVibeMatch}
                                className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-500 cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shadow-violet-500/30">
                                        ⚡
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex items-center gap-1.5">
                                            Vibe Match ("This or That")
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">5 quick rounds of preference choices with live match score!</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" size={20} />
                            </div>

                            {/* Game 2: Heart Tic-Tac-Toe */}
                            <div
                                onClick={startTicTacToe}
                                className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border border-pink-200 dark:border-pink-800/60 hover:border-pink-400 dark:hover:border-pink-500 cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-2xl shadow-md shadow-pink-500/30">
                                        💗
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors flex items-center gap-1.5">
                                            Heart Tic-Tac-Toe
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Live 2-player board game with 💗 vs 💙 markers!</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" size={20} />
                            </div>

                            {/* Game 3: Truth or Date */}
                            <div
                                onClick={startTruthOrDate}
                                className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-md shadow-amber-500/30">
                                        🔥
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                            Truth or Date Prompt Deck
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Fun icebreaker cards to discover shared secret stories!</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        </div>
                    )}

                    {/* GAME 1: VIBE MATCH */}
                    {mode === 'vibe' && (
                        <div className="flex-1 flex flex-col justify-between space-y-6">
                            {!vibeFinished ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-3 py-1 rounded-full">
                                            Round {vibeIndex + 1} of {VIBE_QUESTIONS.length}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full flex items-center gap-1">
                                            <Sparkles size={12} /> Matches: {vibeScore}
                                        </span>
                                    </div>

                                    <div className="text-center py-4 relative min-h-[140px] flex flex-col items-center justify-center">
                                        {vibeShowMatch && (
                                            <div className="absolute inset-0 z-20 flex items-center justify-center animate-in zoom-in-75 duration-200">
                                                <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xl px-6 py-3 rounded-full shadow-2xl shadow-pink-500/50 flex items-center gap-2 animate-bounce">
                                                    ✨ Vibe Match! +1
                                                </div>
                                            </div>
                                        )}
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                            {VIBE_QUESTIONS[vibeIndex].text}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-2">Which one describes you better?</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => handleVibeAnswer(0)}
                                            className="p-4 rounded-2xl border-2 border-indigo-100 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all font-bold text-base text-gray-800 dark:text-gray-100 flex items-center justify-between group"
                                        >
                                            <span>{VIBE_QUESTIONS[vibeIndex].optionA}</span>
                                            <ChevronRight className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleVibeAnswer(1)}
                                            className="p-4 rounded-2xl border-2 border-indigo-100 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 bg-gray-50 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all font-bold text-base text-gray-800 dark:text-gray-100 flex items-center justify-between group"
                                        >
                                            <span>{VIBE_QUESTIONS[vibeIndex].optionB}</span>
                                            <ChevronRight className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-300">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-violet-500/30">
                                        {Math.round((vibeScore / VIBE_QUESTIONS.length) * 100)}%
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Vibe Compatibility Score</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {vibeScore >= 4
                                                ? `🔥 Unstoppable Chemistry! You & ${partnerName} agree on almost everything!`
                                                : vibeScore >= 2
                                                ? `✨ Great balance! You & ${partnerName} complement each other well.`
                                                : `🤔 Opposites Attract! Different tastes make great conversations.`}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button onClick={startVibeMatch} variant="outline" className="flex-1 rounded-xl font-bold">
                                            <RefreshCw size={16} className="mr-2" /> Play Again
                                        </Button>
                                        <Button
                                            onClick={() => handleShareToChat(`🎮 Game Result: ${partnerName} & I scored ${Math.round((vibeScore / VIBE_QUESTIONS.length) * 100)}% Vibe Match! 🔥`)}
                                            className="flex-1 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                                        >
                                            <MessageCircle size={16} className="mr-2" /> Share to Chat
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* GAME 2: HEART TIC-TAC-TOE */}
                    {mode === 'tictactoe' && (
                        <div className="flex-1 flex flex-col items-center justify-between space-y-6">
                            <div className="flex items-center justify-between w-full max-w-xs text-xs font-bold">
                                <span className={`px-3 py-1 rounded-full ${turn === 'me' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 ring-2 ring-pink-400' : 'bg-gray-100 text-gray-500'}`}>
                                    You (💗): {scores.me}
                                </span>
                                <span className={`px-3 py-1 rounded-full ${turn === 'partner' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-2 ring-blue-400' : 'bg-gray-100 text-gray-500'}`}>
                                    {partnerName} (💙): {scores.partner}
                                </span>
                            </div>

                            {/* 3x3 Grid */}
                            <div className="grid grid-cols-3 gap-3 w-64 h-64 mx-auto">
                                {board.map((square, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSquareClick(idx)}
                                        className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-3xl font-extrabold flex items-center justify-center transition-all shadow-inner border border-gray-200/50 dark:border-gray-700"
                                    >
                                        {square}
                                    </button>
                                ))}
                            </div>

                            {/* Turn / Winner Banner */}
                            <div className="text-center">
                                {winner ? (
                                    <div className="space-y-3">
                                        <p className="text-lg font-black text-gray-900 dark:text-white">
                                            {winner === 'me' && '🎉 You Won the Round!'}
                                            {winner === 'partner' && `💙 ${partnerName} Won!`}
                                            {winner === 'draw' && "🤝 It's a Tie!"}
                                        </p>
                                        <div className="flex gap-2 justify-center">
                                            <Button onClick={startTicTacToe} size="sm" className="rounded-xl font-bold bg-pink-600 text-white">
                                                <RefreshCw size={14} className="mr-1" /> Next Round
                                            </Button>
                                            <Button
                                                onClick={() => handleShareToChat(`🎮 Tic-Tac-Toe: Played with ${partnerName}! Score: You ${scores.me} - ${scores.partner} ${partnerName}`)}
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl font-bold"
                                            >
                                                Share Score
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 font-medium">
                                        {turn === 'me' ? "Your turn! Tap an empty square." : `${partnerName} is thinking...`}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* GAME 3: TRUTH OR DATE */}
                    {mode === 'truth' && (
                        <div className="flex-1 flex flex-col justify-between space-y-6 text-center">
                            <div className="relative min-h-[220px] flex items-center justify-center">
                                <div className={`w-full p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl space-y-4 transition-all duration-300 ${isFlipping ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl">{TRUTH_CARDS[truthIndex].icon}</span>
                                        <span className="text-xs font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">
                                            {TRUTH_CARDS[truthIndex].category}
                                        </span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold leading-snug">
                                        "{TRUTH_CARDS[truthIndex].text}"
                                    </h3>
                                    <p className="text-[11px] text-amber-100 font-medium">Take turns answering out loud or in chat!</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={drawNextTruthCard} variant="outline" className="flex-1 rounded-xl font-bold py-3">
                                    🎴 Draw Next Card
                                </Button>
                                <Button
                                    onClick={() => handleShareToChat(`💬 Icebreaker Question for ${partnerName}: "${TRUTH_CARDS[truthIndex].text}"`)}
                                    className="flex-1 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg py-3"
                                >
                                    <MessageCircle size={16} className="mr-2" /> Discuss in Chat
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
