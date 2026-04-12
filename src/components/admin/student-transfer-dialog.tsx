'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { ArrowRight, Loader2 } from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';

interface Partner {
  id: string;
  full_name: string;
  email: string;
  company_name?: string;
}

interface StudentTransferDialogProps {
  studentId: string;
  studentName: string;
  currentPartnerId?: string;
  onTransferComplete: () => void;
  trigger: React.ReactNode;
}

export function StudentTransferDialog({
  studentId,
  studentName,
  currentPartnerId,
  onTransferComplete,
  trigger,
}: StudentTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [reason, setReason] = useState('');
  const [notifyStudent, setNotifyStudent] = useState(true);

  // Fetch partners when dialog opens
  const fetchPartners = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch('/api/admin/partners?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to load partners');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchPartners();
      setSelectedPartnerId('');
      setReason('');
      setNotifyStudent(true);
    }
  };

  const handleTransfer = async () => {
    if (!selectedPartnerId) {
      toast.error('Please select a partner');
      return;
    }

    if (!reason || reason.length < 10) {
      toast.error('Please provide a reason (at least 10 characters)');
      return;
    }

    if (selectedPartnerId === currentPartnerId) {
      toast.error('Cannot transfer to the same partner');
      return;
    }

    setLoading(true);
    try {
      const token = await getValidToken();
      const response = await fetch(`/api/admin/partner-students/${studentId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_partner_id: selectedPartnerId,
          reason,
          notify_student: notifyStudent,
        }),
      });

      if (response.ok) {
        toast.success('Student transferred successfully');
        setOpen(false);
        onTransferComplete();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to transfer student');
      }
    } catch (error) {
      console.error('Error transferring student:', error);
      toast.error('Failed to transfer student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Transfer Student
          </DialogTitle>
          <DialogDescription>
            Transfer <strong>{studentName}</strong> to a different partner organization.
            This action will reassign all their applications to the new partner.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="partner">New Partner *</Label>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem 
                    key={partner.id} 
                    value={partner.id}
                    disabled={partner.id === currentPartnerId}
                  >
                    {partner.company_name || partner.full_name}
                    {partner.id === currentPartnerId && ' (Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Transfer *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for transferring this student..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters (minimum 10)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify"
              checked={notifyStudent}
              onChange={(e) => setNotifyStudent(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="notify" className="text-sm font-normal">
              Send notification email to student
            </Label>
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
            onClick={handleTransfer}
            disabled={loading || !selectedPartnerId || reason.length < 10}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
