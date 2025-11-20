import type { ToolDto, ToolStatus } from '@/lib/validation/tools';

type Props = {
  tool: ToolDto;
};

const statusClass: Record<ToolStatus, string> = {
  Validé: 'badge validated',
  'En cours de revue': 'badge review',
  Communauté: 'badge community',
};

function ToolCard({ tool }: Props) {
  const hasDescription = Boolean(tool.description);
  const hasType = Boolean(tool.type);
  const hasSource = Boolean(tool.source);

  return (
    <article className="glass panel panel-muted">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
        <div>
          <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>{tool.title}</p>
          <p style={{ margin: '0.1rem 0 0', color: '#475569', fontWeight: 600 }}>{tool.category}</p>
        </div>
        <span className={statusClass[tool.status]}>{tool.status}</span>
      </div>
      <p style={{ margin: 0, lineHeight: 1.6, color: '#0f172a' }}>
        {hasDescription
          ? tool.description
          : hasType
            ? `Type : ${tool.type}`
            : "Cet outil n'a pas encore de description détaillée."}
      </p>
      <div className="tag-row">
        <span className="tag">{tool.targetPopulation ?? 'Tous publics'}</span>
        {hasType && <span className="tag">Type : {tool.type}</span>}
        {hasSource && (
          <a
            href={tool.source ?? '#'}
            className="tag"
            target="_blank"
            rel="noreferrer"
            aria-label={`Consulter la source de ${tool.title}`}
          >
            Source
          </a>
        )}
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
