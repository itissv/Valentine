"use client";

import { useEffect, useRef, useState } from "react";
import { usePusher } from "@/providers/PusherProvider";
import { Eraser, Pencil } from "lucide-react";

interface DrawTogetherProps {
    roomId: string;
    onExit: () => void;
}

export default function DrawTogether({ roomId, onExit }: DrawTogetherProps) {
    const { pusher } = usePusher();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#ec4899"); // Pink
    const [isDrawing, setIsDrawing] = useState(false);
    const prevPos = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set initial canvas size
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;

        if (!pusher || !roomId) return;

        const channel = pusher.subscribe(`presence-room-${roomId}`);

        channel.bind("draw-line", (data: { x0: number; y0: number; x1: number; y1: number; color: string }) => {
            ctx.strokeStyle = data.color;
            ctx.beginPath();
            ctx.moveTo(data.x0, data.y0);
            ctx.lineTo(data.x1, data.y1);
            ctx.stroke();
        });

        channel.bind("draw-clear", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            pusher.unsubscribe(`presence-room-${roomId}`);
        };
    }, [pusher, roomId]);

    const stopDrawing = () => {
        setIsDrawing(false);
        prevPos.current = null;
    };

    const handlePointerDown = (e: any) => {
        setIsDrawing(true);
        const rect = canvasRef.current!.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        prevPos.current = { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handlePointerMove = async (e: any) => {
        if (!isDrawing || !prevPos.current || !roomId) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;

        // Draw locally
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(prevPos.current.x, prevPos.current.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Emit via API
        try {
            // Note: In high-performance apps, we'd use Pusher Client Events here
            // But for this setup, we use the API route.
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "draw-line",
                    data: {
                        x0: prevPos.current.x,
                        y0: prevPos.current.y,
                        x1: currentX,
                        y1: currentY,
                        color
                    }
                })
            });
        } catch (e) {
            console.error("Draw emit failed:", e);
        }

        prevPos.current = { x: currentX, y: currentY };
    };

    const clearCanvas = async () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "draw-clear",
                    data: {}
                })
            });
        } catch (e) {
            console.error("Clear failed:", e);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 p-4 overscroll-none">
            <h2 className="text-3xl font-bold text-orange-600 mb-4 font-serif">Draw Together</h2>

            <div className="flex gap-4 mb-4">
                <button onClick={() => setColor("#ec4899")} className={`w-8 h-8 rounded-full bg-pink-500 ${color === "#ec4899" ? "ring-2 ring-black" : ""}`} />
                <button onClick={() => setColor("#ef4444")} className={`w-8 h-8 rounded-full bg-red-500 ${color === "#ef4444" ? "ring-2 ring-black" : ""}`} />
                <button onClick={() => setColor("#3b82f6")} className={`w-8 h-8 rounded-full bg-blue-500 ${color === "#3b82f6" ? "ring-2 ring-black" : ""}`} />
                <button onClick={() => setColor("#22c55e")} className={`w-8 h-8 rounded-full bg-green-500 ${color === "#22c55e" ? "ring-2 ring-black" : ""}`} />
                <button onClick={clearCanvas} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                    <Eraser className="w-5 h-5 text-gray-700" />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="bg-white rounded-xl shadow-xl touch-none border-2 border-orange-200"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={stopDrawing}
            />

            <button onClick={onExit} className="mt-4 text-orange-700 underline">Exit Game</button>
        </div>
    );
}
