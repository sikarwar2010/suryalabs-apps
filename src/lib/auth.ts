import { betterAuth } from "better-auth";
import db from "@/db";
import {
  accounts,
  usersTable,
  sessions,
  verifications,
} from "@/db/schema/users";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { authClient } from "./client";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
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

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});

export type User = typeof authClient.$Infer.Session.user;

export type Session = typeof authClient.$Infer.Session;
