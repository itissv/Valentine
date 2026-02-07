"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Proposal({ onYes }: { onYes: () => void }) {
  const [noCount, setNoCount] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleNoClick = () => {
    setNoCount(noCount + 1);

    // Use relative bounds (percentages) for better mobile safety
    // Max movement is 35% of half the screen in any direction
    const xRange = 35;
    const yRange = 35;

    const x = (Math.random() * xRange * 2) - xRange;
    const y = (Math.random() * yRange * 2) - yRange;

    // Also add a bit of "safe kick" to ensure it doesn't just vibrate in place
    const kickX = x > 0 ? x + 10 : x - 10;
    const kickY = y > 0 ? y + 10 : y - 10;

    setPosition({ x: kickX, y: kickY });
  };

  const getNoButtonText = () => {
    const phrases = [
      "No",
      "Are you sure?",
      "Really sure?",
      "Think again!",
      "Last chance!",
      "Surely not?",
      "You might regret this!",
      "Give it another thought!",
      "Are you absolutely certain?",
      "This could be a mistake!",
      "Have a heart!",
      "Don't be so cold!",
      "Change of heart?",
      "Wouldn't you reconsider?",
      "Is that your final answer?",
      "You're breaking my heart ;(",
    ];
    return phrases[Math.min(noCount, phrases.length - 1)];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-pink-100 p-6 overflow-hidden relative">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-black text-pink-600 mb-12 text-center font-serif drop-shadow-sm max-w-[90vw]"
      >
        Will you be my Valentine?
      </motion.h1>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative w-full h-[300px] md:h-auto max-w-md">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-2xl bg-green-500 px-10 py-5 text-2xl font-black text-white shadow-xl hover:bg-green-600 transition-all z-20"
          style={{ fontSize: Math.min(noCount * 5 + 24, 80) }}
          onClick={onYes}
        >
          Yes
        </motion.button>
        <motion.button
          className={cn(
            "rounded-2xl bg-red-500 px-8 py-4 text-xl font-bold text-white hover:bg-red-600 shadow-lg z-30 whitespace-nowrap",
            noCount > 0 ? "absolute" : "relative"
          )}
          animate={noCount > 0 ? { x: position.x, y: position.y } : { x: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onMouseEnter={handleNoClick}
          onClick={handleNoClick}
          style={noCount > 0 ? {
            left: "50%",
            top: "50%",
            marginLeft: "-75px", // Half of average button width
            marginTop: "-30px", // Half of average button height
          } : {}}
        >
          {getNoButtonText()}
        </motion.button>
      </div>
    </div>
  );
}
