'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { testsResponseSchema, testSchema, taxonomyResponseSchema, type TestDto } from '@/lib/validation/tests';
import styles from './test-form.module.css';

type MultiSelectOption = { label: string; value: string };

type MultiSelectProps = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
};

function MultiSelect({ id, label, description, placeholder, options, values, onChange }: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  function toggleValue(value: string) {
    const hasValue = values.includes(value);
    const next = hasValue ? values.filter((item) => item !== value) : [...values, value];
    onChange(next);
  }

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.multiSelectWrapper} ref={wrapperRef}>
      <div className={styles.multiSelectHeader}>
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="helper-text">{description}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        className={cn(styles.multiSelectControl, isOpen && styles.multiSelectOpen)}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className={styles.multiSelectTokens}>
          {values.length === 0 && <span className="text-subtle">{placeholder ?? 'Sélectionner'}</span>}
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className={styles.token}
              onClick={(event) => {
                event.stopPropagation();
                toggleValue(value);
              }}
            >
              {value}
              <span aria-hidden>×</span>
            </Badge>
          ))}
        </div>
        <span className={styles.chevron} aria-hidden>
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen ? (
        <div className={styles.multiSelectDropdown} role="listbox" aria-label={label}>
          <div className={styles.multiSelectSearch}>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder ?? 'Rechercher…'}
              aria-label={`Filtrer ${label}`}
            />
          </div>

          <div className={styles.optionsList}>
            {filtered.length === 0 ? (
              <p className={styles.emptyState}>Aucun résultat</p>
            ) : (
              filtered.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={cn(styles.optionItem, values.includes(option.value) && styles.optionItemActive)}
                  onClick={() => toggleValue(option.value)}
                >
                  <span>{option.label}</span>
                  {values.includes(option.value) ? <Badge variant="outline">Sélectionné</Badge> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const formSchema = testSchema
  .omit({ id: true, slug: true, createdAt: true, updatedAt: true })
  .extend({
    id: z.string().uuid().optional(),
    shortDescription: z.string().nullable().optional(),
    objective: z.string().nullable().optional(),
    population: z.string().nullable().optional(),
    materials: z.string().nullable().optional(),
    publisher: z.string().nullable().optional(),
    priceRange: z.string().nullable().optional(),
    buyLink: z.string().url().nullable().optional(),
    notes: z.string().nullable().optional(),
    ageMinMonths: z.number().int().nullable().optional(),
    ageMaxMonths: z.number().int().nullable().optional(),
  durationMinutes: z.number().int().nullable().optional(),
  bibliography: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .default([])
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ApiResponse = {
  test?: TestDto;
  tests?: TestDto[];
  error?: string;
};

const defaultValues: FormValues = {
  id: undefined,
  name: '',
  shortDescription: null,
  objective: null,
  ageMinMonths: null,
  ageMaxMonths: null,
  population: null,
  durationMinutes: null,
  materials: null,
  isStandardized: false,
  publisher: null,
  priceRange: null,
  buyLink: null,
  notes: null,
  domains: [],
  tags: [],
  bibliography: [],
};

async function fetchTests() {
  const response = await fetch('/api/tests');

  if (!response.ok) {
    throw new Error('Impossible de récupérer les tests');
  }

  const json = (await response.json()) as ApiResponse;
  const parsed = testsResponseSchema.parse({ tests: json.tests ?? [] });
  return parsed.tests;
}

async function fetchTaxonomy() {
  const response = await fetch('/api/tests/taxonomy');

  if (!response.ok) {
    throw new Error('Impossible de charger les domaines et tags');
  }

  const json = await response.json();
  return taxonomyResponseSchema.parse(json);
}

async function createTest(payload: FormValues) {
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? "Impossible de créer le test");
  }

  return (await response.json()) as ApiResponse;
}

async function updateTest(payload: FormValues) {
  const response = await fetch('/api/tests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? "Impossible de mettre à jour le test");
  }

  return (await response.json()) as ApiResponse;
}

function TestForm() {
  const queryClient = useQueryClient();
  const { data: taxonomy } = useQuery({ queryKey: ['test-taxonomy'], queryFn: fetchTaxonomy });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: fetchTests });
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [newBibliography, setNewBibliography] = useState({ label: '', url: '' });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const currentDomains = watch('domains');
  const currentTags = watch('tags');
  const currentBibliography = watch('bibliography');
  const populationValue = watch('population');
  const materialsValue = watch('materials');

  useEffect(() => {
    if (!selectedTestId) {
      reset(defaultValues);
      setNewBibliography({ label: '', url: '' });
      return;
    }

    const test = (tests ?? []).find((item) => item.id === selectedTestId);

    if (test) {
      reset({
        id: test.id,
        name: test.name,
        shortDescription: test.shortDescription,
        objective: test.objective,
        ageMinMonths: test.ageMinMonths,
        ageMaxMonths: test.ageMaxMonths,
        population: test.population,
        durationMinutes: test.durationMinutes,
        materials: test.materials,
        isStandardized: test.isStandardized,
        publisher: test.publisher,
        priceRange: test.priceRange,
        buyLink: test.buyLink,
        notes: test.notes,
        domains: test.domains,
        tags: test.tags,
        bibliography: test.bibliography ?? [],
      });
      setNewBibliography({ label: '', url: '' });
    }
  }, [reset, selectedTestId, tests]);

  const createMutation = useMutation({
    mutationFn: createTest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
      reset(defaultValues);
      setSelectedTestId(null);
      setNewBibliography({ label: '', url: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
    },
  });

  const [submitLabel, submitDisabled] = useMemo(() => {
    const pending = createMutation.isPending || updateMutation.isPending;
    const label = pending ? 'Enregistrement…' : selectedTestId ? 'Mettre à jour' : 'Créer le test';
    return [label, pending];
  }, [createMutation.isPending, updateMutation.isPending, selectedTestId]);

  const onSubmit = handleSubmit((values) => {
    const payload: FormValues = {
      ...values,
      name: values.name.trim(),
      shortDescription: values.shortDescription?.trim() || null,
      objective: values.objective?.trim() || null,
      population: values.population?.trim() || null,
      materials: values.materials?.trim() || null,
      publisher: values.publisher?.trim() || null,
      priceRange: values.priceRange?.trim() || null,
      buyLink: values.buyLink?.trim() || null,
      notes: values.notes?.trim() || null,
      ageMinMonths: values.ageMinMonths ?? null,
      ageMaxMonths: values.ageMaxMonths ?? null,
      durationMinutes: values.durationMinutes ?? null,
      domains: Array.from(new Set((values.domains ?? []).map((domain) => domain.trim()).filter(Boolean))),
      tags: Array.from(new Set((values.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
      bibliography: (values.bibliography ?? [])
        .map((entry) => ({
          label: entry.label.trim(),
          url: entry.url.trim(),
        }))
        .filter((entry) => entry.label && entry.url),
    };

    if (payload.id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  });

  function updateBibliographyItem(
    index: number,
    field: 'label' | 'url',
    value: string,
  ) {
    const entries = [...(currentBibliography ?? [])];
    const next = entries.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry,
    );
    setValue('bibliography', next, { shouldDirty: true });
  }

  function removeBibliographyItem(index: number) {
    const entries = [...(currentBibliography ?? [])];
    entries.splice(index, 1);
    setValue('bibliography', entries, { shouldDirty: true });
  }

  function addBibliographyItem() {
    const label = newBibliography.label.trim();
    const url = newBibliography.url.trim();

    if (!label || !url) {
      return;
    }

    const entries = [...(currentBibliography ?? []), { label, url }];
    setValue('bibliography', entries, { shouldDirty: true });
    setNewBibliography({ label: '', url: '' });
  }

  return (
    <form className="notion-form" onSubmit={(event) => void onSubmit(event)}>
      <div className="notion-toolbar">
        <div className="notion-toolbar__group">
          <Label htmlFor="test-selector">Fiche</Label>
          <Select
            id="test-selector"
            value={selectedTestId ?? ''}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedTestId(event.target.value || null)}
          >
            <option value="">Nouveau test</option>
            {(tests ?? []).map((test) => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </Select>
          {selectedTestId ? <Badge variant="outline">Mode édition</Badge> : <Badge>Nouvelle fiche</Badge>}
        </div>

        <div className="notion-toolbar__group">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset(defaultValues);
              setSelectedTestId(null);
              setNewBibliography({ label: '', url: '' });
            }}
          >
            Réinitialiser
          </Button>
          <Button type="submit" disabled={submitDisabled} aria-busy={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <Input
        id="name"
        className="notion-title-input"
        placeholder="Nom du test (ex : Évaluation du langage)"
        {...register('name')}
      />
      {errors.name && <p className="error-text">{errors.name.message}</p>}

      <Card className="property-panel">
        <CardHeader>
          <CardTitle>Propriétés</CardTitle>
          <p className="helper-text">Pensez aux propriétés clés comme dans une fiche Notion.</p>
        </CardHeader>
        <CardContent className={styles.propertySections}>
          <div className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Ciblage & durée</p>
            <div className="property-grid">
              <div className="property-row">
                <div className="property-label">Âge (mois)</div>
                <div className="property-value">
                  <div className={styles.ageGrid}>
                    <Input
                      id="ageMinMonths"
                      type="number"
                      placeholder="36"
                      {...register('ageMinMonths', {
                        setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                      })}
                    />
                    <Input
                      id="ageMaxMonths"
                      type="number"
                      placeholder="120"
                      {...register('ageMaxMonths', {
                        setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                      })}
                    />
                  </div>
                  {(errors.ageMinMonths || errors.ageMaxMonths) && (
                    <p className="error-text">{errors.ageMinMonths?.message || errors.ageMaxMonths?.message}</p>
                  )}
                </div>
              </div>

              <div className="property-row">
                <div className="property-label">Durée</div>
                <div className="property-value">
                  <Input
                    id="durationMinutes"
                    type="number"
                    placeholder="45"
                    {...register('durationMinutes', {
                      setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                    })}
                  />
                  {errors.durationMinutes && <p className="error-text">{errors.durationMinutes.message}</p>}
                  <p className="helper-text">Temps moyen estimé en minutes.</p>
                </div>
              </div>

              <div className="property-row">
                <div className="property-label">Population</div>
                <div className="property-value">
                  <Input
                    id="population"
                    placeholder="Enfants, adolescents, adultes…"
                    {...register('population', { setValueAs: (value) => (value === '' ? null : value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Édition & accès</p>
            <div className="property-grid">
              <div className="property-row">
                <div className="property-label">Éditeur</div>
                <div className="property-value">
                  <Input
                    id="publisher"
                    placeholder="Maison d'édition"
                    {...register('publisher', { setValueAs: (value) => (value === '' ? null : value) })}
                  />
                  <Input
                    id="priceRange"
                    placeholder="Fourchette de prix"
                    {...register('priceRange', { setValueAs: (value) => (value === '' ? null : value) })}
                  />
                </div>
              </div>

              <div className="property-row">
                <div className="property-label">Achat</div>
                <div className="property-value">
                  <Input
                    id="buyLink"
                    placeholder="Lien d'achat (URL)"
                    {...register('buyLink', { setValueAs: (value) => (value === '' ? null : value) })}
                  />
                  {errors.buyLink && <p className="error-text">{errors.buyLink.message}</p>}
                  <Input
                    id="materials"
                    placeholder="Matériel requis"
                    {...register('materials', { setValueAs: (value) => (value === '' ? null : value) })}
                  />
                </div>
              </div>

              <div className="property-row">
                <div className="property-label">Standardisation</div>
                <div className="property-value">
                  <label className={cn('pill-toggle', watch('isStandardized') && 'is-active')}>
                    <input type="checkbox" {...register('isStandardized')} className={styles.hiddenInput} />
                    {watch('isStandardized') ? 'Standardisé' : 'Non standardisé'}
                  </label>
                  <p className="helper-text">Basculer selon la nature du protocole.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Taxonomie</p>
            <div className="property-grid">
              <div className="property-row">
                <div className="property-label">Domaines</div>
                <div className="property-value">
                  <MultiSelect
                    id="domains"
                    label="Domaines"
                    description="Affinez la fiche en ajoutant un ou plusieurs domaines."
                    placeholder="Rechercher un domaine"
                    options={(taxonomy?.domains ?? []).map((domain) => ({
                      label: domain.label,
                      value: domain.label,
                    }))}
                    values={currentDomains ?? []}
                    onChange={(values) => setValue('domains', values, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="property-row">
                <div className="property-label">Tags</div>
                <div className="property-value">
                  <MultiSelect
                    id="tags"
                    label="Tags"
                    description="Ajoutez des mots-clés pour faciliter la recherche."
                    placeholder="Rechercher un tag"
                    options={(taxonomy?.tags ?? []).map((tag) => ({
                      label: tag.label,
                      value: tag.label,
                    }))}
                    values={currentTags ?? []}
                    onChange={(values) => setValue('tags', values, { shouldDirty: true })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="content-grid">
        <Card>
          <CardHeader>
            <CardTitle>Résumé détaillé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="property-value">
              <Label htmlFor="shortDescription">Description longue</Label>
              <Textarea
                id="shortDescription"
                placeholder="Présentez l'outil et ce qui le rend unique."
                {...register('shortDescription', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
            <Separator />
            <div className="property-value">
              <Label htmlFor="objective">Objectif</Label>
              <Textarea
                id="objective"
                placeholder="Que mesure ce test ? Dans quel contexte l'utiliser ?"
                {...register('objective', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
            <Separator />
            <div className="property-value">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                placeholder="Observations internes ou liens vers des ressources connexes."
                {...register('notes', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="property-value">
              <Label htmlFor="population-secondary">Public cible</Label>
              <Input
                id="population-secondary"
                placeholder="Compléter le public si besoin"
                value={populationValue ?? ''}
                onChange={(event) =>
                  setValue('population', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
                }
              />
            </div>
            <Separator />
            <div className="property-value">
              <Label htmlFor="materials-secondary">Matériel détaillé</Label>
              <Textarea
                id="materials-secondary"
                placeholder="Listez le matériel précis, les grilles ou supports nécessaires."
                value={materialsValue ?? ''}
                onChange={(event) =>
                  setValue('materials', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bibliographie</CardTitle>
            <p className="helper-text">Ajoutez des liens vers des articles, vidéos ou références utiles.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(currentBibliography ?? []).length === 0 && (
                <p className={`helper-text ${styles.helperTight}`}>
                  Aucun lien pour le moment. Ajoutez votre première référence ci-dessous.
                </p>
              )}

              {(currentBibliography ?? []).map((entry, index) => (
                <div key={`${entry.label}-${index}`} className={`property-value ${styles.bibliographyEntry}`}>
                  <Label htmlFor={`bibliography-label-${index}`}>Titre ou source</Label>
                  <Input
                    id={`bibliography-label-${index}`}
                    value={entry.label}
                    onChange={(event) => updateBibliographyItem(index, 'label', event.target.value)}
                    placeholder="Article, vidéo, ouvrage…"
                  />
                  {errors.bibliography?.[index]?.label && (
                    <p className="error-text">{errors.bibliography?.[index]?.label?.message}</p>
                  )}

                  <Label htmlFor={`bibliography-url-${index}`}>Lien</Label>
                  <div className="notion-toolbar__group">
                    <Input
                      id={`bibliography-url-${index}`}
                      type="url"
                      value={entry.url}
                      onChange={(event) => updateBibliographyItem(index, 'url', event.target.value)}
                      placeholder="https://example.com/ressource"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBibliographyItem(index)}
                    >
                      Supprimer
                    </Button>
                  </div>
                  {errors.bibliography?.[index]?.url && (
                    <p className="error-text">{errors.bibliography?.[index]?.url?.message}</p>
                  )}
                  <Separator />
                </div>
              ))}
            </div>

            <div className={`property-value ${styles.bibliographyCreate}`}>
              <Label htmlFor="bibliography-new-label">Ajouter une référence</Label>
              <Input
                id="bibliography-new-label"
                placeholder="Titre de la ressource"
                value={newBibliography.label}
                onChange={(event) => setNewBibliography((prev) => ({ ...prev, label: event.target.value }))}
              />
              <div className="notion-toolbar__group">
                <Input
                  id="bibliography-new-url"
                  type="url"
                  placeholder="https://exemple.com/ressource"
                  value={newBibliography.url}
                  onChange={(event) => setNewBibliography((prev) => ({ ...prev, url: event.target.value }))}
                />
                <Button type="button" variant="outline" size="sm" onClick={addBibliographyItem}>
                  Ajouter
                </Button>
              </div>
              <p className={`helper-text ${styles.helperTight}`}>
                Indiquez un titre court et une URL valide. Les liens seront enregistrés avec le test.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(createMutation.isError || updateMutation.isError) && (
        <p className={`error-text ${styles.flushError}`}>
          {createMutation.error?.message || updateMutation.error?.message || 'Une erreur est survenue.'}
        </p>
      )}

      {(createMutation.isSuccess || updateMutation.isSuccess) && !createMutation.isError && !updateMutation.isError && (
        <p className={styles.successMessage}>
          Le test et ses relations ont été enregistrés.
        </p>
      )}
    </form>
  );
}

export default TestForm;
