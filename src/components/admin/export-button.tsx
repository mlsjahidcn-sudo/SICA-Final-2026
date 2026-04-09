'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  Loader2,
  Users,
  FileText,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  className?: string;
}

export function ExportButton({ className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'students' | 'applications' | 'partners', format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/export?type=${type}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${type} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export as CSV</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('students', 'csv')}>
          <Users className="mr-2 h-4 w-4" />
          Students
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('applications', 'csv')}>
          <FileText className="mr-2 h-4 w-4" />
          Applications
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('partners', 'csv')}>
          <Building2 className="mr-2 h-4 w-4" />
          Partners
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Export as JSON</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('students', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Students
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('applications', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Applications
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('partners', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Partners
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
