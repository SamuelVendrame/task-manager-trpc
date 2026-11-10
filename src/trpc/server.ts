import "server-only";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";

/**
 * Server-side caller: Server Components call the procedures directly
 * (no HTTP round-trip) to pre-load data for SSR. Same validation and
 * same errors as the HTTP endpoint, because it runs the same router.
 */
export const serverApi = createCallerFactory(appRouter)({});
