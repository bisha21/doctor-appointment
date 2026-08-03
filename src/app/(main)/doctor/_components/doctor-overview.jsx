import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock, User, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DOCTOR_NET_PER_CREDIT } from "@/lib/constants";

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <Card className="border-emerald-900/30">
      <CardContent className="py-6 space-y-1">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </p>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function UpcomingAppointments({ appointments, onNavigate }) {
  const upcoming = appointments
    .filter((a) => a.status === "SCHEDULED")
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  return (
    <Card className="border-emerald-900/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Next Appointments</CardTitle>
        <Button variant="link" className="h-auto p-0" onClick={() => onNavigate("appointments")}>
          View all
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming appointments.</p>
        ) : (
          upcoming.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between gap-4 text-sm">
              <p className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                {appointment.patient.name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {format(new Date(appointment.startTime), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DoctorOverview({ appointments, days, earnedCredits, onNavigate }) {
  const upcomingCount = appointments.filter((a) => a.status === "SCHEDULED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const openSlotsCount = days.reduce(
    (total, day) => total + day.slots.filter((s) => s.status === "AVAILABLE").length,
    0
  );
  const estimatedNet = earnedCredits * DOCTOR_NET_PER_CREDIT;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming Appointments" value={upcomingCount} icon={Calendar} />
        <StatCard label="Completed Appointments" value={completedCount} icon={CheckCircle2} />
        <StatCard
          label="Open Slots"
          value={openSlotsCount}
          hint="Across your scheduled availability"
          icon={Clock}
        />
        <StatCard
          label="Earned Credits"
          value={earnedCredits}
          hint={`Worth $${estimatedNet.toFixed(2)} net`}
          icon={Wallet}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingAppointments appointments={appointments} onNavigate={onNavigate} />

        <Card className="border-emerald-900/30">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onNavigate("availability")}
            >
              <Clock className="h-4 w-4 text-emerald-400" />
              Manage your availability
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onNavigate("payouts")}
            >
              <Wallet className="h-4 w-4 text-emerald-400" />
              Request a payout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
