import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const ROLES = ["customer", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const auth = betterAuth({
  appName: "Nord Alterlier",
  // neon-http has no interactive transactions: leave the adapter's `transaction` off.
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // `input: false`: never accepted from sign-up/update requests. Promote with
      // `pnpm auth:make-admin <email>`.
      role: {
        type: [...ROLES],
        required: true,
        defaultValue: "customer",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // slide the expiry at most once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Sign-in/up go through the rate-limited server actions in src/app/(auth)/actions.ts.
  // Close the HTTP doors so they can't be used to skip those limits. `auth.api.*` calls
  // are unaffected (disabledPaths only applies to HTTP requests).
  disabledPaths: ["/sign-in/email", "/sign-up/email"],
  advanced: {
    database: { generateId: "uuid" },
  },
  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
