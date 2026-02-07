"use client";

import { useState, useEffect, useCallback } from "react";
import { usePusher } from "@/providers/PusherProvider";
import { Copy, Users, Check, Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";

export default function CoupleConnect({ onConnected }: { onConnected: (roomId: string) => void }) {
    const { pusher, isConnected, setRoomInfo } = usePusher();
    const [roomInput, setRoomInput] = useState("");
    const [generatedRoomId, setGeneratedRoomId] = useState("");
    const [isWaiting, setIsWaiting] = useState(false);
    const [isJoiner, setIsJoiner] = useState(false);
    const [copied, setCopied] = useState(false);
    const [partnerJoined, setPartnerJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const proceedToGames = useCallback((id: string) => {
        console.log("Proceeding to games with room:", id);
        setPartnerJoined(true);
        setTimeout(() => {
            onConnected(id);
        }, 1500);
    }, [onConnected]);

    useEffect(() => {
        if (!pusher || !generatedRoomId || !isWaiting) return;

        const channel = pusher.subscribe(`presence-room-${generatedRoomId}`);

        channel.bind('pusher:member_added', () => {
            console.log("Partner joined!");
            setPartnerJoined(true);
            proceedToGames(generatedRoomId);
        });

        channel.bind('room-ready', (data: { roomId: string; memoryBoard: number[] }) => {
            console.log("Room ready received!", data);
            setRoomInfo({
                roomId: data.roomId,
                role: "O", // If we were waiting and got room-ready, we might be the joiner
                isHost: false, // Default for joiner
                memoryBoard: data.memoryBoard
            });
            proceedToGames(data.roomId);
        });

        return () => {
            pusher.unsubscribe(`presence-room-${generatedRoomId}`);
        };
    }, [pusher, generatedRoomId, isWaiting, setRoomInfo, proceedToGames]);

    const joinRoomAPI = async (id: string) => {
        try {
            const res = await fetch("/api/room/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: id })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error + (data.details ? `: ${data.details}` : "") || "Failed to join room");
                setIsWaiting(false);
                return;
            }

            setRoomInfo({
                roomId: data.roomId,
                role: data.role,
                isHost: data.isHost,
                memoryBoard: data.memoryBoard
            });

            if (data.role === "O") {
                // Joiner is immediately ready if they joined a room with someone
                proceedToGames(data.roomId);
            }
        } catch (e: any) {
            console.error("Join Room API Error:", e);
            setError(`Network error: ${e.message}. Check your console and .env file.`);
            setIsWaiting(false);
        }
    };

    const createRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setGeneratedRoomId(newRoomId);
        setIsWaiting(true);
        setIsJoiner(false);
        setError(null);
        joinRoomAPI(newRoomId);
    };

    const handleJoin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = roomInput.trim().toUpperCase();
        if (!code) return;

        setGeneratedRoomId(code);
        setIsWaiting(true);
        setIsJoiner(true);
        setError(null);
        joinRoomAPI(code);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-pink-200">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                {isConnected ? (
                    <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                        <Wifi className="w-3 h-3" /> Online
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                        <WifiOff className="w-3 h-3" /> Offline
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-bold text-pink-600 mb-2 flex items-center gap-2">
                <Users className="w-7 h-7" /> Connect Room
            </h2>
            <p className="text-gray-500 text-sm mb-8 text-center px-4">
                Share a code with your partner to start your romantic adventure together!
            </p>

            {error && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {!isWaiting ? (
                <div className="flex flex-col gap-6 w-full">
                    <button
                        onClick={createRoom}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
                    >
                        ✨ Create New Private Room
                    </button>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-full border-t border-gray-200"></div>
                        <span className="relative bg-white px-4 text-gray-400 text-xs font-bold tracking-widest uppercase">Or Join Room</span>
                    </div>

                    <form onSubmit={handleJoin} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ROOM CODE"
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                                className="flex-1 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-300 uppercase text-center text-xl font-mono tracking-[0.2em] transition-all bg-gray-50/50"
                                maxLength={6}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!roomInput.trim()}
                            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg"
                        >
                            🚀 Join Room
                        </button>
                    </form>
                </div>
            ) : (
                <div className="text-center w-full min-h-[250px] flex flex-col justify-center">
                    {partnerJoined ? (
                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                                <Check className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-green-600">Connected! 💕</h3>
                            <p className="text-gray-500 animate-pulse">Launching your experience...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!isJoiner ? (
                                <>
                                    <p className="text-gray-600 font-medium">Share this code with your partner:</p>
                                    <div className="flex items-center justify-center gap-4 bg-gradient-to-br from-pink-50 to-rose-50 p-8 rounded-3xl border-2 border-pink-100 shadow-inner relative group">
                                        <span className="text-5xl font-mono font-black text-pink-700 tracking-wider">
                                            {generatedRoomId}
                                        </span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="absolute -right-3 -top-3 p-4 bg-white border border-pink-100 rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95 group-hover:rotate-6"
                                            title="Copy Code"
                                        >
                                            {copied ? (
                                                <Check className="w-6 h-6 text-green-500" />
                                            ) : (
                                                <Copy className="w-6 h-6 text-pink-500" />
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center border border-purple-100">
                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-700">Joining Room...</h3>
                                    <p className="text-pink-600 font-mono font-bold tracking-widest">{generatedRoomId}</p>
                                </div>
                            )}

                            {!isJoiner && (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-3 text-pink-400">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="font-bold text-sm tracking-wide">WAITING FOR PARTNER</span>
                                    </div>
                                    <button
                                        onClick={() => setIsWaiting(false)}
                                        className="text-xs text-gray-400 hover:text-pink-500 underline transition-colors"
                                    >
                                        Cancel and try another room
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
