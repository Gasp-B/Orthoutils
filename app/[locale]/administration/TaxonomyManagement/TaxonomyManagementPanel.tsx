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
import {
  populationCharacteristicCreateSchema,
  populationCharacteristicDeleteSchema,
  populationCharacteristicUpdateSchema,
  populationCharacteristicsResponseSchema,
  type PopulationCharacteristicsResponse,
} from '@/lib/validation/population';
import { type Locale } from '@/i18n/routing';

type TaxonomyType = 'themes' | 'domains' | 'tags' | 'resourceTypes' | 'populations';
type TaxonomyEntry =
  | TaxonomyResponse['themes'][number]
  | TaxonomyResponse['domains'][number]
  | TaxonomyResponse['tags'][number]
  | TaxonomyResponse['resourceTypes'][number];

type FormState = {
  label: string;
  description: string;
  synonyms: string;
  color: string;
  domainIds: string[];
};

const colors = ['#0EA5E9', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

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

const typeToApi: Record<Exclude<TaxonomyType, 'populations'>, 'theme' | 'domain' | 'tag' | 'resourceType'> = {
  themes: 'theme',
  domains: 'domain',
  tags: 'tag',
  resourceTypes: 'resourceType',
};

const initialFormState: FormState = {
  label: '',
  description: '',
  synonyms: '',
  color: '',
  domainIds: [],
};

export default function TaxonomyManagementPanel() {
  const t = useTranslations('taxonomyManagement');
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();

  const [activeType, setActiveType] = useState<TaxonomyType>('themes');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPopulationId, setSelectedPopulationId] = useState<string | null>(null);
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<string | null>(null);
  const [populationCharacteristic, setPopulationCharacteristic] = useState('');

  const taxonomyQuery = useQuery<TaxonomyResponse>({
    queryKey: ['taxonomy-management', locale],
    queryFn: async () => {
      const response = await fetch(`/api/tests/taxonomy?locale=${locale}`);
      if (!response.ok) throw new Error(t('messages.loadError'));
      const json = await response.json();
      return taxonomyResponseSchema.parse(json);
    },
  });

  const populationQuery = useQuery<PopulationCharacteristicsResponse>({
    queryKey: ['population-management', locale],
    queryFn: async () => {
      const response = await fetch(`/api/tests/populations?locale=${locale}`);
      if (!response.ok) throw new Error(t('messages.loadError'));
      const json = await response.json();
      return populationCharacteristicsResponseSchema.parse(json);
    },
  });

  const resetForm = () => {
    setSelectedId(null);
    setFormState(initialFormState);
  };

  useEffect(() => {
    resetForm();
    setSearchTerm('');
    setStatusMessage(null);
    setErrorMessage(null);
    setSelectedPopulationId(null);
    setSelectedCharacteristic(null);
    setPopulationCharacteristic('');
  }, [activeType]);

  const typeDetails = useMemo(() => ({
    themes: { label: t('types.themes'), hint: t('types.hints.themes'), lead: t('descriptions.themes') },
    domains: { label: t('types.domains'), hint: t('types.hints.domains'), lead: t('descriptions.domains') },
    tags: { label: t('types.tags'), hint: t('types.hints.tags'), lead: t('descriptions.tags') },
    resourceTypes: { label: t('types.resourceTypes'), hint: t('types.hints.resourceTypes'), lead: t('descriptions.resourceTypes') },
    populations: { label: t('types.populations'), hint: t('types.hints.populations'), lead: t('descriptions.populations') },
  }), [t]);

  const items: TaxonomyEntry[] = useMemo(() => {
    if (!taxonomyQuery.data) return [];
    if (activeType === 'populations') return [];
    return taxonomyQuery.data[activeType] || [];
  }, [taxonomyQuery.data, activeType]);

  const availableDomains = taxonomyQuery.data?.domains ?? [];
  const populationItems = populationQuery.data?.populations ?? [];
  const totalPopulationCharacteristics = useMemo(() => (
    populationItems.reduce((total, population) => total + population.characteristics.length, 0)
  ), [populationItems]);

  const typeCounts = useMemo(() => ({
    themes: taxonomyQuery.data?.themes.length ?? 0,
    domains: taxonomyQuery.data?.domains.length ?? 0,
    tags: taxonomyQuery.data?.tags.length ?? 0,
    resourceTypes: taxonomyQuery.data?.resourceTypes.length ?? 0,
    populations: totalPopulationCharacteristics,
  }), [taxonomyQuery.data, totalPopulationCharacteristics]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const labelMatch = item.label?.toLowerCase().includes(term);
      const descMatch = 'description' in item && typeof item.description === 'string' ? item.description.toLowerCase().includes(term) : false;
      const synMatch = 'synonyms' in item && Array.isArray(item.synonyms) ? item.synonyms.some(s => s.toLowerCase().includes(term)) : false;
      return labelMatch || descMatch || synMatch;
    });
  }, [items, searchTerm]);

  const selectedPopulation = populationItems.find((population) => population.id === selectedPopulationId);
  const filteredCharacteristics = useMemo(() => {
    if (!selectedPopulation) return [];
    const term = searchTerm.trim().toLowerCase();
    const list = selectedPopulation.characteristics;
    if (!term) return list;
    return list.filter((value) => value.toLowerCase().includes(term));
  }, [selectedPopulation, searchTerm]);

  // Logique de regroupement des thèmes par domaines
  const themesGroups = useMemo(() => {
    if (activeType !== 'themes') return { grouped: {}, noDomain: [] };

    const grouped: Record<string, TaxonomyEntry[]> = {};
    const noDomain: TaxonomyEntry[] = [];

    filteredItems.forEach((item) => {
      // Cast sécurisé car on a vérifié activeType === 'themes'
      const theme = item as TaxonomyResponse['themes'][number];

      if (!theme.domains || theme.domains.length === 0) {
        noDomain.push(item);
      } else {
        theme.domains.forEach((d) => {
          if (!grouped[d.id]) grouped[d.id] = [];
          grouped[d.id].push(item);
        });
      }
    });

    return { grouped, noDomain };
  }, [filteredItems, activeType]);

  const saveMutation = useMutation({
    mutationFn: async (input: { id?: string; payload: any }) => {
      const body = input.id ? { id: input.id, ...input.payload } : input.payload;
      const method = input.id ? 'PUT' : 'POST';
      const res = await fetch('/api/tests/taxonomy', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(t('messages.saveError'));
      return res.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['taxonomy-management', locale] });
      setStatusMessage(variables.id ? t('messages.updated') : t('messages.created'));
      setErrorMessage(null);
      if (!variables.id) resetForm();
    },
    onError: (err) => { setErrorMessage(err.message); setStatusMessage(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/tests/taxonomy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t('messages.deleteError'));
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['taxonomy-management', locale] });
      setStatusMessage(t('messages.deleted'));
      setErrorMessage(null);
      resetForm();
    },
    onError: (err) => { setErrorMessage(err.message); setStatusMessage(null); },
  });

  const populationSaveMutation = useMutation({
    mutationFn: async (input: { method: 'POST' | 'PUT'; payload: any }) => {
      const res = await fetch('/api/tests/populations', {
        method: input.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.payload),
      });
      if (!res.ok) throw new Error(t('messages.saveError'));
      return res.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['population-management', locale] });
      setStatusMessage(
        variables.method === 'PUT' ? t('messages.updated') : t('messages.created'),
      );
      setErrorMessage(null);
      setSelectedCharacteristic(null);
      setPopulationCharacteristic('');
    },
    onError: (err) => { setErrorMessage(err.message); setStatusMessage(null); },
  });

  const populationDeleteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/tests/populations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t('messages.deleteError'));
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['population-management', locale] });
      setStatusMessage(t('messages.deleted'));
      setErrorMessage(null);
      setSelectedCharacteristic(null);
      setPopulationCharacteristic('');
    },
    onError: (err) => { setErrorMessage(err.message); setStatusMessage(null); },
  });

  const handleSelect = (id: string) => {
    const entry = items.find((i) => i.id === id);
    if (!entry) return;
    setSelectedId(id);
    if (activeType === 'themes') {
      const theme = entry as any;
      setFormState({
        label: theme.label ?? '',
        description: theme.description ?? '',
        synonyms: Array.isArray(theme.synonyms) ? theme.synonyms.join(', ') : '',
        color: '',
        domainIds: theme.domains?.map((d: any) => d.id) ?? [],
      });
    } else if (activeType === 'tags') {
      const tag = entry as any;
      setFormState({ label: tag.label ?? '', description: '', synonyms: Array.isArray(tag.synonyms) ? tag.synonyms.join(', ') : '', color: tag.color ?? '', domainIds: [] });
    } else {
      const domain = entry as any;
      setFormState({ label: domain.label ?? '', description: '', synonyms: Array.isArray(domain.synonyms) ? domain.synonyms.join(', ') : '', color: '', domainIds: [] });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activeType === 'populations') {
      if (!selectedPopulationId) {
        setErrorMessage(t('populationForm.messages.populationRequired'));
        return;
      }
      const payload = {
        populationId: selectedPopulationId,
        locale,
        value: populationCharacteristic.trim(),
      };
      const parsed = selectedCharacteristic
        ? populationCharacteristicUpdateSchema.safeParse({
            ...payload,
            previousValue: selectedCharacteristic,
          })
        : populationCharacteristicCreateSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage(parsed.error.issues[0]?.message ?? t('messages.validationError'));
        return;
      }
      await populationSaveMutation.mutateAsync({
        method: selectedCharacteristic ? 'PUT' : 'POST',
        payload: parsed.data,
      });
      return;
    }

    const payload = {
      type: typeToApi[activeType as Exclude<TaxonomyType, 'populations'>],
      locale,
      value: formState.label.trim(),
      description: activeType === 'themes' ? formState.description.trim() || null : undefined,
      synonyms: activeType !== 'resourceTypes' ? formState.synonyms.trim() : undefined,
      color: activeType === 'tags' ? formState.color || null : undefined,
      domainIds: activeType === 'themes' ? formState.domainIds : undefined,
    };
    const parsed = taxonomyMutationSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? t('messages.validationError'));
      return;
    }
    await saveMutation.mutateAsync({ id: selectedId ?? undefined, payload: parsed.data });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(t('messages.deleteConfirm'));
    if (!confirmed) return;
    await deleteMutation.mutateAsync({
      type: typeToApi[activeType as Exclude<TaxonomyType, 'populations'>],
      id,
      locale,
    });
  };

  const handlePopulationSelect = (id: string) => {
    setSelectedPopulationId(id);
    setSelectedCharacteristic(null);
    setPopulationCharacteristic('');
  };

  const handleCharacteristicEdit = (value: string) => {
    setSelectedCharacteristic(value);
    setPopulationCharacteristic(value);
  };

  const handleCharacteristicDelete = async (value: string) => {
    const confirmed = window.confirm(t('populationForm.messages.deleteConfirm'));
    if (!confirmed || !selectedPopulationId) return;
    const parsed = populationCharacteristicDeleteSchema.safeParse({
      populationId: selectedPopulationId,
      locale,
      value,
    });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? t('messages.validationError'));
      return;
    }
    await populationDeleteMutation.mutateAsync(parsed.data);
  };

  // Helper pour rendre un item de la liste afin d'éviter la duplication de code
  const renderItem = (item: TaxonomyEntry) => (
    <div key={item.id} className={`${styles.listItem} ${selectedId === item.id ? styles.listItemActive : ''}`}>
      <div className={styles.itemMeta}>
        <p className={styles.itemLabel}>{item.label}</p>
        {'synonyms' in item && Array.isArray(item.synonyms) && item.synonyms.length > 0 && (
          <div className={styles.synonyms}>
            {item.synonyms.map(s => <span key={s} className={styles.synonym}>{s}</span>)}
          </div>
        )}
        {'color' in item && typeof item.color === 'string' && item.color && (
          <span className={`${styles.synonym} ${getColorClass(item.color)}`}>
            {item.color}
          </span>
        )}
      </div>
      <div className={styles.actions}>
        <button className={styles.actionButton} onClick={() => handleSelect(item.id)}>{t('actions.edit')}</button>
        <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>{t('actions.delete')}</button>
      </div>
    </div>
  );

  useEffect(() => {
    if (activeType !== 'populations') return;
    if (selectedPopulationId) return;
    if (populationItems.length === 0) return;
    setSelectedPopulationId(populationItems[0]?.id ?? null);
  }, [activeType, populationItems, selectedPopulationId]);

  return (
    <section className={styles.panel}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>{t('sidebar.title')}</p>
        <p className={styles.sidebarLead}>{t('sidebar.lead')}</p>
        {(Object.keys(typeDetails) as TaxonomyType[]).map((type) => (
          <button
            key={type}
            className={`${styles.typeButton} ${activeType === type ? styles.typeButtonActive : ''}`}
            onClick={() => setActiveType(type)}
          >
            <span className={styles.typeLabel}>
              <span className={styles.typeName}>{typeDetails[type].label}</span>
              <span className={styles.typeHint}>{typeDetails[type].hint}</span>
            </span>
            <span className={styles.count}>{typeCounts[type] ?? 0}</span>
          </button>
        ))}
      </aside>

      <div className={styles.main}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>{typeDetails[activeType].label}</h2>
          <p className={styles.headerLead}>{typeDetails[activeType].lead}</p>
        </div>

        {statusMessage && <div className={styles.statusBar}>{statusMessage}</div>}
        {errorMessage && <div className={`${styles.statusBar} ${styles.errorBar}`}>{errorMessage}</div>}

        <div className={styles.content}>
          <div className={styles.listCard}>
            {activeType === 'populations' && (
              <div className={styles.field}>
                <label htmlFor="population-select">{t('populationForm.fields.population')}</label>
                <select
                  id="population-select"
                  className={styles.select}
                  value={selectedPopulationId ?? ''}
                  onChange={(e) => handlePopulationSelect(e.target.value)}
                >
                  <option value="" disabled>
                    {t('populationForm.placeholders.population')}
                  </option>
                  {populationItems.map((population) => (
                    <option key={population.id} value={population.id}>
                      {population.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <input
              type="search"
              className={styles.input}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('list.searchPlaceholder', { type: typeDetails[activeType].label })}
            />
            
            <div className={styles.list}>
              {activeType === 'populations' ? (
                <>
                  {!selectedPopulation && (
                    <p className={styles.emptyListMessage}>
                      {t('populationForm.messages.selectPopulation')}
                    </p>
                  )}
                  {selectedPopulation && filteredCharacteristics.length === 0 && (
                    <p className={styles.emptyListMessage}>{t('list.noResults')}</p>
                  )}
                  {selectedPopulation && filteredCharacteristics.map((value) => (
                    <div key={value} className={styles.characteristicItem}>
                      <span className={styles.characteristicLabel}>{value}</span>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => handleCharacteristicEdit(value)}
                        >
                          {t('actions.edit')}
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleCharacteristicDelete(value)}
                        >
                          {t('actions.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : activeType === 'themes' ? (
                <>
                  {/* Afficher les groupes par domaine */}
                  {availableDomains.map((domain) => {
                    const groupItems = themesGroups.grouped[domain.id];
                    if (!groupItems || groupItems.length === 0) return null;

                    return (
                      <div key={domain.id} className={styles.groupSection}>
                        <h4 className={styles.groupTitle}>
                          {domain.label}
                        </h4>
                        {groupItems.map(item => renderItem(item))}
                      </div>
                    );
                  })}

                  {/* Afficher les éléments sans domaine */}
                  {themesGroups.noDomain.length > 0 && (
                    <div className={styles.ungroupedSection}>
                      <h4 className={styles.ungroupedTitle}>
                        {t('groups.ungrouped')}
                      </h4>
                      {themesGroups.noDomain.map(item => renderItem(item))}
                    </div>
                  )}
                  
                  {/* Message si vide */}
                  {Object.keys(themesGroups.grouped).length === 0 && themesGroups.noDomain.length === 0 && (
                     <p className={styles.emptyListMessage}>{t('list.noResults')}</p>
                  )}
                </>
              ) : (
                filteredItems.map(item => renderItem(item))
              )}
            </div>
          </div>

          <div className={styles.formCard}>
            <form className={styles.formGrid} onSubmit={handleSubmit}>
              {activeType === 'populations' ? (
                <>
                  <p className={styles.fieldHint}>{t('populationForm.hints.independentAudience')}</p>
                  <div className={styles.field}>
                    <label htmlFor="population-characteristic-input">
                      {t('populationForm.fields.characteristic')}
                    </label>
                    <input
                      id="population-characteristic-input"
                      className={styles.input}
                      value={populationCharacteristic}
                      onChange={(e) => setPopulationCharacteristic(e.target.value)}
                      placeholder={t('populationForm.placeholders.characteristic')}
                      required
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.submitButton} type="submit" disabled={populationSaveMutation.isPending}>
                      {selectedCharacteristic ? t('populationForm.actions.update') : t('populationForm.actions.create')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        setSelectedCharacteristic(null);
                        setPopulationCharacteristic('');
                      }}
                    >
                      {t('populationForm.actions.reset')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.field}>
                    <label htmlFor="label-input">{t('form.fields.label')}</label>
                    <input id="label-input" className={styles.input} value={formState.label} onChange={(e) => setFormState({ ...formState, label: e.target.value })} required />
                  </div>

                  {activeType === 'themes' && (
                    <>
                      <div className={styles.field}>
                        <label htmlFor="description-input">{t('form.fields.description')}</label>
                        <textarea id="description-input" className={styles.textarea} value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
                      </div>
                      <div className={styles.field}>
                        <label>{t('form.fields.domains')}</label>
                        <div className={styles.checkboxList}>
                          {availableDomains.map((domain) => (
                            <label key={domain.id} className={styles.checkboxItem}>
                              <input
                                type="checkbox"
                                checked={formState.domainIds.includes(domain.id)}
                                onChange={(e) => {
                                  const next = new Set(formState.domainIds);
                                  if (e.target.checked) next.add(domain.id); else next.delete(domain.id);
                                  setFormState({ ...formState, domainIds: Array.from(next) });
                                }}
                              />
                              <span>{domain.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {(activeType === 'themes' || activeType === 'domains' || activeType === 'tags') && (
                    <div className={styles.field}>
                      <label htmlFor="synonyms-input">{t('form.fields.synonyms')}</label>
                      <input id="synonyms-input" className={styles.input} value={formState.synonyms} onChange={(e) => setFormState({ ...formState, synonyms: e.target.value })} />
                    </div>
                  )}

                  {activeType === 'tags' && (
                    <div className={styles.field}>
                      <label>{t('form.fields.color')}</label>
                      <div className={styles.colorSwatches}>
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`${styles.colorChip} ${getColorClass(color)} ${formState.color === color ? styles.colorChipActive : ''}`}
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
                    <button type="button" className={styles.secondaryButton} onClick={resetForm}>{t('form.actions.reset')}</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
