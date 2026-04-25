import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, X, AlertTriangle } from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: string;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  switch (status?.toLowerCase()) {
    case 'verified':
      return (
        <Badge variant="default" className={`bg-green-500 hover:bg-green-600 ${className || ''}`}>
          <Check className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className={`${className || ''}`}>
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className={`${className || ''}`}>
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge className={className}>{status}</Badge>;
  }
}

interface DocumentExpiryBadgeProps {
  expiryStatus?: 'expired' | 'expiring' | 'valid' | string | null;
  className?: string;
}

export function DocumentExpiryBadge({ expiryStatus, className }: DocumentExpiryBadgeProps) {
  if (!expiryStatus || expiryStatus === 'valid') return null;

  switch (expiryStatus) {
    case 'expired':
      return (
        <Badge variant="destructive" className={`${className || ''}`}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    case 'expiring':
      return (
        <Badge variant="outline" className={`border-orange-500 text-orange-600 ${className || ''}`}>
          <Clock className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    default:
      return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
