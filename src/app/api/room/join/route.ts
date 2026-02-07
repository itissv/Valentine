import { prisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { roomId } = await req.json();

        // --- MOCK BEHAVIOR IF DATABASE IS MISSING ---
        if (!prisma) {
            console.log("🛠️ Mocking room join (No DB):", roomId);
            // Simulate that the room is always available and we are first/second
            // We'll use a simple logic: if roomId is even, we are X, else O? 
            // Or just always room-ready for testing.

            // For testing, we'll just return a success state
            return NextResponse.json({
                roomId,
                role: "X", // Default to host for local testing
                isHost: true,
                memoryBoard: []
            });
        }

        // --- REAL DATABASE LOGIC ---
        let room = await prisma.couple.findUnique({
            where: { id: roomId },
            include: { users: true }
        });

        if (!room) {
            room = await prisma.couple.create({
                data: { id: roomId },
                include: { users: true }
            });
        }

        const memberCount = room.users.length;
        let role = "X";
        let isHost = true;

        if (memberCount >= 2) {
            return NextResponse.json({ error: "Room is full" }, { status: 400 });
        }

        if (memberCount === 1) {
            role = "O";
            isHost = false;
        }

        await prisma.user.create({
            data: {
                coupleId: roomId,
            }
        });

        if (memberCount === 1 && pusherServer) {
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
            memoryBoard: memberCount === 1 ? [] : null
        });

    } catch (error: any) {
        console.error("Join room error:", error);
        return NextResponse.json({
            error: "Failed to join room",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
