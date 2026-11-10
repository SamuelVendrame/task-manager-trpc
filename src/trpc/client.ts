"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

/** Typed React hooks generated from the router type (end-to-end type safety). */
export const trpc = createTRPCReact<AppRouter>();
