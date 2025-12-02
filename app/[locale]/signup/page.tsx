'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSignupSchema } from '@/lib/validation/auth';

export default function SignupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth.signup');
  const authT = useTranslations('Auth');
  const layoutT = useTranslations('Auth.layout');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const parsed = createSignupSchema(authT).safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? authT('feedback.genericError'));
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.refresh();
      router.push(`/${locale}/tests/manage`);
      return;
    }

    setInfo(t('feedback.emailConfirmation'));
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
        content: (
          <form
            onSubmit={(event) => {
              void handleSignup(event);
            }}
            className="space-y-4"
          >
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
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
            {info && (
              <div
                className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                role="status"
              >
                <span aria-hidden>✅</span>
                <span>{info}</span>
              </div>
            )}

            <Button type="submit" className="w-full shadow" disabled={loading}>
              {loading ? t('submit.loading') : t('submit.idle')}
            </Button>
          </form>
        ),
        footer: (
          <>
            {t('loginPrompt')}{' '}
            <Link
              href={`/${locale}/login`}
              className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
            >
              {t('loginCta')}
            </Link>
          </>
        ),
      }}
    />
  );
}
