"use client";
import { useState, useEffect } from "react";
import { usePusher } from "@/providers/PusherProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X, Circle, RotateCcw, Trophy, Heart } from "lucide-react";
interface TicTacToeProps {
    roomId: string;
    onExit: () => void;
}
export default function TicTacToe({ roomId, onExit }: TicTacToeProps) {
    const { pusher, role, channel } = usePusher();
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    useEffect(() => {
        if (!channel || !role) return;
        // X goes first
        setIsMyTurn(role === "X");
        const handleMove = (data: { index: number, symbol: string }) => {
            console.log("📡 [TicTacToe] Move received:", data);
            setBoard((prev) => {
                const newBoard = [...prev];
                newBoard[data.index] = data.symbol;
                const gameWinner = checkWinner(newBoard);
                if (gameWinner) setWinner(gameWinner);
                return newBoard;
            });
            setIsMyTurn(true);
        };
        const handleReset = () => {
            console.log("📡 [TicTacToe] Game reset");
            setBoard(Array(9).fill(null));
            setWinner(null);
            setIsMyTurn(role === "X");
        };
        channel.bind("move-made", handleMove);
        channel.bind("game-reset", handleReset);
        return () => {
            channel.unbind("move-made", handleMove);
            channel.unbind("game-reset", handleReset);
        };
    }, [channel, role]);
    const checkWinner = (squares: (string | null)[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        if (squares.every(s => s !== null)) return "DRAW";
        return null;
    };
    const handleClick = async (index: number) => {
        if (board[index] || winner || !isMyTurn || !role) return;
        const newBoard = [...board];
        newBoard[index] = role;
        setBoard(newBoard);
        setIsMyTurn(false);
        // API call to trigger Pusher event for partner
        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "move-made",
                    data: { index, symbol: role }
                })
            });
            const gameWinner = checkWinner(newBoard);
            if (gameWinner) {
                setWinner(gameWinner);
                await fetch("/api/game", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId,
                        action: "game-end",
                        data: {
                            gameType: "TIC_TAC_TOE",
                            winner: gameWinner,
                            state: newBoard
                        }
                    })
                });
            }
        } catch (e) {
            console.error("Move failed:", e);
        }
    };
    const resetGame = async () => {
        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "game-reset",
                    data: {}
                })
            });
        } catch (e) {
            console.error("Reset failed:", e);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center p-2 w-full max-w-full md:max-w-sm mx-auto overflow-hidden">
            <h2 className="text-2xl md:text-5xl font-black text-pink-600 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                <Heart className="w-6 h-6 md:w-12 md:h-12 fill-current" />
                Tic-Tac-Love
            </h2>
            <div className="w-full flex justify-between items-center mb-8 px-4 py-3 bg-white rounded-2xl shadow-sm border border-pink-100">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">You</span>
                    <div className={`p-2 rounded-xl border-2 ${role === "X" ? "border-pink-500 bg-pink-50 text-pink-500" : "border-blue-400 bg-blue-50 text-blue-400"}`}>
                        {role === "X" ? <X className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-black text-sm uppercase tracking-tighter ${isMyTurn ? "bg-green-500 text-white animate-pulse" : "bg-gray-100 text-gray-400"}`}>
                    {winner ? "Done!" : isMyTurn ? "Your Turn" : "Partner's Turn"}
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Partner</span>
                    <div className={`p-2 rounded-xl border-2 ${role === "O" ? "border-pink-500 bg-pink-50 text-pink-500" : "border-blue-400 bg-blue-50 text-blue-400"}`}>
                        {role === "O" ? <X className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4 w-full aspect-square bg-pink-100 p-2 md:p-4 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:16px_16px]" />
                {board.map((cell, i) => (
                    <motion.button
                        key={i}
                        whileHover={!cell && !winner && isMyTurn ? { scale: 1.02 } : {}}
                        whileTap={!cell && !winner && isMyTurn ? { scale: 0.95 } : {}}
                        onClick={() => handleClick(i)}
                        className={`
                            relative z-10 w-full h-full bg-white rounded-2xl flex items-center justify-center transition-all shadow-sm
                            ${!cell && !winner && isMyTurn ? "hover:bg-pink-50 cursor-pointer" : "cursor-default"}
                            ${cell === "X" ? "text-pink-500" : "text-blue-500"}
                        `}
                    >
                        <AnimatePresence>
                            {cell === "X" && (
                                <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}>
                                    <X className="w-10 h-10 md:w-14 md:h-14 stroke-[3px]" />
                                </motion.div>
                            )}
                            {cell === "O" && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <Circle className="w-9 h-9 md:w-13 md:h-13 stroke-[3px]" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </div>
            <AnimatePresence>
                {winner && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex flex-col items-center text-center"
                    >
                        <div className="flex items-center gap-2 text-2xl font-black mb-4">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            <span className="text-pink-600">
                                {winner === "DRAW" ? "It's a Tie! 💕" : winner === role ? "You Won! ✨" : "Partner Won 💖"}
                            </span>
                        </div>
                        <button
                            onClick={resetGame}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                        >
                            <RotateCcw className="w-5 h-5" /> Play Again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <button onClick={onExit} className="mt-12 text-pink-300 font-bold hover:text-pink-500 transition-colors underline-offset-4 hover:underline">
                Back to Playroom
            </button>
        </div>
    );
}
