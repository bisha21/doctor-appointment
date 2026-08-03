'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Video, XCircle } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { cancelAppointment } from 'actions/appointments';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { isWithinJoinWindow } from '@/lib/appointmentTiming';
import { CANCELLATION_REFUND_WINDOW_HOURS } from '@/lib/constants';

export function AppointmentActions({ appointment }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { fn: submitCancel, loading, data } = useFetch(cancelAppointment);

  useEffect(() => {
    if (data?.success) {
      toast.success(
        data.refunded
          ? 'Appointment cancelled — credits refunded.'
          : 'Appointment cancelled.'
      );
      setConfirmOpen(false);
      router.refresh();
    }
  }, [data, router]);

  const handleCancel = async () => {
    const formData = new FormData();
    formData.append('appointmentId', appointment.id);
    await submitCancel(formData);
  };

  const hoursUntilStart =
    (new Date(appointment.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
  const isRefundEligible = hoursUntilStart >= CANCELLATION_REFUND_WINDOW_HOURS;
  const inJoinWindow = isWithinJoinWindow(appointment.startTime, appointment.endTime);

  return (
    <div className="flex flex-col items-start sm:items-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        title="Video calling isn't available yet"
      >
        <Video className="h-4 w-4 mr-1" />
        {inJoinWindow ? 'Join Call (coming soon)' : 'Join Call'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-400"
        onClick={() => setConfirmOpen(true)}
      >
        <XCircle className="h-4 w-4 mr-1" />
        Cancel
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              {isRefundEligible
                ? `This appointment is more than ${CANCELLATION_REFUND_WINDOW_HOURS} hours away, so your credits will be fully refunded.`
                : `This appointment is less than ${CANCELLATION_REFUND_WINDOW_HOURS} hours away, so credits will not be refunded.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
