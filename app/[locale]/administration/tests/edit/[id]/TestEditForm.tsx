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
  const [ageUnit, setAgeUnit] = useState<'weeks' | 'months' | 'years'>(
    test.targetAudience === 'adult' ? 'years' : 'months',
  );
  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    setFormState(toFormState(test));
    setAgeUnit(test.targetAudience === 'adult' ? 'years' : 'months');
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

  const ageUnitOptions = useMemo(
    () => [
      { label: t('ageUnitWeeks'), value: 'weeks' },
      { label: t('ageUnitMonths'), value: 'months' },
    ],
    [t],
  );

  useEffect(() => {
    if (formState.targetAudience === 'adult') {
      setAgeUnit('years');
    } else if (ageUnit === 'years') {
      setAgeUnit('months');
    }
  }, [formState.targetAudience, ageUnit]);

  const toDisplayValue = (valueMonths: number | null, unit: 'weeks' | 'months' | 'years') => {
    if (valueMonths === null) return '';
    if (unit === 'weeks') return Math.round(valueMonths * 4);
    if (unit === 'years') return Number((valueMonths / 12).toFixed(1));
    return valueMonths;
  };

  const toMonthsValue = (value: number | null, unit: 'weeks' | 'months' | 'years') => {
    if (value === null) return null;
    if (unit === 'weeks') return Math.round(value / 4);
    if (unit === 'years') return Math.round(value * 12);
    return Math.round(value);
  };

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
            {formState.targetAudience === 'adult' ? t('ageMinAdultLabel') : t('ageMinLabel')}
          </label>
          <Input
            id="ageMinMonths"
            type="number"
            min={0}
            step={formState.targetAudience === 'adult' ? 0.5 : 1}
            value={toDisplayValue(formState.ageMinMonths, ageUnit)}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                ageMinMonths: toMonthsValue(
                  event.target.value === '' ? null : Number(event.target.value),
                  ageUnit,
                ),
              }))
            }
            placeholder={formState.targetAudience === 'adult' ? t('ageMinAdultPlaceholder') : t('ageMinPlaceholder')}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel} htmlFor="ageMaxMonths">
            {formState.targetAudience === 'adult' ? t('ageMaxAdultLabel') : t('ageMaxLabel')}
          </label>
          <Input
            id="ageMaxMonths"
            type="number"
            min={0}
            step={formState.targetAudience === 'adult' ? 0.5 : 1}
            value={toDisplayValue(formState.ageMaxMonths, ageUnit)}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                ageMaxMonths: toMonthsValue(
                  event.target.value === '' ? null : Number(event.target.value),
                  ageUnit,
                ),
              }))
            }
            placeholder={formState.targetAudience === 'adult' ? t('ageMaxAdultPlaceholder') : t('ageMaxPlaceholder')}
          />
        </div>

        {formState.targetAudience === 'child' && (
          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor="ageUnit">
              {t('ageUnitLabel')}
            </label>
            <Select
              id="ageUnit"
              value={ageUnit}
              onChange={(event) => setAgeUnit(event.target.value as 'weeks' | 'months')}
            >
              {ageUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}
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
