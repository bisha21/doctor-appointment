'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, CheckCircle2, Loader2, User } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { markAppointmentCompleted, updateAppointmentNotes } from 'actions/doctor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { APPOINTMENT_STATUS_STYLES } from '@/lib/constants';

export function AppointmentsList({ appointments }) {
  const router = useRouter();
  const [notesAppointment, setNotesAppointment] = useState(null);
  const [notesValue, setNotesValue] = useState('');

  const {
    fn: submitComplete,
    loading: completing,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  const {
    fn: submitNotes,
    loading: savingNotes,
    data: notesData,
  } = useFetch(updateAppointmentNotes);

  useEffect(() => {
    if (completeData?.success) {
      toast.success('Appointment marked as completed');
      router.refresh();
    }
  }, [completeData, router]);

  useEffect(() => {
    if (notesData?.success) {
      toast.success('Notes saved');
      setNotesAppointment(null);
      router.refresh();
    }
  }, [notesData, router]);

  const handleComplete = async (appointmentId) => {
    const formData = new FormData();
    formData.append('appointmentId', appointmentId);
    await submitComplete(formData);
  };

  const openNotes = (appointment) => {
    setNotesAppointment(appointment);
    setNotesValue(appointment.notes || '');
  };

  const handleSaveNotes = async () => {
    const formData = new FormData();
    formData.append('appointmentId', notesAppointment.id);
    formData.append('notes', notesValue);
    await submitNotes(formData);
  };

  if (!appointments || appointments.length === 0) {
    return (
      <p className="text-muted-foreground">
        You don&apos;t have any appointments yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="border-emerald-900/30">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                {appointment.patient.name}
              </p>
              <p className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(
                  new Date(appointment.startTime),
                  "EEE, MMM d, yyyy 'at' h:mm a"
                )}
              </p>
              {appointment.patientDescription && (
                <p className="text-sm text-muted-foreground italic">
                  &quot;{appointment.patientDescription}&quot;
                </p>
              )}
              {appointment.notes && (
                <p className="text-sm text-emerald-400">
                  Notes: {appointment.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="outline"
                className={APPOINTMENT_STATUS_STYLES[appointment.status]}
              >
                {appointment.status}
              </Badge>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openNotes(appointment)}
                >
                  Notes
                </Button>
                {appointment.status === 'SCHEDULED' && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={completing}
                    onClick={() => handleComplete(appointment.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark Completed
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={!!notesAppointment}
        onOpenChange={(open) => !open && setNotesAppointment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes for {notesAppointment?.patient.name}
            </Label>
            <Textarea
              id="notes"
              rows={5}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Diagnosis, recommendations, follow-up..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotesAppointment(null)}
              disabled={savingNotes}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {savingNotes ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Notes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
