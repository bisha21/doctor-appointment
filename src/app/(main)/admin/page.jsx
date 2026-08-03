import {
  getPendingDoctors,
  getVerifiedDoctors,
  getRejectedDoctors,
  getSuspendedDoctors,
  getAllAppointmentsForAdmin,
  getPlatformSummary,
} from "actions/admin";
import { getAllReviewsForAdmin } from "actions/reviews";
import { getPendingPayouts, getProcessedPayouts } from "actions/payouts";
import { AdminDashboard } from "./_components/admin-dashboard";

export const metadata = {
  title: "Admin Dashboard - MediMeet",
};

export default async function AdminDashboardPage() {
  const [
    pendingDoctors,
    verifiedDoctors,
    rejectedDoctors,
    suspendedDoctors,
    reviews,
    appointments,
    summary,
    pendingPayouts,
    processedPayouts,
  ] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getRejectedDoctors(),
    getSuspendedDoctors(),
    getAllReviewsForAdmin(),
    getAllAppointmentsForAdmin(),
    getPlatformSummary(),
    getPendingPayouts(),
    getProcessedPayouts(),
  ]);

  return (
    <AdminDashboard
      pendingDoctors={pendingDoctors}
      verifiedDoctors={verifiedDoctors}
      rejectedDoctors={rejectedDoctors}
      suspendedDoctors={suspendedDoctors}
      reviews={reviews}
      appointments={appointments}
      summary={summary}
      pendingPayouts={pendingPayouts}
      processedPayouts={processedPayouts}
    />
  );
}
