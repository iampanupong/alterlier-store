import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

// Browser client. The v1 sign-in/up/out flows use server actions instead
// (src/app/(auth)/actions.ts); this stays typed for later client-side use.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
