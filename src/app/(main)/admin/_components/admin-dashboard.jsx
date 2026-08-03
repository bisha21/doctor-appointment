"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  ShieldOff,
  Star,
  Wallet,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardSidebarNav } from "@/components/dashboard-sidebar-nav";
import { AdminOverview } from "./admin-overview";
import { DoctorReviewList } from "./doctor-review-list";
import { DoctorActiveStatusList } from "./verified-doctors";
import { ReviewModerationList } from "./review-moderation-list";
import { AllAppointmentsList } from "./all-appointments-list";
import { PayoutQueue } from "./payout-queue";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "verified", label: "Verified", icon: ShieldCheck },
  { key: "suspended", label: "Suspended", icon: ShieldOff },
  { key: "rejected", label: "Rejected", icon: XCircle },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "payouts", label: "Payouts", icon: Wallet },
];

export function AdminDashboard({
  pendingDoctors,
  verifiedDoctors,
  rejectedDoctors,
  suspendedDoctors,
  reviews,
  appointments,
  summary,
  pendingPayouts,
  processedPayouts,
}) {
  const [active, setActive] = useState("overview");

  const counts = {
    pending: pendingDoctors.length,
    verified: verifiedDoctors.length,
    suspended: suspendedDoctors.length,
    rejected: rejectedDoctors.length,
    reviews: reviews.length,
    appointments: appointments.length,
    payouts: pendingPayouts.length,
  };

  const items = SECTIONS.map((section) => ({
    ...section,
    count: counts[section.key],
  }));

  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Manage doctors, reviews, appointments, and payouts across the platform."
      sidebar={
        <DashboardSidebarNav items={items} active={active} onChange={setActive} />
      }
    >
      {active === "overview" && (
        <AdminOverview
          summary={summary}
          pendingDoctors={pendingDoctors}
          verifiedDoctors={verifiedDoctors}
          appointments={appointments}
          reviews={reviews}
          pendingPayouts={pendingPayouts}
          onNavigate={setActive}
        />
      )}

      {active === "pending" && (
        <DoctorReviewList
          doctors={pendingDoctors}
          showReject
          emptyMessage="No pending applications."
        />
      )}

      {active === "verified" && (
        <DoctorActiveStatusList
          doctors={verifiedDoctors}
          suspend
          emptyMessage="No verified doctors yet."
        />
      )}

      {active === "suspended" && (
        <DoctorActiveStatusList
          doctors={suspendedDoctors}
          suspend={false}
          emptyMessage="No suspended doctors."
        />
      )}

      {active === "rejected" && (
        <DoctorReviewList
          doctors={rejectedDoctors}
          showReject={false}
          emptyMessage="No rejected applications."
        />
      )}

      {active === "reviews" && <ReviewModerationList reviews={reviews} />}

      {active === "appointments" && (
        <AllAppointmentsList appointments={appointments} />
      )}

      {active === "payouts" && (
        <PayoutQueue
          pendingPayouts={pendingPayouts}
          processedPayouts={processedPayouts}
        />
      )}
    </DashboardShell>
  );
}
