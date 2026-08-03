"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const PLAN_CREDITS = {
    free_user: 0,
    standard: 10,
    premium: 24
}
export async function checkAndAllocateCredits(user) {

    try {
        if (!user) return null;

        if (user.role !== 'PATIENT') return user;

        const { has } = await auth();
        const hasBasic = has({ plan: "free_user" });
        const hasStandard = has({ plan: "standard" });
        const hasPremium = has({ plan: "premium" });

        let currentPlan = null;
        let creditsToAllocate = 0;

        if (hasPremium) {
            currentPlan = "premium";
            creditsToAllocate = PLAN_CREDITS.premium;
        } else if (hasStandard) {
            currentPlan = "standard";
            creditsToAllocate = PLAN_CREDITS.standard;
        } else if (hasBasic) {
            currentPlan = "free_user";
            creditsToAllocate = PLAN_CREDITS.free_user;
        }

        if (!currentPlan) {
            return user;
        }

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // Sum everything already granted this month (regardless of which plan it
        // came from), so a mid-month plan change tops up to the new plan's amount
        // instead of stacking a fresh full allocation on top of what's already been
        // granted. Downgrading mid-month never claws back credits already received.
        const alreadyGranted = await db.creditTransaction.aggregate({
            where: {
                userId: user.id,
                type: "CREDIT_PURCHASE",
                createdAt: { gte: monthStart },
            },
            _sum: { amount: true },
        });

        const grantedThisMonth = alreadyGranted._sum.amount || 0;
        const creditsToTopUp = creditsToAllocate - grantedThisMonth;

        if (creditsToTopUp <= 0) {
            return user;
        }

        const updatedUser = await db.$transaction(async (tx) => {
            await tx.creditTransaction.create({
                data: {
                    userId: user.id,
                    amount: creditsToTopUp,
                    type: "CREDIT_PURCHASE",
                    packageId: currentPlan,
                },
            });

            return tx.user.update({
                where: { id: user.id },
                data: { credits: { increment: creditsToTopUp } },
            });
        });

        revalidatePath('/doctors');
        revalidatePath('/appointments');

        return updatedUser;
    } catch (e) {
        console.log(e);
    }
}

export async function getCreditHistory() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const user = await db.user.findUnique({ where: { clerkUserId: userId } });
        if (!user) throw new Error("User not found");

        const transactions = await db.creditTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        return { credits: user.credits, transactions };
    } catch (error) {
        console.error("Failed to fetch credit history:", error);
        return { error: "Failed to fetch credit history" };
    }
}