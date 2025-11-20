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
    <div className="glass panel panel-muted" id="collaboration">
      <div className="section-title">
        <span />
        <p style={{ margin: 0 }}>Suggérer une amélioration</p>
      </div>
      <p className="body-text">
        Les référentiels sont publiés après validation par des orthophonistes. Vous pouvez néanmoins partager discrètement
        vos propositions (terminologie, consignes, scores…). Chaque proposition est relue et documentée avant diffusion.
      </p>
      <form onSubmit={handleSubmit} className="stack" style={{ gap: '0.75rem' }}>
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
        <button className="secondary-btn" type="submit" style={{ justifySelf: 'flex-start' }}>
          Partager ma suggestion
        </button>
      </form>
      {message && (
        <div className="glass panel" style={{ padding: '0.9rem', border: '1px solid rgba(56,189,248,0.35)' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SuggestionForm;
