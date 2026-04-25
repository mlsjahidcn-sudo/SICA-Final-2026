'use client';

import { useI18n } from '@/i18n/context';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconLanguage } from '@tabler/icons-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="gap-2">
          <IconLanguage className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={locale === loc ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcherInline() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <IconLanguage className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {locales.map((loc) => (
          <Button
            key={loc}
            variant={locale === loc ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLocale(loc)}
            className="h-7 px-2 text-xs"
          >
            {localeFlags[loc]} {localeNames[loc]}
          </Button>
        ))}
      </div>
    </div>
  );
}
