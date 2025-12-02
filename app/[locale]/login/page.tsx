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
import { createForgotPasswordSchema, createLoginSchema } from '@/lib/validation/auth';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth.login');
  const authT = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<
    'password' | 'google' | 'apple' | 'magic' | 'phone' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingAction('password');
    setError(null);
    setInfo(null);

    const parsed = createLoginSchema(authT).safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? authT('feedback.genericError'));
      setPendingAction(null);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

    if (signInError) {
      setError(signInError.message);
      setPendingAction(null);
      return;
    }

    router.refresh();
    router.push(`/${locale}/tests/manage`);
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setPendingAction(provider);
    setError(null);
    setInfo(null);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/${locale}/tests/manage`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setPendingAction(null);
    }
  };

  const handleMagicLink = async () => {
    setPendingAction('magic');
    setError(null);
    setInfo(null);

    const parsed = createForgotPasswordSchema(authT).safeParse({
      email,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? authT('feedback.genericError'));
      setPendingAction(null);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/tests/manage`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setPendingAction(null);
      return;
    }

    setInfo(t('feedback.magicLinkSent'));
    setPendingAction(null);
  };

  const handlePhoneLogin = () => {
    setError(t('feedback.phoneUnavailable'));
    setInfo(null);
  };

  return (
    <AuthLayout
      card={{
        title: t('title'),
        description: t('subtitle'),
        content: (
          <div className="space-y-6">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3 border-slate-200"
                onClick={handlePhoneLogin}
                disabled={pendingAction !== null}
              >
                <span aria-hidden className="text-lg">
                  📱
                </span>
                <span className="flex-1 text-center font-semibold text-slate-800">
                  {t('social.phone')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3 border-slate-200"
                onClick={() => {
                  void handleOAuthLogin('google');
                }}
                disabled={pendingAction !== null}
              >
                <span aria-hidden className="text-lg">
                  🟢
                </span>
                <span className="flex-1 text-center font-semibold text-slate-800">
                  {t('social.google')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3 border-slate-200"
                onClick={() => {
                  void handleOAuthLogin('apple');
                }}
                disabled={pendingAction !== null}
              >
                <span aria-hidden className="text-lg">
                  🍎
                </span>
                <span className="flex-1 text-center font-semibold text-slate-800">
                  {t('social.apple')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3 border-slate-200"
                onClick={() => {
                  void handleMagicLink();
                }}
                disabled={pendingAction !== null}
              >
                <span aria-hidden className="text-lg">
                  ✉️
                </span>
                <span className="flex-1 text-center font-semibold text-slate-800">
                  {t('social.magicLink')}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t('social.separator')}
              </span>
              <Separator className="flex-1" />
            </div>

            <form
              onSubmit={(event) => {
                void handleLogin(event);
              }}
              className="space-y-5"
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
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="password">{t('passwordLabel')}</Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
                  >
                    {authT('forgotPassword.title')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? (
                <div
                  className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  <span aria-hidden>⚠️</span>
                  <span>{error}</span>
                </div>
              ) : null}

              {info ? (
                <div
                  className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                  role="status"
                >
                  <span aria-hidden>✅</span>
                  <span>{info}</span>
                </div>
              ) : null}

              <Button type="submit" className="w-full shadow" disabled={pendingAction !== null}>
                {pendingAction === 'password' ? t('submit.loading') : t('submit.idle')}
              </Button>
            </form>
          </div>
        ),
        footer: (
          <div className="space-y-2">
            <p>{t('footer.disclaimer')}</p>
            <p>
              {t('signupPrompt')}{' '}
              <Link
                href={`/${locale}/signup`}
                className="font-semibold text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
              >
                {t('signupCta')}
              </Link>
            </p>
          </div>
        ),
      }}
    />
  );
}
