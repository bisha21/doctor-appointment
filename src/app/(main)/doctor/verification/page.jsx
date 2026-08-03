import { redirect } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "actions/onboarding";

export const metadata = {
  title: "Verification Status - MediMeet",
};

export default async function DoctorVerificationPage() {
  const user = await getCurrentUser();

  if (user.verificationStatus === "VERIFIED") {
    redirect("/doctor");
  }

  const rejected = user.verificationStatus === "REJECTED";

  return (
    <div className="max-w-lg mx-auto">
      <Card className="border-emerald-900/30">
        <CardContent className="py-10 text-center space-y-4">
          {rejected ? (
            <>
              <XCircle className="h-10 w-10 text-red-400 mx-auto" />
              <h1 className="text-xl font-semibold">Verification Rejected</h1>
              <p className="text-muted-foreground">
                Your doctor application was not approved. Please contact
                support for more details.
              </p>
            </>
          ) : (
            <>
              <Clock className="h-10 w-10 text-amber-400 mx-auto" />
              <h1 className="text-xl font-semibold">Verification Pending</h1>
              <p className="text-muted-foreground">
                Your profile is under review by our admin team. You&apos;ll be
                able to manage appointments once you&apos;re verified.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
