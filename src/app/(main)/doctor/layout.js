import { redirect } from "next/navigation";
import { getCurrentUser } from "actions/onboarding";

export const metadata = {
  title: "Doctor Dashboard - MediMeet",
};

export default async function DoctorLayout({ children }) {
  const user = await getCurrentUser();

  if (!user || user.role === "UNASSIGNED") {
    redirect("/onboarding");
  }
  if (user.role === "PATIENT") {
    redirect("/doctors");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}
