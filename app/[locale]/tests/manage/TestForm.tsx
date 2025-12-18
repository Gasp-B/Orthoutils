'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { type Locale } from '@/i18n/routing';
import { testsResponseSchema, testSchema, type TestDto, type TaxonomyResponse } from '@/lib/validation/tests';
// Import du fichier CSS module
import styles from './test-form.module.css';

type TestFormProps = {
  locale: Locale;
};

// --- Schéma Zod ---
const optionalNullableInt = z.preprocess(
  (value) => {
    if (typeof value === 'number' && Number.isNaN(value)) {
      return null;
    }
    return value;
  },
  z.number().int().nullable().optional(),
);

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
    ageMinMonths: optionalNullableInt,
    ageMaxMonths: optionalNullableInt,
    durationMinutes: optionalNullableInt,
    bibliography: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).default([]).optional(),
  });

type FormValues = z.infer<typeof formSchemaBase>;
type ApiResponse = { test?: TestDto; tests?: TestDto[]; error?: string };
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
  pathologies: [],
  domains: [],
  tags: [],
  bibliography: [],
};

// --- Fonctions API (Fetchers) ---
async function fetchTests(locale: Locale) {
  const response = await fetch(`/api/tests?locale=${locale}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Impossible de récupérer les tests');
  const json = (await response.json()) as ApiResponse;
  return testsResponseSchema.parse({ tests: json.tests ?? [] }).tests;
}

async function fetchTaxonomy(locale: Locale) {
  const response = await fetch(`/api/tests/taxonomy?locale=${locale}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Impossible de récupérer la taxonomie');
  return (await response.json()) as TaxonomyResponse;
}

async function saveTest(payload: FormValues, locale: Locale, method: 'POST' | 'PATCH') {
  const response = await fetch('/api/tests', {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, locale }),
  });

  const json = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    const error = new Error(json.error || 'saveError');
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return json as ApiResponse;
}

// --- Composant Toast Local ---
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-2">
        <span className="text-xl">✓</span>
        <p className="font-semibold text-sm">{message}</p>
      </div>
    </div>
  );
}

// --- Composant Principal ---
function TestForm({ locale }: TestFormProps) {
  const formT = useTranslations('ManageTests.form');
  const feedbackT = useTranslations('ManageTests.feedback');
  const multiSelectT = useTranslations('ManageTests.form.multiSelect');

  const queryClient = useQueryClient();

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [newBibliography, setNewBibliography] = useState({ label: '', url: '' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: tests } = useQuery({ 
    queryKey: ['tests', locale], 
    queryFn: () => fetchTests(locale) 
  });
  
  const { data: taxonomy } = useQuery({ 
    queryKey: ['test-taxonomy', locale], 
    queryFn: () => fetchTaxonomy(locale) 
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchemaBase),
    defaultValues,
  });

  const currentDomains = watch('domains') ?? [];
  const currentTags = watch('tags') ?? [];
  const currentPathologies = watch('pathologies') ?? [];
  const currentBibliography = watch('bibliography');

  // Chargement des données lors de la sélection d'un test
  useEffect(() => {
    if (!selectedTestId) {
      reset(defaultValues);
      return;
    }
    const test = tests?.find((t) => t.id === selectedTestId);
    if (test) {
      reset({
        ...test,
        bibliography: test.bibliography ?? [],
        pathologies: test.pathologies ?? [],
        domains: test.domains ?? [],
        tags: test.tags ?? [],
      });
    }
  }, [selectedTestId, tests, reset]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => 
      saveTest(payload, locale, payload.id ? 'PATCH' : 'POST'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests', locale] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy', locale] });
      setToastMsg(feedbackT('success.saved'));
      if (!selectedTestId) reset(defaultValues);
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      name: values.name.trim(),
      bibliography: values.bibliography?.filter(b => b.label && b.url) ?? [],
      domains: values.domains ?? [],
      tags: values.tags ?? [],
      pathologies: values.pathologies ?? [],
    };
    mutation.mutate(payload);
  };

  const addBibliographyItem = () => {
    if (!newBibliography.label || !newBibliography.url) return;
    setValue('bibliography', [...(currentBibliography || []), newBibliography], { shouldDirty: true });
    setNewBibliography({ label: '', url: '' });
  };

  const removeBibliographyItem = (index: number) => {
    const next = [...(currentBibliography || [])];
    next.splice(index, 1);
    setValue('bibliography', next, { shouldDirty: true });
  };

  const commonMultiSelectTrans = {
    add: multiSelectT('add'),
    remove: multiSelectT('remove'),
    clear: multiSelectT('clear'),
    close: multiSelectT('close'),
    emptySelection: multiSelectT('emptySelection'),
    emptyResults: multiSelectT('emptyResults'),
    loading: multiSelectT('loading'),
    searchPlaceholder: multiSelectT('searchPlaceholder'),
    dialogTitle: multiSelectT('dialogTitle', { label: '' }),
    dialogHelper: multiSelectT('filterHelper'),
  };

  return (
    <form className="notion-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      <div className="notion-toolbar sticky top-4 z-40 shadow-sm">
        <div className="notion-toolbar__group flex-1 max-w-md">
          <div className="flex flex-col gap-1 w-full">
            <Label htmlFor="test-selector" className="text-xs uppercase tracking-wider text-slate-500">
              {formT('toolbar.sheetLabel')}
            </Label>
              <Select
                id="test-selector"
                value={selectedTestId ?? ''}
                onChange={(e) => setSelectedTestId(e.currentTarget.value || null)}
                className="font-semibold bg-white/50"
              >
              <option value="">✨ {formT('toolbar.newTest')}</option>
              {tests?.map((test) => (
                <option key={test.id} value={test.id}>
                  📝 {test.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="notion-toolbar__group">
          <Button type="button" variant="ghost" onClick={() => { setSelectedTestId(null); reset(defaultValues); }}>
            {formT('toolbar.reset')}
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="min-w-[140px]">
            {mutation.isPending ? formT('actions.pending') : (selectedTestId ? formT('actions.update') : formT('actions.create'))}
          </Button>
        </div>
      </div>

      {mutation.isError && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          <strong>{feedbackT('errors.title')} </strong>
          {(() => {
            const typedError = mutation.error as Error & { status?: number };
            const isUnauthorized =
              typedError?.message === 'Unauthorized' || typedError?.status === 401;

            if (isUnauthorized) {
              return feedbackT('errors.unauthorized');
            }

            const reason =
              typedError?.message && typedError.message !== 'saveError'
                ? typedError.message
                : '';

            return reason
              ? feedbackT('errors.genericWithReason', { reason })
              : feedbackT('errors.generic');
          })()}
        </div>
      )}

      <Input
        id="name"
        className="notion-title-input mt-4"
        placeholder={formT('fields.name.placeholder')}
        {...register('name')}
      />
      {errors.name && <p className="text-red-500 text-sm ml-2">{errors.name.message}</p>}

      <div className="content-grid">
        {/* COLONNE GAUCHE */}
        <div className={styles.columnStack}>
          <Card>
            <CardHeader><CardTitle>{formT('sections.detailedSummary.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="property-value">
                <Label>{formT('fields.shortDescription.label')}</Label>
                <Textarea {...register('shortDescription')} placeholder={formT('fields.shortDescription.placeholder')} />
              </div>
              <Separator />
              <div className="property-value">
                <Label>{formT('fields.objective.label')}</Label>
                <Textarea {...register('objective')} placeholder={formT('fields.objective.placeholder')} />
              </div>
              <Separator />
              <div className="property-value">
                <Label>{formT('fields.notes.label')}</Label>
                <Textarea {...register('notes')} placeholder={formT('fields.notes.placeholder')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{formT('sections.bibliography.title')}</CardTitle>
              <p className="helper-text">{formT('sections.bibliography.helper')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentBibliography?.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                  <div className="flex-1 grid gap-1">
                    <span className="font-semibold text-sm">{entry.label}</span>
                    <a href={entry.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 truncate">{entry.url}</a>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeBibliographyItem(idx)}>×</Button>
                </div>
              ))}
              
              <div className="grid gap-3 p-3 border rounded-lg bg-slate-50/50">
                <Input 
                  placeholder={formT('bibliography.addPlaceholder')} 
                  value={newBibliography.label}
                  onChange={(e) => setNewBibliography(prev => ({ ...prev, label: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Input 
                    placeholder={formT('bibliography.addUrlPlaceholder')} 
                    value={newBibliography.url}
                    onChange={(e) => setNewBibliography(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={addBibliographyItem}>{formT('bibliography.addButton')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE */}
        <div className={styles.columnStack}>
          <Card className="property-panel">
            <CardHeader>
              <div className="space-y-1">
                <CardTitle>{formT('sections.taxonomy.title')}</CardTitle>
                <p className="text-sm text-slate-500">{formT('sections.taxonomy.helper')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={styles.columnStack}>
                <MultiSelect
                  label={formT('sections.taxonomy.domainsLabel')}
                  options={taxonomy?.domains.map(d => ({ id: d.id, label: d.label })) ?? []}
                  selectedValues={currentDomains}
                  onChange={(vals: string[]) => setValue('domains', vals, { shouldDirty: true })}
                  allowCreate={true}
                  translations={{ ...commonMultiSelectTrans, dialogTitle: formT('sections.taxonomy.domainsLabel') }}
                />

                <MultiSelect
                  label={formT('sections.taxonomy.pathologiesLabel')}
                  options={taxonomy?.pathologies.map((p) => ({ id: p.id, label: p.label })) ?? []}
                  selectedValues={currentPathologies}
                  onChange={(vals: string[]) => setValue('pathologies', vals, { shouldDirty: true })}
                  allowCreate={false}
                  translations={{ ...commonMultiSelectTrans, dialogTitle: formT('sections.taxonomy.pathologiesLabel') }}
                />

                <MultiSelect
                  label={formT('sections.taxonomy.tagsLabel')}
                  options={taxonomy?.tags.map(t => ({ id: t.id, label: t.label })) ?? []}
                  selectedValues={currentTags}
                  onChange={(vals: string[]) => setValue('tags', vals, { shouldDirty: true })}
                  allowCreate={true}
                  translations={{ ...commonMultiSelectTrans, dialogTitle: formT('sections.taxonomy.tagsLabel') }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{formT('sections.properties.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              
              <div className="property-row">
                <Label>{formT('fields.age.label')}</Label>
                {/* Utilisation de flexRow pour mettre min/max sur la même ligne */}
                <div className={styles.flexRow}>
                  <Input type="number" {...register('ageMinMonths', { valueAsNumber: true })} placeholder="Min" />
                  <Input type="number" {...register('ageMaxMonths', { valueAsNumber: true })} placeholder="Max" />
                </div>
              </div>

              <div className="property-row">
                <Label>{formT('fields.duration.label')}</Label>
                <Input type="number" {...register('durationMinutes', { valueAsNumber: true })} placeholder="Min" />
              </div>

              <div className="property-row">
                <Label>{formT('fields.standardization.label')}</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isStandardized" {...register('isStandardized')} className="w-4 h-4" />
                  <Label htmlFor="isStandardized" className="font-normal cursor-pointer">
                    {watch('isStandardized') ? formT('fields.standardization.standardized') : formT('fields.standardization.nonStandardized')}
                  </Label>
                </div>
              </div>

              <div className="property-value pt-2">
                <Label>{formT('fields.materials.placeholder')}</Label>
                <Input {...register('materials')} />
              </div>
              
              <div className="property-value">
                <Label>{formT('fields.publisher.label')}</Label>
                <Input {...register('publisher')} />
              </div>

              <div className="property-value">
                <Label>{formT('fields.buyLink.placeholder')}</Label>
                <Input {...register('buyLink')} placeholder="https://..." />
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default TestForm;
