import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SPECIALTIES } from "@/lib/specialities";

export const metadata = {
  title: "Find a Doctor - MediMeet",
  description: "Browse doctors by specialty and book a consultation",
};

export default function DoctorsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Find Your Doctor</h1>
        <p className="text-muted-foreground">
          Browse by specialty to find and book a consultation
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {SPECIALTIES.map((specialty) => (
          <Link key={specialty.name} href={`/doctors/${encodeURIComponent(specialty.name)}`}>
            <Card className="border-emerald-900/30 hover:border-emerald-700/40 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center text-center gap-3 py-6">
                <div className="p-4 bg-emerald-900/20 rounded-full">
                  <span className="text-emerald-400">{specialty.icon}</span>
                </div>
                <p className="font-medium">{specialty.name}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
