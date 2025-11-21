'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

const formSchema = testSchema
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
  });

type FormValues = z.infer<typeof formSchema>;

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
  isStandardized: false,
  publisher: null,
  priceRange: null,
  buyLink: null,
  notes: null,
  domains: [],
  tags: [],
};

async function fetchTests() {
  const response = await fetch('/api/tests');

  if (!response.ok) {
    throw new Error('Impossible de récupérer les tests');
  }

  const json = (await response.json()) as ApiResponse;
  const parsed = testsResponseSchema.parse({ tests: json.tests ?? [] });
  return parsed.tests;
}

async function fetchTaxonomy() {
  const response = await fetch('/api/tests/taxonomy');

  if (!response.ok) {
    throw new Error('Impossible de charger les domaines et tags');
  }

  const json = await response.json();
  return taxonomyResponseSchema.parse(json);
}

async function createTest(payload: FormValues) {
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? "Impossible de créer le test");
  }

  return (await response.json()) as ApiResponse;
}

async function updateTest(payload: FormValues) {
  const response = await fetch('/api/tests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? "Impossible de mettre à jour le test");
  }

  return (await response.json()) as ApiResponse;
}

function TestForm() {
  const queryClient = useQueryClient();
  const { data: taxonomy } = useQuery({ queryKey: ['test-taxonomy'], queryFn: fetchTaxonomy });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: fetchTests });
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const domainInputRef = useRef<HTMLInputElement | null>(null);
  const tagInputRef = useRef<HTMLInputElement | null>(null);

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
  const populationValue = watch('population');
  const materialsValue = watch('materials');

  useEffect(() => {
    if (!selectedTestId) {
      reset(defaultValues);
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
      });
    }
  }, [reset, selectedTestId, tests]);

  const createMutation = useMutation({
    mutationFn: createTest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
      reset(defaultValues);
      setSelectedTestId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
    },
  });

  const [submitLabel, submitDisabled] = useMemo(() => {
    const pending = createMutation.isPending || updateMutation.isPending;
    const label = pending ? 'Enregistrement…' : selectedTestId ? 'Mettre à jour' : 'Créer le test';
    return [label, pending];
  }, [createMutation.isPending, updateMutation.isPending, selectedTestId]);

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
    };

    if (payload.id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  });

  function addDomain(value: string) {
    const next = Array.from(new Set([...(currentDomains ?? []), value.trim()].filter(Boolean)));
    setValue('domains', next, { shouldDirty: true });
  }

  function addTag(value: string) {
    const next = Array.from(new Set([...(currentTags ?? []), value.trim()].filter(Boolean)));
    setValue('tags', next, { shouldDirty: true });
  }

  function removeDomain(value: string) {
    setValue(
      'domains',
      (currentDomains ?? []).filter((domain) => domain !== value),
      { shouldDirty: true },
    );
  }

  function removeTag(value: string) {
    setValue(
      'tags',
      (currentTags ?? []).filter((tag) => tag !== value),
      { shouldDirty: true },
    );
  }

  return (
    <form className="notion-form" onSubmit={(event) => void onSubmit(event)}>
      <div className="notion-toolbar">
        <div className="notion-toolbar__group">
          <Label htmlFor="test-selector">Fiche</Label>
          <Select
            id="test-selector"
            value={selectedTestId ?? ''}
            onChange={(event) => setSelectedTestId(event.target.value || null)}
          >
            <option value="">Nouveau test</option>
            {(tests ?? []).map((test) => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </Select>
          {selectedTestId ? <Badge variant="outline">Mode édition</Badge> : <Badge>Nouvelle fiche</Badge>}
        </div>

        <div className="notion-toolbar__group">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset(defaultValues);
              setSelectedTestId(null);
            }}
          >
            Réinitialiser
          </Button>
          <Button type="submit" disabled={submitDisabled} aria-busy={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <Input
        id="name"
        className="notion-title-input"
        placeholder="Nom du test (ex : Évaluation du langage)"
        {...register('name')}
      />
      {errors.name && <p className="error-text">{errors.name.message}</p>}

      <Card className="property-panel">
        <CardHeader>
          <CardTitle>Propriétés</CardTitle>
          <p className="helper-text">Pensez aux propriétés clés comme dans une fiche Notion.</p>
        </CardHeader>
        <CardContent className="property-grid">
          <div className="property-row">
            <div className="property-label">Âge (mois)</div>
            <div className="property-value">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                <Input
                  id="ageMinMonths"
                  type="number"
                  placeholder="36"
                  {...register('ageMinMonths', {
                    setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                  })}
                />
                <Input
                  id="ageMaxMonths"
                  type="number"
                  placeholder="120"
                  {...register('ageMaxMonths', {
                    setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                  })}
                />
              </div>
              {(errors.ageMinMonths || errors.ageMaxMonths) && (
                <p className="error-text">{errors.ageMinMonths?.message || errors.ageMaxMonths?.message}</p>
              )}
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Durée</div>
            <div className="property-value">
              <Input
                id="durationMinutes"
                type="number"
                placeholder="45"
                {...register('durationMinutes', {
                  setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                })}
              />
              {errors.durationMinutes && <p className="error-text">{errors.durationMinutes.message}</p>}
              <p className="helper-text">Temps moyen estimé en minutes.</p>
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Population</div>
            <div className="property-value">
              <Input
                id="population"
                placeholder="Enfants, adolescents, adultes…"
                {...register('population', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Éditeur</div>
            <div className="property-value">
              <Input
                id="publisher"
                placeholder="Maison d'édition"
                {...register('publisher', { setValueAs: (value) => (value === '' ? null : value) })}
              />
              <Input
                id="priceRange"
                placeholder="Fourchette de prix"
                {...register('priceRange', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Achat</div>
            <div className="property-value">
              <Input
                id="buyLink"
                placeholder="Lien d'achat (URL)"
                {...register('buyLink', { setValueAs: (value) => (value === '' ? null : value) })}
              />
              {errors.buyLink && <p className="error-text">{errors.buyLink.message}</p>}
              <Input
                id="materials"
                placeholder="Matériel requis"
                {...register('materials', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Standardisation</div>
            <div className="property-value">
              <label className={cn('pill-toggle', watch('isStandardized') && 'is-active')}>
                <input type="checkbox" {...register('isStandardized')} style={{ display: 'none' }} />
                {watch('isStandardized') ? 'Standardisé' : 'Non standardisé'}
              </label>
              <p className="helper-text">Basculer selon la nature du protocole.</p>
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Domaines</div>
            <div className="property-value">
              <div className="pill-collection">
                {(taxonomy?.domains ?? []).map((domain) => {
                  const isSelected = (currentDomains ?? []).includes(domain.name);
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      className={cn('pill-toggle', isSelected && 'is-active')}
                      onClick={() => (isSelected ? removeDomain(domain.name) : addDomain(domain.name))}
                    >
                      {domain.name}
                    </button>
                  );
                })}
              </div>
              <div className="notion-toolbar__group">
                <Input
                  id="domainInput"
                  placeholder="Ajouter un domaine"
                  ref={domainInputRef}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addDomain((event.currentTarget as HTMLInputElement).value);
                      (event.currentTarget as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = domainInputRef.current;
                    if (input && input.value) {
                      addDomain(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Ajouter
                </Button>
              </div>
              <p className="helper-text">Domaines actifs : {(currentDomains ?? []).join(', ') || 'aucun'}</p>
            </div>
          </div>

          <div className="property-row">
            <div className="property-label">Tags</div>
            <div className="property-value">
              <div className="pill-collection">
                {(taxonomy?.tags ?? []).map((tag) => {
                  const isSelected = (currentTags ?? []).includes(tag.label);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={cn('pill-toggle', isSelected && 'is-active')}
                      onClick={() => (isSelected ? removeTag(tag.label) : addTag(tag.label))}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              <div className="notion-toolbar__group">
                <Input
                  id="tagInput"
                  placeholder="Ajouter un tag"
                  ref={tagInputRef}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag((event.currentTarget as HTMLInputElement).value);
                      (event.currentTarget as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = tagInputRef.current;
                    if (input && input.value) {
                      addTag(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Ajouter
                </Button>
              </div>
              <p className="helper-text">Tags actifs : {(currentTags ?? []).join(', ') || 'aucun'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="content-grid">
        <Card>
          <CardHeader>
            <CardTitle>Résumé détaillé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="property-value">
              <Label htmlFor="shortDescription">Description longue</Label>
              <Textarea
                id="shortDescription"
                placeholder="Présentez l'outil et ce qui le rend unique."
                {...register('shortDescription', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
            <Separator />
            <div className="property-value">
              <Label htmlFor="objective">Objectif</Label>
              <Textarea
                id="objective"
                placeholder="Que mesure ce test ? Dans quel contexte l'utiliser ?"
                {...register('objective', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
            <Separator />
            <div className="property-value">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                placeholder="Observations internes ou liens vers des ressources connexes."
                {...register('notes', { setValueAs: (value) => (value === '' ? null : value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="property-value">
              <Label htmlFor="population-secondary">Public cible</Label>
              <Input
                id="population-secondary"
                placeholder="Compléter le public si besoin"
                value={populationValue ?? ''}
                onChange={(event) =>
                  setValue('population', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
                }
              />
            </div>
            <Separator />
            <div className="property-value">
              <Label htmlFor="materials-secondary">Matériel détaillé</Label>
              <Textarea
                id="materials-secondary"
                placeholder="Listez le matériel précis, les grilles ou supports nécessaires."
                value={materialsValue ?? ''}
                onChange={(event) =>
                  setValue('materials', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {(createMutation.isError || updateMutation.isError) && (
        <p className="error-text" style={{ margin: 0 }}>
          {createMutation.error?.message || updateMutation.error?.message || 'Une erreur est survenue.'}
        </p>
      )}

      {(createMutation.isSuccess || updateMutation.isSuccess) && !createMutation.isError && !updateMutation.isError && (
        <p style={{ margin: 0, color: '#16a34a', fontWeight: 600 }}>
          Le test et ses relations ont été enregistrés.
        </p>
      )}
    </form>
  );
}

export default TestForm;
