import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        <div className="md:w-64 shrink-0 flex md:flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 md:w-full shrink-0" />
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
