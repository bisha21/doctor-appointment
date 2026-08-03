'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { submitReview } from 'actions/reviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/star-rating';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function ReviewForm({ appointmentId, existingReview }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  const { fn: submit, loading, data } = useFetch(submitReview);

  useEffect(() => {
    if (data?.success) {
      toast.success('Review saved');
      setOpen(false);
      router.refresh();
    }
  }, [data, router]);

  const openDialog = () => {
    setRating(existingReview?.rating || 0);
    setComment(existingReview?.comment || '');
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error('Please select a rating');
      return;
    }
    const formData = new FormData();
    formData.append('appointmentId', appointmentId);
    formData.append('rating', String(rating));
    formData.append('comment', comment);
    await submit(formData);
  };

  return (
    <div className="space-y-1">
      {existingReview ? (
        <>
          <StarRating value={existingReview.rating} readOnly size="h-4 w-4" />
          {existingReview.comment && (
            <p className="text-sm text-muted-foreground italic">
              &quot;{existingReview.comment}&quot;
            </p>
          )}
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-emerald-400"
            onClick={openDialog}
          >
            Edit review
          </Button>
        </>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={openDialog}>
          <MessageSquarePlus className="h-4 w-4 mr-1" />
          Leave a Review
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {existingReview ? 'Edit Review' : 'Leave a Review'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <StarRating value={rating} onChange={setRating} size="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your experience with this doctor?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
