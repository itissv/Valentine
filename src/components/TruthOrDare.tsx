"use client";
import { useState, useEffect } from "react";
import { usePusher } from "@/providers/PusherProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Dice5, HelpCircle, Heart, ArrowRight } from "lucide-react";
const TRUTH_QUESTIONS = [
    "What was your first impression of me?",
    "What is your favorite memory of us?",
    "When did you realize you loved me?",
    "What is one thing you're scared to ask me?",
    "What is my most annoying habit?",
    "What is the most romantic thing I've done?",
    "If we could go anywhere right now, where would it be?",
    "What about me makes you smile the most?",
];
const DARES = [
    "Give me a 10-second massage.",
    "Sing a romantic song to me.",
    "Do your best impression of me.",
    "Whisper something sweet in my ear.",
    "Hold my hand for the next 3 rounds.",
    "Kiss me on the forehead.",
    "Dance with me (no music) for 30 seconds.",
    "Post a photo of us on your story right now.",
];
export default function TruthOrDare({ roomId, onExit }: TruthOrDareProps) {
    const { channel, role } = usePusher();
    const [currentCard, setCurrentCard] = useState<string | null>(null);
    const [type, setType] = useState<"TRUTH" | "DARE" | null>(null);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [partnerAction, setPartnerAction] = useState<string | null>(null);
    useEffect(() => {
        if (!channel || !role) return;
        // X starts
        setIsMyTurn(role === "X");
        const handleUpdate = (data: { type: "TRUTH" | "DARE", card: string, nextTurn: string }) => {
            console.log("📡 [TruthOrDare] Update received:", data);
            setType(data.type);
            setCurrentCard(data.card);
            setPartnerAction(null);
            setIsMyTurn(data.nextTurn === role);
        };
        const handleWaiting = (data: { message: string, waitingRole: string }) => {
            console.log("📡 [TruthOrDare] Waiting received:", data);
            if (data.waitingRole === role) {
                setPartnerAction(data.message);
                setCurrentCard(null);
                setType(null);
            }
        };
        channel.bind("tod-update", handleUpdate);
        channel.bind("tod-waiting", handleWaiting);
        return () => {
            channel.unbind("tod-update", handleUpdate);
            channel.unbind("tod-waiting", handleWaiting);
        };
    }, [channel, role]);
    const pickCard = async (selectedType: "TRUTH" | "DARE") => {
        if (!isMyTurn) return;
        const pool = selectedType === "TRUTH" ? TRUTH_QUESTIONS : DARES;
        const card = pool[Math.floor(Math.random() * pool.length)];
        setType(selectedType);
        setCurrentCard(card);
        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "tod-update",
                    data: {
                        type: selectedType,
                        card,
                        nextTurn: role // Current player stays as active for "Done!" button
                    }
                })
            });
        } catch (e) {
            console.error("Pick card failed:", e);
        }
    };
    const completeTurn = async () => {
        setCurrentCard(null);
        setType(null);
        setIsMyTurn(false);
        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "tod-update",
                    data: {
                        type: null,
                        card: null,
                        nextTurn: role === "X" ? "O" : "X"
                    }
                })
            });
            // Also notify the other player they can choose
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "tod-waiting",
                    data: {
                        message: "Wait for partner's choice...",
                        waitingRole: role
                    }
                })
            });
        } catch (e) {
            console.error("Complete turn failed:", e);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center p-2 w-full max-w-full md:max-w-lg mx-auto overflow-x-hidden min-h-[80vh]">
            <h2 className="text-2xl md:text-5xl font-black text-purple-700 mb-1 font-serif flex items-center gap-2 md:gap-3">
                <Dice5 className="w-7 h-7 md:w-12 md:h-12 text-purple-600" />
                Truth or Dare
            </h2>
            <p className="text-purple-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 md:mb-10 flex items-center gap-1 md:gap-2">
                <Heart className="w-3 h-3 fill-current" /> Reveal Secrets & Fun Tasks
            </p>
            <div className="mb-10 w-full flex justify-center">
                <div className={`px-8 py-3 rounded-full font-black shadow-lg transition-all border-2 ${isMyTurn ? "bg-purple-600 text-white border-purple-400 animate-pulse scale-105" : "bg-white text-gray-300 border-gray-100"}`}>
                    {isMyTurn ? "YOUR TURN! ✨" : "WAITING FOR PARTNER... ⏳"}
                </div>
            </div>
            <AnimatePresence mode="wait">
                {!currentCard ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full"
                    >
                        {isMyTurn ? (
                            <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-sm mx-auto">
                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => pickCard("TRUTH")}
                                    className="bg-blue-500 hover:bg-blue-600 text-white aspect-[2/3] md:w-44 md:h-64 rounded-3xl text-xl md:text-3xl font-black shadow-2xl flex flex-col items-center justify-center gap-3 border-4 md:border-8 border-white group transition-colors"
                                >
                                    <HelpCircle className="w-10 h-10 md:w-14 md:h-14 group-hover:rotate-12 transition-transform" />
                                    TRUTH
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: 3 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => pickCard("DARE")}
                                    className="bg-red-500 hover:bg-red-600 text-white aspect-[2/3] md:w-44 md:h-64 rounded-3xl text-xl md:text-3xl font-black shadow-2xl flex flex-col items-center justify-center gap-3 border-4 md:border-8 border-white group transition-colors"
                                >
                                    <Dice5 className="w-10 h-10 md:w-14 md:h-14 group-hover:rotate-[-12deg] transition-transform" />
                                    DARE
                                </motion.button>
                            </div>
                        ) : (
                            <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-xl border-4 border-purple-50 flex flex-col items-center gap-6 text-center">
                                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center relative">
                                    <Sparkles className="w-10 h-10 text-purple-400 animate-spin-slow" />
                                    <Heart className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 fill-current animate-bounce" />
                                </div>
                                <p className="text-xl font-black text-gray-700 uppercase tracking-tighter italic">Partner is choosing...</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
                        className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-2xl w-full text-center border-4 md:border-8 border-purple-100 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-full h-2 ${type === "TRUTH" ? "bg-blue-400" : "bg-red-400"}`} />
                        <h3 className={`text-xs md:text-sm font-black mb-6 tracking-widest uppercase ${type === "TRUTH" ? "text-blue-500" : "text-red-500"}`}>
                            THE {type}
                        </h3>
                        <p className="text-2xl md:text-4xl font-black text-gray-800 mb-14 leading-tight font-serif italic text-balance">
                            &quot;{currentCard}&quot;
                        </p>
                        {isMyTurn ? (
                            <button
                                onClick={completeTurn}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-black py-4 px-10 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto uppercase tracking-tighter"
                            >
                                Done! Next Turn <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                </div>
                                <p className="text-purple-400 font-black text-xs uppercase tracking-widest">Partner is doing the task</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            <button onClick={onExit} className="mt-12 text-purple-300 font-bold hover:text-purple-600 transition-colors underline-offset-4 hover:underline">
                Back to Playroom
            </button>
        </div>
    );
}
