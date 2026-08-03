import { db } from "@/lib/prisma";

export function videoChannelName(appointmentId) {
    return `appointment:${appointmentId}`;
}

// Resolves the Clerk-authenticated caller against a specific appointment and
// returns their role on that appointment, or null if they aren't one of its
// two participants. Every video-related entry point (token route, session
// creation, the call page itself) must go through this rather than trusting
// the appointmentId route param alone.
export async function getAppointmentForParticipant(appointmentId, clerkUserId) {
    if (!clerkUserId) return null;

    const user = await db.user.findUnique({ where: { clerkUserId } });
    if (!user) return null;

    const appointment = await db.appointment.findFirst({
        where: {
            id: appointmentId,
            OR: [{ patientId: user.id }, { doctorId: user.id }],
        },
        include: {
            patient: { select: { id: true, name: true } },
            doctor: { select: { id: true, name: true } },
        },
    });

    if (!appointment) return null;

    const role = appointment.patientId === user.id ? "patient" : "doctor";
    return { appointment, user, role };
}
