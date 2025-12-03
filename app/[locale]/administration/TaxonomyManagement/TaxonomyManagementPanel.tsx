'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';

import styles from './taxonomy-management.module.css';
import {
  taxonomyDeletionSchema,
  taxonomyMutationSchema,
  taxonomyResponseSchema,
  type TaxonomyResponse,
} from '@/lib/validation/tests';
import { type Locale } from '@/i18n/routing';

type TaxonomyType = 'pathologies' | 'domains' | 'tags' | 'resourceTypes';
type TaxonomyEntry =
  | TaxonomyResponse['pathologies'][number]
  | TaxonomyResponse['domains'][number]
  | TaxonomyResponse['tags'][number]
  | TaxonomyResponse['resourceTypes'][number];

type FormState = {
  label: string;
  description: string;
  synonyms: string;
  color: string;
};

// La palette correspond aux classes CSS définies
const colors = ['#0EA5E9', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

// Helper pour mapper la couleur hex vers la classe CSS
function getColorClass(hex: string | null | undefined) {
  switch (hex) {
    case '#0EA5E9': return styles['bg-sky-500'];
    case '#6366F1': return styles['bg-indigo-500'];
    case '#EC4899': return styles['bg-pink-500'];
    case '#F59E0B': return styles['bg-amber-500'];
    case '#10B981': return styles['bg-emerald-500'];
    case '#EF4444': return styles['bg-red-500'];
    default: return styles['bg-default'];
  }
}

const typeToApi: Record<TaxonomyType, 'pathology' | 'domain' | 'tag' | 'resourceType'> = {
  pathologies: 'pathology',
  domains: 'domain',
  tags: 'tag',
  resourceTypes: 'resourceType',
};

const initialFormState: FormState = {
  label: '',
  description: '',
  synonyms: '',
  color: '',
};

export default function TaxonomyManagementPanel() {
  const t = useTranslations('taxonomyManagement');
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();

  const [activeType, setActiveType] = useState<TaxonomyType>('pathologies');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const taxonomyQuery = useQuery<TaxonomyResponse>({
    queryKey: ['taxonomy-management', locale],
    queryFn: async () => {
      const response = await fetch(`/api/tests/taxonomy?locale=${locale}`);

      if (!response.ok) {
        throw new Error(t('messages.loadError'));
      }

      const json = await response.json();
      return taxonomyResponseSchema.parse(json);
    },
  });

  const resetForm = () => {
    setSelectedId(null);
    setFormState(initialFormState);
  };

  useEffect(() => {
    resetForm();
    setSearchTerm('');
  }, [activeType]);

  const typeDetails = useMemo(
    () => ({
      pathologies: {
        label: t('types.pathologies'),
        hint: t('types.hints.pathologies'),
        lead: t('descriptions.pathologies'),
      },
      domains: {
        label: t('types.domains'),
        hint: t('types.hints.domains'),
        lead: t('descriptions.domains'),
      },
      tags: {
        label: t('types.tags'),
        hint: t('types.hints.tags'),
        lead: t('descriptions.tags'),
      },
      resourceTypes: {
        label: t('types.resourceTypes'),
        hint: t('types.hints.resourceTypes'),
        lead: t('descriptions.resourceTypes'),
      },
    }),
    [t],
  );

  const items: TaxonomyEntry[] = useMemo(() => {
    if (!taxonomyQuery.data) return [];
    if (activeType === 'pathologies') return taxonomyQuery.data.pathologies;
    if (activeType === 'domains') return taxonomyQuery.data.domains;
    if (activeType === 'tags') return taxonomyQuery.data.tags;
    return taxonomyQuery.data.resourceTypes;
  }, [taxonomyQuery.data, activeType]);

  const filteredItems: TaxonomyEntry[] = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return items;

    return items.filter((item) => {
      const labelMatch = item.label?.toLowerCase().includes(normalizedTerm);
      const descriptionMatch =
        'description' in item && typeof item.description === 'string'
          ? item.description.toLowerCase().includes(normalizedTerm)
          : false;
      const synonymMatch =
        'synonyms' in item && Array.isArray(item.synonyms)
          ? item.synonyms.some((synonym) => synonym.toLowerCase().includes(normalizedTerm))
          : false;

      return labelMatch || descriptionMatch || synonymMatch;
    });
  }, [items, searchTerm]);

  const saveMutation = useMutation({
    mutationFn: async (input: { id?: string; payload: ReturnType<typeof taxonomyMutationSchema.parse> }) => {
      const body = input.id ? { id: input.id, ...input.payload } : input.payload;
      const method = input.id ? 'PUT' : 'POST';

      const response = await fetch('/api/tests/taxonomy', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorPayload = (await response
          .json()
          .catch(() => ({ error: t('messages.saveError') }))) as { error?: string };
        const errorMessage = typeof errorPayload.error === 'string' ? errorPayload.error : t('messages.saveError');
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['taxonomy-management', locale] });
      setStatusMessage(variables.id ? t('messages.updated') : t('messages.created'));
      setErrorMessage(null);
      if (!variables.id) {
        resetForm();
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStatusMessage(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof taxonomyDeletionSchema.parse>) => {
      const response = await fetch('/api/tests/taxonomy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response
          .json()
          .catch(() => ({ error: t('messages.deleteError') }))) as { error?: string };
        const errorMessage = typeof errorPayload.error === 'string' ? errorPayload.error : t('messages.deleteError');
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['taxonomy-management', locale] });
      setStatusMessage(t('messages.deleted'));
      setErrorMessage(null);
      resetForm();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStatusMessage(null);
    },
  });

  const handleSelect = (id: string) => {
    const entry = items.find((item) => item.id === id);
    if (!entry) return;

    setSelectedId(id);
    if (activeType === 'pathologies') {
      const pathology = entry as TaxonomyResponse['pathologies'][number];

      setFormState({
        label: pathology.label ?? '',
        description: pathology.description ?? '',
        synonyms: Array.isArray(pathology.synonyms) ? pathology.synonyms.join(', ') : '',
        color: '',
      });
      return;
    }

    if (activeType === 'tags') {
      const tag = entry as TaxonomyResponse['tags'][number];

      setFormState({
        label: tag.label ?? '',
        description: '',
        synonyms: '',
        color: tag.color ?? '',
      });
      return;
    }

    const domain = entry as TaxonomyResponse['domains'][number];

    setFormState({
      label: domain.label ?? '',
      description: '',
      synonyms: '',
      color: '',
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      type: typeToApi[activeType],
      locale,
      value: formState.label.trim(),
      description:
        activeType === 'pathologies' ? formState.description.trim() || null : undefined,
      synonyms: activeType === 'pathologies' ? formState.synonyms.trim() : undefined,
      color: activeType === 'tags' ? formState.color || null : undefined,
    };

    const parsed = taxonomyMutationSchema.safeParse(payload);

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? t('messages.validationError'));
      setStatusMessage(null);
      return;
    }

    await saveMutation.mutateAsync({ id: selectedId ?? undefined, payload: parsed.data });
  };

  const handleDelete = async (id: string) => {
    const deletion = {
      type: typeToApi[activeType],
      id,
      locale,
    };

    const parsed = taxonomyDeletionSchema.safeParse(deletion);
    if (!parsed.success) {
      setErrorMessage(t('messages.deleteError'));
      setStatusMessage(null);
      return;
    }

    const confirmed = window.confirm(t('messages.deleteConfirm'));
    if (!confirmed) return;

    await deleteMutation.mutateAsync(parsed.data);
  };

  const activeCopy = typeDetails[activeType];

  return (
    <section className={styles.panel} aria-label={t('aria.panel')}>
      <aside className={styles.sidebar} aria-label={t('aria.sidebar')}>
        <div>
          <p className={styles.sidebarTitle}>{t('sidebar.title')}</p>
          <p className={styles.sidebarLead}>{t('sidebar.lead')}</p>
        </div>
        {(Object.keys(typeDetails) as TaxonomyType[]).map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.typeButton} ${activeType === type ? styles.typeButtonActive : ''}`}
            onClick={() => setActiveType(type)}
            aria-pressed={activeType === type}
          >
            <span className={styles.typeLabel}>
              <span className={styles.typeName}>{typeDetails[type].label}</span>
              <span className={styles.typeHint}>{typeDetails[type].hint}</span>
            </span>
            <span className={styles.count}>{(taxonomyQuery.data?.[type] as unknown[] | undefined)?.length ?? 0}</span>
          </button>
        ))}
      </aside>

      <div className={styles.main} aria-live="polite">
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>{activeCopy.label}</h2>
          <p className={styles.headerLead}>{activeCopy.lead}</p>
        </div>

        {statusMessage && <div className={styles.statusBar}>{statusMessage}</div>}
        {errorMessage && <div className={`${styles.statusBar} ${styles.errorBar}`}>{errorMessage}</div>}

        <div className={styles.content}>
          <div className={styles.listCard}>
            <h3 className={styles.cardTitle}>{t('list.title', { type: activeCopy.label })}</h3>
            <div className={styles.listToolbar}>
              <label className={styles.searchLabel} htmlFor="taxonomy-search">
                {t('list.searchLabel')}
              </label>
              <input
                id="taxonomy-search"
                type="search"
                className={styles.input}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('list.searchPlaceholder', { type: activeCopy.label })}
                aria-label={t('list.searchAria')}
              />
            </div>
            {/* List rendering */}
            <div className={styles.list}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.listItem} ${selectedId === item.id ? styles.listItemActive : ''}`}
                >
                  <div className={styles.itemMeta}>
                    <p className={styles.itemLabel}>{item.label}</p>
                    
                    {/* Affichage sécurisé de la couleur via classe CSS */}
                    {(() => {
                      const colorValue = 'color' in item && typeof item.color === 'string' ? item.color : '';
                      if (!colorValue) return null;

                      return (
                        <span
                          aria-label={t('labels.colorValue', { value: colorValue })}
                          className={`${styles.synonym} ${getColorClass(colorValue)}`}
                        >
                          {colorValue}
                        </span>
                      );
                    })()}
                    {/* ... description et synonymes inchangés ... */}
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => handleSelect(item.id)}
                    >
                      {t('actions.edit')}
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => void handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {t('actions.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.cardTitle}>{t('form.title')}</h3>
            <form className={styles.formGrid} onSubmit={(event) => void handleSubmit(event)}>
              {/* ... champs label, description, synonymes inchangés ... */}
              
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label htmlFor="label-input">{t('form.fields.label')}</label>
                  <span className="text-subtle">{t('form.hints.required')}</span>
                </div>
                <input
                  id="label-input"
                  name="label"
                  className={styles.input}
                  value={formState.label}
                  onChange={(event) => setFormState({ ...formState, label: event.target.value })}
                  placeholder={t('form.placeholders.label')}
                  required
                />
              </div>

              {activeType === 'pathologies' && (
                <>
                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <label htmlFor="description-input">{t('form.fields.description')}</label>
                      <span className="text-subtle">{t('form.hints.optional')}</span>
                    </div>
                    <textarea
                      id="description-input"
                      name="description"
                      className={styles.textarea}
                      value={formState.description}
                      onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                      placeholder={t('form.placeholders.description')}
                    />
                  </div>

                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <label htmlFor="synonyms-input">{t('form.fields.synonyms')}</label>
                      <span className="text-subtle">{t('form.hints.commaSeparated')}</span>
                    </div>
                    <input
                      id="synonyms-input"
                      name="synonyms"
                      className={styles.input}
                      value={formState.synonyms}
                      onChange={(event) => setFormState({ ...formState, synonyms: event.target.value })}
                      placeholder={t('form.placeholders.synonyms')}
                    />
                  </div>
                </>
              )}

              {activeType === 'tags' && (
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor="color-input">{t('form.fields.color')}</label>
                    <span className="text-subtle">{t('form.hints.optional')}</span>
                  </div>
                  <input
                    id="color-input"
                    name="color"
                    className={styles.input}
                    value={formState.color}
                    onChange={(event) => setFormState({ ...formState, color: event.target.value })}
                    placeholder={t('form.placeholders.color')}
                  />
                  <div className={styles.colorSwatches}>
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`${styles.colorChip} ${getColorClass(color)} ${formState.color === color ? styles.colorChipActive : ''}`}
                        aria-label={t('labels.colorValue', { value: color })}
                        onClick={() => setFormState({ ...formState, color })}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button className={styles.submitButton} type="submit" disabled={saveMutation.isPending}>
                  {selectedId ? t('form.actions.update') : t('form.actions.create')}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                  {t('form.actions.reset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}