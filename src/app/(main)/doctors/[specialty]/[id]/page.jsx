import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Stethoscope, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { getDoctorById, getAvailableSlots } from "actions/appointments";
import { getCurrentUser } from "actions/onboarding";
import { getDoctorReviews } from "actions/reviews";
import { APPOINTMENT_CREDIT_COST } from "@/lib/constants";
import { BookingForm } from "./_components/booking-form";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { doctor } = await getDoctorById(id);
  return {
    title: doctor ? `Dr. ${doctor.name} - MediMeet` : "Doctor - MediMeet",
  };
}

export default async function DoctorProfilePage({ params }) {
  const { specialty, id } = await params;
  const { doctor, error } = await getDoctorById(id);

  if (error || !doctor) {
    notFound();
  }

  const [{ days, error: slotsError }, currentUser, { reviews, averageRating, reviewCount, error: reviewsError }] =
    await Promise.all([
      getAvailableSlots(doctor.id),
      getCurrentUser(),
      getDoctorReviews(doctor.id),
    ]);

  let canBook = false;
  let blockedMessage = null;

  if (!currentUser) {
    blockedMessage = "Sign in as a patient to book this doctor.";
  } else if (currentUser.role !== "PATIENT") {
    blockedMessage = "Only patient accounts can book appointments.";
  } else if (currentUser.credits < APPOINTMENT_CREDIT_COST) {
    blockedMessage = `You need at least ${APPOINTMENT_CREDIT_COST} credits to book. Visit pricing to top up.`;
  } else {
    canBook = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/doctors/${specialty}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Dr. {doctor.name}</h1>
      </div>

      <Card className="border-emerald-900/30">
        <CardContent className="flex flex-col sm:flex-row gap-6 py-6">
          <div className="w-24 h-24 rounded-full bg-emerald-900/20 flex items-center justify-center shrink-0 overflow-hidden">
            {doctor.imageUrl ? (
              <Image
                src={doctor.imageUrl}
                alt={doctor.name}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="h-10 w-10 text-emerald-400" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-emerald-400 flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              {doctor.specialty} · {doctor.experience} years experience
            </p>
            {reviewCount > 0 ? (
              <div className="flex items-center gap-2">
                <StarRating value={averageRating} readOnly size="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviewCount} review
                  {reviewCount === 1 ? "" : "s"})
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            )}
            <p className="text-muted-foreground">{doctor.description}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Slots</h2>
        {slotsError ? (
          <p className="text-destructive">{slotsError}</p>
        ) : (
          <BookingForm
            doctorId={doctor.id}
            days={days}
            canBook={canBook}
            blockedMessage={blockedMessage}
          />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Patient Reviews</h2>
        {reviewsError ? (
          <p className="text-destructive">{reviewsError}</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">
            No reviews yet. Be the first to leave one after your appointment.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-emerald-900/30">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.patient.name}</p>
                    <StarRating value={review.rating} readOnly size="h-4 w-4" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
