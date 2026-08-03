"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireVerifiedDoctor } from "@/lib/serverAuth";

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
