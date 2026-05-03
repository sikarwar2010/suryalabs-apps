import { betterAuth } from "better-auth";
import db from "@/db";
import {
  accounts,
  usersTable,
  sessions,
  verifications,
} from "@/db/schema/users";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
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

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
