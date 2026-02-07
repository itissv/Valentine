import { prisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
    try {
        const { roomId } = await req.json();
        // --- MOCK BEHAVIOR IF DATABASE IS MISSING ---
        if (!prisma) {
            console.log("🛠️ [Mock Mode] Joining room:", roomId);
            // In Mock Mode, we'll return a 'pending' role and let the client-side 
            // Presence Presence count decide the role to be 100% accurate.
            return NextResponse.json({
                roomId,
                role: null,
                isHost: false,
                memoryBoard: []
            });
        }
        // --- REAL DATABASE LOGIC ---
        // Using a transaction to ensure atomic count and role assignment
        const result = await prisma.$transaction(async (tx) => {
            // Check if room exists
            let room = await tx.couple.findUnique({
                where: { id: roomId },
                include: { _count: { select: { users: true } } }
            });
            if (!room) {
                room = await tx.couple.create({
                    data: { id: roomId },
                    include: { _count: { select: { users: true } } }
                });
            }
            const currentCount = room._count.users;
            if (currentCount >= 2) {
                return { error: "Room is full", status: 400 };
            }
            // Assign role based on current count
            const role = currentCount === 0 ? "X" : "O";
            const isHost = currentCount === 0;
            await tx.user.create({
                data: { coupleId: roomId }
            });
            return { roomId, role, isHost };
        });
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { role, isHost } = result;
        if (role === "O" && pusherServer) {
            // Joiner triggered ready state
            const memoryIcons = Array.from({ length: 8 }, (_, i) => i);
            const board = [...memoryIcons, ...memoryIcons].sort(() => Math.random() - 0.5);
            await pusherServer.trigger(`presence-room-${roomId}`, "room-ready", {
                roomId,
                memoryBoard: board
            });
        }
        return NextResponse.json({
            roomId,
            role,
            isHost,
            memoryBoard: role === "O" ? [] : null
        });
    } catch (error: any) {
        console.error("Join room error:", error);
        return NextResponse.json({
            error: "Failed to join room",
            details: error.message,
        }, { status: 500 });
    }
}
