"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeNext } from "@/lib/session";

export type AuthFormState = {
  error?: string;
  values?: { name?: string; email?: string };
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = formData.get("password");
  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter your email and password.", values: { email } };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password, rememberMe: true },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      // One message for every credential failure so accounts can't be enumerated.
      return {
        error:
          error.status === "TOO_MANY_REQUESTS"
            ? "Too many attempts. Please wait a moment and try again."
            : "Email or password is incorrect.",
        values: { email },
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
  const password = formData.get("password");
  const values = { name, email };
  if (!name || !email || typeof password !== "string" || !password) {
    return { error: "Fill in your name, email and password.", values };
  }

  try {
    // `role` is input: false, so only these fields are accepted.
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: signUpMessage(error), values };
    }
    throw error;
  }

  redirect(safeNext(formData.get("next")));
}

function signUpMessage(error: APIError) {
  switch (error.body?.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Sign in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters for your password.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    default:
      return error.status === "TOO_MANY_REQUESTS"
        ? "Too many attempts. Please wait a moment and try again."
        : "We couldn't create your account. Please try again.";
  }
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
