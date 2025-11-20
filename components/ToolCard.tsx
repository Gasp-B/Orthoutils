import type { Tool } from '../data/tools';

type Props = {
  tool: Tool;
};

const statusClass: Record<Tool['status'], string> = {
  Validé: 'badge validated',
  'En cours de revue': 'badge review',
  Communauté: 'badge community',
};

function ToolCard({ tool }: Props) {
  return (
    <article className="glass panel panel-muted">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
        <div>
          <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>{tool.name}</p>
          <p style={{ margin: '0.1rem 0 0', color: '#475569', fontWeight: 600 }}>{tool.category}</p>
        </div>
        <span className={statusClass[tool.status]}>{tool.status}</span>
      </div>
      <p style={{ margin: 0, lineHeight: 1.6, color: '#0f172a' }}>{tool.description}</p>
      <div className="tag-row">
        <span className="tag">{tool.population}</span>
        {tool.tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>
      <div className="tool-actions">
        <button className="primary-btn">Voir la fiche détaillée</button>
      </div>
    </article>
  );
}

export default ToolCard;
