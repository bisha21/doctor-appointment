"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requireVerifiedDoctor } from "@/lib/serverAuth";
import { verifyAdmin } from "actions/admin";
import { PLATFORM_FEE_PER_CREDIT, DOCTOR_NET_PER_CREDIT } from "@/lib/constants";
import { createNotification } from "@/lib/notifyHelpers";

export async function getDoctorPayouts() {
    const doctor = await requireVerifiedDoctor();

    try {
        const payouts = await db.payout.findMany({
            where: { doctorId: doctor.id },
            orderBy: { createdAt: "desc" },
        });

        return { payouts, earnedCredits: doctor.earnedCredits };
    } catch (error) {
        console.error("Failed to fetch payouts:", error);
        return { error: "Failed to fetch payouts" };
    }
}

export async function requestPayout(formData) {
    const doctor = await requireVerifiedDoctor();
    const paypalEmail = formData.get("paypalEmail");

    if (!paypalEmail) throw new Error("PayPal email is required");

    try {
        const freshDoctor = await db.user.findUnique({ where: { id: doctor.id } });
        const credits = freshDoctor.earnedCredits;

        if (credits <= 0) {
            throw new Error("You have no earned credits available for payout");
        }

        const amount = credits * (PLATFORM_FEE_PER_CREDIT + DOCTOR_NET_PER_CREDIT);
        const platformFee = credits * PLATFORM_FEE_PER_CREDIT;
        const netAmount = credits * DOCTOR_NET_PER_CREDIT;

        const payout = await db.$transaction(async (tx) => {
            const updated = await tx.user.updateMany({
                where: { id: doctor.id, earnedCredits: credits },
                data: { earnedCredits: { decrement: credits } },
            });

            if (updated.count === 0) {
                throw new Error("Your earned credits changed, please try again");
            }

            await tx.creditTransaction.create({
                data: {
                    userId: doctor.id,
                    amount: -credits,
                    type: "PAYOUT_REQUEST",
                },
            });

            return tx.payout.create({
                data: {
                    doctorId: doctor.id,
                    amount,
                    credits,
                    platformFee,
                    netAmount,
                    paypalEmail,
                    status: "PROCESSING",
                },
            });
        });

        revalidatePath("/doctor");
        revalidatePath("/admin");

        return { success: true, payout };
    } catch (error) {
        console.error("Failed to request payout:", error);
        throw new Error(error.message || "Failed to request payout");
    }
}

export async function getPendingPayouts() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    try {
        const payouts = await db.payout.findMany({
            where: { status: "PROCESSING" },
            include: { doctor: { select: { name: true, email: true } } },
            orderBy: { createdAt: "asc" },
        });

        return payouts;
    } catch (e) {
        console.log("Failed to get pending payouts");
        throw new Error("Failed to get pending payouts");
    }
}

export async function getProcessedPayouts() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    try {
        const payouts = await db.payout.findMany({
            where: { status: "PROCESSED" },
            include: { doctor: { select: { name: true, email: true } } },
            orderBy: { processedAt: "desc" },
            take: 100,
        });

        return payouts;
    } catch (e) {
        console.log("Failed to get processed payouts");
        throw new Error("Failed to get processed payouts");
    }
}

export async function processPayout(formData) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const payoutId = formData.get("payoutId");
    if (!payoutId) throw new Error("Payout id is required");

    try {
        const { userId: adminClerkId } = await auth();
        const admin = await db.user.findUnique({ where: { clerkUserId: adminClerkId } });

        const payout = await db.payout.findFirst({
            where: { id: payoutId, status: "PROCESSING" },
        });
        if (!payout) throw new Error("Payout not found or already processed");

        await db.$transaction(async (tx) => {
            await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: "PROCESSED",
                    processedAt: new Date(),
                    processedBy: admin?.name || admin?.email || "admin",
                },
            });

            await createNotification(tx, {
                userId: payout.doctorId,
                type: "PAYOUT_PROCESSED",
                message: `Your payout of $${payout.netAmount.toFixed(2)} (${payout.credits} credits) has been processed`,
            });
        });

        revalidatePath("/admin");
        revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Failed to process payout:", error);
        throw new Error(error.message || "Failed to process payout");
    }
}
