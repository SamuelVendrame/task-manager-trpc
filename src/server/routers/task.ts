import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { store, type Task } from "../store";

/**
 * Validation lives in Zod schemas: tRPC rejects invalid input with BAD_REQUEST
 * before the resolver runs, and the same types flow to the client automatically.
 */
const titulo = z
  .string({ error: (issue) => (issue.input === undefined ? "Title is required" : "Title must be a string") })
  .trim()
  .min(1, "Title is required")
  .max(120, "Title must have at most 120 characters");

const descricao = z
  .string()
  .trim()
  .max(1000, "Description must have at most 1000 characters")
  .optional()
  // An empty description is stored as "no description".
  .transform((v) => (v ? v : undefined));

function findOrThrow(id: string): Task {
  const task = store.tasks.find((t) => t.id === id);
  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Task "${id}" was not found` });
  }
  return task;
}

/** A task's position in the list order. */
type Position = Pick<Task, "dataCriacao" | "id">;

/** Newest first. The id breaks ties, so the order is total and stable. */
const byNewest = (a: Position, b: Position) =>
  b.dataCriacao - a.dataCriacao || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

export const taskRouter = router({
  /**
   * Keyset (cursor) pagination, used by the infinite scroll.
   * The cursor is the POSITION of the last task already shown (creation time +
   * id), and a page is "the next tasks after that position".
   * Unlike an offset, this does not skip or repeat items when tasks are created
   * or deleted between page loads, even if the cursor task itself was deleted,
   * because the cursor is a position in the order, not a reference to a task.
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.object({ dataCriacao: z.number(), id: z.string() }).nullish(),
      }),
    )
    .query(({ input }) => {
      const { cursor, limit } = input;
      const sorted = [...store.tasks].sort(byNewest);
      let start = 0;
      if (cursor) {
        // First task that comes strictly after the cursor position.
        const idx = sorted.findIndex((t) => byNewest(cursor, t) < 0);
        start = idx === -1 ? sorted.length : idx;
      }
      const items = sorted.slice(start, start + limit);
      const last = items[items.length - 1];
      const hasMore = start + limit < sorted.length;
      return {
        items,
        nextCursor: hasMore && last ? { dataCriacao: last.dataCriacao, id: last.id } : null,
        total: sorted.length,
      };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => findOrThrow(input.id)),

  create: publicProcedure
    .input(z.object({ titulo, descricao }))
    .mutation(({ input }) => {
      const task: Task = {
        id: crypto.randomUUID(),
        titulo: input.titulo,
        descricao: input.descricao,
        dataCriacao: Date.now(),
      };
      store.tasks.push(task);
      return task;
    }),

  update: publicProcedure
    .input(z.object({ id: z.string().min(1), titulo, descricao }))
    .mutation(({ input }) => {
      const task = findOrThrow(input.id);
      task.titulo = input.titulo;
      task.descricao = input.descricao;
      return task;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      const task = findOrThrow(input.id);
      store.tasks = store.tasks.filter((t) => t.id !== task.id);
      return { id: task.id };
    }),
});
