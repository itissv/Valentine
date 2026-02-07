"use client";

import { useState, useEffect } from "react";
import { usePusher } from "@/providers/PusherProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, Sun, Moon, Cloud, Music, Gift, Smile, Trophy, Brain } from "lucide-react";

const ICONS = [Heart, Star, Sun, Moon, Cloud, Music, Gift, Smile];

interface MemoryMatchProps {
    roomId: string;
    onExit: () => void;
}

export default function MemoryMatch({ roomId, onExit }: MemoryMatchProps) {
    const { pusher, role, memoryBoard } = usePusher();
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [scores, setScores] = useState({ me: 0, partner: 0 });

    useEffect(() => {
        if (!pusher || !role || !memoryBoard || !roomId) return;

        // X starts
        setIsMyTurn(role === "X");

        const initializedCards = memoryBoard.map((iconIndex: number, idx: number) => ({
            id: idx,
            icon: ICONS[iconIndex],
            matched: false
        }));
        setCards(initializedCards);

        const channel = pusher.subscribe(`presence-room-${roomId}`);

        channel.bind("memory-flip", (data: { index: number }) => {
            console.log("[MemoryMatch] Flip received:", data);
            setFlipped((prev) => [...prev, data.index]);
        });

        channel.bind("memory-reset", () => {
            console.log("[MemoryMatch] Reset received");
            setFlipped([]);
            setIsMyTurn(true);
        });

        channel.bind("memory-solved", (data: { indices: number[], winnerRole: string }) => {
            console.log("[MemoryMatch] Solved received:", data);
            setSolved((prev) => [...prev, ...data.indices]);
            setFlipped([]);

            if (data.winnerRole === role) {
                setScores(prev => ({ ...prev, me: prev.me + 1 }));
                setIsMyTurn(true);
            } else {
                setScores(prev => ({ ...prev, partner: prev.partner + 1 }));
                setIsMyTurn(false);
            }
        });

        return () => {
            pusher.unsubscribe(`presence-room-${roomId}`);
        };
    }, [pusher, role, memoryBoard, roomId]);

    const handleCardClick = async (index: number) => {
        if (!isMyTurn || flipped.includes(index) || solved.includes(index) || flipped.length >= 2) return;

        setFlipped((prev) => [...prev, index]);

        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "memory-flip",
                    data: { index }
                })
            });

            if (flipped.length === 1) {
                const firstIndex = flipped[0];
                const secondIndex = index;

                if (cards[firstIndex].icon === cards[secondIndex].icon) {
                    setTimeout(async () => {
                        await fetch("/api/game", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                roomId,
                                action: "memory-solved",
                                data: {
                                    indices: [firstIndex, secondIndex],
                                    winnerRole: role
                                }
                            })
                        });
                    }, 800);
                } else {
                    setTimeout(async () => {
                        await fetch("/api/game", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                roomId,
                                action: "memory-reset",
                                data: {}
                            })
                        });
                        setFlipped([]);
                        setIsMyTurn(false);
                    }, 1000);
                }
            }
        } catch (e) {
            console.error("Flip failed:", e);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full max-w-lg mx-auto overflow-x-hidden">
            <h2 className="text-3xl md:text-5xl font-black text-blue-600 mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
                Memory Love
            </h2>

            <div className="w-full flex justify-between items-center mb-10 px-6 py-4 bg-white rounded-3xl shadow-sm border-2 border-blue-50">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Me</span>
                    <span className="text-3xl font-black text-blue-600">{scores.me}</span>
                </div>

                <div className={`p-1 rounded-full transition-all flex flex-col items-center gap-1 ${isMyTurn ? "scale-110" : "opacity-40"}`}>
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isMyTurn ? "bg-green-500 text-white animate-pulse" : "bg-gray-200 text-gray-500"}`}>
                        {isMyTurn ? "Your Turn" : "Partner"}
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Partner</span>
                    <span className="text-3xl font-black text-pink-500">{scores.partner}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-4 bg-blue-100 p-3 md:p-6 rounded-[2.5rem] shadow-2xl w-full">
                {cards.map((card, index) => {
                    const isFlipped = flipped.includes(index) || solved.includes(index);
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={index}
                            whileHover={!isFlipped && isMyTurn ? { scale: 1.05 } : {}}
                            whileTap={!isFlipped && isMyTurn ? { scale: 0.95 } : {}}
                            className={`
                                relative w-full aspect-square rounded-2xl md:rounded-3xl flex items-center justify-center cursor-pointer shadow-md transition-all
                                ${isFlipped ? "bg-white" : "bg-gradient-to-br from-blue-400 to-blue-600"}
                                ${!isMyTurn && !isFlipped ? "opacity-60 grayscale-[0.5]" : ""}
                            `}
                            onClick={() => handleCardClick(index)}
                        >
                            <AnimatePresence>
                                {isFlipped ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                        className="text-blue-500"
                                    >
                                        <Icon className="w-8 h-8 md:w-12 md:h-12" />
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ opacity: 0.3 }} className="text-white/20">
                                        <Heart className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {solved.length === cards.length && cards.length > 0 && (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mt-8 text-center">
                    <p className="text-3xl font-black text-blue-600 mb-2 flex items-center gap-2">
                        <Trophy className="text-yellow-400" />
                        {scores.me > scores.partner ? "You Win! ✨" : scores.me < scores.partner ? "Partner Wins! 💖" : "It's a Tie! 🤝"}
                    </p>
                </motion.div>
            )}

            <button onClick={onExit} className="mt-12 text-blue-300 font-bold hover:text-blue-600 transition-colors underline-offset-4 hover:underline">
                Quit Game
            </button>
        </div>
    );
}
