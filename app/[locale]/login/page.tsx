'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              void handleLogin(event);
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
            
            {/* Zone modifiée avec le lien Mot de passe oublié */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('passwordLabel')}</Label>
                <Link 
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-primary hover:underline"
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

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('submit.loading') : t('submit.idle')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('signupPrompt')}{' '}
            <Link href={`/${locale}/signup`} className="font-medium text-primary hover:underline">
              {t('signupCta')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}