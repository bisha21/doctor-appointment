"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { APPOINTMENT_CREDIT_COST, CANCELLATION_REFUND_WINDOW_HOURS } from "@/lib/constants";

export async function getDoctorById(doctorId) {
    try {
        const doctor = await db.user.findFirst({
            where: {
                id: doctorId,
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
            },
        });

        if (!doctor) {
            return { error: "Doctor not found" };
        }

        return { doctor };
    } catch (error) {
        console.error("Failed to fetch doctor:", error);
        return { error: "Failed to fetch doctor" };
    }
}

export async function getAvailableSlots(doctorId) {
    try {
        const doctor = await db.user.findFirst({
            where: {
                id: doctorId,
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
            },
        });

        if (!doctor) {
            return { error: "Doctor not found" };
        }

        const availabilitySlots = await db.availability.findMany({
            where: {
                doctorId,
                status: "AVAILABLE",
                startTime: { gte: new Date() },
            },
            orderBy: { startTime: "asc" },
        });

        const slotsByDay = {};

        availabilitySlots.forEach((slot) => {
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
                startTime: slot.startTime.toISOString(),
                endTime: slot.endTime.toISOString(),
                formatted: `${format(slot.startTime, "h:mm a")} - ${format(slot.endTime, "h:mm a")}`,
            });
        });

        return { days: Object.values(slotsByDay) };
    } catch (error) {
        console.error("Failed to fetch available slots:", error);
        return { error: "Failed to fetch available slots" };
    }
}

export async function bookAppointment(formData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const doctorId = formData.get("doctorId");
    const availabilityId = formData.get("availabilityId");
    const patientDescription = formData.get("patientDescription") || null;

    if (!doctorId || !availabilityId) {
        throw new Error("Doctor and time slot are required");
    }

    try {
        const patient = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!patient) throw new Error("Patient not found");
        if (patient.role !== "PATIENT") {
            throw new Error("Only patients can book appointments");
        }

        if (patient.credits < APPOINTMENT_CREDIT_COST) {
            throw new Error(
                "Insufficient credits. Please purchase a plan to book an appointment."
            );
        }

        const doctor = await db.user.findFirst({
            where: { id: doctorId, role: "DOCTOR", verificationStatus: "VERIFIED" },
        });
        if (!doctor) throw new Error("Doctor not found");

        const slot = await db.availability.findFirst({
            where: { id: availabilityId, doctorId, status: "AVAILABLE" },
        });
        if (!slot) {
            throw new Error("This slot is no longer available. Please choose another one.");
        }

        const appointment = await db.$transaction(async (tx) => {
            const updatedSlots = await tx.availability.updateMany({
                where: { id: slot.id, status: "AVAILABLE" },
                data: { status: "BOOKED" },
            });

            if (updatedSlots.count === 0) {
                throw new Error(
                    "This slot is no longer available. Please choose another one."
                );
            }

            const newAppointment = await tx.appointment.create({
                data: {
                    patientId: patient.id,
                    doctorId: doctor.id,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    patientDescription,
                    status: "SCHEDULED",
                },
            });

            await tx.creditTransaction.create({
                data: {
                    userId: patient.id,
                    amount: -APPOINTMENT_CREDIT_COST,
                    type: "APPOINTMENT_DEDUCTION",
                },
            });

            await tx.user.update({
                where: { id: patient.id },
                data: { credits: { decrement: APPOINTMENT_CREDIT_COST } },
            });

            return newAppointment;
        });

        revalidatePath("/appointments");
        revalidatePath(`/doctors`);

        return { success: true, appointment };
    } catch (error) {
        console.error("Failed to book appointment:", error);
        throw new Error(error.message || "Failed to book appointment");
    }
}

export async function getPatientAppointments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const patient = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!patient) throw new Error("Patient not found");

        const appointments = await db.appointment.findMany({
            where: { patientId: patient.id },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialty: true,
                        imageUrl: true,
                    },
                },
                review: true,
            },
            orderBy: { startTime: "desc" },
        });

        return { appointments };
    } catch (error) {
        console.error("Failed to fetch appointments:", error);
        return { error: "Failed to fetch appointments" };
    }
}

export async function cancelAppointment(formData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const appointmentId = formData.get("appointmentId");
    if (!appointmentId) throw new Error("Appointment id is required");

    try {
        const patient = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!patient) throw new Error("Patient not found");

        const appointment = await db.appointment.findFirst({
            where: { id: appointmentId, patientId: patient.id },
        });

        if (!appointment) throw new Error("Appointment not found");
        if (appointment.status !== "SCHEDULED") {
            throw new Error("Only scheduled appointments can be cancelled");
        }

        const hoursUntilStart =
            (appointment.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
        const isRefundEligible = hoursUntilStart >= CANCELLATION_REFUND_WINDOW_HOURS;

        await db.$transaction(async (tx) => {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: { status: "CANCELLED" },
            });

            // Release the matching slot back to the pool, if it still exists.
            await tx.availability.updateMany({
                where: {
                    doctorId: appointment.doctorId,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                    status: "BOOKED",
                },
                data: { status: "AVAILABLE" },
            });

            if (isRefundEligible) {
                await tx.creditTransaction.create({
                    data: {
                        userId: patient.id,
                        amount: APPOINTMENT_CREDIT_COST,
                        type: "APPOINTMENT_REFUND",
                    },
                });

                await tx.user.update({
                    where: { id: patient.id },
                    data: { credits: { increment: APPOINTMENT_CREDIT_COST } },
                });
            }
        });

        revalidatePath("/appointments");
        revalidatePath("/doctor");
        revalidatePath("/doctors");

        return { success: true, refunded: isRefundEligible };
    } catch (error) {
        console.error("Failed to cancel appointment:", error);
        throw new Error(error.message || "Failed to cancel appointment");
    }
}
