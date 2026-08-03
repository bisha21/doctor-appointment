"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function verifyAdmin() {
    const { userId } = await auth();
    if (!userId) return false;
    try {
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        return user.role === "ADMIN";
    } catch (e) {
        console.log("Failed to verify admin");
        return false;
    }
}

export async function getPendingDoctors() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");
    try {
        const pendingDoctors = await db.user.findMany({
            where: { role: "DOCTOR", verificationStatus: "PENDING" },
            orderBy: { createdAt: "desc" },
        });
        return pendingDoctors;
    } catch (e) {
        console.log("Failed to get pending doctors");
        throw new Error("Failed to get pending doctors");
    }
}
export async function getVerifiedDoctors() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");
    try {
        const verifiedDoctors = await db.user.findMany({
            where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
            orderBy: { createdAt: "desc" },
        });
        return verifiedDoctors;
    } catch (e) {
        console.log("Failed to get verified doctors");
        throw new Error("Failed to get verified doctors");
    }
}

export async function getRejectedDoctors() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");
    try {
        const rejectedDoctors = await db.user.findMany({
            where: { role: "DOCTOR", verificationStatus: "REJECTED" },
            orderBy: { createdAt: "desc" },
        });
        return rejectedDoctors;
    } catch (e) {
        console.log("Failed to get rejected doctors");
        throw new Error("Failed to get rejected doctors");
    }
}

export async function getSuspendedDoctors() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");
    try {
        const suspendedDoctors = await db.user.findMany({
            where: { role: "DOCTOR", verificationStatus: "SUSPENDED" },
            orderBy: { createdAt: "desc" },
        });
        return suspendedDoctors;
    } catch (e) {
        console.log("Failed to get suspended doctors");
        throw new Error("Failed to get suspended doctors");
    }
}



export async function updateDoctorStatus(formData) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const doctorId = formData.get("doctorId");
    const status = formData.get("status");
    if (!doctorId || !["VERIFIED", "REJECTED"].includes(status)) {
        throw new Error("Invalid input");
    }
    try {
        await db.user.update({
            where: { id: doctorId },
            data: { verificationStatus: status },
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (e) {
        console.log("Failed to update doctor status");
        throw new Error("Failed to update doctor status");
    }

}

export async function updateDoctorActiveStatus(formData) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const doctorId = formData.get("doctorId");
    const suspend = formData.get("suspend") === "true";

    if (!doctorId) {
        throw new Error("Doctor ID is required");
    }

    try {
        const status = suspend ? "SUSPENDED" : "VERIFIED";

        await db.user.update({
            where: {
                id: doctorId,
            },
            data: {
                verificationStatus: status,
            },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Failed to update doctor active status:", error);
        throw new Error(`Failed to update doctor status: ${error.message}`);
    }
}

export async function getAllAppointmentsForAdmin() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");
    try {
        const appointments = await db.appointment.findMany({
            include: {
                patient: { select: { name: true, email: true } },
                doctor: { select: { name: true, specialty: true } },
            },
            orderBy: { startTime: "desc" },
            take: 200,
        });
        return appointments;
    } catch (e) {
        console.log("Failed to get all appointments");
        throw new Error("Failed to get all appointments");
    }
}

export async function getPlatformSummary() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    try {
        const [
            totalPatients,
            totalDoctors,
            verifiedDoctors,
            appointmentCounts,
            creditAggregates,
            payoutAggregates,
            outstandingCredits,
        ] = await Promise.all([
            db.user.count({ where: { role: "PATIENT" } }),
            db.user.count({ where: { role: "DOCTOR" } }),
            db.user.count({ where: { role: "DOCTOR", verificationStatus: "VERIFIED" } }),
            db.appointment.groupBy({
                by: ["status"],
                _count: { _all: true },
            }),
            db.creditTransaction.groupBy({
                by: ["type"],
                _sum: { amount: true },
            }),
            db.payout.groupBy({
                by: ["status"],
                _sum: { netAmount: true, credits: true },
            }),
            db.user.aggregate({
                where: { role: "PATIENT" },
                _sum: { credits: true },
            }),
        ]);

        const appointmentsByStatus = Object.fromEntries(
            appointmentCounts.map((row) => [row.status, row._count._all])
        );

        const creditsByType = Object.fromEntries(
            creditAggregates.map((row) => [row.type, row._sum.amount || 0])
        );

        const payoutsByStatus = Object.fromEntries(
            payoutAggregates.map((row) => [
                row.status,
                { netAmount: row._sum.netAmount || 0, credits: row._sum.credits || 0 },
            ])
        );

        return {
            totalPatients,
            totalDoctors,
            verifiedDoctors,
            appointmentsByStatus,
            creditsByType,
            payoutsByStatus,
            outstandingPatientCredits: outstandingCredits._sum.credits || 0,
        };
    } catch (error) {
        console.error("Failed to compute platform summary:", error);
        return { error: "Failed to compute platform summary" };
    }
}

