"use client";

import { useState, useEffect } from "react";
import { usePusher } from "@/providers/PusherProvider";
import Proposal from "@/components/Proposal";
import Celebration from "@/components/Celebration";
import CoupleConnect from "@/components/CoupleConnect";
import GameHub from "@/components/GameHub";
import TicTacToe from "@/components/TicTacToe";
import TruthOrDare from "@/components/TruthOrDare";
import MemoryMatch from "@/components/MemoryMatch";
import DrawTogether from "@/components/DrawTogether";
import LoveQuiz from "@/components/LoveQuiz";

enum AppState {
  PROPOSAL,
  CELEBRATION,
  CONNECT,
  DASHBOARD,
  GAME_TICTACTOE,
  GAME_QUIZ,
  GAME_TRUTH,
  GAME_MEMORY,
  GAME_DRAW
}

export default function Home() {
  const { pusher, roomId, isHost } = usePusher();
  const [appState, setAppState] = useState<AppState>(AppState.PROPOSAL);

  useEffect(() => {
    if (!pusher || !roomId) return;

    const channel = pusher.subscribe(`presence-room-${roomId}`);

    channel.bind("app-state-changed", (data: { newState: AppState }) => {
      console.log("App state changed via Pusher:", data.newState);
      setAppState(data.newState);
    });

    return () => {
      pusher.unsubscribe(`presence-room-${roomId}`);
    };
  }, [pusher, roomId]);

  const changeState = async (newState: AppState) => {
    if (isHost && roomId) {
      // Use API to trigger Pusher event
      try {
        await fetch("/api/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            action: "app-state-changed",
            data: { newState }
          })
        });
      } catch (e) {
        console.error("Failed to change app state:", e);
      }
    } else if (!roomId) {
      // Local only changes (Proposal flow)
      setAppState(newState);
    }
  };

  const handleProposalYes = () => {
    setAppState(AppState.CELEBRATION);
    setTimeout(() => setAppState(AppState.CONNECT), 8000);
  };

  const handleConnected = (id: string) => {
    setAppState(AppState.DASHBOARD);
  };

  const handleSelectGame = (gameId: string) => {
    let newState = AppState.DASHBOARD;
    switch (gameId) {
      case "tictactoe": newState = AppState.GAME_TICTACTOE; break;
      case "quiz": newState = AppState.GAME_QUIZ; break;
      case "truth": newState = AppState.GAME_TRUTH; break;
      case "memory": newState = AppState.GAME_MEMORY; break;
      case "draw": newState = AppState.GAME_DRAW; break;
    }
    changeState(newState);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-pink-50 selection:bg-pink-200 overflow-x-hidden">
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 py-6 md:py-12 relative overflow-hidden">
        {appState === AppState.PROPOSAL && <Proposal onYes={handleProposalYes} />}

        {appState === AppState.CELEBRATION && <Celebration />}

        {appState === AppState.CONNECT && (
          <div className="w-full max-w-md">
            <CoupleConnect onConnected={handleConnected} />
          </div>
        )}

        {appState === AppState.DASHBOARD && (
          <div className="w-full max-w-4xl">
            <GameHub onSelectGame={handleSelectGame} />
          </div>
        )}

        <div className="w-full max-w-5xl">
          {appState === AppState.GAME_TICTACTOE && (
            <TicTacToe roomId={roomId!} onExit={() => changeState(AppState.DASHBOARD)} />
          )}

          {appState === AppState.GAME_TRUTH && (
            <TruthOrDare roomId={roomId!} onExit={() => changeState(AppState.DASHBOARD)} />
          )}

          {appState === AppState.GAME_MEMORY && (
            <MemoryMatch roomId={roomId!} onExit={() => changeState(AppState.DASHBOARD)} />
          )}

          {appState === AppState.GAME_DRAW && (
            <DrawTogether roomId={roomId!} onExit={() => changeState(AppState.DASHBOARD)} />
          )}

          {appState === AppState.GAME_QUIZ && (
            <LoveQuiz roomId={roomId!} onExit={() => changeState(AppState.DASHBOARD)} />
          )}
        </div>
      </main>

      <footer className="w-full py-6 md:py-8 px-4 md:px-6 border-t border-pink-100 bg-white/60 backdrop-blur-md mt-auto z-10 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-pink-600 font-medium">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-base md:text-lg font-black">
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>Valentine&apos;s Special</span>
            </div>
            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-[0.2em] text-center md:text-left">Our Little Secret Place</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-2 text-[10px] md:text-sm bg-pink-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-pink-100 shadow-sm">
              <span className="text-pink-400">Handcrafted by</span>
              <span className="font-black text-pink-700 underline decoration-2 decoration-pink-300 underline-offset-4">COOKED</span>
            </div>
            <p className="text-[9px] md:text-[10px] text-pink-300 font-bold">© 2026 • Forever & Always</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
