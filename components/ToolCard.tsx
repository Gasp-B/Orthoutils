"use client";

import type { ToolDto, ToolStatus } from '@/lib/validation/tools';
import { useTranslations } from 'next-intl';
import styles from './tool-card.module.css';

type Props = {
  tool: ToolDto;
};

const statusClass: Record<ToolStatus, string> = {
  validated: 'badge validated',
  review: 'badge review',
  community: 'badge community',
};

function ToolCard({ tool }: Props) {
  const t = useTranslations('ToolCard');

  const hasDescription = Boolean(tool.description);
  const hasType = Boolean(tool.type);
  const hasSource = Boolean(tool.source);
  const statusLabels: Record<ToolStatus, string> = {
    validated: t('status.validated'),
    review: t('status.review'),
    community: t('status.community'),
  };
  const statusLabel = tool.statusLabel ?? statusLabels[tool.status];
  const typeLabel = hasType ? t('labels.type', { type: tool.type ?? '' }) : null;
  const descriptionContent = hasDescription
    ? tool.description
    : typeLabel ?? t('fallback.description');
  const targetPopulation = tool.targetPopulation ?? t('fallback.population');

  return (
    <article className="glass panel panel-muted">
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.title}>{tool.title}</p>
          <p className={styles.category}>{tool.category}</p>
        </div>
        <span className={statusClass[tool.status]}>{statusLabel}</span>
      </div>
      <p className={styles.description}>{descriptionContent}</p>
      <div className="tag-row">
        <span className="tag">{targetPopulation}</span>
        {typeLabel && <span className="tag">{typeLabel}</span>}
        {hasSource && (
          <a
            href={tool.source ?? '#'}
            className="tag"
            target="_blank"
            rel="noreferrer"
            aria-label={t('labels.sourceAria', { toolName: tool.title })}
          >
            {t('labels.source')}
          </a>
        )}
        {tool.tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>
      <div className="tool-actions">
        <button className="primary-btn">{t('cta.viewDetails')}</button>
      </div>
    </article>
  );
}

export default ToolCard;
