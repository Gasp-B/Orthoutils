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
import { Separator } from '@/components/ui/separator';
import { createLoginSchema } from '@/lib/validation/auth';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth.login');
  const authT = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const parsed = createLoginSchema(authT).safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? authT('feedback.genericError'));
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push(`/${locale}/tests/manage`);
  };

  const handleSocialFallback = (label: string) => {
    setError(t('comingSoon', { method: label }));
  };

  const socialOptions = [
    { key: 'phoneButton' as const, icon: '📱' },
    { key: 'googleButton' as const, icon: '🟦' },
    { key: 'appleButton' as const, icon: '🍎' },
    { key: 'magicLinkButton' as const, icon: '✨' },
  ];

  return (
    <AuthLayout
      card={{
        title: t('title'),
        description: t('subtitle'),
        content: (
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('socialLead')}</p>
              <div className="grid gap-2">
                {socialOptions.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-3 border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300"
                    onClick={() => {
                      handleSocialFallback(t(option.key));
                    }}
                  >
                    <span aria-hidden className="text-lg">
                      {option.icon}
                    </span>
                    <span className="flex-1 text-left font-semibold">{t(option.key)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              <Separator className="bg-slate-100" />
              <span>{t('dividerLabel')}</span>
              <Separator className="bg-slate-100" />
            </div>

            <form
              onSubmit={(event) => {
                void handleLogin(event);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">{t('emailSectionTitle')}</h3>
                <p className="text-xs text-muted-foreground">{t('emailSectionHint')}</p>
              </div>

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
                <div className="text-right text-xs">
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
                  >
                    {authT('forgotPassword.title')}
                  </Link>
                </div>
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
          </div>
        ),
        footer: (
          <>
            {t('signupPrompt')}{' '}
            <Link
              href={`/${locale}/signup`}
              className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
            >
              {t('signupCta')}
            </Link>
          </>
        ),
      }}
    />
  );
}
