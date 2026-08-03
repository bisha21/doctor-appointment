import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPOINTMENT_STATUS_STYLES } from "@/lib/constants";
import { PlatformSummary } from "./platform-summary";

function SpecialtyBreakdown({ doctors }) {
  const counts = doctors.reduce((acc, doctor) => {
    acc[doctor.specialty] = (acc[doctor.specialty] || 0) + 1;
    return acc;
  }, {});

  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 0;

  return (
    <Card className="border-emerald-900/30">
      <CardHeader>
        <CardTitle className="text-base">Verified Doctors by Specialty</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No verified doctors yet.</p>
        ) : (
          rows.map(([specialty, count]) => (
            <div key={specialty} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{specialty}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-500/80"
                  style={{ width: `${max ? (count / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentAppointments({ appointments, onNavigate }) {
  const recent = [...appointments]
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 5);

  return (
    <Card className="border-emerald-900/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent Appointments</CardTitle>
        <Button variant="link" className="h-auto p-0" onClick={() => onNavigate("appointments")}>
          View all
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">No appointments yet.</p>
        ) : (
          recent.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="flex items-center gap-1.5 truncate">
                  <User className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {appointment.patient.name}
                  <span className="text-muted-foreground">→</span>
                  Dr. {appointment.doctor.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(appointment.startTime), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`${APPOINTMENT_STATUS_STYLES[appointment.status]} shrink-0`}
              >
                {appointment.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions({ pendingCount, reviewsCount, payoutsCount, onNavigate }) {
  const actions = [
    {
      key: "pending",
      icon: Clock,
      label: "Doctor applications awaiting review",
      count: pendingCount,
    },
    {
      key: "reviews",
      icon: Star,
      label: "Patient reviews to moderate",
      count: reviewsCount,
    },
    {
      key: "payouts",
      icon: Wallet,
      label: "Payout requests to process",
      count: payoutsCount,
    },
  ];

  return (
    <Card className="border-emerald-900/30">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            type="button"
            variant="outline"
            className="w-full justify-between"
            onClick={() => onNavigate(action.key)}
          >
            <span className="flex items-center gap-2">
              <action.icon className="h-4 w-4 text-emerald-400" />
              {action.label}
            </span>
            <Badge variant="outline">{action.count}</Badge>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminOverview({
  summary,
  pendingDoctors,
  verifiedDoctors,
  appointments,
  reviews,
  pendingPayouts,
  onNavigate,
}) {
  return (
    <div className="space-y-6">
      <PlatformSummary summary={summary} />

      <QuickActions
        pendingCount={pendingDoctors.length}
        reviewsCount={reviews.length}
        payoutsCount={pendingPayouts.length}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentAppointments appointments={appointments} onNavigate={onNavigate} />
        <SpecialtyBreakdown doctors={verifiedDoctors} />
      </div>
    </div>
  );
}
