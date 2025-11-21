import type { ToolDto, ToolStatus } from '@/lib/validation/tools';
import styles from './tool-card.module.css';

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
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.title}>{tool.title}</p>
          <p className={styles.category}>{tool.category}</p>
        </div>
        <span className={statusClass[tool.status]}>{tool.status}</span>
      </div>
      <p className={styles.description}>
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
