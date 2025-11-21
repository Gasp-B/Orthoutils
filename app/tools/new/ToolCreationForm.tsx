'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createToolSchema } from '@/lib/validation/tools';
import styles from './tool-creation-form.module.css';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  type: z.string().min(1, 'Le type est requis'),
  tags: z.string().min(1, 'Ajoutez au moins un tag, séparés par des virgules'),
  source: z.string().url('La source doit être une URL valide'),
});

const defaultValues = {
  name: '',
  category: '',
  type: '',
  tags: '',
  source: '',
};

type FormValues = z.infer<typeof formSchema>;

type CreateToolPayload = z.infer<typeof createToolSchema>;

type ApiResponse = {
  tool?: CreateToolPayload & { id: string };
  error?: string;
};

async function submitTool(payload: CreateToolPayload) {
  const response = await fetch('/api/tools', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(data.error ?? "Impossible d'enregistrer l'outil");
  }

  return (await response.json()) as ApiResponse;
}

function ToolCreationForm() {
  const queryClient = useQueryClient();
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
    mutationFn: submitTool,
    onSuccess: () => {
      reset(defaultValues);
      void queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const [submitLabel, submitDisabled] = useMemo(
    () => [
      mutation.isPending ? 'Enregistrement…' : 'Créer la fiche',
      mutation.isPending,
    ],
    [mutation.isPending],
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
          Nom de l'outil
        </label>
        <input
          id="name"
          className="input"
          placeholder="Exemple : Grille de repérage OMF"
          {...register('name')}
        />
        {errors.name && <p className="error-text">{errors.name.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="category">
          Catégorie
        </label>
        <input
          id="category"
          className="input"
          placeholder="Bilan, Diagnostic, OMF…"
          {...register('category')}
        />
        {errors.category && <p className="error-text">{errors.category.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="type">
          Type
        </label>
        <input id="type" className="input" placeholder="Questionnaire, batterie, suivi…" {...register('type')} />
        {errors.type && <p className="error-text">{errors.type.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="tags">
          Tags
        </label>
        <input
          id="tags"
          className="input"
          placeholder="dysarthrie, accompagnement, cognition"
          {...register('tags')}
        />
        <p className={`text-subtle ${styles.helperTight}`}>
          Séparez les tags par des virgules. Ils seront utilisés pour filtrer le catalogue.
        </p>
        {errors.tags && <p className="error-text">{errors.tags.message}</p>}
      </div>

      <div className={styles.fieldGroup}>
        <label className="text-subtle" htmlFor="source">
          Source
        </label>
        <input id="source" className="input" placeholder="https://…" {...register('source')} />
        {errors.source && <p className="error-text">{errors.source.message}</p>}
      </div>

      {mutation.isError && (
        <p className={`error-text ${styles.errorInline}`}>
          {mutation.error instanceof Error ? mutation.error.message : "Une erreur est survenue."}
        </p>
      )}

      {mutation.isSuccess && !mutation.isError && (
        <p className={styles.successMessage}>
          La fiche a été créée. Elle apparaîtra dans le catalogue sous l'étiquette « Communauté ».
        </p>
      )}

      <button className="primary-btn" type="submit" disabled={submitDisabled} aria-busy={submitDisabled}>
        {submitLabel}
      </button>
    </form>
  );
}

export default ToolCreationForm;
