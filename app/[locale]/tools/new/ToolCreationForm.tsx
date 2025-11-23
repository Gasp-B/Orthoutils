'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { CreateToolPayload } from '@/lib/validation/tools';
import styles from './tool-creation-form.module.css';

const defaultValues = {
  name: '',
  category: '',
  type: '',
  tags: '',
  source: '',
};

type ApiResponse = {
  tool?: CreateToolPayload & { id: string };
  error?: string;
};

const createFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t('validation.name.required')),
    category: z.string().min(1, t('validation.category.required')),
    type: z.string().min(1, t('validation.type.required')),
    tags: z.string().min(1, t('validation.tags.required')),
    source: z.string().url(t('validation.source.url')),
  });

type FormSchema = ReturnType<typeof createFormSchema>;
type FormValues = z.infer<FormSchema>;

async function submitTool(payload: CreateToolPayload, fallbackMessage: string, locale: string) {
  const response = await fetch('/api/tools', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      'X-Orthoutil-Locale': locale,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(data.error ?? fallbackMessage);
  }

  return (await response.json()) as ApiResponse;
}

function ToolCreationForm() {
  const queryClient = useQueryClient();
  const t = useTranslations('ToolForm');
  const locale = useLocale();

  const formSchema = useMemo<FormSchema>(() => createFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateToolPayload) => submitTool(payload, t('validation.fallback'), locale),
    onSuccess: () => {
      reset(defaultValues);
      void queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const [submitLabel, submitDisabled] = useMemo(
    () => [
      mutation.isPending ? t('submit.pending') : t('submit.idle'),
      mutation.isPending,
    ],
    [mutation.isPending, t],
  );

  const onSubmit = handleSubmit((values) => {
    const payload: CreateToolPayload = {
      name: values.name.trim(),
      category: values.category.trim(),
      type: values.type.trim(),
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => Boolean(tag)),
      source: values.source.trim(),
    };

    mutation.mutate(payload);
  });

  return (
    <form className={`glass panel ${styles.form}`} onSubmit={(event) => void onSubmit(event)}>
      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="name">
          {t('fields.name.label')}
        </label>
        <input id="name" className="input" placeholder={t('fields.name.placeholder')} {...register('name')} />
        {errors.name && <p className="error-text">{errors.name.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="category">
          {t('fields.category.label')}
        </label>
        <input id="category" className="input" placeholder={t('fields.category.placeholder')} {...register('category')} />
        {errors.category && <p className="error-text">{errors.category.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="type">
          {t('fields.type.label')}
        </label>
        <input id="type" className="input" placeholder={t('fields.type.placeholder')} {...register('type')} />
        {errors.type && <p className="error-text">{errors.type.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="tags">
          {t('fields.tags.label')}
        </label>
        <input id="tags" className="input" placeholder={t('fields.tags.placeholder')} {...register('tags')} />
        <p className={`text-subtle ${styles.helperTight}`}>{t('helpers.tags')}</p>
        {errors.tags && <p className="error-text">{errors.tags.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="source">
          {t('fields.source.label')}
        </label>
        <input id="source" className="input" placeholder={t('fields.source.placeholder')} {...register('source')} />
        {errors.source && <p className="error-text">{errors.source.message}</p>}
      </div>

      {mutation.isError && (
        <p className={`error-text ${styles.errorInline}`}>
          {mutation.error instanceof Error ? mutation.error.message : t('feedback.error')}
        </p>
      )}

      {mutation.isSuccess && !mutation.isError && (
        <p className={styles.successMessage}>{t('feedback.success')}</p>
      )}

      <button className="primary-btn" type="submit" disabled={submitDisabled} aria-busy={submitDisabled}>
        {submitLabel}
      </button>
    </form>
  );
}

export default ToolCreationForm;
