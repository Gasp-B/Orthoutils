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
    <div className="page">
      <Header />
      <Hero />

      <section id="catalogue" className="container section-shell">
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
