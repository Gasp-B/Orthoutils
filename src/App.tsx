import React, { useMemo, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolCard from './components/ToolCard';
import SuggestionForm from './components/SuggestionForm';
import { tools, type Tool } from './data/tools';

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | undefined>(tools[0]);

  const stats = useMemo(
    () => [
      { label: 'Outils référencés', value: tools.length, detail: 'Questionnaires, batteries, suivis patients' },
      { label: 'Contributeurs', value: 38, detail: 'Orthophonistes, chercheurs, UX designers' },
      { label: 'Propositions en cours', value: 12, detail: 'En relecture et validation par pairs' },
    ],
    [],
  );

  return (
    <div id="top" style={{ color: '#cbd5e1', paddingBottom: '2rem' }}>
      <Header />
      <Hero />

      <section id="catalogue" className="container" style={{ display: 'grid', gap: '1.2rem', padding: '0 0 1rem' }}>
        <div className="section-title">
          <span />
          <p style={{ margin: 0 }}>Catalogue prêt à éditer</p>
        </div>
        <div className="card-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onSuggest={setSelectedTool} />
          ))}
        </div>
      </section>

      <section
        id="collaboration"
        className="container"
        style={{ display: 'grid', gap: '1.2rem', marginTop: '1.6rem' }}
      >
        <div className="card-grid">
          <div
            className="glass"
            style={{
              padding: '1.3rem',
              display: 'grid',
              gap: '0.9rem',
              background: 'linear-gradient(180deg, #ffffff 0%, #edf7fb 100%)',
            }}
          >
            <div className="section-title">
              <span />
              <p style={{ margin: 0 }}>Gouvernance éditoriale</p>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
              <li>Assurez un espace clair entre brouillons, fiches validées et contenus communautaires.</li>
              <li>Constituez un comité de relecture pluridisciplinaire avec attribution automatique des validations.</li>
              <li>Archivez les versions pour suivre les modifications, commentaires et décisions thérapeutiques.</li>
            </ul>
            <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {stats.map((stat) => (
                <div key={stat.label} className="glass" style={{ padding: '0.9rem', background: 'rgba(8,145,178,0.06)' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.3rem' }}>{stat.value}</p>
                  <p style={{ margin: '0.1rem 0 0', color: '#0f172a' }}>{stat.label}</p>
                  <small style={{ color: '#334155' }}>{stat.detail}</small>
                </div>
              ))}
            </div>
          </div>
          <SuggestionForm selectedTool={selectedTool} />
        </div>
      </section>

      <footer className="container footer">
        Made with soin pour les équipes d'orthophonie. Mobile first, adaptatif et pensé pour vos collaborations.
      </footer>
    </div>
  );
};

export default App;
