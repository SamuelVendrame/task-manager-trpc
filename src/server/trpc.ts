import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

/**
 * tRPC initialization.
 *
 * The errorFormatter exposes Zod validation errors in a structured way
 * (`error.data.zodError.fieldErrors`) so the frontend can show a field-level
 * message such as "Title is required" instead of a raw JSON string.
 */
const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
