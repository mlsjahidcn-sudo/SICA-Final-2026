'use client';

import Link from 'next/link';
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <BreadcrumbUI className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <BreadcrumbItem key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}
