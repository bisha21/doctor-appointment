import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DoctorProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-7 w-56" />
      </div>

      <Card className="border-emerald-900/30">
        <CardContent className="flex flex-col sm:flex-row gap-6 py-6">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
      </div>
    </div>
  );
}
