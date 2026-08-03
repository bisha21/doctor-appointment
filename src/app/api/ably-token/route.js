import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ablyRest } from "@/lib/ablyServer";
import { getAppointmentForParticipant, videoChannelName } from "@/lib/videoAccess";

// Ably's client SDK calls this as its authUrl. The raw ABLY_API_KEY never
// leaves the server — this endpoint only ever hands back a short-lived token
// request scoped to the single appointment channel the caller is allowed on.
export async function GET(request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointmentId = request.nextUrl.searchParams.get("appointmentId");
    if (!appointmentId) {
        return NextResponse.json(
            { error: "appointmentId is required" },
            { status: 400 }
        );
    }

    const access = await getAppointmentForParticipant(appointmentId, userId);
    if (!access) {
        return NextResponse.json(
            { error: "Not a participant on this appointment" },
            { status: 403 }
        );
    }

    const channel = videoChannelName(appointmentId);

    try {
        const tokenRequestData = await ablyRest.auth.createTokenRequest({
            clientId: access.user.id,
            capability: {
                [channel]: ["publish", "subscribe", "presence"],
            },
            ttl: 60 * 60 * 1000,
        });

        return NextResponse.json(tokenRequestData);
    } catch (error) {
        console.error("Failed to create Ably token request:", error);
        return NextResponse.json(
            { error: "Failed to create token request" },
            { status: 500 }
        );
    }
}
