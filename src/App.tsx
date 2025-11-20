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
          <div className="glass" style={{ padding: '1.3rem', display: 'grid', gap: '0.9rem' }}>
            <div className="section-title">
              <span />
              <p style={{ margin: 0 }}>Gouvernance éditoriale</p>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
              <li>Séparez brouillons, fiches validées et contenus communautaires.</li>
              <li>Organisez un comité de relecture avec attribution automatique des validations.</li>
              <li>Archivez les versions pour suivre les modifications et commentaires.</li>
            </ul>
            <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {stats.map((stat) => (
                <div key={stat.label} className="glass" style={{ padding: '0.9rem', background: 'rgba(255,255,255,0.04)' }}>
                  <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 800, fontSize: '1.3rem' }}>{stat.value}</p>
                  <p style={{ margin: '0.1rem 0 0', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
                  <small style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.detail}</small>
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
