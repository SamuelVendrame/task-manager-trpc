# Task Manager (Next.js 15 + tRPC)

A simple task manager built for a technical challenge. The backend keeps the tasks in memory and exposes a CRUD through tRPC. The frontend uses the Next.js App Router, and the task list is rendered on the server (SSR).

All data in this project is fictitious. There are no secrets, tokens or personal data.

## Running

Requires Node.js 20 or newer (tested on Node.js 24).

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other commands: `npm run typecheck` to check the types, and `npm run build && npm start` to run in production mode.

## Features

- Create, list, update and delete tasks through tRPC.
- Validation with Zod: a task cannot be created or updated without a title, and the API returns clear errors, for example when the task does not exist.
- Task list rendered on the server, with infinite scroll.
- Tasks can be deleted from the list, with a success or error message.
- One form to create and edit tasks, with validation and loading, success and error states.

## Structure

```
src/
  server/
    store.ts            # in-memory store and sample tasks
    trpc.ts             # tRPC setup and error formatter
    routers/task.ts     # task procedures and Zod schemas
    routers/_app.ts     # root router
  trpc/
    client.ts           # typed React hooks
    provider.tsx        # React Query and tRPC providers
    server.ts           # caller used by the server pages
  app/
    api/trpc/[trpc]/route.ts  # HTTP endpoint
    page.tsx                  # task list (SSR)
    tasks/new/page.tsx        # create
    tasks/[id]/edit/page.tsx  # edit
  components/
    TaskList.tsx        # list, delete, infinite scroll
    TaskForm.tsx        # create and edit form
    flash.ts            # success message shown on the list after saving
```

## How it works

- The list page is rendered on every request. It calls the tRPC router directly on the server and sends the first page of tasks to the client, which loads the next pages while the user scrolls.
- The tasks are stored in an array in memory, so the data is reset when the server restarts. With a database, only `store.ts` would change.
- The pagination uses a cursor (creation date and id) instead of an offset, so creating or deleting tasks while scrolling does not skip or repeat items.
- Dates are shown in UTC, so the server and the browser render the same text.
- The title is validated in the form and again on the server, because the client validation can be bypassed.
- The interface is simple on purpose, with plain CSS and no component library.
