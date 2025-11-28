'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createForgotPasswordSchema } from '@/lib/validation/auth';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations('Auth.forgotPassword');
  const authT = useTranslations('Auth');
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={(e) => void handleReset(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('submit.loading') : t('submit.idle')}
              </Button>
            </form>
          ) : (
            <div className="text-sm text-green-600 bg-green-50 p-4 rounded mb-4" role="status">
              {t('successMessage')}
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}