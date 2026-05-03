"use client";

import { createAuthClient } from "better-auth/react";

function resolveAuthBaseURL(): string {
  const publicUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (publicUrl) return publicUrl.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return (
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
