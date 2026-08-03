'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink, Loader2, User } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { updateDoctorStatus } from 'actions/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DoctorReviewList({ doctors, showReject = true, emptyMessage }) {
  const router = useRouter();
  const [actingId, setActingId] = useState(null);

  const { fn: submitStatus, loading, data } = useFetch(updateDoctorStatus);

  useEffect(() => {
    if (data?.success) {
      toast.success('Doctor status updated');
      router.refresh();
    }
  }, [data, router]);

  const handleAction = async (doctorId, status) => {
    setActingId(doctorId);
    const formData = new FormData();
    formData.append('doctorId', doctorId);
    formData.append('status', status);
    await submitStatus(formData);
  };

  if (!doctors || doctors.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => {
        const isActing = loading && actingId === doctor.id;
        return (
          <Card key={doctor.id} className="border-emerald-900/30">
            <CardContent className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-6">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  {doctor.name}
                </p>
                <p className="text-sm text-emerald-400">
                  {doctor.specialty} · {doctor.experience} years experience
                </p>
                <p className="text-sm text-muted-foreground">{doctor.email}</p>
                {doctor.description && (
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {doctor.description}
                  </p>
                )}
                {doctor.credentialUrl && (
                  <a
                    href={doctor.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    View credentials
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  onClick={() => handleAction(doctor.id, 'VERIFIED')}
                >
                  {isActing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Approve'
                  )}
                </Button>
                {showReject && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleAction(doctor.id, 'REJECTED')}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
