'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { setReviewHidden, deleteReview } from 'actions/reviews';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function ReviewModerationList({ reviews }) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    fn: submitToggle,
    loading: toggling,
    data: toggleData,
  } = useFetch(setReviewHidden);

  const {
    fn: submitDelete,
    loading: deleting,
    data: deleteData,
  } = useFetch(deleteReview);

  useEffect(() => {
    if (toggleData?.success) {
      toast.success('Review updated');
      router.refresh();
    }
  }, [toggleData, router]);

  useEffect(() => {
    if (deleteData?.success) {
      toast.success('Review deleted');
      setDeleteTarget(null);
      router.refresh();
    }
  }, [deleteData, router]);

  const handleToggle = async (review) => {
    setTogglingId(review.id);
    const formData = new FormData();
    formData.append('reviewId', review.id);
    formData.append('hide', (!review.isHidden).toString());
    await submitToggle(formData);
  };

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append('reviewId', deleteTarget.id);
    await submitDelete(formData);
  };

  if (!reviews || reviews.length === 0) {
    return <p className="text-muted-foreground">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="border-emerald-900/30">
          <CardContent className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{review.patient.name}</p>
                <span className="text-sm text-muted-foreground">
                  → Dr. {review.doctor.name}
                </span>
                {review.isHidden && (
                  <Badge
                    variant="outline"
                    className="bg-red-900/20 text-red-400 border-red-700/30"
                  >
                    Hidden
                  </Badge>
                )}
              </div>
              <StarRating value={review.rating} readOnly size="h-4 w-4" />
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={toggling}
                onClick={() => handleToggle(review)}
              >
                {toggling && togglingId === review.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : review.isHidden ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Unhide
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteTarget(review)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This permanently deletes {deleteTarget?.patient.name}&apos;s review
              of Dr. {deleteTarget?.doctor.name}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
