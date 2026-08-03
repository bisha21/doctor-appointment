// Called from inside an existing db.$transaction alongside the write that
// triggered it, so the notification is never created without its underlying event.
export async function createNotification(tx, { userId, type, message, appointmentId }) {
    await tx.notification.create({
        data: { userId, type, message, appointmentId },
    });
}
