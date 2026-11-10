"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import type { Task } from "@/server/store";
import { setFlash } from "./flash";

type Props = { task?: Task };

/**
 * One form for both create and edit (if `task` is given, it's an edit).
 * Validation happens twice on purpose:
 *  - on the client, for instant feedback (empty title blocks submission);
 *  - on the server (Zod), which is the real guarantee, because the client can be bypassed.
 */
export function TaskForm({ task }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(task);

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  // The validation message appears only after a submit attempt. Showing it on
  // blur would insert it while the user is clicking "Cancel", moving the button
  // away from the cursor in the middle of the click.
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const titleError = titulo.trim().length === 0 ? "Title is required" : null;

  const onSuccess = () => {
    // Success feedback: the list page shows this message once (see TaskList).
    setFlash(isEdit ? "Task updated successfully." : "Task created successfully.");
    // Drop the cached list. The list page then starts from the data rendered on
    // the server, which already includes this change, instead of first showing
    // its old cache next to the success message.
    queryClient.removeQueries({ queryKey: getQueryKey(trpc.task.list) });
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
  // Stays true after a successful save, until the redirect replaces this page:
  // the button must not be clickable again while the navigation is in progress.
  const isSaving = create.isPending || update.isPending || create.isSuccess || update.isSuccess;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
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
          maxLength={120}
          autoFocus
        />
        {submitted && titleError && <span className="hint">{titleError}</span>}
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
