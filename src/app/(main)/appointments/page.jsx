import Link from "next/link";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPatientAppointments } from "actions/appointments";
import { APPOINTMENT_STATUS_STYLES } from "@/lib/constants";
import { ReviewForm } from "./_components/review-form";
import { AppointmentActions } from "./_components/appointment-actions";

export const metadata = {
  title: "My Appointments - MediMeet",
};

export default async function AppointmentsPage() {
  const { appointments, error } = await getPatientAppointments();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Appointments</h1>

      {error && <p className="text-destructive">{error}</p>}

      {!error && (!appointments || appointments.length === 0) && (
        <Card className="border-emerald-900/30">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">
              You don&apos;t have any appointments yet.
            </p>
            <Link href="/doctors">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Find a Doctor
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {appointments && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="border-emerald-900/30">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-emerald-400" />
                    Dr. {appointment.doctor.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.doctor.specialty}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(
                      new Date(appointment.startTime),
                      "EEE, MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                  {appointment.patientDescription && (
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{appointment.patientDescription}&quot;
                    </p>
                  )}
                  {appointment.notes && (
                    <p className="text-sm text-emerald-400">
                      Doctor&apos;s notes: {appointment.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge
                    variant="outline"
                    className={APPOINTMENT_STATUS_STYLES[appointment.status]}
                  >
                    {appointment.status}
                  </Badge>
                  {appointment.status === "SCHEDULED" && (
                    <AppointmentActions appointment={appointment} />
                  )}
                  {appointment.status === "COMPLETED" && (
                    <ReviewForm
                      appointmentId={appointment.id}
                      existingReview={appointment.review}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
