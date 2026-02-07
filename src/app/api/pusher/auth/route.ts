import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.formData();
    const socketId = body.get("socket_id") as string;
    const channel = body.get("channel_name") as string;

    // For a simple Valentine's app, we'll allow all connections.
    // In a production app, you'd check a session or token here.
    const presenceData = {
        user_id: socketId,
        user_info: { id: socketId },
    };

    if (!pusherServer) {
        return NextResponse.json({ error: "Pusher not configured" }, { status: 503 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
    return NextResponse.json(authResponse);
}
