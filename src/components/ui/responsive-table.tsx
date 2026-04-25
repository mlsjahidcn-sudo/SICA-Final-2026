'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  title?: string;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
  renderCardActions?: (item: T) => React.ReactNode;
  renderTableActions?: (item: T) => React.ReactNode;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyField,
  title,
  emptyMessage = 'No data available',
  className,
  cardClassName,
  renderCardActions,
  renderTableActions,
}: ResponsiveTableProps<T>) {
  const getValue = (item: T, column: Column<T>): React.ReactNode => {
    if (column.cell) {
      return column.cell(item);
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    const value = item[column.accessor];
    // Convert value to ReactNode
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'object' && !React.isValidElement(value) && !Array.isArray(value)) {
      return String(value);
    }
    return value as React.ReactNode;
  };

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-auto">
        <table className="w-full caption-bottom text-sm">
          {title && <caption className="mb-4 text-left font-medium">{title}</caption>}
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
              {renderTableActions && (
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.map((item) => (
              <tr
                key={String(item[keyField])}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={cn(
                      'p-4 align-middle [&:has([role=checkbox])]:pr-0',
                      column.className
                    )}
                  >
                    {getValue(item, column)}
                  </td>
                ))}
                {renderTableActions && (
                  <td className="p-4 align-middle">
                    {renderTableActions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={String(item[keyField])}
            className={cn(
              'rounded-lg border bg-card p-4 shadow-sm',
              cardClassName
            )}
          >
            {columns.map((column, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <dt className="text-xs font-medium text-muted-foreground mb-1">
                  {column.header}
                </dt>
                <dd className="text-sm">{getValue(item, column)}</dd>
              </div>
            ))}
            {renderCardActions && (
              <div className="mt-4 pt-3 border-t">{renderCardActions(item)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
