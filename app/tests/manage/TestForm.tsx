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

type PopupPosition = { top: number; left: number; width: number } | null;

function MultiSelect({ id, label, description, placeholder, options, values, onChange }: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );

  function toggleValue(value: string) {
    const hasValue = values.includes(value);
    const next = hasValue ? values.filter((item) => item !== value) : [...values, value];
    onChange(next);
  }

  function closePopup() {
    setIsOpen(false);
  }

  function updatePopupPosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportWidth = window.innerWidth;

    const popupWidth = Math.min(Math.max(rect.width, 320), Math.min(520, viewportWidth - 24));
    const maxLeft = viewportWidth - popupWidth - 12;
    const left = Math.min(Math.max(12, rect.left), Math.max(12, maxLeft));

    const top = Math.min(rect.bottom + 8, window.innerHeight - 16);

    setPopupPosition({
      top,
      left,
      width: popupWidth,
    });
  }

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    updatePopupPosition();
    const handleResize = () => updatePopupPosition();
    const handleScroll = () => updatePopupPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (overlayRef.current?.contains(target)) return;
      closePopup();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePopup();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

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
        aria-haspopup="dialog"
        ref={triggerRef}
      >
        <div className={styles.multiSelectTokens}>
          {values.length === 0 ? (
            <span className="text-subtle">{placeholder ?? 'Sélectionner'}</span>
          ) : (
            values.map((value) => (
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
            ))
          )}
        </div>
        <span className={styles.chevron} aria-hidden>
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen ? (
        <div className={styles.popupLayer}>
          <div className={styles.popupBackdrop} aria-hidden onClick={closePopup} />
          <div
            className={styles.popup}
            ref={overlayRef}
            style={popupPosition ? { top: popupPosition.top, left: popupPosition.left, width: popupPosition.width } : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={`Sélectionner ${label}`}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>Sélectionner {label.toLowerCase()}</div>
              <p className="helper-text">Tapez pour filtrer, cliquez pour ajouter ou retirer.</p>
            </div>

            <div className={styles.searchBar}>
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder ?? 'Rechercher…'}
                aria-label={`Filtrer ${label}`}
              />
              {query ? (
                <Button variant="ghost" size="sm" type="button" onClick={() => setQuery('')}>
                  Effacer
                </Button>
              ) : null}
            </div>

            <div className={styles.selectedBadges}>
              {selectedOptions.length === 0 ? (
                <p className="helper-text">Aucun élément sélectionné pour le moment.</p>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    className={styles.selectedToken}
                    onClick={() => toggleValue(option.value)}
                  >
                    {option.label}
                    <span aria-hidden>×</span>
                  </Badge>
                ))
              )}
            </div>

            <div className={styles.optionsList}>
              {filtered.length === 0 ? (
                <p className={styles.emptyState}>Aucun résultat</p>
              ) : (
                filtered.map((option) => {
                  const active = values.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={cn(styles.optionItem, active && styles.optionItemActive)}
                      onClick={() => toggleValue(option.value)}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionBadge}>{active ? 'Supprimer' : 'Ajouter'}</span>
                    </button>
                  );
                })
              )}
            </div>
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

    {/* 1. Résumé détaillé + 2. Bibliographie + Infos complémentaires */}
    <div className="content-grid">
      {/* Résumé détaillé */}
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

      {/* Bibliographie (2ème bloc) */}
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

      {/* Informations complémentaires (3e carte dans la grid, mais avant Propriétés) */}
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
    </div>

    {/* 3. Propriétés (déplacé après le contenu détaillé + biblio) */}
    <Card className="property-panel">
      <CardHeader>
        <CardTitle>Propriétés</CardTitle>
        <p className="helper-text">Pensez aux propriétés clés comme dans une fiche Notion.</p>
      </CardHeader>
      <CardContent className={styles.propertySections}>
        {/* ... tout ton bloc Ciblage & durée / Edition & accès / Taxonomie inchangé ... */}
        {/* (reprends ici tel quel ton CardContent original) */}
      </CardContent>
    </Card>

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
