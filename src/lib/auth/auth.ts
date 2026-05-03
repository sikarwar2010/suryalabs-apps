import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db";
import {
  accounts,
  sessions,
  usersTable,
  verifications,
} from "@/db/schema/users";

const PRODUCTION_ORIGIN = "https://suryalabs-apps.vercel.app";
const LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function normalizeOrigin(origin?: string) {
  if (!origin) return null;

  const value = origin.trim().replace(/\/$/, "");
  if (!value) return null;

  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

function getHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

function getTrustedOrigins() {
  return [
    ...LOCAL_ORIGINS,
    PRODUCTION_ORIGIN,
    normalizeOrigin(process.env.BETTER_AUTH_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_BETTER_AUTH_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    normalizeOrigin(process.env.VERCEL_URL),
    normalizeOrigin(process.env.VERCEL_BRANCH_URL),
  ].filter((origin): origin is string => Boolean(origin));
}

function getAllowedHosts() {
  return Array.from(
    new Set(
      getTrustedOrigins()
        .map((origin) => getHost(origin))
        .filter((host): host is string => Boolean(host)),
    ),
  );
}

function getAuthFallbackURL() {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_BETTER_AUTH_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL) ??
    normalizeOrigin(process.env.BETTER_AUTH_URL) ??
    PRODUCTION_ORIGIN
  );
}

export const auth = betterAuth({
  baseURL: {
    allowedHosts: getAllowedHosts(),
    fallback: getAuthFallbackURL(),
    protocol: "auto",
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    // Better Auth uses singular model names ("user"); plural Drizzle keys require this.
    usePlural: true,
    schema: {
      users: usersTable,
      sessions: sessions,
      accounts: accounts,
      verifications: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Default Better Auth minimum is 8; keep UI/forms at 6+.
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "sales",
        input: false,
      },
    },
  },

  // Drizzle schema uses uuid columns; Better Auth defaults to non-UUID string ids.
  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  trustedOrigins: getTrustedOrigins(),
});
