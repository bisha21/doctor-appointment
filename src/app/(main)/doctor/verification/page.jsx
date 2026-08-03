import { redirect } from "next/navigation";
import { Clock, ShieldOff, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "actions/onboarding";

export const metadata = {
  title: "Verification Status - MediMeet",
};

const STATUS_CONTENT = {
  REJECTED: {
    icon: XCircle,
    iconClassName: "text-red-400",
    title: "Verification Rejected",
    message:
      "Your doctor application was not approved. Please contact support for more details.",
  },
  SUSPENDED: {
    icon: ShieldOff,
    iconClassName: "text-red-400",
    title: "Account Suspended",
    message:
      "Your doctor account has been suspended by an admin. Please contact support for more details.",
  },
  PENDING: {
    icon: Clock,
    iconClassName: "text-amber-400",
    title: "Verification Pending",
    message:
      "Your profile is under review by our admin team. You'll be able to manage appointments once you're verified.",
  },
};

export default async function DoctorVerificationPage() {
  const user = await getCurrentUser();

  if (user.verificationStatus === "VERIFIED") {
    redirect("/doctor");
  }

  const content = STATUS_CONTENT[user.verificationStatus] ?? STATUS_CONTENT.PENDING;
  const Icon = content.icon;

  return (
    <div className="max-w-lg mx-auto">
      <Card className="border-emerald-900/30">
        <CardContent className="py-10 text-center space-y-4">
          <Icon className={`h-10 w-10 mx-auto ${content.iconClassName}`} />
          <h1 className="text-xl font-semibold">{content.title}</h1>
          <p className="text-muted-foreground">{content.message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
