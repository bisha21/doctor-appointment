import { redirect } from "next/navigation";
import { getCurrentUser } from "actions/onboarding";
import { getDoctorAppointments } from "actions/doctor";
import { getDoctorAvailability } from "actions/availability";
import { getDoctorPayouts } from "actions/payouts";
import { DoctorDashboard } from "./_components/doctor-dashboard";

export const metadata = {
  title: "Doctor Dashboard - MediMeet",
};

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser();

  if (user.verificationStatus !== "VERIFIED") {
    redirect("/doctor/verification");
  }

  const [
    { appointments, error: appointmentsError },
    { days, error: availabilityError },
    { payouts, earnedCredits, error: payoutsError },
  ] = await Promise.all([
    getDoctorAppointments(),
    getDoctorAvailability(),
    getDoctorPayouts(),
  ]);

  return (
    <DoctorDashboard
      appointments={appointments || []}
      appointmentsError={appointmentsError}
      days={days || []}
      availabilityError={availabilityError}
      payouts={payouts || []}
      earnedCredits={earnedCredits ?? 0}
      payoutsError={payoutsError}
    />
  );
}
