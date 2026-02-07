"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export default function Celebration() {
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        // Launch confetti
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // Show text after a slight delay
        setTimeout(() => setShowText(true), 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-pink-100 text-center p-4">
            {showText && (
                <div className="animate-in fade-in zoom-in duration-1000">
                    <h1 className="text-5xl md:text-7xl font-bold text-pink-600 mb-4 font-serif">
                        Best Decision Ever! 💖
                    </h1>
                    <p className="text-2xl md:text-3xl text-pink-500">
                        I knew you loved me!
                    </p>
                    <img
                        src="https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif"
                        alt="Celebrating Bear"
                        className="mt-8 rounded-lg shadow-lg w-full max-w-md mx-auto"
                    />
                </div>
            )}
        </div>
    );
}
