"use server";

import { db } from "@/lib/prisma";

export async function getDoctorsBySpecialty(specialty) {
    try {
        const doctors = await db.user.findMany({
            where: {
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
                specialty,
            },
            orderBy: { name: "asc" },
            include: {
                doctorReviews: { select: { rating: true } },
            },
        });

        const doctorsWithRatings = doctors.map(({ doctorReviews, ...doctor }) => {
            const reviewCount = doctorReviews.length;
            const averageRating =
                reviewCount === 0
                    ? null
                    : doctorReviews.reduce((sum, review) => sum + review.rating, 0) /
                    reviewCount;

            return { ...doctor, averageRating, reviewCount };
        });

        return { doctors: doctorsWithRatings };
    } catch (error) {
        console.error("Failed to fetch doctors by specialty:", error);
        return { error: "Failed to fetch doctors" };
    }
}
