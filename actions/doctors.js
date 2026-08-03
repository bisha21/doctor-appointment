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
        });

        return { doctors };
    } catch (error) {
        console.error("Failed to fetch doctors by specialty:", error);
        return { error: "Failed to fetch doctors" };
    }
}
