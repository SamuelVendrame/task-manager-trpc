/**
 * In-memory task store.
 *
 * Decision: the challenge asks for no database, so tasks live in a plain array.
 * The array is attached to `globalThis` because in Next.js the API route handler
 * and the Server Components can be bundled separately (and dev mode hot-reloads
 * modules). A module-level variable could end up as two different copies; the
 * global guarantees a single source of truth per Node process.
 *
 * Trade-off: data is lost on server restart and is not shared across multiple
 * instances (e.g. serverless). Fine for this exercise; in production this would
 * be swapped for a database behind the same functions.
 */

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  /** Unix timestamp in milliseconds (a number serializes over JSON without a transformer). */
  dataCriacao: number;
};

type Store = { tasks: Task[] };

const globalForStore = globalThis as unknown as { __taskStore?: Store };

function seed(): Task[] {
  // Fictitious sample data so the list (and infinite scroll) has something to show.
  const now = Date.now();
  return Array.from({ length: 25 }, (_, i) => ({
    id: crypto.randomUUID(),
    titulo: `Sample task #${25 - i}`,
    descricao: i % 3 === 0 ? undefined : `Description for sample task #${25 - i}`,
    dataCriacao: now - i * 60_000,
  }));
}

export const store: Store = globalForStore.__taskStore ?? { tasks: seed() };
globalForStore.__taskStore = store;
