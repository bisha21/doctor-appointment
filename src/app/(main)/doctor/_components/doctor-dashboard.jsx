"use client";

import { useState } from "react";
import { Calendar, Clock, LayoutDashboard, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardSidebarNav } from "@/components/dashboard-sidebar-nav";
import { DoctorOverview } from "./doctor-overview";
import { AppointmentsList } from "./appointments-list";
import { AvailabilityManager } from "./availability-manager";
import { PayoutsPanel } from "./payouts-panel";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "availability", label: "Availability", icon: Clock },
  { key: "payouts", label: "Payouts", icon: Wallet },
];

export function DoctorDashboard({
  appointments,
  appointmentsError,
  days,
  availabilityError,
  payouts,
  earnedCredits,
  payoutsError,
}) {
  const [active, setActive] = useState("overview");

  const items = SECTIONS.map((section) => ({
    ...section,
    count: section.key === "appointments" ? appointments.length : undefined,
  }));

  return (
    <DashboardShell
      title="Doctor Dashboard"
      description="Manage your appointments, availability, and payouts."
      sidebar={
        <DashboardSidebarNav items={items} active={active} onChange={setActive} />
      }
    >
      {active === "overview" && (
        <DoctorOverview
          appointments={appointments}
          days={days}
          earnedCredits={earnedCredits}
          onNavigate={setActive}
        />
      )}

      {active === "appointments" &&
        (appointmentsError ? (
          <p className="text-destructive">{appointmentsError}</p>
        ) : (
          <AppointmentsList appointments={appointments} />
        ))}

      {active === "availability" &&
        (availabilityError ? (
          <p className="text-destructive">{availabilityError}</p>
        ) : (
          <AvailabilityManager days={days} />
        ))}

      {active === "payouts" &&
        (payoutsError ? (
          <p className="text-destructive">{payoutsError}</p>
        ) : (
          <PayoutsPanel earnedCredits={earnedCredits} payouts={payouts} />
        ))}
    </DashboardShell>
  );
}
