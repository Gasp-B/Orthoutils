import React, { useEffect, useState } from 'react';
import type { Tool } from '../data/tools';

export type Suggestion = {
  toolId: string;
  title: string;
  description: string;
  impact: 'Ergonomie' | 'Contenu' | 'Données' | 'Accessibilité';
  author: string;
};

type Props = {
  selectedTool?: Tool;
};

const SuggestionForm: React.FC<Props> = ({ selectedTool }) => {
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Suggestion>({
    toolId: selectedTool?.id ?? '',
    title: '',
    description: '',
    impact: 'Contenu',
    author: '',
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, toolId: selectedTool?.id ?? '' }));
  }, [selectedTool]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(
      `Suggestion enregistrée pour ${selectedTool?.name ?? 'un outil'} : ${form.title}.
Elle est prête à être partagée avec le comité éditorial.`,
    );
    setForm({ toolId: selectedTool?.id ?? '', title: '', description: '', impact: 'Contenu', author: '' });
  };

  return (
    <div className="glass" style={{ padding: '1.3rem', display: 'grid', gap: '0.7rem' }} id="collaboration">
      <div className="section-title">
        <span />
        <p style={{ margin: 0 }}>Proposer une modification</p>
      </div>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        Rédigez vos suggestions de mise à jour (terminologie, consignes, scores…) avant de les publier. Nous conservons
        le fil de discussion et les validations afin de documenter chaque décision clinique en toute transparence.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span>Outil concerné</span>
          <input
            className="input"
            value={selectedTool?.name ?? ''}
            readOnly
            placeholder="Choisissez un outil dans le catalogue"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span>Titre de la proposition</span>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Clarifier les consignes, ajouter un indicateur, corriger un score…"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span>Détail</span>
          <textarea
            className="textarea"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez le besoin, le contexte clinique et la valeur pour les patient·es."
          />
        </label>
        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Impact</span>
            <select
              className="input"
              value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value as Suggestion['impact'] })}
            >
              <option value="Ergonomie">Ergonomie</option>
              <option value="Contenu">Contenu</option>
              <option value="Données">Données</option>
              <option value="Accessibilité">Accessibilité</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span>Signé par</span>
            <input
              className="input"
              required
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Votre nom ou équipe"
            />
          </label>
        </div>
        <button className="primary-btn" type="submit" style={{ justifySelf: 'flex-start' }}>
          Soumettre la proposition
        </button>
      </form>
      {message && (
        <div className="glass" style={{ padding: '0.9rem', border: '1px solid rgba(56,189,248,0.35)' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SuggestionForm;
