'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldOff, User } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { updateDoctorActiveStatus } from 'actions/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VerifiedDoctors({ doctors }) {
  const router = useRouter();
  const [actingId, setActingId] = useState(null);

  const { fn: submitSuspend, loading, data } = useFetch(updateDoctorActiveStatus);

  useEffect(() => {
    if (data?.success) {
      toast.success('Doctor suspended');
      router.refresh();
    }
  }, [data, router]);

  const handleSuspend = async (doctorId) => {
    setActingId(doctorId);
    const formData = new FormData();
    formData.append('doctorId', doctorId);
    formData.append('suspend', 'true');
    await submitSuspend(formData);
  };

  if (!doctors || doctors.length === 0) {
    return <p className="text-muted-foreground">No verified doctors yet.</p>;
  }

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => {
        const isActing = loading && actingId === doctor.id;
        return (
          <Card key={doctor.id} className="border-emerald-900/30">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  {doctor.name}
                </p>
                <p className="text-sm text-emerald-400">
                  {doctor.specialty} · {doctor.experience} years experience
                </p>
                <p className="text-sm text-muted-foreground">{doctor.email}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => handleSuspend(doctor.id)}
              >
                {isActing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4 mr-1" />
                    Suspend
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
