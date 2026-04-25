'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconFileTypePdf, IconZoomIn, IconDownload } from '@tabler/icons-react';

interface A4DocumentPreviewProps {
  url: string | null;
  title: string;
  className?: string;
  maxWidth?: number; // Maximum width in pixels
  showActions?: boolean;
}

/**
 * A4DocumentPreview Component
 * Displays A4 documents (PDF or images) with proper aspect ratio (1:1.414)
 * 
 * A4 dimensions: 210mm × 297mm
 * Aspect ratio: 1:1.414
 */
export function A4DocumentPreview({
  url,
  title,
  className,
  maxWidth = 400,
  showActions = true,
}: A4DocumentPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!url) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          className
        )}
        style={{
          maxWidth: `${maxWidth}px`,
          aspectRatio: '1/1.414',
        }}
      >
        <p className="text-sm text-muted-foreground">No document uploaded</p>
      </div>
    );
  }

  const isPDF = url.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  return (
    <>
      <div
        className={cn(
          'relative group rounded-lg overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow',
          className
        )}
        style={{
          maxWidth: `${maxWidth}px`,
          aspectRatio: '1/1.414',
        }}
      >
        {isPDF ? (
          // PDF Preview
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
            <IconFileTypePdf className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-sm font-medium text-center px-4">{title}</p>
            <p className="text-xs text-muted-foreground mt-2">PDF Document</p>
          </div>
        ) : (
          // Image Preview
          <Image
            src={url}
            alt={title}
            fill
            className="object-cover"
            sizes={`${maxWidth}px`}
          />
        )}

        {/* Hover Overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
            >
              <IconZoomIn className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
            >
              <IconDownload className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>

      {/* Full-screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="w-full flex justify-center">
            {isPDF ? (
              <iframe
                src={url}
                className="w-full"
                style={{ height: '80vh' }}
                title={title}
              />
            ) : (
              <div className="relative w-full" style={{ aspectRatio: '1/1.414' }}>
                <Image
                  src={url}
                  alt={title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 896px) 100vw, 896px"
                  priority
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
