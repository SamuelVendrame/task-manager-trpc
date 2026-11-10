import { router } from "../trpc";
import { taskRouter } from "./task";

export const appRouter = router({
  task: taskRouter,
});

/** Only the TYPE is exported to the client, so no server code is bundled. */
export type AppRouter = typeof appRouter;
