import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Stethoscope, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { getDoctorsBySpecialty } from "actions/doctors";

export async function generateMetadata({ params }) {
  const { specialty } = await params;
  return {
    title: `${decodeURIComponent(specialty)} Doctors - MediMeet`,
  };
}

const SpecialtyPage = async ({ params }) => {
  const { specialty } = await params;
  const decodedSpecialty = decodeURIComponent(specialty);
  const { doctors, error } = await getDoctorsBySpecialty(decodedSpecialty);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/doctors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{decodedSpecialty}</h1>
      </div>

      {error && <p className="text-destructive">{error}</p>}

      {!error && (!doctors || doctors.length === 0) && (
        <p className="text-muted-foreground">
          No verified doctors are available in {decodedSpecialty} yet. Please
          check back later.
        </p>
      )}

      {doctors && doctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/doctors/${specialty}/${doctor.id}`}
            >
              <Card className="border-emerald-900/30 hover:border-emerald-700/40 transition-all cursor-pointer h-full">
                <CardContent className="flex items-start gap-4 py-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {doctor.imageUrl ? (
                      <Image
                        src={doctor.imageUrl}
                        alt={doctor.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {doctor.specialty}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.experience} years of experience
                    </p>
                    {doctor.reviewCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <StarRating value={doctor.averageRating} readOnly size="h-3.5 w-3.5" />
                        <span className="text-xs text-muted-foreground">
                          ({doctor.reviewCount})
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No reviews yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialtyPage;
