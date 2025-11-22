'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
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

type MultiSelectCopy = {
  placeholder: string;
  dialogLabel: string;
  dialogTitle: string;
  dialogHelper: string;
  searchPlaceholder: string;
  searchAria: string;
  clear: string;
  emptySelection: string;
  emptyResults: string;
  remove: string;
  add: string;
};

type MultiSelectProps = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  copy: MultiSelectCopy;
  onChange: (values: string[]) => void;
};

type PopupPosition = { top: number; left: number; width: number } | null;

function MultiSelect({ id, label, description, placeholder, options, values, copy, onChange }: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>(null);
  const t = useTranslations('ManageTests.form.multiSelect');

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

  const optionLabelMap = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options],
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
            <span className="text-subtle">{placeholder ?? t('placeholder')}</span>
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
                {optionLabelMap.get(value) ?? value}
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
            aria-label={t('dialogLabel', { label })}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>{t('dialogTitle', { label })}</div>
              <p className="helper-text">{t('filterHelper')}</p>
            </div>

            <div className={styles.searchBar}>
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder ?? t('searchPlaceholder')}
                aria-label={t('filterAria', { label })}
              />
              {query ? (
                <Button variant="ghost" size="sm" type="button" onClick={() => setQuery('')}>
                  {t('clear')}
                </Button>
              ) : null}
            </div>

            <div className={styles.selectedBadges}>
              {selectedOptions.length === 0 ? (
                <p className="helper-text">{t('emptySelection')}</p>
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
                <p className={styles.emptyState}>{t('emptyResults')}</p>
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
                      <span className={styles.optionBadge}>{active ? t('remove') : t('add')}</span>
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

const formSchemaBase = testSchema
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

type FormValues = z.infer<typeof formSchemaBase>;

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
  isStandardized: true,
  publisher: null,
  priceRange: null,
  buyLink: null,
  notes: null,
  domains: [],
  tags: [],
  bibliography: [],
};

async function fetchTests(errorMessage: string) {
  const response = await fetch('/api/tests');

  if (!response.ok) {
    throw new Error('fetchTests');
  }

  const json = (await response.json()) as ApiResponse;
  const parsed = testsResponseSchema.parse({ tests: json.tests ?? [] });
  return parsed.tests;
}

async function fetchTaxonomy(errorMessage: string) {
  const response = await fetch('/api/tests/taxonomy');

  if (!response.ok) {
    throw new Error('fetchTaxonomy');
  }

  const json = await response.json();
  return taxonomyResponseSchema.parse(json);
}

async function createTest(payload: FormValues, fallbackMessage: string) {
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? 'createTest');
  }

  return (await response.json()) as ApiResponse;
}

async function updateTest(payload: FormValues, fallbackMessage: string) {
  const response = await fetch('/api/tests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? 'updateTest');
  }

  return (await response.json()) as ApiResponse;
}

function TestForm() {
  const t = useTranslations('TestsForm');
  const queryClient = useQueryClient();
  const form = useTranslations('ManageTests.form');
  const feedback = useTranslations('ManageTests.feedback');
  const { data: taxonomy } = useQuery({ queryKey: ['test-taxonomy'], queryFn: fetchTaxonomy });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: fetchTests });
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [newBibliography, setNewBibliography] = useState({ label: '', url: '' });
  const errorTranslationKeyByMessage: Record<string, string> = {
    fetchTests: 'errors.fetchTests',
    'Impossible de récupérer les tests': 'errors.fetchTests',
    'Unable to retrieve tests': 'errors.fetchTests',
    fetchTaxonomy: 'errors.fetchTaxonomy',
    'Impossible de charger les domaines et tags': 'errors.fetchTaxonomy',
    'Unable to load domains and tags': 'errors.fetchTaxonomy',
    createTest: 'errors.create',
    'Impossible de créer le test': 'errors.create',
    'Unable to create the test': 'errors.create',
    updateTest: 'errors.update',
    'Impossible de mettre à jour le test': 'errors.update',
    'Unable to update the test': 'errors.update',
  };

  const translateHandlerError = (message?: string | null) => {
    if (!message) return feedback('errors.generic');

    const normalizedMessage = message.trim();
    const translationKey = errorTranslationKeyByMessage[normalizedMessage];

    if (translationKey) {
      return feedback(translationKey);
    }

    return feedback('errors.genericWithReason', { reason: normalizedMessage });
  };

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

  const multiSelectBaseCopy = useMemo<Omit<MultiSelectCopy, 'dialogLabel' | 'dialogTitle' | 'searchAria'>>(
    () => ({
      placeholder: t('multiSelect.placeholder'),
      dialogHelper: t('multiSelect.dialogHelper'),
      searchPlaceholder: t('multiSelect.searchPlaceholder'),
      clear: t('multiSelect.clear'),
      emptySelection: t('multiSelect.emptySelection'),
      emptyResults: t('multiSelect.emptyResults'),
      remove: t('multiSelect.remove'),
      add: t('multiSelect.add'),
    }),
    [t],
  );

  const domainCopy = useMemo<MultiSelectCopy>(
    () => ({
      ...multiSelectBaseCopy,
      dialogLabel: t('multiSelect.dialogLabel', { label: t('sections.taxonomy.domainsLabel') }),
      dialogTitle: t('multiSelect.dialogTitle', { label: t('sections.taxonomy.domainsLabel') }),
      searchAria: t('multiSelect.searchAria', { label: t('sections.taxonomy.domainsLabel') }),
    }),
    [multiSelectBaseCopy, t],
  );

  const tagCopy = useMemo<MultiSelectCopy>(
    () => ({
      ...multiSelectBaseCopy,
      dialogLabel: t('multiSelect.dialogLabel', { label: t('sections.taxonomy.tagsLabel') }),
      dialogTitle: t('multiSelect.dialogTitle', { label: t('sections.taxonomy.tagsLabel') }),
      searchAria: t('multiSelect.searchAria', { label: t('sections.taxonomy.tagsLabel') }),
    }),
    [multiSelectBaseCopy, t],
  );

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
    mutationFn: (payload: FormValues) => createTest(payload, t('states.createError')),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
      reset(defaultValues);
      setSelectedTestId(null);
      setNewBibliography({ label: '', url: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormValues) => updateTest(payload, t('states.updateError')),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
    },
  });

  const [submitLabel, submitDisabled] = useMemo(() => {
    const pending = createMutation.isPending || updateMutation.isPending;
    const label = pending
      ? form('actions.pending')
      : selectedTestId
        ? form('actions.update')
        : form('actions.create');
    return [label, pending];
  }, [createMutation.isPending, form, selectedTestId, updateMutation.isPending]);

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
        <Label htmlFor="test-selector">{form('toolbar.sheetLabel')}</Label>
        <Select
          id="test-selector"
          value={selectedTestId ?? ''}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedTestId(event.target.value || null)}
          aria-label={t('toolbar.selectorAria')}
        >
          <option value="">{form('toolbar.newTest')}</option>
          {(tests ?? []).map((test) => (
            <option key={test.id} value={test.id}>
              {test.name}
            </option>
          ))}
        </Select>
        {selectedTestId ? <Badge variant="outline">{form('toolbar.editBadge')}</Badge> : <Badge>{form('toolbar.newBadge')}</Badge>}
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
          {form('toolbar.reset')}
        </Button>
        <Button type="submit" disabled={submitDisabled} aria-busy={submitDisabled}>
          {submitLabel}
        </Button>
      </div>
    </div>

    <Input
      id="name"
      className="notion-title-input"
      placeholder={form('fields.name.placeholder')}
      {...register('name')}
    />
    {errors.name && <p className="error-text">{errors.name.message}</p>}

    {/* 1. Résumé détaillé + 2. Bibliographie + Infos complémentaires */}
    <div className="content-grid">
      {/* Résumé détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>{form('sections.detailedSummary.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="property-value">
            <Label htmlFor="shortDescription">{form('fields.shortDescription.label')}</Label>
            <Textarea
              id="shortDescription"
              placeholder={form('fields.shortDescription.placeholder')}
              {...register('shortDescription', { setValueAs: (value) => (value === '' ? null : value) })}
            />
          </div>
          <Separator />
          <div className="property-value">
            <Label htmlFor="objective">{form('fields.objective.label')}</Label>
            <Textarea
              id="objective"
              placeholder={form('fields.objective.placeholder')}
              {...register('objective', { setValueAs: (value) => (value === '' ? null : value) })}
            />
          </div>
          <Separator />
          <div className="property-value">
            <Label htmlFor="notes">{form('fields.notes.label')}</Label>
            <Textarea
              id="notes"
              placeholder={form('fields.notes.placeholder')}
              {...register('notes', { setValueAs: (value) => (value === '' ? null : value) })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bibliographie (2ème bloc) */}
      <Card>
        <CardHeader>
          <CardTitle>{form('sections.bibliography.title')}</CardTitle>
          <p className="helper-text">{form('sections.bibliography.helper')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(currentBibliography ?? []).length === 0 && (
              <p className={`helper-text ${styles.helperTight}`}>
                {form('sections.bibliography.empty')}
              </p>
            )}

            {(currentBibliography ?? []).map((entry, index) => (
              <div key={`${entry.label}-${index}`} className={`property-value ${styles.bibliographyEntry}`}>
                <Label htmlFor={`bibliography-label-${index}`}>{form('bibliography.entryLabel')}</Label>
                <Input
                  id={`bibliography-label-${index}`}
                  value={entry.label}
                  onChange={(event) => updateBibliographyItem(index, 'label', event.target.value)}
                  placeholder={form('bibliography.entryPlaceholder')}
                />
                {errors.bibliography?.[index]?.label && (
                  <p className="error-text">{errors.bibliography?.[index]?.label?.message}</p>
                )}

                <Label htmlFor={`bibliography-url-${index}`}>{form('bibliography.linkLabel')}</Label>
                <div className="notion-toolbar__group">
                  <Input
                    id={`bibliography-url-${index}`}
                    type="url"
                    value={entry.url}
                    onChange={(event) => updateBibliographyItem(index, 'url', event.target.value)}
                    placeholder={form('bibliography.linkPlaceholder')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBibliographyItem(index)}
                  >
                    {form('bibliography.remove')}
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
            <Label htmlFor="bibliography-new-label">{form('bibliography.addTitle')}</Label>
            <Input
              id="bibliography-new-label"
              placeholder={form('bibliography.addPlaceholder')}
              value={newBibliography.label}
              onChange={(event) => setNewBibliography((prev) => ({ ...prev, label: event.target.value }))}
            />
            <div className="notion-toolbar__group">
              <Input
                id="bibliography-new-url"
                type="url"
                placeholder={form('bibliography.addUrlPlaceholder')}
                value={newBibliography.url}
                onChange={(event) => setNewBibliography((prev) => ({ ...prev, url: event.target.value }))}
              />
              <Button type="button" variant="outline" size="sm" onClick={addBibliographyItem}>
                {form('bibliography.addButton')}
              </Button>
            </div>
            <p className={`helper-text ${styles.helperTight}`}>
              {form('bibliography.addHelper')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informations complémentaires (3e carte dans la grid, mais avant Propriétés) */}
      <Card>
        <CardHeader>
          <CardTitle>{form('sections.additionalInfo.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="property-value">
            <Label htmlFor="population-secondary">{form('fields.populationDetailed.label')}</Label>
            <Input
              id="population-secondary"
              placeholder={form('fields.populationDetailed.placeholder')}
              value={populationValue ?? ''}
              onChange={(event) =>
                setValue('population', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
              }
            />
          </div>
          <Separator />
          <div className="property-value">
            <Label htmlFor="materials-secondary">{form('fields.materialsDetailed.label')}</Label>
            <Textarea
              id="materials-secondary"
              placeholder={form('fields.materialsDetailed.placeholder')}
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
    <CardTitle>{form('sections.properties.title')}</CardTitle>
    <p className="helper-text">{form('sections.properties.helper')}</p>
  </CardHeader>

  <CardContent className={styles.propertySections}>

    {/* --- Ciblage & durée --- */}
    <div className={styles.sectionBlock}>
      <p className={styles.sectionTitle}>{form('sections.properties.targetingTitle')}</p>
      <div className="property-grid">

        {/* Âge (mois) */}
        <div className="property-row">
          <div className="property-label">{form('fields.age.label')}</div>
          <div className="property-value">
            <div className={styles.ageGrid}>
              <Input
                id="ageMinMonths"
                type="number"
                placeholder={form('fields.age.minPlaceholder')}
                {...register('ageMinMonths', {
                  setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                })}
              />
              <Input
                id="ageMaxMonths"
                type="number"
                placeholder={form('fields.age.maxPlaceholder')}
                {...register('ageMaxMonths', {
                  setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                })}
              />
            </div>

            {(errors.ageMinMonths || errors.ageMaxMonths) && (
              <p className="error-text">
                {errors.ageMinMonths?.message || errors.ageMaxMonths?.message}
              </p>
            )}
          </div>
        </div>

        {/* Durée */}
        <div className="property-row">
          <div className="property-label">{form('fields.duration.label')}</div>
          <div className="property-value">
            <Input
              id="durationMinutes"
              type="number"
              placeholder={form('fields.duration.placeholder')}
              {...register('durationMinutes', {
                setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
              })}
            />
            {errors.durationMinutes && (
              <p className="error-text">{errors.durationMinutes.message}</p>
            )}
            <p className="helper-text">{form('fields.duration.helper')}</p>
          </div>
        </div>

        {/* Population */}
        <div className="property-row">
          <div className="property-label">{form('fields.population.label')}</div>
          <div className="property-value">
            <Input
              id="population"
              placeholder={form('fields.population.placeholder')}
              {...register('population', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
          </div>
        </div>

      </div>
    </div>

    {/* --- Édition & accès --- */}
    <div className={styles.sectionBlock}>
      <p className={styles.sectionTitle}>{form('sections.properties.publishingTitle')}</p>
      <div className="property-grid">

        {/* Éditeur */}
        <div className="property-row">
          <div className="property-label">{form('fields.publisher.label')}</div>
          <div className="property-value">
            <Input
              id="publisher"
              placeholder={form('fields.publisher.placeholder')}
              {...register('publisher', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
            <Input
              id="priceRange"
              placeholder={form('fields.priceRange.placeholder')}
              {...register('priceRange', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
          </div>
        </div>

        {/* Achat */}
        <div className="property-row">
          <div className="property-label">{form('fields.purchase.label')}</div>
          <div className="property-value">
            <Input
              id="buyLink"
              placeholder={form('fields.buyLink.placeholder')}
              {...register('buyLink', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
            {errors.buyLink && (
              <p className="error-text">{errors.buyLink.message}</p>
            )}
            <Input
              id="materials"
              placeholder={form('fields.materials.placeholder')}
              {...register('materials', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
          </div>
        </div>

        {/* Standardisation */}
        <div className="property-row">
          <div className="property-label">{form('fields.standardization.label')}</div>
          <div className="property-value">
            <label
              className={cn(
                'pill-toggle',
                watch('isStandardized') && 'is-active'
              )}
            >
              <input
                type="checkbox"
                {...register('isStandardized')}
                className={styles.hiddenInput}
                aria-label={t('fields.isStandardized.aria')}
              />
              {watch('isStandardized')
                ? form('fields.standardization.standardized')
                : form('fields.standardization.nonStandardized')}
            </label>
            <p className="helper-text">{form('fields.standardization.helper')}</p>
          </div>
        </div>

      </div>
    </div>

    {/* --- Taxonomie --- */}
    <div className={styles.sectionBlock}>
      <p className={styles.sectionTitle}>{form('sections.taxonomy.title')}</p>
      <div className="property-grid">

        {/* Domaines */}
        <div className="property-row">
          <div className="property-label">{form('fields.domains.label')}</div>
          <div className="property-value">
            <MultiSelect
              id="domains"
              label={form('fields.domains.label')}
              description={form('fields.domains.description')}
              placeholder={form('fields.domains.placeholder')}
              options={(taxonomy?.domains ?? []).map((domain) => ({
                label: domain.label,
                value: domain.label,
              }))}
              values={currentDomains ?? []}
              copy={domainCopy}
              onChange={(values) =>
                setValue('domains', values, { shouldDirty: true })
              }
            />
          </div>
        </div>

        {/* Tags */}
        <div className="property-row">
          <div className="property-label">{form('fields.tags.label')}</div>
          <div className="property-value">
            <MultiSelect
              id="tags"
              label={form('fields.tags.label')}
              description={form('fields.tags.description')}
              placeholder={form('fields.tags.placeholder')}
              options={(taxonomy?.tags ?? []).map((tag) => ({
                label: tag.label,
                value: tag.label,
              }))}
              values={currentTags ?? []}
              copy={tagCopy}
              onChange={(values) =>
                setValue('tags', values, { shouldDirty: true })
              }
            />
          </div>
        </div>

      </div>
    </div>

  </CardContent>
</Card>

    {(createMutation.isError || updateMutation.isError) && (
      <p className={`error-text ${styles.flushError}`}>
        {translateHandlerError(createMutation.error?.message ?? updateMutation.error?.message ?? null)}
      </p>
    )}

    {(createMutation.isSuccess || updateMutation.isSuccess) && !createMutation.isError && !updateMutation.isError && (
      <p className={styles.successMessage}>
        {feedback('success.saved')}
      </p>
    )}
  </form>
);
}

export default TestForm;
