'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Wallet } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { requestPayout } from 'actions/payouts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DOCTOR_NET_PER_CREDIT } from '@/lib/constants';

const PAYOUT_STATUS_STYLES = {
  PROCESSING: 'bg-amber-900/20 text-amber-400 border-amber-700/30',
  PROCESSED: 'bg-emerald-900/20 text-emerald-400 border-emerald-700/30',
};

export function PayoutsPanel({ earnedCredits, payouts }) {
  const router = useRouter();
  const [paypalEmail, setPaypalEmail] = useState('');

  const { fn: submitRequest, loading, data } = useFetch(requestPayout);

  useEffect(() => {
    if (data?.success) {
      toast.success('Payout requested');
      setPaypalEmail('');
      router.refresh();
    }
  }, [data, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('paypalEmail', paypalEmail);
    await submitRequest(formData);
  };

  const estimatedNet = earnedCredits * DOCTOR_NET_PER_CREDIT;

  return (
    <div className="space-y-6">
      <Card className="border-emerald-900/30">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-400" />
            <p className="text-lg font-semibold">
              {earnedCredits} earned credit{earnedCredits === 1 ? '' : 's'} available
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Worth ${estimatedNet.toFixed(2)} at ${DOCTOR_NET_PER_CREDIT}/credit after the
            platform fee.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="space-y-2 flex-1">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                required
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="you@paypal.com"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || earnedCredits <= 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Request Payout'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-medium">Payout History</h3>
        {!payouts || payouts.length === 0 ? (
          <p className="text-muted-foreground">No payout requests yet.</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <Card key={payout.id} className="border-emerald-900/30">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {payout.credits} credits · ${payout.netAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested {format(new Date(payout.createdAt), 'MMM d, yyyy')}
                      {payout.processedAt &&
                        ` · Processed ${format(new Date(payout.processedAt), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={PAYOUT_STATUS_STYLES[payout.status]}
                  >
                    {payout.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
