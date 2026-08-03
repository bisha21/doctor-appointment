"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getDoctorReviews(doctorId) {
    try {
        const reviews = await db.review.findMany({
            where: { doctorId },
            include: {
                patient: {
                    select: { name: true, imageUrl: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const reviewCount = reviews.length;
        const averageRating =
            reviewCount === 0
                ? null
                : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;

        return { reviews, averageRating, reviewCount };
    } catch (error) {
        console.error("Failed to fetch doctor reviews:", error);
        return { error: "Failed to fetch reviews" };
    }
}

export async function submitReview(formData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const appointmentId = formData.get("appointmentId");
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment") || null;

    if (!appointmentId) throw new Error("Appointment id is required");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5 stars");
    }

    try {
        const patient = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!patient) throw new Error("Patient not found");

        const appointment = await db.appointment.findFirst({
            where: { id: appointmentId, patientId: patient.id },
        });

        if (!appointment) throw new Error("Appointment not found");
        if (appointment.status !== "COMPLETED") {
            throw new Error("You can only review completed appointments");
        }

        const review = await db.review.upsert({
            where: { appointmentId },
            update: { rating, comment },
            create: {
                appointmentId,
                patientId: patient.id,
                doctorId: appointment.doctorId,
                rating,
                comment,
            },
        });

        revalidatePath("/appointments");
        revalidatePath("/doctors");

        return { success: true, review };
    } catch (error) {
        console.error("Failed to submit review:", error);
        throw new Error(error.message || "Failed to submit review");
    }
}
