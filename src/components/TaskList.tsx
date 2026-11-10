"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/trpc/client";
import type { Task } from "@/server/store";

type Page = { items: Task[]; nextCursor: { dataCriacao: number; id: string } | null; total: number };
type Feedback = { type: "success" | "error"; message: string } | null;

/**
 * Dates are formatted in a fixed time zone (UTC). This list is rendered on the
 * server and then hydrated in the browser; formatting in each side's local time
 * zone would produce different text and a React hydration error whenever the
 * server and the browser are in different time zones.
 */
const formatDate = (ms: number) =>
  `${new Date(ms).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC`;

export function TaskList({ initialPage, pageSize }: { initialPage: Page; pageSize: number }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  /**
   * Infinite query seeded with the SSR result (initialData), so the first
   * render already has data and no loading spinner is shown.
   */
  const query = trpc.task.list.useInfiniteQuery(
    { limit: pageSize },
    {
      getNextPageParam: (last) => last.nextCursor,
      initialData: { pages: [initialPage], pageParams: [null] },
    },
  );

  const deleteTask = trpc.task.delete.useMutation({
    onMutate: ({ id }) => setDeletingId(id),
    onSuccess: () => setFeedback({ type: "success", message: "Task deleted successfully." }),
    onError: (err) => setFeedback({ type: "error", message: `Could not delete the task: ${err.message}` }),
    // Refetch on success AND on error: if the delete failed because the task was
    // already removed elsewhere, the list still gets back in sync with the server.
    onSettled: async () => {
      await utils.task.list.invalidate();
      setDeletingId(null);
    },
  });

  // Hide the feedback message after a few seconds.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  /**
   * Infinite scroll: an invisible "sentinel" at the bottom of the list.
   * When it enters the viewport, the next page is requested.
   *
   * It waits for ANY fetch in progress (`isFetching`), not only a next-page one:
   * `fetchNextPage` cancels a running refetch, so scrolling right after a delete
   * would cancel the list refresh and leave the deleted task on screen.
   */
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetching, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetching) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const tasks = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <section>
      {feedback && (
        <div className={`alert ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      )}

      {query.isError && <div className="alert error">Failed to load tasks: {query.error.message}</div>}

      <p className="meta">
        Showing {tasks.length} of {total} task(s)
      </p>

      {tasks.length === 0 && !query.isFetching && (
        <p className="muted">
          No tasks yet. <Link href="/tasks/new">Create the first one</Link>.
        </p>
      )}

      {tasks.map((task) => (
        <article key={task.id} className="card">
          <h3>{task.titulo}</h3>
          {task.descricao && <p>{task.descricao}</p>}
          <span className="meta">Created at {formatDate(task.dataCriacao)}</span>
          <div className="actions">
            <Link href={`/tasks/${task.id}/edit`} className="button secondary">
              Edit
            </Link>
            <button
              className="button danger"
              disabled={deletingId === task.id}
              onClick={() => {
                if (confirm(`Delete "${task.titulo}"?`)) deleteTask.mutate({ id: task.id });
              }}
            >
              {deletingId === task.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </article>
      ))}

      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="muted">Loading more tasks...</p>}
      {!hasNextPage && tasks.length > 0 && <p className="muted">You reached the end of the list.</p>}
    </section>
  );
}
