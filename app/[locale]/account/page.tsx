'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Met à jour le mot de passe de l'utilisateur ACTUELLEMENT connecté
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(`Erreur: ${error.message}`);
      setLoading(false);
    } else {
      setMessage('Mot de passe mis à jour ! Redirection...');
      setTimeout(() => {
        router.push('/tests/manage');
      }, 1500);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Nouveau mot de passe</CardTitle></CardHeader>
        <CardContent>
          <form 
            onSubmit={(e) => void handleUpdate(e)} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="pass">Choisissez votre nouveau mot de passe</Label>
              <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {message && <div className="p-2 bg-blue-50 text-blue-800 text-sm rounded">{message}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}