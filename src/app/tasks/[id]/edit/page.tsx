import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { serverApi } from "@/trpc/server";
import { TaskForm } from "@/components/TaskForm";

export const dynamic = "force-dynamic";

/**
 * Edit page: loads the task on the server (SSR). If it doesn't exist,
 * the tRPC NOT_FOUND error is translated into Next's 404 page.
 * Note: in Next.js 15 `params` is a Promise.
 */
export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await serverApi.task.byId({ id });
    return (
      <>
        <h1>Edit task</h1>
        <TaskForm task={task} />
      </>
    );
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") notFound();
    throw err;
  }
}
