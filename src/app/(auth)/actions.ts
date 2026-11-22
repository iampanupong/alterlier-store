"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PASSWORD_MIN, validateForm, type FieldErrors } from "@/lib/auth-validation";
import { clientIp, withinLimits } from "@/lib/rate-limit";
import { safeNext } from "@/lib/session";

export type AuthFormState = {
  /** Form-level problem (bad credentials, rate limit, unexpected failure). */
  error?: string;
  fieldErrors?: FieldErrors;
  /** Sign-up hit an existing account: the form offers a sign-in link. */
  emailTaken?: boolean;
  values?: { name?: string; email?: string };
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function password(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

const RATE_LIMITED = "Too many attempts. Please wait a few minutes and try again.";

// Better Auth's limiter doesn't run for `auth.api.*` calls, so these actions limit themselves.
// Per-IP stops one client hammering; per-email stops a distributed guess at one account.
const SIGN_IN_PER_IP = { max: 20, windowSeconds: 10 * 60 };
const SIGN_IN_PER_EMAIL = { max: 10, windowSeconds: 10 * 60 };
const SIGN_UP_PER_IP = { max: 10, windowSeconds: 60 * 60 };

function hasErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const pwd = password(formData);
  const values = { email };
  const fieldErrors = validateForm("sign-in", { email, password: pwd });
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  const ip = await clientIp();
  const allowed = await withinLimits([
    [`sign-in:ip:${ip}`, SIGN_IN_PER_IP],
    [`sign-in:email:${email.toLowerCase()}`, SIGN_IN_PER_EMAIL],
  ]);
  if (!allowed) return { error: RATE_LIMITED, values };

  try {
    await auth.api.signInEmail({
      body: { email, password: pwd, rememberMe: true },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      // One message for every credential failure so accounts can't be enumerated.
      return {
        error: "That email and password don't match an account. Check them and try again.",
        values,
      };
    }
    throw error;
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const pwd = password(formData);
  const values = { name, email };
  const fieldErrors = validateForm("sign-up", { name, email, password: pwd });
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  if (!(await withinLimits([[`sign-up:ip:${await clientIp()}`, SIGN_UP_PER_IP]]))) {
    return { error: RATE_LIMITED, values };
  }

  try {
    // `role` is input: false, so only these fields are accepted.
    await auth.api.signUpEmail({
      body: { name, email, password: pwd },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { ...signUpError(error), values };
    }
    throw error;
  }

  redirect(safeNext(formData.get("next")));
}

function signUpError(error: APIError): AuthFormState {
  switch (error.body?.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return {
        fieldErrors: { email: "An account with this email already exists." },
        emailTaken: true,
      };
    case "PASSWORD_TOO_SHORT":
      return { fieldErrors: { password: `Use at least ${PASSWORD_MIN} characters.` } };
    case "PASSWORD_TOO_LONG":
      return { fieldErrors: { password: "That password is too long." } };
    case "INVALID_EMAIL":
      return { fieldErrors: { email: "Enter a valid email address, like name@example.com." } };
    default:
      return { error: "We couldn't create your account. Please try again." };
  }
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
