"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import type { Task } from "@/server/store";

type Props = { task?: Task };

/**
 * One form for both create and edit (if `task` is given, it's an edit).
 * Validation happens twice on purpose:
 *  - on the client, for instant feedback (empty title blocks submission);
 *  - on the server (Zod), which is the real guarantee, because the client can be bypassed.
 */
export function TaskForm({ task }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = Boolean(task);

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const titleError = titulo.trim().length === 0 ? "Title is required" : null;

  const onSuccess = async () => {
    await utils.task.list.invalidate();
    router.push("/");
    router.refresh(); // re-run the SSR list with fresh data
  };

  // Prefer the field-level message from Zod; fall back to the generic message (e.g. NOT_FOUND).
  const showError = (message: string, fieldMsg?: string) => setServerError(fieldMsg ?? message);

  const create = trpc.task.create.useMutation({
    onSuccess,
    onError: (err) => showError(err.message, err.data?.zodError?.fieldErrors.titulo?.[0]),
  });
  const update = trpc.task.update.useMutation({
    onSuccess,
    onError: (err) => showError(err.message, err.data?.zodError?.fieldErrors.titulo?.[0]),
  });
  const isSaving = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (titleError) return; // client-side validation: do not send an empty title

    if (task) update.mutate({ id: task.id, titulo, descricao });
    else create.mutate({ titulo, descricao });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <div className="alert error">{serverError}</div>}

      <div className="field">
        <label htmlFor="titulo">Title *</label>
        <input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={120}
          autoFocus
        />
        {touched && titleError && <span className="hint">{titleError}</span>}
      </div>

      <div className="field">
        <label htmlFor="descricao">Description (optional)</label>
        <textarea id="descricao" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={1000} />
      </div>

      <div className="actions">
        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create task"}
        </button>
        <Link href="/" className="button secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
