"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { signInAction, signUpAction, type AuthFormState } from "@/app/(auth)/actions";
import {
  FIELDS,
  PASSWORD_MIN,
  validateField,
  type AuthField,
  type AuthMode,
  type FieldErrors,
} from "@/lib/auth-validation";
import { Spinner } from "@/components/ui/spinner";

type AuthFormProps = {
  mode: AuthMode;
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
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Field errors live here: seeded from each server response, then updated as the user edits.
  const [errors, setErrors] = useState<FieldErrors>({});
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setErrors(state.fieldErrors ?? {});
  }

  // After a failed submit, move focus to the problem so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (state.error) alertRef.current?.focus();
    else if (state.fieldErrors) focusFirstInvalid(formRef.current, state.fieldErrors, mode);
  }, [state, mode]);

  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  function check(field: AuthField, value: string) {
    setErrors((prev) => ({ ...prev, [field]: validateField(mode, field, value) }));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      aria-busy={pending}
      className="space-y-8"
      onSubmit={(event) => {
        // Validate before the round trip; the server repeats the same checks.
        const data = new FormData(event.currentTarget);
        const found: FieldErrors = {};
        for (const field of FIELDS[mode]) {
          const error = validateField(mode, field, String(data.get(field) ?? ""));
          if (error) found[field] = error;
        }
        if (Object.keys(found).length > 0) {
          event.preventDefault();
          setErrors(found);
          focusFirstInvalid(event.currentTarget, found, mode);
        }
      }}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="border-l-2 border-danger bg-surface px-4 py-3 text-body focus:outline-none"
        >
          {state.error}
        </div>
      ) : null}

      {mode === "sign-up" ? (
        <Field
          id="name"
          label="Name"
          autoComplete="name"
          defaultValue={state.values?.name}
          error={errors.name}
          readOnly={pending}
          onCheck={check}
        />
      ) : null}

      <Field
        id="email"
        label="Email address"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={errors.email}
        readOnly={pending}
        onCheck={check}
      >
        {errors.email && state.emailTaken ? (
          <Link href={`/sign-in${nextQuery}`} className="link ml-1 text-ink">
            Sign in instead
          </Link>
        ) : null}
      </Field>

      <PasswordField
        mode={mode}
        error={errors.password}
        readOnly={pending}
        onCheck={check}
      />

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={pending}
      >
        {pending ? (
          <>
            <Spinner />
            {copy.pending}
          </>
        ) : (
          copy.submit
        )}
      </button>

      <p className="text-caption text-muted">
        {copy.switchText}{" "}
        <Link href={`${copy.switchHref}${nextQuery}`} className="link text-ink">
          {copy.switchLabel}
        </Link>
      </p>
    </form>
  );
}

function focusFirstInvalid(form: HTMLFormElement | null, errors: FieldErrors, mode: AuthMode) {
  const first = FIELDS[mode].find((field) => errors[field]);
  if (!first || !form) return;
  const input = form.elements.namedItem(first);
  if (input instanceof HTMLInputElement) input.focus();
}

type FieldProps = {
  id: AuthField;
  label: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  readOnly?: boolean;
  onCheck: (field: AuthField, value: string) => void;
  /** Extra controls placed inside the input row (e.g. the password toggle). */
  adornment?: React.ReactNode;
  /** Extra content after the error message (e.g. a recovery link). */
  children?: React.ReactNode;
};

function Field({
  id,
  label,
  type = "text",
  inputMode,
  autoComplete,
  defaultValue,
  hint,
  error,
  readOnly,
  onCheck,
  adornment,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <div className="relative">
        <input
          // Remount with the server's echoed value after a failed submit.
          key={defaultValue}
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          required
          autoComplete={autoComplete}
          autoCapitalize={id === "name" ? "words" : "none"}
          spellCheck={false}
          defaultValue={defaultValue}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          // Check once the user leaves a field they've typed in; after that,
          // re-check on every keystroke so the message clears as soon as it's fixed.
          onBlur={(e) => {
            if (e.currentTarget.value) onCheck(id, e.currentTarget.value);
          }}
          onChange={(e) => {
            if (error) onCheck(id, e.currentTarget.value);
          }}
          className={adornment ? "field pr-16" : "field"}
        />
        {adornment}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-caption text-danger">
          {error}
          {children}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="mt-2 text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  mode,
  error,
  readOnly,
  onCheck,
}: {
  mode: AuthMode;
  error?: string;
  readOnly?: boolean;
  onCheck: FieldProps["onCheck"];
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      id="password"
      label="Password"
      type={visible ? "text" : "password"}
      autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
      hint={mode === "sign-up" ? `At least ${PASSWORD_MIN} characters.` : undefined}
      error={error}
      readOnly={readOnly}
      onCheck={onCheck}
      adornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls="password"
          aria-pressed={visible}
          aria-label="Show password"
          className="eyebrow absolute top-1/2 right-0 -translate-y-1/2 px-1 py-3 text-muted hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
