"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { pusherClient } from "@/lib/pusher";
interface PusherContextType {
    pusher: typeof pusherClient | null;
    isConnected: boolean;
    roomId: string | null;
    channel: any;
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
    channel: null,
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
    const [channel, setChannel] = useState<any>(null);
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
        console.log("📡 [Pusher] Subscribing to:", roomId);
        const newChannel = pusherClient.subscribe(`presence-room-${roomId}`);
        setChannel(newChannel);
        newChannel.bind('pusher:subscription_succeeded', (members: any) => {
            console.log("📡 [Pusher] Subscribed! Members:", members.count);
            if (members.count >= 2) setIsPartnerConnected(true);
            // If the API didn't give us a role yet (Mock Mode fallback)
            // Or if we need to re-verify roles
            if (!role) {
                const assignedRole = members.count <= 1 ? "X" : "O";
                console.log("📡 [Pusher] Auto-assigned role:", assignedRole);
                setRole(assignedRole);
                setIsHost(assignedRole === "X");
            }
        });
        newChannel.bind('pusher:member_added', (member: any) => {
            console.log("📡 [Pusher] Partner joined:", member.id);
            setIsPartnerConnected(true);
        });
        newChannel.bind('pusher:member_removed', (member: any) => {
            console.log("📡 [Pusher] Partner left:", member.id);
            setIsPartnerConnected(false);
        });
        return () => {
            console.log("📡 [Pusher] Unsubscribing from:", roomId);
            if (pusherClient) {
                pusherClient.unsubscribe(`presence-room-${roomId}`);
            }
            setChannel(null);
        };
    }, [roomId]);
    const setRoomInfo = (info: { roomId: string; role: string; isHost: boolean; memoryBoard: number[] | null }) => {
        console.log("📡 [Pusher] Setting Room Info:", info);
        setRoomId(info.roomId);
        // Prioritize API-assigned roles, but we have the Presence fallback above
        setRole(info.role);
        setIsHost(info.isHost);
        setMemoryBoard(info.memoryBoard);
    };
    return (
        <PusherContext.Provider value={{
            pusher: pusherClient,
            isConnected,
            roomId,
            channel,
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
