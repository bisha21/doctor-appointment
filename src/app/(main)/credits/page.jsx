import { format } from "date-fns";
import { CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCreditHistory } from "actions/credits";

export const metadata = {
  title: "Credits - MediMeet",
};

const TRANSACTION_LABELS = {
  CREDIT_PURCHASE: "Plan Credit",
  APPOINTMENT_DEDUCTION: "Appointment Booked",
  APPOINTMENT_REFUND: "Cancellation Refund",
  APPOINTMENT_EARNING: "Appointment Earning",
  PAYOUT_REQUEST: "Payout Requested",
  ADMIN_ADJUSTMENT: "Admin Adjustment",
};

export default async function CreditsPage() {
  const { credits, transactions, error } = await getCreditHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Credits</h1>

      {error && <p className="text-destructive">{error}</p>}

      {!error && (
        <>
          <Card className="border-emerald-900/30">
            <CardContent className="py-6 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold">{credits}</p>
                <p className="text-sm text-muted-foreground">
                  credits available
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            {!transactions || transactions.length === 0 ? (
              <p className="text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isPositive = transaction.amount > 0;
                  return (
                    <Card key={transaction.id} className="border-emerald-900/30">
                      <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium">
                              {TRANSACTION_LABELS[transaction.type] ||
                                transaction.type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(transaction.createdAt),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            isPositive
                              ? "bg-emerald-900/20 text-emerald-400 border-emerald-700/30"
                              : "bg-red-900/20 text-red-400 border-red-700/30"
                          }
                        >
                          {isPositive ? "+" : ""}
                          {transaction.amount}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
