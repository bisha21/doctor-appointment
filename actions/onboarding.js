"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache"; // Correct import

export async function setUserRoles(formData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found in database");

    const role = formData.get("role"); // Make sure you're using `formData.get` here

    if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
        throw new Error("Invalid role selection");
    }

    try {
        if (role === "PATIENT") {
            await db.user.update({
                where: { clerkUserId: userId },
                data: { role: "PATIENT" },
            });

            revalidatePath("/");
            return {
                success: true,
                redirect: "/doctors",
            };
        }

        if (role === "DOCTOR") {
            const specialty = formData.get("specialty");
            const experience = parseInt(formData.get("experience"), 10);
            const credentialUrl = formData.get("credentialUrl");
            const description = formData.get("description");

            if (!specialty || !experience || !credentialUrl || !description) {
                throw new Error("All fields are required");
            }

            await db.user.update({
                where: { clerkUserId: userId },
                data: {
                    role: "DOCTOR",
                    specialty,
                    experience,
                    credentialUrl,
                    description,
                    verificationStatus: "PENDING",
                },
            });

            revalidatePath("/");
            return {
                success: true,
                redirect: "/doctor/verification",
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}


export async function getCurrentUser() {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    try {
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });

        return user;
    } catch (error) {
        console.error("Failed to get user information:", error);
        return null;
    }
}