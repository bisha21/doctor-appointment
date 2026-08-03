import { Clock, ShieldCheck, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getRejectedDoctors,
} from "actions/admin";
import { DoctorReviewList } from "./_components/doctor-review-list";
import { VerifiedDoctors } from "./_components/verified-doctors";

export const metadata = {
  title: "Admin Dashboard - MediMeet",
};

export default async function AdminDashboardPage() {
  const [pendingDoctors, verifiedDoctors, rejectedDoctors] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getRejectedDoctors(),
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
          <VerifiedDoctors doctors={verifiedDoctors} />
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
