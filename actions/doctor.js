"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

const SLOT_MINUTES = 30;

async function requireVerifiedDoctor() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const doctor = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
        throw new Error("Only doctors can perform this action");
    }
    if (doctor.verificationStatus !== "VERIFIED") {
        throw new Error("Your account is not verified yet");
    }

    return doctor;
}

export async function setAvailability(formData) {
    const doctor = await requireVerifiedDoctor();

    const date = formData.get("date");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!date || !startTime || !endTime) {
        throw new Error("Date, start time, and end time are required");
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date or time");
    }
    if (startDateTime >= endDateTime) {
        throw new Error("End time must be after start time");
    }
    if (startDateTime < new Date()) {
        throw new Error("Cannot set availability in the past");
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const slots = [];
    let slotStart = startDateTime;
    while (slotStart < endDateTime) {
        const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60000);
        if (slotEnd > endDateTime) break;
        slots.push({
            doctorId: doctor.id,
            startTime: slotStart,
            endTime: slotEnd,
            status: "AVAILABLE",
        });
        slotStart = slotEnd;
    }

    if (slots.length === 0) {
        throw new Error("Time range is too short to create any 30-minute slots");
    }

    try {
        await db.$transaction(async (tx) => {
            await tx.availability.deleteMany({
                where: {
                    doctorId: doctor.id,
                    status: "AVAILABLE",
                    startTime: { gte: dayStart, lte: dayEnd },
                },
            });

            await tx.availability.createMany({ data: slots });
        });

        revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Failed to set availability:", error);
        throw new Error("Failed to set availability");
    }
}

export async function getDoctorAvailability() {
    const doctor = await requireVerifiedDoctor();

    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const slots = await db.availability.findMany({
            where: {
                doctorId: doctor.id,
                startTime: { gte: todayStart },
            },
            orderBy: { startTime: "asc" },
        });

        const slotsByDay = {};
        slots.forEach((slot) => {
            const dayKey = format(slot.startTime, "yyyy-MM-dd");
            if (!slotsByDay[dayKey]) {
                slotsByDay[dayKey] = {
                    date: dayKey,
                    displayDate: format(slot.startTime, "EEEE, MMMM d"),
                    slots: [],
                };
            }
            slotsByDay[dayKey].slots.push({
                id: slot.id,
                status: slot.status,
                formatted: `${format(slot.startTime, "h:mm a")} - ${format(slot.endTime, "h:mm a")}`,
            });
        });

        return { days: Object.values(slotsByDay) };
    } catch (error) {
        console.error("Failed to fetch availability:", error);
        return { error: "Failed to fetch availability" };
    }
}

export async function deleteAvailabilitySlot(formData) {
    const doctor = await requireVerifiedDoctor();
    const slotId = formData.get("slotId");
    if (!slotId) throw new Error("Slot id is required");

    try {
        const deleted = await db.availability.deleteMany({
            where: { id: slotId, doctorId: doctor.id, status: "AVAILABLE" },
        });

        if (deleted.count === 0) {
            throw new Error("Slot not found or already booked");
        }

        revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete slot:", error);
        throw new Error(error.message || "Failed to delete slot");
    }
}

export async function getDoctorAppointments() {
    const doctor = await requireVerifiedDoctor();

    try {
        const appointments = await db.appointment.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: {
                    select: { id: true, name: true, email: true, imageUrl: true },
                },
            },
            orderBy: { startTime: "desc" },
        });

        return { appointments };
    } catch (error) {
        console.error("Failed to fetch appointments:", error);
        return { error: "Failed to fetch appointments" };
    }
}

export async function updateAppointmentNotes(formData) {
    const doctor = await requireVerifiedDoctor();
    const appointmentId = formData.get("appointmentId");
    const notes = formData.get("notes") ?? "";

    if (!appointmentId) throw new Error("Appointment id is required");

    try {
        const updated = await db.appointment.updateMany({
            where: { id: appointmentId, doctorId: doctor.id },
            data: { notes },
        });

        if (updated.count === 0) throw new Error("Appointment not found");

        revalidatePath("/doctor");
        revalidatePath("/appointments");
        return { success: true };
    } catch (error) {
        console.error("Failed to update notes:", error);
        throw new Error(error.message || "Failed to update notes");
    }
}

export async function markAppointmentCompleted(formData) {
    const doctor = await requireVerifiedDoctor();
    const appointmentId = formData.get("appointmentId");
    if (!appointmentId) throw new Error("Appointment id is required");

    try {
        const appointment = await db.appointment.findFirst({
            where: { id: appointmentId, doctorId: doctor.id },
        });

        if (!appointment) throw new Error("Appointment not found");
        if (appointment.status !== "SCHEDULED") {
            throw new Error("Only scheduled appointments can be marked completed");
        }

        await db.appointment.update({
            where: { id: appointmentId },
            data: { status: "COMPLETED" },
        });

        revalidatePath("/doctor");
        revalidatePath("/appointments");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark appointment completed:", error);
        throw new Error(error.message || "Failed to mark appointment completed");
    }
}
