'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle2, Loader2 } from 'lucide-react';
import useFetch from '@/app/hooks/useFetch';
import { processPayout } from 'actions/payouts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function PayoutQueue({ pendingPayouts, processedPayouts }) {
  const router = useRouter();
  const [actingId, setActingId] = useState(null);

  const { fn: submitProcess, loading, data } = useFetch(processPayout);

  useEffect(() => {
    if (data?.success) {
      toast.success('Payout marked as processed');
      router.refresh();
    }
  }, [data, router]);

  const handleProcess = async (payoutId) => {
    setActingId(payoutId);
    const formData = new FormData();
    formData.append('payoutId', payoutId);
    await submitProcess(formData);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="font-medium">Pending Payouts</h3>
        {!pendingPayouts || pendingPayouts.length === 0 ? (
          <p className="text-muted-foreground">No pending payouts.</p>
        ) : (
          <div className="space-y-3">
            {pendingPayouts.map((payout) => (
              <Card key={payout.id} className="border-emerald-900/30">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{payout.doctor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {payout.credits} credits · ${payout.netAmount.toFixed(2)} net ·{' '}
                      {payout.paypalEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {format(new Date(payout.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                    onClick={() => handleProcess(payout.id)}
                  >
                    {loading && actingId === payout.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Processed
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Payout History</h3>
        {!processedPayouts || processedPayouts.length === 0 ? (
          <p className="text-muted-foreground">No payouts processed yet.</p>
        ) : (
          <div className="space-y-3">
            {processedPayouts.map((payout) => (
              <Card key={payout.id} className="border-emerald-900/30">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{payout.doctor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {payout.credits} credits · ${payout.netAmount.toFixed(2)} net
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processed {format(new Date(payout.processedAt), 'MMM d, yyyy')} by{' '}
                      {payout.processedBy}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-900/20 text-emerald-400 border-emerald-700/30"
                  >
                    PROCESSED
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
