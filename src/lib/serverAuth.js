import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function requireVerifiedDoctor() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const doctor = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
        throw new Error("Only doctors can perform this action");
    }
    if (doctor.verificationStatus !== "VERIFIED") {
        throw new Error("Your account is not verified or has been suspended");
    }

    return doctor;
}
