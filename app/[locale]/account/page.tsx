'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl'; // Ajout pour gérer la redirection locale

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Vérification de la session au montage
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si pas de session, on redirige vers le login car le lien est invalide ou expiré
        router.replace(`/${locale}/login?error=session_expired`);
      } else {
        setIsSessionChecked(true);
      }
    };
    void checkSession();
  }, [supabase, router, locale]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Met à jour le mot de passe de l'utilisateur ACTUELLEMENT connecté
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(`Erreur: ${error.message}`);
      setLoading(false);
    } else {
      setMessage('Mot de passe mis à jour ! Redirection...');
      setTimeout(() => {
        router.push(`/${locale}/administration`);
      }, 1500);
    }
  };

  if (!isSessionChecked) {
    return <div className="flex items-center justify-center min-h-[60vh]">Chargement...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nouveau mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pass">Choisissez votre nouveau mot de passe</Label>
              <Input
                id="pass"
                type="password"
                placeholder="Entrez votre nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            
            {message && (
              <div className={`p-2 text-sm rounded ${message.startsWith('Erreur') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                {message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
