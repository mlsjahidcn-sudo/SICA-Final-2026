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
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  FileText,
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

interface PaymentConfig {
  id?: string;
  deposit_amount: number | null;
  deposit_currency: string;
  service_fee_amount: number | null;
  service_fee_currency: string;
}

export function ApplicationPaymentSection({ applicationId }: { applicationId: string }) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [configForm, setConfigForm] = useState<PaymentConfig>({
    deposit_amount: null,
    deposit_currency: 'USD',
    service_fee_amount: null,
    service_fee_currency: 'USD',
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
        setConfig(data.config);
        if (data.config) {
          setConfigForm(data.config);
        }
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

  const handleSaveConfig = async () => {
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/payment-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          deposit_amount: configForm.deposit_amount,
          deposit_currency: configForm.deposit_currency,
          service_fee_amount: configForm.service_fee_amount,
          service_fee_currency: configForm.service_fee_currency,
        }),
      });
      if (res.ok) {
        toast.success('Payment configuration saved');
        setConfigDialogOpen(false);
        await fetchPayments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save config');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (res.ok) {
        toast.success('Payment confirmed');
        setConfirmDialogOpen(false);
        setSelectedPayment(null);
        await fetchPayments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to confirm payment');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefundPayment = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'refunded' }),
      });
      if (res.ok) {
        toast.success('Payment marked as refunded');
        setConfirmDialogOpen(false);
        setSelectedPayment(null);
        await fetchPayments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to refund payment');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Payment deleted');
        await fetchPayments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to delete payment');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'received':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Received</Badge>;
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

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              Payment Configuration & Tracking
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setConfigDialogOpen(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {config ? 'Edit Config' : 'Set Config'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Config Summary */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Deposit Required</p>
              <p className="font-medium text-sm">
                {config?.deposit_amount != null
                  ? `${config.deposit_amount.toLocaleString()} ${config.deposit_currency}`
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Service Fee Required</p>
              <p className="font-medium text-sm">
                {config?.service_fee_amount != null
                  ? `${config.service_fee_amount.toLocaleString()} ${config.service_fee_currency}`
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Deposit Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Deposit</span>
              {getStatusBadge(summary?.deposit?.status || 'unpaid')}
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
                  {(summary?.deposit?.total_pending || 0).toLocaleString()} {(summary?.deposit?.config_currency || 'USD')}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Service Fee Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Service Fee</span>
              {getStatusBadge(summary?.service_fee?.status || 'unpaid')}
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
                  {(summary?.service_fee?.total_pending || 0).toLocaleString()} {(summary?.service_fee?.config_currency || 'USD')}
                </span>
              </div>
            )}
          </div>

          {/* Payment Records Table */}
          {payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment Records</p>
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2.5 rounded-lg border text-sm">
                      <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getPaymentTypeLabel(p.payment_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.amount.toLocaleString()} {p.currency} &middot; {new Date(p.payment_date).toLocaleDateString()}
                        </p>
                        {p.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{p.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {getStatusBadge(p.status)}
                        {p.status === 'received' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600"
                            title="Confirm Payment"
                            onClick={() => { setSelectedPayment(p); setConfirmDialogOpen(true); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={() => handleDeletePayment(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Configuration</DialogTitle>
            <DialogDescription>
              Set the required deposit and service fee amounts for this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Deposit Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={configForm.deposit_amount ?? ''}
                  onChange={(e) => setConfigForm((d) => ({ ...d, deposit_amount: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={configForm.deposit_currency}
                  onValueChange={(v) => setConfigForm((d) => ({ ...d, deposit_currency: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Service Fee Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={configForm.service_fee_amount ?? ''}
                  onChange={(e) => setConfigForm((d) => ({ ...d, service_fee_amount: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={configForm.service_fee_currency}
                  onValueChange={(v) => setConfigForm((d) => ({ ...d, service_fee_currency: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm/Refund Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment Action</DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  {getPaymentTypeLabel(selectedPayment.payment_type)} of{' '}
                  <strong>{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {selectedPayment?.receipt_url && (
              <a
                href={selectedPayment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
              >
                <FileText className="h-3.5 w-3.5" /> View Receipt
              </a>
            )}
            {selectedPayment?.notes && (
              <p className="text-sm text-muted-foreground mb-3">{selectedPayment.notes}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefundPayment} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refund
            </Button>
            <Button onClick={handleConfirmPayment} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
