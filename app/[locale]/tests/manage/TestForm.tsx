'use client';

import React, { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  Save, 
  Tag, 
  Info,
  ChevronLeft,
  X,
  BookOpen,
  Settings,
  Link as LinkIcon
} from "lucide-react";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from '@/components/ui/multi-select';

import { type Locale } from '@/i18n/routing';
import { testsResponseSchema, testSchema, type TestDto, type TaxonomyResponse, targetAudienceSchema } from '@/lib/validation/tests';

type TestFormProps = {
  locale: Locale;
  testId?: string | null;
};

const ageUnitSchema = z.enum(['weeks', 'months', 'years']);

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
    targetAudience: targetAudienceSchema.default('child'), 
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

const formSchema = formSchemaBase.extend({
  ageMinValue: optionalNullableInt,
  ageMinUnit: ageUnitSchema.default('months'),
  ageMaxValue: optionalNullableInt,
  ageMaxUnit: ageUnitSchema.default('months'),
});

type FormValues = z.infer<typeof formSchema>;
type SubmitValues = z.infer<typeof formSchemaBase>;
type ApiResponse = { test?: TestDto; tests?: TestDto[]; error?: string };
type AgeUnit = z.infer<typeof ageUnitSchema>;
type TargetAudience = z.infer<typeof targetAudienceSchema>;

const defaultValues: FormValues = {
  id: undefined,
  name: '',
  targetAudience: 'child',
  status: 'draft',
  shortDescription: null,
  objective: null,
  ageMinMonths: null,
  ageMaxMonths: null,
  ageMinValue: null,
  ageMinUnit: 'months',
  ageMaxValue: null,
  ageMaxUnit: 'months',
  population: null,
  durationMinutes: null,
  materials: null,
  isStandardized: true,
  publisher: null,
  priceRange: null,
  buyLink: null,
  notes: null,
  themes: [],
  domains: [],
  tags: [],
  bibliography: [],
};

const toMonths = (value: number | null | undefined, unit: AgeUnit): number | null => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const normalized = Math.round(value);
  switch (unit) {
    case 'weeks': return Math.round(normalized / 4);
    case 'months': return normalized;
    case 'years': return normalized * 12;
    default: return normalized;
  }
};

const fromMonths = (value: number | null | undefined, unit: AgeUnit): number | null => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  switch (unit) {
    case 'weeks': return Math.round(value * 4);
    case 'months': return value;
    case 'years': return Math.round(value / 12);
    default: return value;
  }
};

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

async function saveTest(payload: SubmitValues, locale: Locale, method: 'POST' | 'PATCH') {
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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2">
      <span className="text-xl">✓</span>
      <p className="font-semibold text-sm">{message}</p>
    </div>
  );
}

export default function TestForm({ locale, testId = null }: TestFormProps) {
  const formT = useTranslations('ManageTests.form');
  const feedbackT = useTranslations('ManageTests.feedback');
  const multiSelectT = useTranslations('ManageTests.form.multiSelect');

  const router = useRouter();
  const queryClient = useQueryClient();

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
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const currentDomains = watch('domains') ?? [];
  const currentTags = watch('tags') ?? [];
  const currentThemes = watch('themes') ?? [];
  const currentBibliography = watch('bibliography');
  const watchedTestId = watch('id');
  const selectedTestId = testId ?? watchedTestId ?? null;
  const targetAudience = watch('targetAudience');
  const ageMinValue = watch('ageMinValue');
  const ageMaxValue = watch('ageMaxValue');
  const ageMinUnit = watch('ageMinUnit');
  const ageMaxUnit = watch('ageMaxUnit');
  const currentStatus = watch('status');

  const applyTestValues = useCallback((test: TestDto) => {
    const audience = test.targetAudience ?? 'child';
    const baseUnit: AgeUnit = audience === 'adult' ? 'years' : 'months';
    reset({
      ...test,
      bibliography: test.bibliography ?? [],
      themes: test.themes ?? [],
      domains: test.domains ?? [],
      tags: test.tags ?? [],
      targetAudience: audience,
      ageMinValue: fromMonths(test.ageMinMonths, baseUnit),
      ageMinUnit: baseUnit,
      ageMaxValue: fromMonths(test.ageMaxMonths, baseUnit),
      ageMaxUnit: baseUnit,
    });
  }, [reset]);

  useEffect(() => {
    if (!selectedTestId) {
      reset(defaultValues);
      return;
    }
    const test = tests?.find((t) => t.id === selectedTestId);
    if (test) applyTestValues(test);
  }, [selectedTestId, tests, applyTestValues, reset]);

  const mutation = useMutation({
    mutationFn: (payload: SubmitValues) => 
      saveTest(payload, locale, payload.id ? 'PATCH' : 'POST'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tests', locale] });
      await queryClient.invalidateQueries({ queryKey: ['test-taxonomy', locale] });
      setToastMsg(feedbackT('success.saved'));
      if (!testId && !selectedTestId) {
         reset(defaultValues);
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    const {
      targetAudience,
      ageMinValue: minValue,
      ageMaxValue: maxValue,
      ageMinUnit: minUnit,
      ageMaxUnit: maxUnit,
      ...baseValues
    } = values;
    
    const resolvedUnit: AgeUnit = targetAudience === 'adult' ? 'years' : minUnit;
    const resolvedMaxUnit: AgeUnit = targetAudience === 'adult' ? 'years' : maxUnit;
    const populationLabel = targetAudience === 'adult'
        ? formT('fields.age.populationOptions.adult')
        : formT('fields.age.populationOptions.child');
    
    const payload = {
      ...baseValues,
      name: baseValues.name.trim(),
      targetAudience,
      status: baseValues.status,
      population: baseValues.population || populationLabel,
      ageMinMonths: toMonths(minValue, resolvedUnit),
      ageMaxMonths: toMonths(maxValue, resolvedMaxUnit),
      bibliography: baseValues.bibliography?.filter((b) => b.label && b.url) ?? [],
      domains: baseValues.domains ?? [],
      tags: baseValues.tags ?? [],
      themes: baseValues.themes ?? [],
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

  const targetAudienceField = register('targetAudience');
  const handleAudienceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    targetAudienceField.onChange(event);
    const nextAudience = event.currentTarget.value as TargetAudience;
    
    const currentMinMonths = toMonths(ageMinValue, targetAudience === 'adult' ? 'years' : ageMinUnit);
    const currentMaxMonths = toMonths(ageMaxValue, targetAudience === 'adult' ? 'years' : ageMaxUnit);
    const nextUnit: AgeUnit = nextAudience === 'adult' ? 'years' : 'months';
    
    setValue('ageMinUnit', nextUnit, { shouldDirty: true });
    setValue('ageMaxUnit', nextUnit, { shouldDirty: true });
    setValue('ageMinValue', fromMonths(currentMinMonths, nextUnit), { shouldDirty: true });
    setValue('ageMaxValue', fromMonths(currentMaxMonths, nextUnit), { shouldDirty: true });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    void handleSubmit(onSubmit)(e);
  };

  const getStatusLabel = (status: string) => {
    // Cast sécurisé car nous savons que les clés existent dans le type de traduction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return formT(`fields.status.options.${status}` as any);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 pb-10 max-w-7xl mx-auto">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 pt-2 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
            onClick={() => router.back()}
           >
             <ChevronLeft className="h-4 w-4 mr-1" />
             {formT('toolbar.back')}
           </Button>
           <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {selectedTestId ? formT('actions.update') : formT('actions.create')}
                <Badge variant={currentStatus === 'published' ? 'default' : 'outline'} className="ml-2 text-xs font-normal">
                  {getStatusLabel(currentStatus)}
                </Badge>
              </h2>
              {!testId && (
                <div className="mt-1">
                  <select 
                    className="text-xs bg-transparent border-none text-muted-foreground focus:ring-0 cursor-pointer hover:text-foreground"
                    value={selectedTestId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      if (!val) reset(defaultValues);
                      setValue('id', val || undefined, { shouldDirty: true });
                    }}
                  >
                    <option value="">{formT('toolbar.newTest')}</option>
                    {tests?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
           </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={() => reset(defaultValues)} className="flex-1 sm:flex-none">
            {formT('toolbar.reset')}
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="flex-1 sm:flex-none min-w-[140px]">
            {mutation.isPending ? (
              <span>{formT('actions.pending')}...</span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {formT('actions.save')}
              </>
            )}
          </Button>
        </div>
      </div>

      {mutation.isError && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          <p className="font-semibold">{feedbackT('errors.title')}</p>
          <p className="text-sm">{(mutation.error as Error).message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details"> <Info className="w-4 h-4 mr-2"/> Détails</TabsTrigger>
              <TabsTrigger value="taxonomy"> <Tag className="w-4 h-4 mr-2"/> Classification</TabsTrigger>
              <TabsTrigger value="content"> <BookOpen className="w-4 h-4 mr-2"/> Contenu</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{formT('sections.detailedSummary.title')}</CardTitle>
                  <CardDescription>Informations générales sur le test.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{formT('fields.name.placeholder')} <span className="text-red-500">*</span></Label>
                    <Input id="name" {...register('name')} className="text-base font-medium" />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>{formT('fields.shortDescription.label')}</Label>
                    <Textarea {...register('shortDescription')} placeholder={formT('fields.shortDescription.placeholder')} className="min-h-[100px]" />
                  </div>

                  <div className="space-y-2">
                    <Label>{formT('fields.objective.label')}</Label>
                    <Textarea {...register('objective')} placeholder={formT('fields.objective.placeholder')} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{formT('fields.publisher.label')}</Label>
                      <Input {...register('publisher')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{formT('fields.duration.label')}</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" {...register('durationMinutes', { valueAsNumber: true })} />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ciblage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded bg-slate-50">
                    <Label>{formT('fields.age.populationLabel')}</Label>
                    <Select {...targetAudienceField} onChange={handleAudienceChange}>
                        <option value="child">{formT('fields.age.populationOptions.child')}</option>
                        <option value="adult">{formT('fields.age.populationOptions.adult')}</option>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{formT('fields.age.minLabel')}</Label>
                      <div className="flex gap-2">
                        <Input type="number" {...register('ageMinValue', { valueAsNumber: true })} />
                        {targetAudience !== 'adult' && (
                          <Select {...register('ageMinUnit')}>
                            <option value="weeks">{formT('fields.age.units.weeks')}</option>
                            <option value="months">{formT('fields.age.units.months')}</option>
                            <option value="years">{formT('fields.age.units.years')}</option>
                          </Select>
                        )}
                        {targetAudience === 'adult' && <span className="flex items-center text-sm">ans</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{formT('fields.age.maxLabel')}</Label>
                      <div className="flex gap-2">
                        <Input type="number" {...register('ageMaxValue', { valueAsNumber: true })} />
                        {targetAudience !== 'adult' && (
                          <Select {...register('ageMaxUnit')}>
                            <option value="weeks">{formT('fields.age.units.weeks')}</option>
                            <option value="months">{formT('fields.age.units.months')}</option>
                            <option value="years">{formT('fields.age.units.years')}</option>
                          </Select>
                        )}
                        {targetAudience === 'adult' && <span className="flex items-center text-sm">ans</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="taxonomy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{formT('sections.taxonomy.title')}</CardTitle>
                  <CardDescription>{formT('sections.taxonomy.helper')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>{formT('sections.taxonomy.domainsLabel')}</Label>
                    <MultiSelect
                      label={formT('sections.taxonomy.domainsLabel')}
                      options={taxonomy?.domains.map(d => ({ id: d.id, label: d.label })) ?? []}
                      selectedValues={currentDomains}
                      onChange={(vals: string[]) => setValue('domains', vals, { shouldDirty: true })}
                      allowCreate={true}
                      translations={{ 
                        add: multiSelectT('add'),
                        remove: multiSelectT('remove'),
                        clear: multiSelectT('clear'),
                        close: multiSelectT('close'),
                        emptySelection: multiSelectT('emptySelection'),
                        emptyResults: multiSelectT('emptyResults'),
                        loading: multiSelectT('loading'),
                        searchPlaceholder: multiSelectT('searchPlaceholder'),
                        dialogTitle: formT('sections.taxonomy.domainsLabel'),
                        dialogHelper: multiSelectT('filterHelper')
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{formT('sections.taxonomy.themesLabel')}</Label>
                    <MultiSelect
                      label={formT('sections.taxonomy.themesLabel')}
                      options={taxonomy?.themes.map((p) => ({ id: p.id, label: p.label })) ?? []}
                      selectedValues={currentThemes}
                      onChange={(vals: string[]) => setValue('themes', vals, { shouldDirty: true })}
                      allowCreate={false}
                      translations={{
                        add: multiSelectT('add'),
                        remove: multiSelectT('remove'),
                        clear: multiSelectT('clear'),
                        close: multiSelectT('close'),
                        emptySelection: multiSelectT('emptySelection'),
                        emptyResults: multiSelectT('emptyResults'),
                        loading: multiSelectT('loading'),
                        searchPlaceholder: multiSelectT('searchPlaceholder'),
                        dialogTitle: formT('sections.taxonomy.themesLabel'),
                        dialogHelper: multiSelectT('filterHelper')
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{formT('sections.taxonomy.tagsLabel')}</Label>
                    <MultiSelect
                      label={formT('sections.taxonomy.tagsLabel')}
                      options={taxonomy?.tags.map(t => ({ id: t.id, label: t.label })) ?? []}
                      selectedValues={currentTags}
                      onChange={(vals: string[]) => setValue('tags', vals, { shouldDirty: true })}
                      allowCreate={true}
                      translations={{
                        add: multiSelectT('add'),
                        remove: multiSelectT('remove'),
                        clear: multiSelectT('clear'),
                        close: multiSelectT('close'),
                        emptySelection: multiSelectT('emptySelection'),
                        emptyResults: multiSelectT('emptyResults'),
                        loading: multiSelectT('loading'),
                        searchPlaceholder: multiSelectT('searchPlaceholder'),
                        dialogTitle: formT('sections.taxonomy.tagsLabel'),
                        dialogHelper: multiSelectT('filterHelper')
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{formT('sections.bibliography.title')}</CardTitle>
                  <CardDescription>{formT('sections.bibliography.helper')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentBibliography?.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-md border border-slate-100 group">
                      <div className="p-2 bg-white rounded border shadow-sm">
                        <LinkIcon className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 grid gap-1">
                        <span className="font-medium text-sm">{entry.label}</span>
                        <a href={entry.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground truncate hover:underline">{entry.url}</a>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeBibliographyItem(idx)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="p-4 border rounded-lg bg-slate-50/50 space-y-3">
                    <Label className="text-xs uppercase text-slate-500">Ajouter une référence</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input 
                        placeholder={formT('bibliography.addPlaceholder')} 
                        value={newBibliography.label}
                        onChange={(e) => setNewBibliography(prev => ({ ...prev, label: e.target.value }))}
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <Input 
                          placeholder={formT('bibliography.addUrlPlaceholder')} 
                          value={newBibliography.url}
                          onChange={(e) => setNewBibliography(prev => ({ ...prev, url: e.target.value }))}
                          className="bg-white"
                        />
                        <Button type="button" size="sm" variant="outline" className="h-10 w-10 p-0" onClick={addBibliographyItem}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{formT('fields.materials.placeholder')}</CardTitle>
                </CardHeader>
                <CardContent>
                   <Textarea {...register('materials')} placeholder="Liste du matériel requis..." className="min-h-[80px]" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
               <CardTitle className="text-base flex items-center gap-2">
                 <Settings className="h-4 w-4"/> Paramètres
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{formT('fields.status.label')}</Label>
                <Select {...register('status')}>
                  <option value="draft">{formT('fields.status.options.draft')}</option>
                  <option value="in_review">{formT('fields.status.options.inReview')}</option>
                  <option value="published">{formT('fields.status.options.published')}</option>
                  <option value="archived">{formT('fields.status.options.archived')}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{formT('fields.buyLink.placeholder')}</Label>
                <Input {...register('buyLink')} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>{formT('fields.priceRange') || "Prix approx."}</Label>
                <Input {...register('priceRange')} placeholder="ex: 50-100€" />
              </div>

              <Separator />

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isStandardized" {...register('isStandardized')} className="w-4 h-4 accent-blue-600" />
                <Label htmlFor="isStandardized" className="font-normal cursor-pointer text-sm">
                  {watch('isStandardized') ? formT('fields.standardization.standardized') : formT('fields.standardization.nonStandardized')}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes Internes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea {...register('notes')} placeholder={formT('fields.notes.placeholder')} className="min-h-[150px] resize-y text-sm" />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}