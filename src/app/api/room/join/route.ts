import { prisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
    try {
        const { roomId } = await req.json();
        // --- MOCK BEHAVIOR IF DATABASE IS MISSING ---
        if (!prisma) {
            console.log("🛠️ [Mock Mode] Joining room:", roomId);
            // Even-length ID = Host, Odd-length ID = Partner?
            // Simple heuristic for testing: if room code ends in a digit, be Partner.
            const isDigit = /\d$/.test(roomId);
            return NextResponse.json({
                roomId,
                role: isDigit ? "O" : "X",
                isHost: !isDigit,
                memoryBoard: isDigit ? [] : null
            });
        }
        // --- REAL DATABASE LOGIC ---
        // We use a transaction to avoid race conditions during role assignment
        const result = await prisma.$transaction(async (tx) => {
            let room = await tx.couple.findUnique({
                where: { id: roomId },
                include: { users: true }
            });
            if (!room) {
                room = await tx.couple.create({
                    data: { id: roomId },
                    include: { users: true }
                });
            }
            const currentUsers = room.users.length;
            if (currentUsers >= 2) {
                return { error: "Room is full", status: 400 };
            }
            const role = currentUsers === 0 ? "X" : "O";
            const isHost = currentUsers === 0;
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
