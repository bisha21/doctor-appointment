'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { setAvailability, deleteAvailabilitySlot } from 'actions/availability';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export function AvailabilityManager({ days }) {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const {
    fn: submitAvailability,
    loading: saving,
    data: saveData,
  } = useFetch(setAvailability);

  const {
    fn: submitDelete,
    loading: deleting,
    data: deleteData,
  } = useFetch(deleteAvailabilitySlot);

  useEffect(() => {
    if (saveData?.success) {
      toast.success('Availability updated');
      router.refresh();
    }
  }, [saveData, router]);

  useEffect(() => {
    if (deleteData?.success) {
      toast.success('Slot removed');
      router.refresh();
    }
  }, [deleteData, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('date', date);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    await submitAvailability(formData);
  };

  const handleDelete = async (slotId) => {
    const formData = new FormData();
    formData.append('slotId', slotId);
    await submitDelete(formData);
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-900/30">
        <CardContent className="py-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Set Availability
                </>
              )}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-3">
            This generates 30-minute slots for the selected date and replaces
            any of your existing unbooked slots for that day.
          </p>
        </CardContent>
      </Card>

      {!days || days.length === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t set any availability yet.
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.date} className="space-y-2">
              <p className="font-medium">{day.displayDate}</p>
              <div className="flex flex-wrap gap-2">
                {day.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-1 border border-emerald-900/30 rounded-md px-2 py-1 text-sm"
                  >
                    <span className={slot.status === 'BOOKED' ? 'text-blue-400' : ''}>
                      {slot.formatted}
                    </span>
                    {slot.status === 'AVAILABLE' ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(slot.id)}
                        disabled={deleting}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove slot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        (booked)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
