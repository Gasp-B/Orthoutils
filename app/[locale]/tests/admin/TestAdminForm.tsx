'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { type Locale } from '@/i18n/routing';
import {
  adminTestFormSchema,
  taxonomyResponseSchema,
  testsResponseSchema,
  type TestDto,
} from '@/lib/validation/tests';
import { slugify } from '@/lib/utils/slug';

const statusOrder: TestDto['status'][] = ['draft', 'in_review', 'published', 'archived'];

type FormValues = z.infer<typeof adminTestFormSchema> & { locale: Locale };

type PathologyItem = { id: string; label: string };

type ApiResponse = { test?: TestDto; tests?: TestDto[]; error?: string };

type MultiSelectOption = { id: string; label: string };

type MultiSelectProps = {
  label: string;
  helper?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  loading?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
};

function formatDateTimeForInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const iso = date.toISOString();
  return iso.substring(0, 16);
}

function MultiSelectField({
  label,
  helper,
  options,
  value,
  onChange,
  loading,
  placeholder,
  searchPlaceholder,
  emptyLabel,
}: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const normalized = useMemo(() => new Set(value.map((v) => v.trim())), [value]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  const toggleValue = (nextValue: string) => {
    const next = new Set(normalized);
    if (next.has(nextValue)) {
      next.delete(nextValue);
    } else {
      next.add(nextValue);
    }
    onChange(Array.from(next));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
        </div>
        <Badge variant="outline" className="bg-slate-50 text-slate-700">
          {normalized.size}
        </Badge>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="cursor-pointer hover:bg-slate-200"
                onClick={() => toggleValue(item)}
              >
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-500">{placeholder}</span>
          )}
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
        />

        <div className="grid max-h-44 gap-2 overflow-y-auto pr-1 text-sm">
          {loading ? (
            <p className="text-slate-500">…</p>
          ) : filtered.length > 0 ? (
            filtered.map((option) => {
              const active = normalized.has(option.label);
              return (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <span>{option.label}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-indigo-600"
                    checked={active}
                    onChange={() => toggleValue(option.label)}
                  />
                </label>
              );
            })
          ) : (
            <p className="text-xs text-slate-500">{emptyLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function buildDefaultValues(locale: Locale): FormValues {
  return {
    id: undefined,
    locale,
    name: '',
    slug: '',
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
    pathologies: [],
    domains: [],
    tags: [],
    bibliography: [],
    status: 'draft',
    validatedBy: null,
    validatedAt: null,
    createdBy: null,
    createdAt: null,
    updatedAt: null,
  };
}

async function fetchTests(locale: Locale) {
  const response = await fetch(`/api/tests?locale=${locale}`);
  if (!response.ok) throw new Error('load-tests');
  const json = (await response.json()) as ApiResponse;
  return testsResponseSchema.parse({ tests: json.tests ?? [] }).tests;
}

async function fetchTaxonomy(locale: Locale) {
  const response = await fetch(`/api/tests/taxonomy?locale=${locale}`);
  if (!response.ok) throw new Error('load-taxonomy');
  return taxonomyResponseSchema.parse(await response.json());
}

async function fetchPathologies(locale: Locale, query?: string) {
  const searchParams = new URLSearchParams({ locale, limit: '50' });
  if (query?.trim()) searchParams.set('q', query.trim());
  const response = await fetch(`/api/pathologies?${searchParams.toString()}`);
  if (!response.ok) throw new Error('load-pathologies');
  const json = (await response.json()) as { items: PathologyItem[] };
  return json.items ?? [];
}

async function saveTest(payload: FormValues) {
  const method = payload.id ? 'PATCH' : 'POST';
  const response = await fetch('/api/tests', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'save-error');
  }

  return (await response.json()) as ApiResponse;
}

export default function TestAdminForm({ locale }: { locale: Locale }) {
  const t = useTranslations('TestsAdmin.form');
  const fieldsT = useTranslations('TestsAdmin.form.fields');
  const sectionsT = useTranslations('TestsAdmin.form.sections');
  const statusT = useTranslations('TestsAdmin.form.status');
  const multiT = useTranslations('TestsAdmin.form.multiSelect');
  const feedbackT = useTranslations('TestsAdmin.form.feedback');
  const systemT = useTranslations('TestsAdmin.form.system');

  const queryClient = useQueryClient();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pathologyQuery, setPathologyQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(adminTestFormSchema),
    defaultValues: buildDefaultValues(locale),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const nameValue = watch('name');
  const bibliography = watch('bibliography') ?? [];
  const domains = watch('domains') ?? [];
  const tags = watch('tags') ?? [];
  const pathologies = watch('pathologies') ?? [];

  useEffect(() => {
    if (slugTouched) return;
    if (!nameValue) return;
    setValue('slug', slugify(nameValue));
  }, [nameValue, setValue, slugTouched]);

  const { data: tests = [], isFetching: isFetchingTests } = useQuery({
    queryKey: ['tests', locale],
    queryFn: () => fetchTests(locale),
  });

  const { data: taxonomy, isFetching: isFetchingTaxonomy } = useQuery({
    queryKey: ['tests-taxonomy', locale],
    queryFn: () => fetchTaxonomy(locale),
  });

  const { data: pathologyOptions = [], isFetching: isLoadingPathologies } = useQuery({
    queryKey: ['pathologies', locale, pathologyQuery],
    queryFn: () => fetchPathologies(locale, pathologyQuery),
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!selectedTestId) {
      reset(buildDefaultValues(locale));
      setSlugTouched(false);
      return;
    }

    const selected = tests.find((test) => test.id === selectedTestId);
    if (!selected) return;

    setSlugTouched(true);
    reset({
      ...selected,
      locale,
      validatedAt: selected.validatedAt ?? null,
      createdAt: selected.createdAt ?? null,
      updatedAt: selected.updatedAt ?? null,
    });
  }, [locale, reset, selectedTestId, tests]);

  const mutation = useMutation({
    mutationFn: saveTest,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['tests', locale] });
      await queryClient.invalidateQueries({ queryKey: ['tests-taxonomy', locale] });
      setToastMessage(
        response.test?.id === selectedTestId
          ? feedbackT('updated')
          : feedbackT(selectedTestId ? 'updated' : 'created'),
      );
      if (response.test?.id) {
        setSelectedTestId(response.test.id);
      }
    },
    onError: () => {
      setToastMessage(feedbackT('error'));
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: FormValues = {
      ...values,
      locale,
      id: selectedTestId ?? values.id,
      name: values.name.trim(),
      slug: slugify(values.slug || values.name),
      shortDescription: values.shortDescription?.trim() || null,
      objective: values.objective?.trim() || null,
      population: values.population?.trim() || null,
      materials: values.materials?.trim() || null,
      publisher: values.publisher?.trim() || null,
      priceRange: values.priceRange?.trim() || null,
      buyLink: values.buyLink?.trim() || null,
      notes: values.notes?.trim() || null,
      bibliography: (values.bibliography ?? []).filter((entry) => entry.label && entry.url),
      domains: values.domains ?? [],
      tags: values.tags ?? [],
      pathologies: values.pathologies ?? [],
      validatedAt: values.validatedAt ?? null,
      validatedBy: values.validatedBy?.trim() || null,
      createdBy: values.createdBy?.trim() || null,
    };

    mutation.mutate(payload);
  };

  const addBibliographyEntry = () => {
    const emptyEntry = { label: '', url: '' };
    setValue('bibliography', [...bibliography, emptyEntry], { shouldDirty: true });
  };

  const updateBibliographyEntry = (index: number, key: 'label' | 'url', value: string) => {
    const entries = [...bibliography];
    entries[index] = { ...entries[index], [key]: value };
    setValue('bibliography', entries, { shouldDirty: true });
  };

  const removeBibliographyEntry = (index: number) => {
    const entries = [...bibliography];
    entries.splice(index, 1);
    setValue('bibliography', entries, { shouldDirty: true });
  };

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      {toastMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toastMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{t('selector.label')}</p>
            <CardTitle className="text-xl">{t('selector.title')}</CardTitle>
            <p className="text-sm text-slate-500">{t('selector.helper')}</p>
          </div>
          <div className="flex flex-col gap-2 md:w-72">
            <Label className="text-sm font-medium text-slate-700" htmlFor="test-selector">
              {t('selector.controlLabel')}
            </Label>
            <Select
              id="test-selector"
              value={selectedTestId ?? ''}
              onChange={(event) => setSelectedTestId(event.target.value || null)}
              className="w-full"
            >
              <option value="">{t('selector.new')}</option>
              {isFetchingTests && <option>{t('selector.loading')}</option>}
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{sectionsT('translation.title')}</CardTitle>
          <p className="text-sm text-slate-500">{sectionsT('translation.helper')}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{fieldsT('name.label')}</Label>
            <Input id="name" {...register('name')} placeholder={fieldsT('name.placeholder')} />
            {errors.name && <p className="text-xs text-red-600">{t('validation.required')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{fieldsT('slug.label')}</Label>
            <Input
              id="slug"
              {...register('slug', {
                onChange: () => setSlugTouched(true),
              })}
              placeholder={fieldsT('slug.placeholder')}
            />
            {errors.slug && <p className="text-xs text-red-600">{t('validation.required')}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="shortDescription">{fieldsT('shortDescription.label')}</Label>
            <Textarea
              id="shortDescription"
              rows={3}
              {...register('shortDescription')}
              placeholder={fieldsT('shortDescription.placeholder')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="objective">{fieldsT('objective.label')}</Label>
            <Textarea
              id="objective"
              rows={3}
              {...register('objective')}
              placeholder={fieldsT('objective.placeholder')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">{fieldsT('notes.label')}</Label>
            <Textarea id="notes" rows={3} {...register('notes')} placeholder={fieldsT('notes.placeholder')} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{sectionsT('usage.title')}</CardTitle>
            <p className="text-sm text-slate-500">{sectionsT('usage.helper')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ageMinMonths">{fieldsT('ageMin.label')}</Label>
                <Input
                  id="ageMinMonths"
                  type="number"
                  inputMode="numeric"
                  {...register('ageMinMonths', {
                    setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                  })}
                  placeholder={fieldsT('ageMin.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageMaxMonths">{fieldsT('ageMax.label')}</Label>
                <Input
                  id="ageMaxMonths"
                  type="number"
                  inputMode="numeric"
                  {...register('ageMaxMonths', {
                    setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                  })}
                  placeholder={fieldsT('ageMax.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">{fieldsT('duration.label')}</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  inputMode="numeric"
                  {...register('durationMinutes', {
                    setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                  })}
                  placeholder={fieldsT('duration.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="population">{fieldsT('population.label')}</Label>
                <Input
                  id="population"
                  {...register('population')}
                  placeholder={fieldsT('population.placeholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materials">{fieldsT('materials.label')}</Label>
              <Input id="materials" {...register('materials')} placeholder={fieldsT('materials.placeholder')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{sectionsT('editorial.title')}</CardTitle>
            <p className="text-sm text-slate-500">{sectionsT('editorial.helper')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publisher">{fieldsT('publisher.label')}</Label>
                <Input id="publisher" {...register('publisher')} placeholder={fieldsT('publisher.placeholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceRange">{fieldsT('priceRange.label')}</Label>
                <Input id="priceRange" {...register('priceRange')} placeholder={fieldsT('priceRange.placeholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyLink">{fieldsT('buyLink.label')}</Label>
                <Input id="buyLink" {...register('buyLink')} placeholder={fieldsT('buyLink.placeholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isStandardized">{fieldsT('isStandardized.label')}</Label>
                <Select
                  id="isStandardized"
                  value={watch('isStandardized') ? 'true' : 'false'}
                  onChange={(event) => setValue('isStandardized', event.target.value === 'true')}
                >
                  <option value="true">{fieldsT('isStandardized.standardized')}</option>
                  <option value="false">{fieldsT('isStandardized.nonStandardized')}</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{sectionsT('taxonomy.title')}</CardTitle>
          <p className="text-sm text-slate-500">{sectionsT('taxonomy.helper')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultiSelectField
            label={sectionsT('taxonomy.domains')}
            helper={sectionsT('taxonomy.domainsHelper')}
            options={(taxonomy?.domains ?? []).map((domain) => ({ id: domain.id, label: domain.label }))}
            value={domains}
            onChange={(next) => setValue('domains', next, { shouldDirty: true })}
            loading={isFetchingTaxonomy}
            placeholder={multiT('placeholder')}
            searchPlaceholder={multiT('searchPlaceholder')}
            emptyLabel={multiT('emptyResults')}
          />
          <MultiSelectField
            label={sectionsT('taxonomy.tags')}
            helper={sectionsT('taxonomy.tagsHelper')}
            options={(taxonomy?.tags ?? []).map((tag) => ({ id: tag.id, label: tag.label }))}
            value={tags}
            onChange={(next) => setValue('tags', next, { shouldDirty: true })}
            loading={isFetchingTaxonomy}
            placeholder={multiT('placeholder')}
            searchPlaceholder={multiT('searchPlaceholder')}
            emptyLabel={multiT('emptyResults')}
          />
          <MultiSelectField
            label={sectionsT('taxonomy.pathologies')}
            helper={sectionsT('taxonomy.pathologiesHelper')}
            options={pathologyOptions.map((pathology) => ({ id: pathology.id, label: pathology.label }))}
            value={pathologies}
            onChange={(next) => setValue('pathologies', next, { shouldDirty: true })}
            loading={isLoadingPathologies}
            placeholder={multiT('placeholder')}
            searchPlaceholder={multiT('searchPlaceholder')}
            emptyLabel={multiT('emptyResults')}
          />
          <div className="flex flex-col gap-2 md:w-80">
            <Label htmlFor="pathologySearch">{sectionsT('taxonomy.searchLabel')}</Label>
            <Input
              id="pathologySearch"
              value={pathologyQuery}
              onChange={(event) => setPathologyQuery(event.target.value)}
              placeholder={multiT('searchPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{sectionsT('system.title')}</CardTitle>
          <p className="text-sm text-slate-500">{sectionsT('system.helper')}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">{systemT('statusLabel')}</Label>
            <Select id="status" {...register('status')}>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {statusT(status)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="validatedBy">{systemT('validatedBy')}</Label>
            <Input id="validatedBy" {...register('validatedBy')} placeholder={systemT('validatedByPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validatedAt">{systemT('validatedAt')}</Label>
            <Controller
              control={control}
              name="validatedAt"
              render={({ field }) => (
                <Input
                  id="validatedAt"
                  type="datetime-local"
                  value={formatDateTimeForInput(field.value)}
                  onChange={(event) =>
                    field.onChange(event.target.value ? new Date(event.target.value).toISOString() : null)
                  }
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createdBy">{systemT('createdBy')}</Label>
            <Input id="createdBy" {...register('createdBy')} placeholder={systemT('createdByPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{systemT('timestamps')}</Label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <p>
                {systemT('createdAt')} : {watch('createdAt') ?? systemT('notRecorded')}
              </p>
              <p>
                {systemT('updatedAt')} : {watch('updatedAt') ?? systemT('notRecorded')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{sectionsT('bibliography.title')}</CardTitle>
          <p className="text-sm text-slate-500">{sectionsT('bibliography.helper')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {bibliography.length === 0 ? (
            <p className="text-sm text-slate-500">{sectionsT('bibliography.empty')}</p>
          ) : null}
          <div className="grid gap-4">
            {bibliography.map((entry, index) => (
              <div key={`${entry.label}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{sectionsT('bibliography.entry')} #{index + 1}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeBibliographyEntry(index)}>
                    {sectionsT('bibliography.remove')}
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{sectionsT('bibliography.titleLabel')}</Label>
                    <Input
                      value={entry.label}
                      onChange={(event) => updateBibliographyEntry(index, 'label', event.target.value)}
                      placeholder={sectionsT('bibliography.titlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{sectionsT('bibliography.urlLabel')}</Label>
                    <Input
                      value={entry.url}
                      onChange={(event) => updateBibliographyEntry(index, 'url', event.target.value)}
                      placeholder={sectionsT('bibliography.urlPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addBibliographyEntry}>
            {sectionsT('bibliography.add')}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading
            ? t('actions.saving')
            : selectedTestId
              ? t('actions.update')
              : t('actions.create')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset(buildDefaultValues(locale))}>
          {t('actions.reset')}
        </Button>
      </div>
    </form>
  );
}
