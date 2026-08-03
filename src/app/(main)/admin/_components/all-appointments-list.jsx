import { format } from "date-fns";
import { Calendar as CalendarIcon, Stethoscope, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS_STYLES } from "@/lib/constants";

export function AllAppointmentsList({ appointments }) {
  if (!appointments || appointments.length === 0) {
    return <p className="text-muted-foreground">No appointments yet.</p>;
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="border-emerald-900/30">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                {appointment.patient.name}
                <span className="text-muted-foreground font-normal">→</span>
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
            </div>
            <Badge
              variant="outline"
              className={APPOINTMENT_STATUS_STYLES[appointment.status]}
            >
              {appointment.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
