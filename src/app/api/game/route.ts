import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { roomId, action, data } = await req.json();

        // Trigger Pusher event
        if (pusherServer) {
            await pusherServer.trigger(`presence-room-${roomId}`, action, data);
        }

        // Optional: Persist to DB if it's an "end-game" or "save-state" action
        if (prisma && action === "game-end") {
            await prisma.game.create({
                data: {
                    type: data.gameType || "UNKNOWN",
                    state: JSON.stringify(data.state),
                    coupleId: roomId,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Game action error:", error);
        return NextResponse.json({ error: "Failed to process game action" }, { status: 500 });
    }
}
