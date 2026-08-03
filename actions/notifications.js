"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";

async function ensureUpcomingReminders(user) {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = await db.appointment.findMany({
        where: {
            status: "SCHEDULED",
            startTime: { gte: now, lte: windowEnd },
            OR: [{ patientId: user.id }, { doctorId: user.id }],
        },
        include: {
            patient: { select: { name: true } },
            doctor: { select: { name: true } },
        },
    });

    if (upcoming.length === 0) return;

    const existing = await db.notification.findMany({
        where: {
            userId: user.id,
            type: "APPOINTMENT_REMINDER",
            appointmentId: { in: upcoming.map((a) => a.id) },
        },
        select: { appointmentId: true },
    });
    const existingIds = new Set(existing.map((n) => n.appointmentId));

    const toCreate = upcoming.filter((a) => !existingIds.has(a.id));
    if (toCreate.length === 0) return;

    await db.notification.createMany({
        data: toCreate.map((appointment) => {
            const isPatient = appointment.patientId === user.id;
            const otherName = isPatient
                ? appointment.doctor.name
                : appointment.patient.name;
            const when = format(appointment.startTime, "MMM d 'at' h:mm a");

            return {
                userId: user.id,
                type: "APPOINTMENT_REMINDER",
                appointmentId: appointment.id,
                message: isPatient
                    ? `Upcoming appointment with Dr. ${otherName} on ${when}`
                    : `Upcoming appointment with ${otherName} on ${when}`,
            };
        }),
    });
}

export async function getNotifications() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const user = await db.user.findUnique({ where: { clerkUserId: userId } });
        if (!user) throw new Error("User not found");

        await ensureUpcomingReminders(user);

        const [notifications, unreadCount] = await Promise.all([
            db.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                take: 30,
            }),
            db.notification.count({
                where: { userId: user.id, isRead: false },
            }),
        ]);

        return { notifications, unreadCount };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { error: "Failed to fetch notifications" };
    }
}

export async function markNotificationRead(formData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const notificationId = formData.get("notificationId");
    if (!notificationId) throw new Error("Notification id is required");

    try {
        const user = await db.user.findUnique({ where: { clerkUserId: userId } });
        if (!user) throw new Error("User not found");

        await db.notification.updateMany({
            where: { id: notificationId, userId: user.id },
            data: { isRead: true },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to mark notification read:", error);
        throw new Error("Failed to mark notification read");
    }
}

export async function markAllNotificationsRead() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const user = await db.user.findUnique({ where: { clerkUserId: userId } });
        if (!user) throw new Error("User not found");

        await db.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to mark all notifications read:", error);
        throw new Error("Failed to mark all notifications read");
    }
}
