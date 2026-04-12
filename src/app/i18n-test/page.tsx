'use client';

import { useI18n } from '@/i18n/context';
import { LanguageSwitcher, LanguageSwitcherInline } from '@/components/language-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function I18nTestPage() {
  const { locale, t } = useI18n();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{t('home.hero.title')}</h1>
          <p className="text-xl text-muted-foreground">{t('home.hero.subtitle')}</p>
        </div>

        {/* Language Switcher */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.language')}</CardTitle>
            <CardDescription>
              Current language: {locale.toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Dropdown style:</p>
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Inline style:</p>
              <LanguageSwitcherInline />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Example */}
        <Card>
          <CardHeader>
            <CardTitle>{t('nav.home')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline">{t('nav.universities')}</Button>
              <Button variant="outline">{t('nav.programs')}</Button>
              <Button variant="outline">{t('nav.about')}</Button>
              <Button variant="outline">{t('nav.contact')}</Button>
              <Button variant="outline">{t('nav.login')}</Button>
              <Button variant="outline">{t('nav.register')}</Button>
              <Button variant="outline">{t('nav.dashboard')}</Button>
              <Button variant="outline">{t('nav.settings')}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>{t('home.features.title')}</CardTitle>
            <CardDescription>{t('home.features.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{t('home.features.university.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.features.university.description')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{t('home.features.scholarship.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.features.scholarship.description')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{t('home.features.application.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.features.application.description')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{t('home.features.support.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.features.support.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Common UI Elements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button>{t('common.save')}</Button>
              <Button variant="secondary">{t('common.cancel')}</Button>
              <Button variant="destructive">{t('common.delete')}</Button>
              <Button variant="outline">{t('common.edit')}</Button>
              <Button variant="ghost">{t('common.view')}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('application.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{t('application.status.draft')}</span>
              <span className="px-3 py-1 bg-blue-100 rounded-full text-sm">{t('application.status.submitted')}</span>
              <span className="px-3 py-1 bg-yellow-100 rounded-full text-sm">{t('application.status.under_review')}</span>
              <span className="px-3 py-1 bg-green-100 rounded-full text-sm">{t('application.status.accepted')}</span>
              <span className="px-3 py-1 bg-red-100 rounded-full text-sm">{t('application.status.rejected')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
