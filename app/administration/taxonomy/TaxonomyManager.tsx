'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import styles from './taxonomy-manager.module.css';
import type { TaxonomyDeletionInput, TaxonomyMutationInput, TaxonomyResponse } from '@/lib/validation/tests';

const taxonomyQueryKey = ['test-taxonomy'] as const;

const REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Le chargement a expiré, veuillez réessayer.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTaxonomy() {
  const response = await fetchWithTimeout('/api/tests/taxonomy', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Impossible de récupérer les domaines et tags');
  }

  return (await response.json()) as TaxonomyResponse;
}

async function createTaxonomyItem(payload: TaxonomyMutationInput) {
  const response = await fetchWithTimeout('/api/tests/taxonomy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'Impossible de créer cet élément');
  }

  return response.json();
}

async function deleteTaxonomyItem(payload: TaxonomyDeletionInput) {
  const response = await fetchWithTimeout('/api/tests/taxonomy', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'Impossible de supprimer cet élément');
  }

  return response.json();
}

function TaxonomyManager() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({ queryKey: taxonomyQueryKey, queryFn: fetchTaxonomy });
  const [domainInput, setDomainInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const normalizedDomainInput = domainInput.trim();
  const normalizedTagInput = tagInput.trim();

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  const createMutation = useMutation({
    mutationFn: createTaxonomyItem,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey });
      showToast(
        variables.type === 'domain'
          ? 'Le domaine a été enregistré et sera disponible dans le formulaire de test.'
          : 'Le tag a été enregistré et sera disponible dans le formulaire de test.',
      );
      setErrorMessage(null);
      if (variables.type === 'domain') {
        setDomainInput('');
      }
      if (variables.type === 'tag') {
        setTagInput('');
      }
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Impossible de finaliser la création';
      setErrorMessage(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaxonomyItem,
    onMutate: (variables) => {
      setDeletingId(variables.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey });
      showToast('Élément supprimé. Les listes seront actualisées.');
      setErrorMessage(null);
      setDeletingId(null);
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Impossible de supprimer cet élément';
      setErrorMessage(message);
      setDeletingId(null);
    },
  });

  const sortedDomains = useMemo(
    () => [...(data?.domains ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data?.domains],
  );
  const sortedTags = useMemo(() => [...(data?.tags ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [data?.tags]);

  const domainExists = useMemo(
    () => sortedDomains.some((domain) => domain.name.trim().toLowerCase() === normalizedDomainInput.toLowerCase()),
    [normalizedDomainInput, sortedDomains],
  );

  const tagExists = useMemo(
    () => sortedTags.some((tag) => tag.name.trim().toLowerCase() === normalizedTagInput.toLowerCase()),
    [normalizedTagInput, sortedTags],
  );

  return (
    <div className="content-grid">
      {toastMessage && (
        <div role="status" aria-live="polite" className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {errorMessage && (
        <p className={`error-text ${styles.fullWidthError}`} role="alert">
          {errorMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Créer un domaine</CardTitle>
          <p className={`helper-text ${styles.helperTight}`}>
            Les domaines alimentent la liste « Domaines » du formulaire Ajouter / Éditer un test.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="notion-toolbar">
              <div>
                <p className={styles.toolbarTitle}>Domaines</p>
                <p className={`helper-text ${styles.helperTight}`}>
                  {sortedDomains.length} domaine{sortedDomains.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Separator />
            {isLoading && <p className="helper-text">Chargement des domaines…</p>}
            {isError && <p className="error-text">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {sortedDomains.length === 0 && (
                  <p className="helper-text">Aucun domaine enregistré pour le moment.</p>
                )}
                {sortedDomains.map((domain) => (
                  <div key={domain.id} className={`notion-toolbar__group ${styles.toolbarGroupJustify}`}>
                    <span>{domain.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Supprimer ${domain.name}`}
                      onClick={() => deleteMutation.mutate({ type: 'domain', id: domain.id })}
                      disabled={deleteMutation.isPending && deletingId === domain.id}
                    >
                      {deleteMutation.isPending && deletingId === domain.id ? 'Suppression…' : 'Supprimer'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Label htmlFor="new-domain">Nom du domaine</Label>
          <Input
            id="new-domain"
            placeholder="Ex. Phonologie"
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
            disabled={createMutation.isPending}
          />
          {domainExists && (
            <p className={`error-text ${styles.helperTight}`}>
              Ce domaine existe déjà.
            </p>
          )}
          <div className="notion-toolbar__group">
            <Button
              type="button"
              onClick={() => createMutation.mutate({ type: 'domain', value: normalizedDomainInput })}
              disabled={!normalizedDomainInput || createMutation.isPending || domainExists}
            >
              {createMutation.isPending ? 'Enregistrement…' : 'Ajouter le domaine'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDomainInput('')}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Créer un tag</CardTitle>
          <p className={`helper-text ${styles.helperTight}`}>
            Les tags enrichissent la recherche et les filtres dans les fiches tests.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="notion-toolbar">
              <div>
                <p className={styles.toolbarTitle}>Tags</p>
                <p className={`helper-text ${styles.helperTight}`}>
                  {sortedTags.length} tag{sortedTags.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Separator />
            {isLoading && <p className="helper-text">Chargement des tags…</p>}
            {isError && <p className="error-text">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {sortedTags.length === 0 && <p className="helper-text">Aucun tag enregistré pour le moment.</p>}
                {sortedTags.map((tag) => (
                  <div key={tag.id} className={`notion-toolbar__group ${styles.toolbarGroupJustify}`}>
                    <span>{tag.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Supprimer ${tag.name}`}
                      onClick={() => deleteMutation.mutate({ type: 'tag', id: tag.id })}
                      disabled={deleteMutation.isPending && deletingId === tag.id}
                    >
                      {deleteMutation.isPending && deletingId === tag.id ? 'Suppression…' : 'Supprimer'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Label htmlFor="new-tag">Nom du tag</Label>
          <Input
            id="new-tag"
            placeholder="Ex. Bilan rapide"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            disabled={createMutation.isPending}
          />
          {tagExists && (
            <p className={`error-text ${styles.helperTight}`}>
              Ce tag existe déjà.
            </p>
          )}
          <div className="notion-toolbar__group">
            <Button
              type="button"
              onClick={() => createMutation.mutate({ type: 'tag', value: normalizedTagInput })}
              disabled={!normalizedTagInput || createMutation.isPending || tagExists}
            >
              {createMutation.isPending ? 'Enregistrement…' : 'Ajouter le tag'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTagInput('')}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default TaxonomyManager;
