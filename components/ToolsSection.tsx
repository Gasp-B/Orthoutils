'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ToolCard from './ToolCard';
import { toolsResponseSchema, type ToolDto } from '@/lib/validation/tools';

async function fetchTools() {
  const response = await fetch('/api/tools', { cache: 'no-store' });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({ error: null }))) as { error?: string | null };
    throw new Error(error ?? 'Erreur lors du chargement des outils');
  }

  const data = (await response.json()) as unknown;
  return toolsResponseSchema.parse(data).tools;
}

function ToolsSection() {
  const { data: tools = [], isLoading, isError, refetch } = useQuery<ToolDto[]>({
    queryKey: ['tools'],
    queryFn: fetchTools,
    staleTime: 1000 * 60,
    retry: false,
  });

  const computedStats = useMemo(
    () => [
      { label: 'Outils référencés', value: tools.length, detail: 'Questionnaires, batteries, suivis patients' },
      { label: 'Contributeurs', value: 38, detail: 'Orthophonistes référents, chercheurs, UX designers' },
      { label: 'Propositions en cours', value: 12, detail: 'Relectures éditoriales en cours de validation' },
    ],
    [tools.length],
  );

  return (
    <>
      <section id="catalogue" className="container section-shell">
        <div className="section-title">
          <span />
          <p style={{ margin: 0 }}>Référentiels prêts à consulter</p>
        </div>

        {isLoading && <p className="text-subtle">Chargement des outils depuis Supabase…</p>}
        {isError && (
          <div className="glass panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Impossible de récupérer les outils</p>
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
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {!isLoading && !isError && tools.length === 0 && (
          <p className="text-subtle" style={{ marginTop: '0.5rem' }}>
            Aucun outil n'est disponible pour l'instant. Ajoutez des entrées dans Supabase pour alimenter le catalogue.
          </p>
        )}
      </section>

      <section id="collaboration" className="container section-shell" style={{ marginTop: '1.6rem' }}>
        <div className="card-grid">
          <div className="glass panel">
            <div className="section-title">
              <span />
              <p style={{ margin: 0 }}>Gouvernance éditoriale</p>
            </div>
            <ul className="list">
              <li>Assurez un espace clair entre brouillons, fiches validées et contenus communautaires.</li>
              <li>Constituez un comité de relecture pluridisciplinaire avec attribution automatique des validations.</li>
              <li>Archivez les versions pour suivre les modifications, commentaires et décisions thérapeutiques.</li>
            </ul>
            <div className="stat-grid">
              {computedStats.map((stat) => (
                <div key={stat.label} className="glass panel stat-card">
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.3rem' }}>{stat.value}</p>
                  <p style={{ margin: '0.1rem 0 0', color: '#0f172a' }}>{stat.label}</p>
                  <small className="text-subtle">{stat.detail}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ToolsSection;
