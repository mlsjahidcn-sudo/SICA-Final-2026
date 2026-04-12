'use client';

import { useI18n } from '@/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

export function I18nDemo() {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-4">
      <LanguageSwitcher />
    </div>
  );
}
