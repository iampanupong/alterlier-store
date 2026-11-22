"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type AuthFormState } from "@/app/(auth)/actions";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  /** Where to go after success; validated again on the server. */
  next?: string;
};

const COPY = {
  "sign-in": {
    action: signInAction,
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "New to Nord Alterlier?",
    switchLabel: "Create an account",
    switchHref: "/sign-up",
  },
  "sign-up": {
    action: signUpAction,
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
  },
} as const;

export function AuthForm({ mode, next }: AuthFormProps) {
  const copy = COPY[mode];
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    copy.action,
    {},
  );
  const errorId = `${mode}-error`;
  const invalid = state.error ? true : undefined;
  const switchHref = next
    ? `${copy.switchHref}?next=${encodeURIComponent(next)}`
    : copy.switchHref;

  return (
    <form action={formAction} className="space-y-6" aria-describedby={state.error ? errorId : undefined}>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === "sign-up" ? (
        <Field
          id="name"
          label="Name"
          autoComplete="name"
          defaultValue={state.values?.name}
          invalid={invalid}
        />
      ) : null}
      <Field
        id="email"
        label="Email address"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        invalid={invalid}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        minLength={mode === "sign-up" ? 8 : undefined}
        hint={mode === "sign-up" ? "At least 8 characters." : undefined}
        invalid={invalid}
      />

      <p id={errorId} role="alert" className="min-h-4 text-caption text-danger">
        {state.error}
      </p>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? copy.pending : copy.submit}
      </button>

      <p className="text-caption text-muted">
        {copy.switchText}{" "}
        <Link href={switchHref} className="link text-ink">
          {copy.switchLabel}
        </Link>
      </p>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  defaultValue?: string;
  minLength?: number;
  hint?: string;
  invalid?: boolean;
};

function Field({ id, label, type = "text", autoComplete, defaultValue, minLength, hint, invalid }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <input
        // Remount with the server's echoed value after a failed submit.
        key={defaultValue}
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        minLength={minLength}
        aria-invalid={invalid}
        aria-describedby={hintId}
        className="field"
      />
      {hint ? (
        <p id={hintId} className="mt-2 text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
