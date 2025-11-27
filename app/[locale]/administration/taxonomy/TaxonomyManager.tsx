'use client';

import { useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import type {
  TaxonomyDeletionInput,
  TaxonomyMutationInput,
  TaxonomyResponse,
} from '@/lib/validation/tests';

const taxonomyQueryKey = (locale: Locale) => ['test-taxonomy', locale] as const;

const colorSwatches = ['#0EA5E9', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

type Tab = 'pathologies' | 'domains' | 'tags';
type StatusFilter = 'all' | 'withDescription' | 'withSynonyms' | 'withColor' | 'withoutColor';
type ViewMode = 'table' | 'compact';

type TaxonomyListItem = {
  id: string;
  label: string;
  slug?: string;
  color?: string | null;
  description?: string | null;
  synonyms?: string[];
};

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
);
const FolderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const HashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M9 3 7 21" />
    <path d="M17 3 15 21" />
    <path d="M3 9h19" />
    <path d="M2 15h19" />
  </svg>
);
const StethoscopeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M6 3v6a6 6 0 0 0 12 0V3" />
    <path d="M8 15a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const TableIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
  </svg>
);
const CardsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <rect width="9" height="13" x="3" y="4" rx="2" />
    <rect width="9" height="13" x="12" y="7" rx="2" />
  </svg>
);
export default function TaxonomyManager() {
  const t = useTranslations('taxonomy');
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;

  const [activeTab, setActiveTab] = useState<Tab>('pathologies');
  const [editingItem, setEditingItem] = useState<TaxonomyListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    pathologies: null,
    domains: null,
    tags: null,
  });

  // Form States
  const [labelInput, setLabelInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [synonymsInput, setSynonymsInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  const resetForm = useCallback(() => {
    setEditingItem(null);
    setLabelInput('');
    setDescInput('');
    setSynonymsInput('');
    setColorInput('');
    setErrorMessage(null);
    setSaveAttempted(false);
  }, []);

  // Reset form when tab changes
  useEffect(() => {
    resetForm();
    setStatusFilter('all');
    setSearchTerm('');
  }, [activeTab, resetForm]);

  // --- Data Fetching ---
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: taxonomyQueryKey(locale),
    queryFn: async () => {
      const res = await fetch(`/api/tests/taxonomy?locale=${locale}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(t('errors.fetchTaxonomy'));
      return (await res.json()) as TaxonomyResponse;
    },
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (payload: TaxonomyMutationInput & { id?: string }) => {
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch('/api/tests/taxonomy', {
        method: method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editingItem?.id }),
      });
      
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || t('errors.createGeneric'));
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey(locale) });

      const toastKeys = {
        domain: editingItem ? 'toast.domainUpdated' : 'toast.domainCreated',
        tag: editingItem ? 'toast.tagUpdated' : 'toast.tagCreated',
        pathology: editingItem ? 'toast.pathologyUpdated' : 'toast.pathologyCreated',
      } as const;

      const msg = t(toastKeys[variables.type]); 
      showToast(msg);
      resetForm();
    },
    onError: (err) => setErrorMessage(err instanceof Error ? err.message : t('errors.unknown')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: TaxonomyDeletionInput) => {
      const res = await fetch('/api/tests/taxonomy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t('errors.deleteGeneric'));
      return res.json();
    },
    onMutate: (vars) => setDeletingId(vars.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey(locale) });
      showToast(t('toast.itemDeleted'));
      setDeletingId(null);
      if (editingItem) resetForm();
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : t('errors.unknown'));
      setDeletingId(null);
    },
  });

  const handleSave = () => {
    setSaveAttempted(true);
    if (!labelInput.trim()) return;

    const payload: TaxonomyMutationInput = {
      type: activeTab === 'domains' ? 'domain' : activeTab === 'tags' ? 'tag' : 'pathology',
      locale,
      value: labelInput,
    };

    if (activeTab === 'pathologies') {
      payload.description = descInput;
      payload.synonyms = synonymsInput;
    }
    if (activeTab === 'tags') {
      payload.color = colorInput;
    }

    saveMutation.mutate(payload);
  };

  const handleEdit = (item: TaxonomyListItem) => {
    setEditingItem(item);
    setLabelInput(item.label);
    setDescInput(item.description || '');
    setSynonymsInput(item.synonyms?.join(', ') || '');
    setColorInput(item.color || '');
    setErrorMessage(null);
    setSaveAttempted(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Lists ---
  const activeList = useMemo<TaxonomyListItem[]>(() => {
    if (!data) return [];
    const list = (data[activeTab] ?? []) as TaxonomyListItem[];
    return [...list].sort((a, b) => a.label.localeCompare(b.label));
  }, [data, activeTab]);

  const tabCounts = useMemo(() => {
    if (!data) {
      return {
        pathologies: 0,
        domains: 0,
        tags: 0,
      } satisfies Record<Tab, number>;
    }

    return {
      pathologies: (data.pathologies || []).length,
      domains: (data.domains || []).length,
      tags: (data.tags || []).length,
    } satisfies Record<Tab, number>;
  }, [data]);

  const tabOrder: Tab[] = ['pathologies', 'domains', 'tags'];
  const tabPanelId = 'taxonomy-tabpanel';

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: Tab) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = tabOrder.indexOf(currentTab);

    if (event.key === 'Home') {
      setActiveTab(tabOrder[0]);
      tabRefs.current[tabOrder[0]]?.focus();
      return;
    }

    if (event.key === 'End') {
      setActiveTab(tabOrder[tabOrder.length - 1]);
      tabRefs.current[tabOrder[tabOrder.length - 1]]?.focus();
      return;
    }

    const offset = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + offset + tabOrder.length) % tabOrder.length;
    const nextTab = tabOrder[nextIndex];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const showTabLoading = isLoading || isFetching;

  const tabs = [
    { value: 'pathologies' as const, icon: StethoscopeIcon },
    { value: 'domains' as const, icon: FolderIcon },
    { value: 'tags' as const, icon: HashIcon },
  ];

  const statusOptions = useMemo(
    () =>
      ({
        pathologies: [
          { value: 'all', label: t('filters.status.all') },
          { value: 'withDescription', label: t('filters.status.withDescription') },
          { value: 'withSynonyms', label: t('filters.status.withSynonyms') },
        ],
        domains: [{ value: 'all', label: t('filters.status.all') }],
        tags: [
          { value: 'all', label: t('filters.status.all') },
          { value: 'withColor', label: t('filters.status.withColor') },
          { value: 'withoutColor', label: t('filters.status.withoutColor') },
        ],
      }) satisfies Record<Tab, { value: StatusFilter; label: string }[]>,
    [t],
  );

  const alreadyExists = !editingItem && activeList.some(
    (item) => item.label.toLowerCase() === labelInput.trim().toLowerCase(),
  );

  const labelHasError = alreadyExists || (saveAttempted && !labelInput.trim());
  const colorHasError = Boolean(colorInput && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorInput.trim()));
  const actionLabel = saveMutation.isPending
    ? t('buttons.savePending')
    : editingItem
      ? t('buttons.update')
      : t('buttons.add');

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return activeList.filter((item) => {
      const matchesSearch = term
        ? [item.label, item.description, item.synonyms?.join(', ')].some((value) =>
            value?.toLowerCase().includes(term),
          )
        : true;

      if (!matchesSearch) return false;

      if (statusFilter === 'withDescription') {
        return Boolean(item.description);
      }

      if (statusFilter === 'withSynonyms') {
        return Boolean(item.synonyms && item.synonyms.length > 0);
      }

      if (statusFilter === 'withColor') {
        return Boolean(item.color);
      }

      if (statusFilter === 'withoutColor') {
        return !item.color;
      }

      return true;
    });
  }, [activeList, searchTerm, statusFilter]);

  const renderStatusHelper = (status: 'error' | 'info', message: string) => (
    <p
      className={cn(
        'text-xs mt-1 flex items-center gap-2 rounded-md border px-2 py-1',
        status === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-sky-200 bg-sky-50 text-sky-800',
      )}
      role={status === 'error' ? 'alert' : undefined}
    >
      <span
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold',
          status === 'error' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-800',
        )}
        aria-hidden
      >
        {status === 'error' ? '!' : 'i'}
      </span>
      <span className="leading-tight">{message}</span>
    </p>
  );

  const Spinner = ({ className }: { className?: string }) => (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-hidden
    />
  );


  return (
    <div className="relative">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="self-start space-y-4 lg:sticky lg:top-4">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t('sectionLabel')}</p>
              <CardTitle className="text-xl text-slate-900">{t('pageTitle')}</CardTitle>
              <p className="text-sm text-slate-500">{t('pageLead')}</p>
            </CardHeader>
            <CardContent className="p-0">
              <nav role="tablist" aria-label={t('common.listTitle')} className="divide-y divide-slate-100">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      ref={(node) => {
                        tabRefs.current[tab.value] = node;
                      }}
                      role="tab"
                      aria-selected={activeTab === tab.value}
                      aria-controls={tabPanelId}
                      id={`taxonomy-tab-${tab.value}`}
                      tabIndex={activeTab === tab.value ? 0 : -1}
                      onClick={() => setActiveTab(tab.value)}
                      onKeyDown={(event) => handleTabKeyDown(event, tab.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200',
                        activeTab === tab.value ? 'bg-slate-50' : 'hover:bg-slate-50/70',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border text-slate-700',
                            activeTab === tab.value ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-slate-50',
                          )}
                        >
                          <Icon />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{t(`${tab.value}.toolbarTitle`)}</p>
                          <p className="text-xs text-slate-500">{t(`${tab.value}.cardHelper`)}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="h-7 min-w-[2.5rem] justify-center rounded-full bg-slate-900/5 text-xs font-semibold text-slate-700"
                        aria-live="polite"
                        aria-busy={showTabLoading}
                      >
                        {showTabLoading ? (
                          <span className="inline-flex h-3 w-8 animate-pulse rounded-full bg-slate-200" aria-hidden />
                        ) : (
                          tabCounts[tab.value]
                        )}
                        <span className="sr-only">{t('common.listTitle')}</span>
                      </Badge>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <div
          id={tabPanelId}
          role="tabpanel"
          aria-labelledby={`taxonomy-tab-${activeTab}`}
          className="space-y-6"
        >
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="gap-3 border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {t(`${activeTab}.toolbarTitle`)}
                  </p>
                  <CardTitle className="text-lg text-slate-900">
                    {editingItem ? t('common.editTitle') : t(`${activeTab}.cardTitle`)}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{t(`${activeTab}.cardHelper`)}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  {t('common.listTitle')}: {tabCounts[activeTab]}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <section className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">{t('sections.mainInfo')}</p>
                    <p className="text-xs leading-relaxed text-slate-500">{t('helpers.label')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {t(`${activeTab}.label`)}
                    </Label>
                    <Input
                      id="label"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      placeholder={t(`${activeTab}.placeholder`)}
                      className={cn(
                        'bg-white',
                        labelHasError && 'border-red-300 text-red-900 focus-visible:border-red-400 focus-visible:ring-red-200',
                      )}
                      aria-invalid={labelHasError}
                      aria-describedby="taxonomy-label-help"
                    />
                    <div id="taxonomy-label-help">
                      {labelHasError
                        ? renderStatusHelper(
                            'error',
                            alreadyExists ? t(`${activeTab}.exists`) : t('validation.labelRequired'),
                          )
                        : renderStatusHelper('info', t('helpers.label'))}
                    </div>
                  </div>
                </section>

                {activeTab === 'tags' && (
                  <section className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">{t('sections.color')}</p>
                      <p className="text-xs leading-relaxed text-slate-500">{t('helpers.color')}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="color" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {t('tags.colorLabel')}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            id="color"
                            value={colorInput || colorSwatches[0]}
                            onChange={(e) => setColorInput(e.target.value)}
                            className="h-11 w-16 bg-white p-1"
                            aria-describedby="taxonomy-color-help"
                          />
                          <Input
                            type="text"
                            inputMode="text"
                            id="color-hex"
                            value={colorInput}
                            onChange={(e) => setColorInput(e.target.value)}
                            placeholder={t('tags.colorPlaceholder')}
                            className={cn(
                              'flex-1 bg-white',
                              colorHasError && 'border-red-300 text-red-900 focus-visible:border-red-400 focus-visible:ring-red-200',
                            )}
                            aria-invalid={colorHasError}
                            aria-describedby="taxonomy-color-help"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2" role="list" aria-label={t('tags.swatchesLabel')}>
                        {colorSwatches.map((swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            onClick={() => setColorInput(swatch)}
                            aria-label={t('tags.swatchAria', { color: swatch })}
                            className={cn(
                              'group relative h-9 w-9 rounded-full border border-slate-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200',
                              colorInput === swatch && 'ring-2 ring-amber-200',
                            )}
                          >
                            <span
                              aria-hidden
                              className="absolute inset-[5px] rounded-full"
                              style={{ backgroundColor: swatch }}
                            />
                          </button>
                        ))}
                      </div>

                      <div id="taxonomy-color-help">
                        {colorHasError
                          ? renderStatusHelper('error', t('validation.colorFormat'))
                          : renderStatusHelper('info', t('helpers.color'))}
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'pathologies' && (
                  <section className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">{t('sections.pathologyDetails')}</p>
                      <p className="text-xs leading-relaxed text-slate-500">{t('helpers.pathologyBadge')}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {t('pathologies.descLabel')}
                        </Label>
                        <Textarea
                          id="description"
                          value={descInput}
                          onChange={(e) => setDescInput(e.target.value)}
                          placeholder={t('pathologies.descPlaceholder')}
                          rows={4}
                          className="bg-white"
                        />
                        <p className="text-xs text-slate-500">{t('helpers.description')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="synonyms" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {t('pathologies.synonymsLabel')}
                        </Label>
                        <Input
                          id="synonyms"
                          value={synonymsInput}
                          onChange={(e) => setSynonymsInput(e.target.value)}
                          placeholder={t('pathologies.synonymsPlaceholder')}
                          className="bg-white"
                        />
                        <p className="text-xs text-slate-500">{t('pathologies.synonymsHelper')}</p>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="text-xs text-slate-500">
                    {editingItem ? t('common.editingBadge') : t('states.emptyLead')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="text-slate-700"
                      onClick={() => {
                        resetForm();
                      }}
                      disabled={saveMutation.isPending}
                    >
                      {t('buttons.reset')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {actionLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="gap-4 border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-slate-900">{t('common.listTitle')}</CardTitle>
                  <p className="text-sm text-slate-500">{t('filters.statusLabel')}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="gap-2 px-3 text-slate-700"
                    aria-pressed={viewMode === 'table'}
                    aria-label={t('view.table')}
                  >
                    <TableIcon />
                    <span className="hidden text-xs font-medium sm:inline">{t('view.table')}</span>
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                    className="gap-2 px-3 text-slate-700"
                    aria-pressed={viewMode === 'compact'}
                    aria-label={t('view.compact')}
                  >
                    <CardsIcon />
                    <span className="hidden text-xs font-medium sm:inline">{t('view.compact')}</span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex flex-wrap gap-3">
                  <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-inner">
                    <SearchIcon />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('filters.searchPlaceholder')}
                      className="h-9 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                    />
                  </div>

                  <Select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="min-w-[200px]"
                  >
                    {statusOptions[activeTab].map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 rounded-full bg-slate-200" />
                          <div className="h-3 w-2/3 rounded-full bg-slate-100" />
                        </div>
                        <div className="flex gap-2">
                          <span className="h-8 w-8 rounded-lg bg-slate-200" />
                          <span className="h-8 w-8 rounded-lg bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="p-8 text-center text-red-500">{t('errors.unknown')}</div>
              ) : filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-slate-600">
                  <p className="text-base font-semibold text-slate-800">
                    {activeList.length === 0 ? t('common.empty') : t('filters.noResults')}
                  </p>
                  <p className="max-w-2xl text-sm text-slate-500">
                    {activeList.length === 0
                      ? t('states.emptyLead')
                      : t('filters.noResultsHelper', { query: searchTerm || t('filters.statusLabel') })}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                      <div className="min-w-[680px] divide-y divide-slate-100">
                        <div className="grid grid-cols-12 bg-slate-50/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <span className="col-span-4">{t('table.columns.label')}</span>
                          <span className={activeTab === 'tags' ? 'col-span-4' : 'col-span-5'}>
                            {activeTab === 'pathologies' ? t('table.columns.details') : t('table.columns.helper')}
                          </span>
                          {activeTab === 'tags' && <span className="col-span-2">{t('table.columns.color')}</span>}
                          <span className={cn(activeTab === 'tags' ? 'col-span-2' : 'col-span-3', 'text-right')}>
                            {t('table.columns.actions')}
                          </span>
                        </div>

                        {filteredList.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              'grid grid-cols-12 items-start gap-4 px-6 py-4 transition-colors',
                              'hover:bg-slate-50',
                              editingItem?.id === item.id && 'bg-amber-50/60 ring-1 ring-inset ring-amber-200',
                            )}
                          >
                            <div className="col-span-4 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    'truncate text-sm font-semibold text-slate-800',
                                    editingItem?.id === item.id && 'text-amber-900',
                                  )}
                                >
                                  {item.label}
                                </p>
                                {editingItem?.id === item.id && (
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-[10px] border-amber-200 bg-amber-100 text-amber-700"
                                  >
                                    {t('common.editingBadge')}
                                  </Badge>
                                )}
                              </div>

                              {activeTab === 'pathologies' && item.description && (
                                <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                              )}

                              {activeTab === 'pathologies' && item.synonyms && item.synonyms.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.synonyms.map((syn, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                                    >
                                      {syn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className={cn('min-w-0 space-y-2', activeTab === 'tags' ? 'col-span-4' : 'col-span-5')}>
                              {activeTab === 'tags' ? (
                                <p className="text-xs text-slate-600">
                                  {item.color ? t('helpers.color') : t('filters.status.withoutColor')}
                                </p>
                              ) : activeTab === 'domains' ? (
                                <p className="text-xs text-slate-600">{t('helpers.label')}</p>
                              ) : item.description || (item.synonyms && item.synonyms.length > 0) ? (
                                <>
                                  {item.description && (
                                    <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                                  )}
                                  {item.synonyms && item.synonyms.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {item.synonyms.map((syn, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                                        >
                                          {syn}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-slate-600">
                                  {t('helpers.label')}
                                </p>
                              )}
                            </div>

                            {activeTab === 'tags' && (
                              <div className="col-span-2 flex items-center gap-2">
                                <span
                                  className="block h-4 w-4 rounded-full ring-1 ring-slate-200"
                                  style={{ backgroundColor: item.color || '#e2e8f0' }}
                                  title={item.color || t('tags.colorFallback')}
                                />
                                <span className="text-xs text-slate-500">{item.color || t('tags.colorFallback')}</span>
                              </div>
                            )}

                            <div className={cn('flex items-center justify-end gap-1', activeTab === 'tags' ? 'col-span-2' : 'col-span-3')}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                                onClick={() => handleEdit(item)}
                                disabled={deleteMutation.isPending}
                                aria-label={t('buttons.edit')}
                              >
                                <EditIcon />
                                <span className="sr-only">{t('buttons.edit')}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  deleteMutation.mutate({
                                    type:
                                      activeTab === 'domains'
                                        ? 'domain'
                                        : activeTab === 'tags'
                                          ? 'tag'
                                          : 'pathology',
                                    id: item.id,
                                    locale,
                                  })
                                }
                                disabled={deleteMutation.isPending && deletingId === item.id}
                                aria-label={t('buttons.delete')}
                              >
                                {deleteMutation.isPending && deletingId === item.id ? (
                                  <Spinner className="h-3.5 w-3.5" />
                                ) : (
                                  <TrashIcon />
                                )}
                                <span className="sr-only">{t('buttons.delete')}</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ul className="grid gap-3 p-4 sm:grid-cols-2">
                      {filteredList.map((item) => (
                        <li
                          key={item.id}
                          className={cn(
                            'rounded-xl border border-slate-100 bg-white shadow-sm transition hover:border-slate-200',
                            editingItem?.id === item.id && 'border-amber-200 bg-amber-50/70',
                          )}
                        >
                          <div className="flex items-start gap-3 p-4">
                            {activeTab === 'tags' && (
                              <span
                                className="mt-0.5 block h-4 w-4 rounded-full ring-1 ring-slate-200"
                                style={{ backgroundColor: item.color || '#e2e8f0' }}
                                title={item.color || t('tags.colorFallback')}
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                {editingItem?.id === item.id && (
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-[10px] border-amber-200 bg-amber-100 text-amber-700"
                                  >
                                    {t('common.editingBadge')}
                                  </Badge>
                                )}
                              </div>
                              {activeTab === 'pathologies' && item.description && (
                                <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">{item.description}</p>
                              )}
                              {activeTab === 'pathologies' && item.synonyms && item.synonyms.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.synonyms.map((syn, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                                    >
                                      {syn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 px-2 text-slate-700"
                                onClick={() => handleEdit(item)}
                                disabled={deleteMutation.isPending}
                                aria-label={t('buttons.edit')}
                              >
                                <EditIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  deleteMutation.mutate({
                                    type:
                                      activeTab === 'domains'
                                        ? 'domain'
                                        : activeTab === 'tags'
                                          ? 'tag'
                                          : 'pathology',
                                    id: item.id,
                                    locale,
                                  })
                                }
                                disabled={deleteMutation.isPending && deletingId === item.id}
                                aria-label={t('buttons.delete')}
                              >
                                {deleteMutation.isPending && deletingId === item.id ? (
                                  <Spinner className="h-3.5 w-3.5" />
                                ) : (
                                  <TrashIcon />
                                )}
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
