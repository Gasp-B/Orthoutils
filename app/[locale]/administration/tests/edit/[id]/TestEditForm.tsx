'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select } from '@/components/ui/select';
import type { Locale } from '@/i18n/routing';
import type { TaxonomyResponse, TestDto } from '@/lib/validation/tests';
import styles from './tests-edit.module.css';

type TestEditFormProps = {
  test: TestDto;
  locale: Locale;
};

type FormState = Pick<TestDto, 'status' | 'targetAudience' | 'domains' | 'themes' | 'tags'>;

type FeedbackState = 'success' | 'error' | null;

const toFormState = (test: TestDto): FormState => ({
  status: test.status,
  targetAudience: test.targetAudience,
  domains: test.domains,
  themes: test.themes,
  tags: test.tags,
});

export default function TestEditForm({ test, locale }: TestEditFormProps) {
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: test.id,
          locale,
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
          {isSaving ? t('saving') : t('save')}
        </Button>
        {feedback === 'success' && <p className={styles.successMessage}>{t('success')}</p>}
        {feedback === 'error' && <p className={styles.errorMessage}>{t('error')}</p>}
      </div>
    </form>
  );
}
