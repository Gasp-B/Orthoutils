'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createForgotPasswordSchema } from '@/lib/validation/auth';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations('Auth.forgotPassword');
  const authT = useTranslations('Auth');
  const layoutT = useTranslations('Auth.layout');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const parsed = createForgotPasswordSchema(authT).safeParse({ email });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? authT('feedback.genericError'));
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <AuthLayout
      hero={{
        pill: layoutT('pill'),
        headline: layoutT('headline'),
        subheadline: layoutT('subheadline'),
        features: [
          {
            icon: '🛡️',
            title: layoutT('features.security.title'),
            description: layoutT('features.security.description'),
          },
          {
            icon: '⚡',
            title: layoutT('features.speed.title'),
            description: layoutT('features.speed.description'),
          },
          {
            icon: '📚',
            title: layoutT('features.catalog.title'),
            description: layoutT('features.catalog.description'),
          },
          {
            icon: '💬',
            title: layoutT('features.support.title'),
            description: layoutT('features.support.description'),
          },
        ],
      }}
      card={{
        title: t('title'),
        description: t('subtitle'),
        content: !success ? (
          <form onSubmit={(event) => void handleReset(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <span aria-hidden>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full shadow" disabled={loading}>
              {loading ? t('submit.loading') : t('submit.idle')}
            </Button>
          </form>
        ) : (
          <div
            className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-800"
            role="status"
          >
            <span aria-hidden>✅</span>
            <span>{t('successMessage')}</span>
          </div>
        ),
        footer: (
          <Link
            href={`/${locale}/login`}
            className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
          >
            {t('backToLogin')}
          </Link>
        ),
      }}
    />
  );
}