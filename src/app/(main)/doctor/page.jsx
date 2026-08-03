import { redirect } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCurrentUser } from "actions/onboarding";
import { getDoctorAppointments } from "actions/doctor";
import { getDoctorAvailability } from "actions/availability";
import { AppointmentsList } from "./_components/appointments-list";
import { AvailabilityManager } from "./_components/availability-manager";

export const metadata = {
  title: "Doctor Dashboard - MediMeet",
};

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser();

  if (user.verificationStatus !== "VERIFIED") {
    redirect("/doctor/verification");
  }

  const [{ appointments, error: appointmentsError }, { days, error: availabilityError }] =
    await Promise.all([getDoctorAppointments(), getDoctorAvailability()]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          {appointmentsError ? (
            <p className="text-destructive">{appointmentsError}</p>
          ) : (
            <AppointmentsList appointments={appointments} />
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          {availabilityError ? (
            <p className="text-destructive">{availabilityError}</p>
          ) : (
            <AvailabilityManager days={days} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
