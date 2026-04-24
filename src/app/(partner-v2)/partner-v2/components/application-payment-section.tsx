'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Wallet,
  Landmark,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface PaymentSummary {
  deposit: {
    config_amount: number | null;
    config_currency: string;
    total_paid: number;
    total_pending: number;
    status: string;
  };
  service_fee: {
    config_amount: number | null;
    config_currency: string;
    total_paid: number;
    total_pending: number;
    status: string;
  };
}

interface PaymentRecord {
  id: string;
  payment_type: 'deposit' | 'service_fee';
  amount: number;
  currency: string;
  payment_date: string;
  status: 'pending' | 'received' | 'confirmed' | 'refunded';
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export function ApplicationPaymentSection({ applicationId }: { applicationId: string }) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    payment_type: 'deposit' as 'deposit' | 'service_fee',
    amount: '',
    currency: 'USD',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    receipt_url: '',
  });

  const fetchPayments = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/applications/${applicationId}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setLoading(false);
    }
  }, [applicationId, getAccessToken]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSubmit = async () => {
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/partner/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          payment_type: formData.payment_type,
          amount: Number(formData.amount),
          currency: formData.currency,
          payment_date: formData.payment_date,
          notes: formData.notes,
          receipt_url: formData.receipt_url,
        }),
      });
      if (res.ok) {
        toast.success('Payment recorded successfully');
        setDialogOpen(false);
        setFormData({
          payment_type: 'deposit',
          amount: '',
          currency: 'USD',
          payment_date: new Date().toISOString().split('T')[0],
          notes: '',
          receipt_url: '',
        });
        await fetchPayments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to record payment');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'received':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Confirm</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="text-amber-600"><AlertCircle className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Unpaid</Badge>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    return type === 'deposit' ? 'Deposit' : 'Service Fee';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasConfig = summary?.deposit?.config_amount != null || summary?.service_fee?.config_amount != null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Payment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasConfig ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Landmark className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Payment amounts not yet configured by admin.
            </div>
          ) : (
            <>
              {/* Deposit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deposit</span>
                  {getStatusBadge(summary?.deposit?.status || 'unpaid')}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Required</span>
                  <span className="font-medium">
                    {summary?.deposit?.config_amount != null
                      ? `${summary.deposit.config_amount.toLocaleString()} ${summary.deposit.config_currency}`
                      : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paid (Confirmed)</span>
                  <span className="font-medium text-emerald-600">
                    {summary?.deposit?.total_paid?.toLocaleString() || 0} {summary?.deposit?.config_currency || 'USD'}
                  </span>
                </div>
                {(summary?.deposit?.total_pending || 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Confirmation</span>
                    <span className="font-medium text-amber-600">
                      {summary.deposit.total_pending.toLocaleString()} {summary.deposit.config_currency}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Service Fee */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Fee</span>
                  {getStatusBadge(summary?.service_fee?.status || 'unpaid')}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Required</span>
                  <span className="font-medium">
                    {summary?.service_fee?.config_amount != null
                      ? `${summary.service_fee.config_amount.toLocaleString()} ${summary.service_fee.config_currency}`
                      : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paid (Confirmed)</span>
                  <span className="font-medium text-emerald-600">
                    {summary?.service_fee?.total_paid?.toLocaleString() || 0} {summary?.service_fee?.config_currency || 'USD'}
                  </span>
                </div>
                {(summary?.service_fee?.total_pending || 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Confirmation</span>
                    <span className="font-medium text-amber-600">
                      {summary.service_fee.total_pending.toLocaleString()} {summary.service_fee.config_currency}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment History */}
              {payments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment History</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border text-sm">
                          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{getPaymentTypeLabel(p.payment_type)}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.amount.toLocaleString()} {p.currency} &middot; {new Date(p.payment_date).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(p.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {hasConfig && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record an offline payment for this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(v) => setFormData((d) => ({ ...d, payment_type: v as 'deposit' | 'service_fee' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="service_fee">Service Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData((d) => ({ ...d, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData((d) => ({ ...d, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData((d) => ({ ...d, payment_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={formData.receipt_url}
                onChange={(e) => setFormData((d) => ({ ...d, receipt_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about this payment..."
                value={formData.notes}
                onChange={(e) => setFormData((d) => ({ ...d, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
