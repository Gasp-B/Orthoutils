import React, { useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolCard from './components/ToolCard';
import { tools } from './data/tools';

const App: React.FC = () => {
  const stats = useMemo(
    () => [
      { label: 'Outils référencés', value: tools.length, detail: 'Questionnaires, batteries, suivis patients' },
      { label: 'Contributeurs', value: 38, detail: 'Orthophonistes référents, chercheurs, UX designers' },
      {
        label: 'Propositions en cours',
        value: 12,
        detail: 'Relectures éditoriales en cours de validation',
      },
    ],
    [],
  );

  const architecture = useMemo(
    () => [
      {
        title: 'Next.js 14 (App Router)',
        detail:
          'Pages et route handlers typés pour la logique serveur, sans server actions. Auth gérée côté cookies via @supabase/ssr.',
      },
      {
        title: 'Supabase Postgres + Auth',
        detail:
          'Connexion avec supabaseClient (publishable) et supabaseAdmin (server). RLS activée et policies pour toutes les tables.',
      },
      {
        title: 'Drizzle ORM + RPC ciblées',
        detail:
          'Schemas typés, migrations versionnées, et RPC Supabase pour les opérations critiques afin de garder les règles serveur.',
      },
      {
        title: 'UI & formulaires',
        detail: 'Tailwind, shadcn/ui, icônes Lucide. Zod + react-hook-form pour valider et typifier tous les inputs.',
      },
      {
        title: 'Data fetching',
        detail: 'TanStack Query pour le cache client, invalidations ciblées après mutations et revalidations ISR côté Vercel.',
      },
    ],
    [],
  );

  const safeguards = useMemo(
    () => [
      {
        title: 'API minimales et explicites',
        detail: 'Chaque /api/* est typé, renvoie des erreurs claires et valide les entrées/sorties avec Zod.',
      },
      {
        title: 'Sécurité par défaut',
        detail:
          'Headers CSP et middleware de rate-limit léger pour protéger les endpoints. Jamais de clé serveur côté client.',
      },
      {
        title: 'Stockage & RLS',
        detail:
          'Toutes les tables sont sous RLS. Les accès Storage passent par Supabase et respectent les policies.',
      },
    ],
    [],
  );

  const roadmap = useMemo(
    () => [
      'Exposer les fiches via des route handlers Next.js avec cache ISR et contrôle d’auth.',
      'Brancher Supabase en lecture/écriture avec Drizzle pour les fiches et les suggestions.',
      'Déployer les migrations SQL dans supabase/migrations et activer les policies RLS nécessaires.',
      'Outiller la rédaction avec des formulaires validés (zod) et notifications côté TanStack Query.',
    ],
    [],
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
        <div className="card-grid">
          {tools.map((tool) => (
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

      <section id="architecture" className="container section-shell">
        <div className="section-title">
          <span />
          <p style={{ margin: 0 }}>Socle technique pour la plateforme Next.js 14</p>
        </div>
        <div className="card-grid">
          {architecture.map((item) => (
            <div key={item.title} className="glass panel panel-muted">
              <p style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{item.title}</p>
              <p className="body-text" style={{ marginTop: '0.2rem' }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="securite" className="container section-shell" style={{ marginTop: '1.2rem' }}>
        <div className="card-grid">
          <div className="glass panel">
            <div className="section-title">
              <span />
              <p style={{ margin: 0 }}>Fiabilité & sécurité</p>
            </div>
            <div className="card-grid">
              {safeguards.map((item) => (
                <div key={item.title} className="glass panel panel-muted">
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{item.title}</p>
                  <p className="body-text" style={{ marginTop: '0.2rem' }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <ul className="list" style={{ marginTop: '0.9rem' }}>
              <li>Routage côté serveur uniquement : aucune server action, uniquement des route handlers.</li>
              <li>Configuration des clés : NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY côté client, SUPABASE_SECRET_KEY côté serveur.</li>
              <li>Accès aux données via supabaseClient (public) ou supabaseAdmin (server) exposés dans lib/supabaseClient.ts.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="roadmap" className="container section-shell" style={{ marginTop: '1.2rem' }}>
        <div className="card-grid">
          <div className="glass panel panel-muted">
            <div className="section-title">
              <span />
              <p style={{ margin: 0 }}>Feuille de route produit</p>
            </div>
            <p className="body-text" style={{ margin: '0 0 0.4rem' }}>
              Les prochaines itérations reprennent les instructions techniques pour livrer une base prête pour Vercel + Supabase.
            </p>
            <ul className="list">
              {roadmap.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
