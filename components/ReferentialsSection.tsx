'use client';

import { useQuery } from '@tanstack/react-query';
import { referentialsResponseSchema, type ReferentialDto } from '@/lib/validation/referentials';

async function fetchReferentials() {
  const response = await fetch('/api/referentials', { cache: 'no-store' });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({ error: null }))) as { error?: string | null };
    throw new Error(error ?? "Erreur lors du chargement des référentiels");
  }

  const data = (await response.json()) as unknown;
  return referentialsResponseSchema.parse(data).referentials;
}

function ReferentialsSection() {
  const { data: referentials = [], isLoading, isError, refetch } = useQuery<ReferentialDto[]>({
    queryKey: ['referentials'],
    queryFn: fetchReferentials,
    staleTime: 1000 * 60,
    retry: false,
  });

  return (
    <section id="referentiels" className="container section-shell">
      <div className="section-title">
        <span />
        <p style={{ margin: 0 }}>Référentiels structurés</p>
      </div>

      {isLoading && <p className="text-subtle">Chargement des référentiels depuis Supabase…</p>}

      {isError && (
        <div className="glass panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Impossible de récupérer les référentiels</p>
            <p className="text-subtle" style={{ margin: '0.1rem 0 0' }}>
              Vérifiez la connexion ou rechargez la page. La requête passe par Supabase avec RLS activé.
            </p>
          </div>
          <button className="secondary-btn" type="button" onClick={() => void refetch()}>
            Réessayer
          </button>
        </div>
      )}

      <div className="card-grid">
        {referentials.map((referential) => (
          <article key={referential.id} className="glass panel panel-muted" style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <p style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{referential.name}</p>
                {referential.description && (
                  <p className="text-subtle" style={{ margin: '0.1rem 0 0' }}>
                    {referential.description}
                  </p>
                )}
              </div>
              <span className="badge validated">Référentiel</span>
            </div>

            <div className="tag-row" style={{ flexWrap: 'wrap' }}>
              {referential.subsections.map((subsection) => (
                <span key={subsection.id} className="tag" style={{ backgroundColor: '#0ea5e91a', color: '#0f172a' }}>
                  {subsection.name}
                </span>
              ))}
              {referential.subsections.length === 0 && (
                <span className="text-subtle">Aucune sous-catégorie associée pour le moment.</span>
              )}
            </div>

            {referential.subsections.some((subsection) => subsection.tags.length > 0) && (
              <div className="tag-row" style={{ flexWrap: 'wrap', gap: '0.45rem' }}>
                {referential.subsections.flatMap((subsection) =>
                  subsection.tags.map((tag) => (
                    <span key={`${subsection.id}-${tag.id}`} className="tag" style={{ backgroundColor: '#e2f3ff' }}>
                      #{tag.name}
                    </span>
                  )),
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {!isLoading && !isError && referentials.length === 0 && (
        <p className="text-subtle" style={{ marginTop: '0.5rem' }}>
          Aucun référentiel n'est disponible pour le moment. Vérifiez que les données sont bien présentes dans Supabase.
        </p>
      )}
    </section>
  );
}

export default ReferentialsSection;
