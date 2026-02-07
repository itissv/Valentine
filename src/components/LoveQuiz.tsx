"use client";

import { useState, useEffect } from "react";
import { usePusher } from "@/providers/PusherProvider";

const QUESTIONS = [
    "What is my favorite food?",
    "Where did we first meet?",
    "What is my dream vacation?",
    "What is your favorite thing about me?",
    "Who said 'I love you' first?",
];

interface LoveQuizProps {
    roomId: string;
    onExit: () => void;
}

export default function LoveQuiz({ roomId, onExit }: LoveQuizProps) {
    const { pusher } = usePusher();
    const [qIndex, setQIndex] = useState(0);
    const [myAnswer, setMyAnswer] = useState("");
    const [partnerAnswer, setPartnerAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!pusher || !roomId) return;

        const channel = pusher.subscribe(`presence-room-${roomId}`);

        channel.bind("quiz-answer", (data: { answer: string }) => {
            setPartnerAnswer(data.answer);
        });

        channel.bind("quiz-next", () => {
            setQIndex((prev) => prev + 1);
            setMyAnswer("");
            setPartnerAnswer("");
            setSubmitted(false);
        });

        return () => {
            pusher.unsubscribe(`presence-room-${roomId}`);
        };
    }, [pusher, roomId]);

    const submitAnswer = async () => {
        setSubmitted(true);
        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "quiz-answer",
                    data: { answer: myAnswer }
                })
            });
        } catch (e) {
            console.error("Submit failed:", e);
        }
    };

    const nextQuestion = async () => {
        try {
            await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    action: "quiz-next",
                    data: {}
                })
            });
            // Optimistic update
            setQIndex((prev) => prev + 1);
            setMyAnswer("");
            setPartnerAnswer("");
            setSubmitted(false);
        } catch (e) {
            console.error("Next question failed:", e);
        }
    };

    const isFinished = qIndex >= QUESTIONS.length;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50 p-6">
            <h2 className="text-3xl font-bold text-pink-700 mb-8 font-serif">Love Quiz</h2>

            {!isFinished ? (
                <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-xl">
                    <p className="text-gray-500 mb-2 uppercase tracking-wide text-xs">Question {qIndex + 1} of {QUESTIONS.length}</p>
                    <h3 className="text-2xl font-bold mb-6 text-pink-600">{QUESTIONS[qIndex]}</h3>

                    <input
                        type="text"
                        value={myAnswer}
                        onChange={(e) => setMyAnswer(e.target.value)}
                        disabled={submitted}
                        placeholder="Type your answer..."
                        className="w-full border p-3 rounded-lg mb-4 focus:ring-2 focus:ring-pink-400 outline-none"
                    />

                    {!submitted ? (
                        <button
                            onClick={submitAnswer}
                            disabled={!myAnswer}
                            className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 disabled:opacity-50"
                        >
                            Submit Answer
                        </button>
                    ) : (
                        <div className="text-center">
                            <p className="text-green-500 font-bold mb-4">Answer Submitted!</p>
                            {partnerAnswer ? (
                                <div className="bg-pink-100 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-gray-600">Partner said:</p>
                                    <p className="text-xl font-bold text-pink-800">{partnerAnswer}</p>
                                </div>
                            ) : (
                                <p className="text-gray-400 italic mb-4">Waiting for partner...</p>
                            )}

                            {partnerAnswer && (
                                <button
                                    onClick={nextQuestion}
                                    className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600"
                                >
                                    Next Question
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center">
                    <h3 className="text-3xl font-bold text-pink-600 mb-4">Quiz Complete! 💖</h3>
                    <p className="text-gray-600">You really know each other!</p>
                    <button onClick={onExit} className="mt-8 text-pink-700 underline">Back to Playroom</button>
                </div>
            )}

            {!isFinished && <button onClick={onExit} className="mt-8 text-gray-400 underline text-sm">Exit Game</button>}
        </div>
    );
}
