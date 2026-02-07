"use client";

import { usePusher } from "@/providers/PusherProvider";
import {
    Gamepad2,
    Heart,
    Dice5,
    Brain,
    Paintbrush,
    UserIcon,
    Crown
} from "lucide-react";
import { motion } from "framer-motion";

const games = [
    { id: "tictactoe", name: "Tic Tac Toe", icon: Gamepad2, color: "bg-pink-500", desc: "Classic battle of hearts" },
    { id: "quiz", name: "Love Quiz", icon: Heart, color: "bg-red-500", desc: "How well do you know me?" },
    { id: "truth", name: "Truth or Dare", icon: Dice5, color: "bg-purple-500", desc: "Playful secrets & actions" },
    { id: "memory", name: "Memory Match", icon: Brain, color: "bg-blue-500", desc: "Test your connection memory" },
    { id: "draw", name: "Draw Together", icon: Paintbrush, color: "bg-orange-500", desc: "Create art as a couple" },
];

export default function GameHub({ onSelectGame }: { onSelectGame: (id: string) => void }) {
    const { isHost } = usePusher();

    return (
        <div className="w-full max-w-4xl px-4 py-8 mx-auto">
            <div className="text-center mb-12">
                <motion.h2
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl md:text-5xl font-black text-pink-600 mb-4 font-serif"
                >
                    Our Playroom
                </motion.h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full text-pink-700 font-bold text-sm uppercase tracking-widest shadow-sm">
                    {isHost ? (
                        <>
                            <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            You are the Leader - Choose a Game
                        </>
                    ) : (
                        <>
                            <UserIcon className="w-4 h-4" />
                            Wait for Partner to pick a game
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, index) => (
                    <motion.button
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => isHost && onSelectGame(game.id)}
                        disabled={!isHost}
                        className={`
                            group relative overflow-hidden text-white p-8 rounded-3xl shadow-xl transition-all 
                            ${game.color} 
                            ${isHost ? "hover:scale-105 active:scale-95 hover:shadow-2xl cursor-pointer" : "opacity-60 cursor-not-allowed"}
                            flex flex-col items-center gap-5 aspect-[4/3] sm:aspect-square flex-1
                        `}
                    >
                        {/* Decorative background circle */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                        <game.icon className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg group-hover:rotate-12 transition-transform" />
                        <div className="text-center">
                            <span className="text-2xl md:text-3xl font-black block mb-1">{game.name}</span>
                            <span className="text-xs md:text-sm font-medium text-white/80">{game.desc}</span>
                        </div>

                        {!isHost && (
                            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="sr-only">Disabled</span>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
