import { redirect } from "next/navigation";
import { getCurrentUser } from "actions/onboarding";

export const metadata = {
  title: "Admin Dashboard - MediMeet",
};

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user || user.role === "UNASSIGNED") redirect("/onboarding");
  if (user.role === "PATIENT") redirect("/doctors");
  if (user.role === "DOCTOR") redirect("/doctor");

  return <>{children}</>;
}
