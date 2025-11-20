import React from 'react';
import type { Tool } from '../data/tools';

type Props = {
  tool: Tool;
  onSuggest: (tool: Tool) => void;
};

const statusClass: Record<Tool['status'], string> = {
  Validé: 'badge validated',
  'En cours de revue': 'badge review',
  Communauté: 'badge community',
};

const ToolCard: React.FC<Props> = ({ tool, onSuggest }) => {
  return (
    <article
      className="glass"
      style={{
        padding: '1.25rem',
        display: 'grid',
        gap: '0.75rem',
        background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
        <div>
          <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>{tool.name}</p>
          <p style={{ margin: '0.1rem 0 0', color: '#475569', fontWeight: 600 }}>{tool.category}</p>
        </div>
        <span className={statusClass[tool.status]}>{tool.status}</span>
      </div>
      <p style={{ margin: 0, lineHeight: 1.6, color: '#0f172a' }}>{tool.description}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="tag">{tool.population}</span>
        {tool.tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button className="primary-btn" onClick={() => onSuggest(tool)}>
          Proposer une modification
        </button>
        <button className="secondary-btn">Voir la fiche détaillée</button>
      </div>
    </article>
  );
};

export default ToolCard;
