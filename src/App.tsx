import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolCard from './components/ToolCard';
import type { Tool } from './data/tools';
import { tools as fallbackTools } from './data/tools';
import { supabase } from './lib/supabaseClient';

type ToolRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  population: string | null;
  tags: string[] | null;
  status: string | null;
};

const parseStatus = (status: string | null): Tool['status'] => {
  if (status === 'Validé' || status === 'En cours de revue') {
    return status;
  }

  return 'Communauté';
};

const parseCategory = (category: string | null): Tool['category'] => {
  if (category === 'Questionnaire' || category === 'Test standardisé') {
    return category;
  }

  return 'Suivi patient';
};

const normalizeTool = (tool: ToolRow): Tool => ({
  id: tool.id,
  name: tool.name,
  description: tool.description ?? '',
  category: parseCategory(tool.category),
  population: tool.population ?? 'Tous publics',
  tags: tool.tags ?? [],
  status: parseStatus(tool.status),
});

const App: React.FC = () => {
  const [catalogue, setCatalogue] = useState<Tool[]>(fallbackTools);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const supabaseClient = supabase;
    let isActive = true;

    const fetchTools = async () => {
      setIsRefreshing(true);
      const { data, error } = await supabaseClient
        .from('tools')
        .select('id, name, description, category, population, tags, status')
        .order('name');

      if (!isActive) return;

      if (error) {
        setSyncError("Impossible de synchroniser les outils avec Supabase : " + error.message);
      } else if (data) {
        setCatalogue(data.map(normalizeTool));
        setSyncError(null);
      }

      setIsRefreshing(false);
    };

    void fetchTools();

    return () => {
      isActive = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Outils référencés', value: catalogue.length, detail: 'Questionnaires, batteries, suivis patients' },
      { label: 'Contributeurs', value: 38, detail: 'Orthophonistes référents, chercheurs, UX designers' },
      { label: 'Propositions en cours', value: 12, detail: 'Relectures éditoriales en cours de validation' },
    ],
    [catalogue.length],
  );

  return (
    <div className="page">
      <Header />
      <Hero />

      <section id="catalogue" className="container section-shell">
        <div className="section-title">
          <span />
          <p style={{ margin: 0 }}>Référentiels prêts à consulter</p>
        </div>
        {isRefreshing && <p className="text-subtle">Mise à jour en cours depuis Supabase...</p>}
        {syncError && <p className="text-subtle" role="status">{syncError}</p>}
        <div className="card-grid">
          {catalogue.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
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
              {stats.map((stat) => (
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

      <footer className="container footer">
        Made with soin pour les équipes d'orthophonie. Mobile first, adaptatif et pensé pour vos collaborations.
      </footer>
    </div>
  );
};

export default App;
