"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { pusherClient } from "@/lib/pusher";

interface PusherContextType {
    pusher: typeof pusherClient | null;
    isConnected: boolean;
    roomId: string | null;
    isPartnerConnected: boolean;
    role: string | null; // "X" or "O"
    isHost: boolean;
    memoryBoard: number[] | null;
    setRoomInfo: (info: { roomId: string; role: string; isHost: boolean; memoryBoard: number[] | null }) => void;
}

const PusherContext = createContext<PusherContextType>({
    pusher: null,
    isConnected: false,
    roomId: null,
    isPartnerConnected: false,
    role: null,
    isHost: false,
    memoryBoard: null,
    setRoomInfo: () => { },
});

export const usePusher = () => useContext(PusherContext);

export const PusherProvider = ({ children }: { children: ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isPartnerConnected, setIsPartnerConnected] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [memoryBoard, setMemoryBoard] = useState<number[] | null>(null);

    useEffect(() => {
        if (!pusherClient) return;

        pusherClient.connection.bind('connected', () => {
            setIsConnected(true);
            console.log("Pusher connected");
        });

        pusherClient.connection.bind('disconnected', () => {
            setIsConnected(false);
            console.log("Pusher disconnected");
        });

        return () => {
            if (pusherClient) {
                pusherClient.connection.unbind('connected');
                pusherClient.connection.unbind('disconnected');
            }
        };
    }, []);

    useEffect(() => {
        if (!roomId || !pusherClient) return;

        const channel = pusherClient.subscribe(`presence-room-${roomId}`);

        channel.bind('pusher:subscription_succeeded', (members: any) => {
            console.log("Subscribed to room:", roomId, "Members:", members.count);
            if (members.count >= 2) setIsPartnerConnected(true);
        });

        channel.bind('pusher:member_added', () => {
            console.log("Partner joined");
            setIsPartnerConnected(true);
        });

        channel.bind('pusher:member_removed', () => {
            console.log("Partner left");
            setIsPartnerConnected(false);
        });

        // App State Sync
        channel.bind('app-state-changed', (data: { newState: number }) => {
            console.log("App state changed:", data.newState);
        });

        return () => {
            if (pusherClient) {
                pusherClient.unsubscribe(`presence-room-${roomId}`);
            }
        };
    }, [roomId]);

    const setRoomInfo = (info: { roomId: string; role: string; isHost: boolean; memoryBoard: number[] | null }) => {
        setRoomId(info.roomId);
        setRole(info.role);
        setIsHost(info.isHost);
        setMemoryBoard(info.memoryBoard);
    };

    return (
        <PusherContext.Provider value={{
            pusher: pusherClient,
            isConnected,
            roomId,
            isPartnerConnected,
            role,
            isHost,
            memoryBoard,
            setRoomInfo
        }}>
            {children}
        </PusherContext.Provider>
    );
};
