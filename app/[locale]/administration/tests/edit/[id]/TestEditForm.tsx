'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Locale } from '@/i18n/routing';
import type { TaxonomyResponse, TestDto } from '@/lib/validation/tests';
import styles from './tests-edit.module.css';

type TestEditFormProps = {
  test: TestDto;
  locale: Locale;
  mode: 'edit' | 'create';
};

type FormState = Pick<
  TestDto,
  | 'name'
  | 'slug'
  | 'shortDescription'
  | 'objective'
  | 'ageMinMonths'
  | 'ageMaxMonths'
  | 'status'
  | 'targetAudience'
  | 'domains'
  | 'themes'
  | 'tags'
>;

type FeedbackState = 'success' | 'error' | null;

const toFormState = (test: TestDto): FormState => ({
  name: test.name,
  slug: test.slug,
  shortDescription: test.shortDescription,
  objective: test.objective,
  ageMinMonths: test.ageMinMonths,
  ageMaxMonths: test.ageMaxMonths,
  status: test.status,
  targetAudience: test.targetAudience,
  domains: test.domains,
  themes: test.themes,
  tags: test.tags,
});

export default function TestEditForm({ test, locale, mode }: TestEditFormProps) {
  const t = useTranslations('AdminTests.edit.form');
  const gridT = useTranslations('AdminTests.grid');
  const multiSelectT = useTranslations('AdminTests.edit.multiSelect');

  const [formState, setFormState] = useState<FormState>(() => toFormState(test));
  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    setFormState(toFormState(test));
  }, [test]);

  useEffect(() => {
    let isMounted = true;
    const loadTaxonomy = async () => {
      const response = await fetch(`/api/tests/taxonomy?locale=${locale}`, { credentials: 'include' });
      if (!response.ok) return;
      const data = (await response.json()) as TaxonomyResponse;
      if (isMounted) setTaxonomy(data);
    };

    void loadTaxonomy();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const statusOptions = useMemo(
    () => [
      { label: gridT('status.draft'), value: 'draft' },
      { label: gridT('status.in_review'), value: 'in_review' },
      { label: gridT('status.published'), value: 'published' },
      { label: gridT('status.archived'), value: 'archived' },
    ],
    [gridT],
  );

  const audienceOptions = useMemo(
    () => [
      { label: gridT('audience.child'), value: 'child' },
      { label: gridT('audience.adult'), value: 'adult' },
    ],
    [gridT],
  );

  const multiSelectTranslations = useMemo(
    () => ({
      add: multiSelectT('add'),
      remove: multiSelectT('remove'),
      clear: multiSelectT('clear'),
      close: multiSelectT('close'),
      emptySelection: multiSelectT('emptySelection'),
      emptyResults: multiSelectT('emptyResults'),
      loading: multiSelectT('loading'),
      searchPlaceholder: multiSelectT('searchPlaceholder'),
      dialogTitle: multiSelectT('dialogTitle', { label: '' }),
      dialogHelper: multiSelectT('dialogHelper'),
    }),
    [multiSelectT],
  );

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/tests', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: mode === 'edit' ? test.id : undefined,
          locale,
          name: formState.name,
          slug: formState.slug,
          shortDescription: formState.shortDescription,
          objective: formState.objective,
          ageMinMonths: formState.ageMinMonths,
          ageMaxMonths: formState.ageMaxMonths,
          status: formState.status,
          targetAudience: formState.targetAudience,
          domains: formState.domains,
          themes: formState.themes,
          tags: formState.tags,
        }),
      });

      if (!response.ok) {
        throw new Error('updateError');
      }

      const json = (await response.json()) as { test: TestDto };
      setFormState(toFormState(json.test));
      setFeedback('success');
    } catch (error) {
      console.error(error);
      setFeedback('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
      <div className={styles.formGrid}>
        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="name">
            {t('nameLabel')}
          </label>
          <Input
            id="name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={t('namePlaceholder')}
            required
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="slug">
            {t('slugLabel')}
          </label>
          <Input
            id="slug"
            value={formState.slug}
            onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder={t('slugPlaceholder')}
            required
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="status">
            {t('statusLabel')}
          </label>
          <Select
            id="status"
            value={formState.status}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, status: event.target.value as TestDto['status'] }))
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="audience">
            {t('audienceLabel')}
          </label>
          <Select
            id="audience"
            value={formState.targetAudience}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                targetAudience: event.target.value as TestDto['targetAudience'],
              }))
            }
          >
            {audienceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="ageMinMonths">
            {t('ageMinLabel')}
          </label>
          <Input
            id="ageMinMonths"
            type="number"
            min={0}
            value={formState.ageMinMonths ?? ''}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                ageMinMonths: event.target.value === '' ? null : Number(event.target.value),
              }))
            }
            placeholder={t('ageMinPlaceholder')}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="ageMaxMonths">
            {t('ageMaxLabel')}
          </label>
          <Input
            id="ageMaxMonths"
            type="number"
            min={0}
            value={formState.ageMaxMonths ?? ''}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                ageMaxMonths: event.target.value === '' ? null : Number(event.target.value),
              }))
            }
            placeholder={t('ageMaxPlaceholder')}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <label className={styles.formLabel} htmlFor="shortDescription">
          {t('shortDescriptionLabel')}
        </label>
        <Textarea
          id="shortDescription"
          value={formState.shortDescription ?? ''}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              shortDescription: event.target.value ? event.target.value : null,
            }))
          }
          placeholder={t('shortDescriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.formLabel} htmlFor="objective">
          {t('objectiveLabel')}
        </label>
        <Textarea
          id="objective"
          value={formState.objective ?? ''}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              objective: event.target.value ? event.target.value : null,
            }))
          }
          placeholder={t('objectivePlaceholder')}
          rows={4}
        />
      </div>

      <div className={styles.formRow}>
        <MultiSelect
          label={t('domainsLabel')}
          options={taxonomy?.domains ?? []}
          selectedValues={formState.domains}
          onChange={(values) => setFormState((prev) => ({ ...prev, domains: values }))}
          translations={multiSelectTranslations}
          isLoading={!taxonomy}
        />
      </div>

      <div className={styles.formRow}>
        <MultiSelect
          label={t('themesLabel')}
          options={taxonomy?.themes ?? []}
          selectedValues={formState.themes}
          onChange={(values) => setFormState((prev) => ({ ...prev, themes: values }))}
          translations={multiSelectTranslations}
          isLoading={!taxonomy}
        />
      </div>

      <div className={styles.formRow}>
        <MultiSelect
          label={t('tagsLabel')}
          options={taxonomy?.tags ?? []}
          selectedValues={formState.tags}
          onChange={(values) => setFormState((prev) => ({ ...prev, tags: values }))}
          translations={multiSelectTranslations}
          isLoading={!taxonomy}
        />
      </div>

      <div className={styles.formActions}>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t('saving') : mode === 'create' ? t('create') : t('save')}
        </Button>
        {feedback === 'success' && <p className={styles.successMessage}>{t('success')}</p>}
        {feedback === 'error' && <p className={styles.errorMessage}>{t('error')}</p>}
      </div>
    </form>
  );
}
