import { serverApi } from "@/trpc/server";
import { TaskList } from "@/components/TaskList";

/**
 * Task list page (Server-Side Rendering).
 * `force-dynamic` makes Next render this page on every request (SSR) instead of
 * generating it statically at build time, because the data changes constantly.
 * The first page of tasks is fetched on the server and handed to the client
 * component, which then takes over (delete, infinite scroll).
 */
export const dynamic = "force-dynamic";

// Not exported: Next.js page files may only export specific names.
const PAGE_SIZE = 10;

export default async function HomePage() {
  const firstPage = await serverApi.task.list({ limit: PAGE_SIZE });
  return (
    <>
      <h1>Tasks</h1>
      <TaskList initialPage={firstPage} pageSize={PAGE_SIZE} />
    </>
  );
}
