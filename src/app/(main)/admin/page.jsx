import { Clock, ShieldCheck, ShieldOff, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getRejectedDoctors,
  getSuspendedDoctors,
} from "actions/admin";
import { DoctorReviewList } from "./_components/doctor-review-list";
import { DoctorActiveStatusList } from "./_components/verified-doctors";

export const metadata = {
  title: "Admin Dashboard - MediMeet",
};

export default async function AdminDashboardPage() {
  const [pendingDoctors, verifiedDoctors, rejectedDoctors, suspendedDoctors] =
    await Promise.all([
      getPendingDoctors(),
      getVerifiedDoctors(),
      getRejectedDoctors(),
      getSuspendedDoctors(),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verified ({verifiedDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="suspended" className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4" />
            Suspended ({suspendedDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedDoctors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <DoctorReviewList
            doctors={pendingDoctors}
            showReject
            emptyMessage="No pending applications."
          />
        </TabsContent>

        <TabsContent value="verified" className="mt-4">
          <DoctorActiveStatusList
            doctors={verifiedDoctors}
            suspend
            emptyMessage="No verified doctors yet."
          />
        </TabsContent>

        <TabsContent value="suspended" className="mt-4">
          <DoctorActiveStatusList
            doctors={suspendedDoctors}
            suspend={false}
            emptyMessage="No suspended doctors."
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <DoctorReviewList
            doctors={rejectedDoctors}
            showReject={false}
            emptyMessage="No rejected applications."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
