'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { bookAppointment } from 'actions/appointments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function BookingForm({ doctorId, days, canBook, blockedMessage }) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [description, setDescription] = useState('');

  const { fn: submitBooking, loading, data } = useFetch(bookAppointment);

  useEffect(() => {
    if (data?.success) {
      toast.success('Appointment booked!');
      setDialogOpen(false);
      router.push('/appointments');
    }
  }, [data, router]);

  const handleSelectSlot = (slot) => {
    if (!canBook) return;
    setSelectedSlot(slot);
    setDescription('');
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    const formData = new FormData();
    formData.append('doctorId', doctorId);
    formData.append('availabilityId', selectedSlot.id);
    formData.append('patientDescription', description);
    await submitBooking(formData);
  };

  if (!days || days.length === 0) {
    return (
      <p className="text-muted-foreground">
        This doctor has no upcoming availability. Please check back later.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {!canBook && blockedMessage && (
        <p className="text-sm text-amber-400">{blockedMessage}</p>
      )}

      {days.map((day) => (
        <div key={day.date} className="space-y-2">
          <p className="font-medium">{day.displayDate}</p>
          <div className="flex flex-wrap gap-2">
            {day.slots.map((slot) => (
              <Button
                key={slot.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={!canBook}
                onClick={() => handleSelectSlot(slot)}
                className="border-emerald-900/30"
              >
                {slot.formatted}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              {selectedSlot?.formatted} · Costs 2 credits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="patientDescription">
              Reason for visit (optional)
            </Label>
            <Textarea
              id="patientDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Persistent headache for the last 3 days"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
