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
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { type Locale } from '@/i18n/routing';
import {
  resourceInputSchema,
  resourcesResponseSchema,
  type ResourceDto,
} from '@/lib/validation/resources';
import { type TaxonomyResponse } from '@/lib/validation/tests';

import styles from './resource-form.module.css';

type ResourceFormProps = {
  locale: Locale;
};

type ApiResponse = { resource?: ResourceDto; resources?: ResourceDto[]; error?: string };

const formSchema = resourceInputSchema
  .extend({
    id: z.string().uuid().optional(),
    url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    description: resourceInputSchema.shape.description.or(z.literal('')).optional(),
  })
  .refine((value) => Boolean(value.title?.trim()), { path: ['title'] })
  .refine((value) => Boolean(value.type?.trim()), { path: ['type'] });

const defaultValues: z.infer<typeof formSchema> = {
  id: undefined,
  title: '',
  type: '',
  url: '',
  description: '',
  domains: [],
  tags: [],
  pathologies: [],
};

async function fetchResources(locale: Locale) {
  const response = await fetch(`/api/resources?locale=${locale}`, { credentials: 'include' });
  if (!response.ok) throw new Error('fetchError');
  const json = (await response.json()) as ApiResponse;
  return resourcesResponseSchema.parse({ resources: json.resources ?? [] }).resources;
}

async function fetchTaxonomy(locale: Locale) {
  const response = await fetch(`/api/tests/taxonomy?locale=${locale}`, { credentials: 'include' });
  if (!response.ok) throw new Error('fetchError');
  return (await response.json()) as TaxonomyResponse;
}

async function saveResource(payload: z.infer<typeof formSchema>, locale: Locale, method: 'POST' | 'PATCH') {
  const response = await fetch('/api/resources', {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, locale }),
  });

  const json = (await response.json().catch(() => ({}))) as ApiResponse;

  if (!response.ok) {
    const error = new Error(json.error || 'saveError');
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return json;
}

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

function ResourceForm({ locale }: ResourceFormProps) {
  const formT = useTranslations('ResourcesManage.form');
  const feedbackT = useTranslations('ResourcesManage.feedback');
  const multiSelectT = useTranslations('ResourcesManage.form.multiSelect');

  const queryClient = useQueryClient();

  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: resources } = useQuery({
    queryKey: ['resources', locale],
    queryFn: () => fetchResources(locale),
  });

  const { data: taxonomy } = useQuery({
    queryKey: ['taxonomy', locale],
    queryFn: () => fetchTaxonomy(locale),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const currentDomains = watch('domains') ?? [];
  const currentTags = watch('tags') ?? [];
  const currentPathologies = watch('pathologies') ?? [];

  useEffect(() => {
    if (!selectedResourceId) {
      reset(defaultValues);
      return;
    }

    const resource = resources?.find((item) => item.id === selectedResourceId);
    if (resource) {
      reset({
        ...resource,
        url: resource.url ?? '',
        description: resource.description ?? '',
      });
    }
  }, [selectedResourceId, resources, reset]);

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof formSchema>) =>
      saveResource(payload, locale, payload.id ? 'PATCH' : 'POST'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resources', locale] });
      void queryClient.invalidateQueries({ queryKey: ['taxonomy', locale] });
      setToastMsg(feedbackT('success.saved'));
      if (!selectedResourceId) reset(defaultValues);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      id: values.id || undefined,
      title: values.title.trim(),
      type: values.type.trim(),
      url: values.url ? values.url : null,
      description: values.description?.trim() ? values.description.trim() : null,
      domains: values.domains ?? [],
      tags: values.tags ?? [],
      pathologies: values.pathologies ?? [],
    };

    mutation.mutate(payload);
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
            <Label htmlFor="resource-selector" className="text-xs uppercase tracking-wider text-slate-500">
              {formT('toolbar.sheetLabel')}
            </Label>
            <select
              id="resource-selector"
              value={selectedResourceId ?? ''}
              onChange={(e) => setSelectedResourceId(e.currentTarget.value || null)}
              className="font-semibold bg-white/50 border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">✨ {formT('toolbar.newResource')}</option>
              {resources?.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  📁 {resource.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="notion-toolbar__group">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelectedResourceId(null);
              reset(defaultValues);
            }}
          >
            {formT('toolbar.reset')}
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="min-w-[140px]">
            {mutation.isPending
              ? formT('toolbar.submit.pending')
              : selectedResourceId
                ? formT('toolbar.submit.update')
                : formT('toolbar.submit.create')}
          </Button>
        </div>
      </div>

      {mutation.isError && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 mt-3">
          <strong>{feedbackT('errors.title')} </strong>
          {(() => {
            const typedError = mutation.error as Error & { status?: number };
            const isUnauthorized = typedError?.message === 'Unauthorized' || typedError?.status === 401;

            if (isUnauthorized) {
              return feedbackT('errors.unauthorized');
            }

            const reason = typedError?.message && typedError.message !== 'saveError' ? typedError.message : '';

            return reason
              ? feedbackT('errors.genericWithReason', { reason })
              : feedbackT('errors.generic');
          })()}
        </div>
      )}

      <div className="grid gap-3 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{formT('sections.identity.title')}</CardTitle>
            <p className={styles.helper}>{formT('sections.identity.helper')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{formT('fields.title.label')}</Label>
              <Input id="title" placeholder={formT('fields.title.placeholder')} {...register('title')} />
              {errors.title && <p className={styles.errorMessage}>{errors.title.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="type">{formT('fields.type.label')}</Label>
                <Input id="type" placeholder={formT('fields.type.placeholder')} {...register('type')} />
                {errors.type && <p className={styles.errorMessage}>{errors.type.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">{formT('fields.url.label')}</Label>
                <Input id="url" placeholder={formT('fields.url.placeholder')} {...register('url')} />
                {errors.url && <p className={styles.errorMessage}>{errors.url.message}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{formT('fields.description.label')}</Label>
              <Textarea
                id="description"
                placeholder={formT('fields.description.placeholder')}
                rows={4}
                {...register('description')}
              />
              {errors.description && <p className={styles.errorMessage}>{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="property-panel">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>{formT('sections.taxonomy.title')}</CardTitle>
              <p className={styles.helper}>{formT('sections.taxonomy.helper')}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={styles.columnStack}>
              <MultiSelect
                label={formT('sections.taxonomy.domainsLabel')}
                options={taxonomy?.domains.map((domain) => ({ id: domain.id, label: domain.label })) ?? []}
                selectedValues={currentDomains}
                onChange={(vals: string[]) => setValue('domains', vals, { shouldDirty: true })}
                allowCreate
                translations={{ ...commonMultiSelectTrans, dialogTitle: formT('sections.taxonomy.domainsLabel') }}
              />

              <MultiSelect
                label={formT('sections.taxonomy.tagsLabel')}
                options={taxonomy?.tags.map((tag) => ({ id: tag.id, label: tag.label })) ?? []}
                selectedValues={currentTags}
                onChange={(vals: string[]) => setValue('tags', vals, { shouldDirty: true })}
                allowCreate
                translations={{ ...commonMultiSelectTrans, dialogTitle: formT('sections.taxonomy.tagsLabel') }}
              />

              <MultiSelect
                label={formT('sections.taxonomy.pathologiesLabel')}
                options={taxonomy?.pathologies.map((pathology) => ({ id: pathology.id, label: pathology.label })) ?? []}
                selectedValues={currentPathologies}
                onChange={(vals: string[]) => setValue('pathologies', vals, { shouldDirty: true })}
                allowCreate={false}
                translations={{ ...commonMultiSelectTrans, dialogTitle: formT('sections.taxonomy.pathologiesLabel') }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

export default ResourceForm;
