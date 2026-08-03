import { Card, CardContent } from "@/components/ui/card";

function StatCard({ label, value, hint }) {
  return (
    <Card className="border-emerald-900/30">
      <CardContent className="py-6 space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function PlatformSummary({ summary }) {
  if (!summary || summary.error) {
    return (
      <p className="text-destructive">
        {summary?.error || "Failed to load platform summary."}
      </p>
    );
  }

  const {
    totalPatients,
    totalDoctors,
    verifiedDoctors,
    appointmentsByStatus,
    creditsByType,
    payoutsByStatus,
    outstandingPatientCredits,
  } = summary;

  const creditsIssued =
    (creditsByType.CREDIT_PURCHASE || 0) + (creditsByType.APPOINTMENT_REFUND || 0);
  const creditsConsumed = Math.abs(creditsByType.APPOINTMENT_DEDUCTION || 0);
  const payoutsPending = payoutsByStatus.PROCESSING?.netAmount || 0;
  const payoutsProcessed = payoutsByStatus.PROCESSED?.netAmount || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doctors"
          value={totalDoctors}
          hint={`${verifiedDoctors} verified`}
        />
        <StatCard label="Patients" value={totalPatients} />
        <StatCard
          label="Appointments"
          value={
            (appointmentsByStatus.SCHEDULED || 0) +
            (appointmentsByStatus.COMPLETED || 0) +
            (appointmentsByStatus.CANCELLED || 0)
          }
          hint={`${appointmentsByStatus.COMPLETED || 0} completed · ${
            appointmentsByStatus.SCHEDULED || 0
          } upcoming · ${appointmentsByStatus.CANCELLED || 0} cancelled`}
        />
        <StatCard
          label="Outstanding Patient Credits"
          value={outstandingPatientCredits}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Credits Issued" value={creditsIssued} />
        <StatCard label="Credits Consumed" value={creditsConsumed} />
        <StatCard
          label="Payouts Pending"
          value={`$${payoutsPending.toFixed(2)}`}
        />
        <StatCard
          label="Payouts Processed"
          value={`$${payoutsProcessed.toFixed(2)}`}
        />
      </div>
    </div>
  );
}
