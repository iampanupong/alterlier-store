// Field rules shared by the auth forms (instant feedback) and the server actions
// (the real check). Keep the limits in step with `emailAndPassword` in auth.ts.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128; // Better Auth's default maxPasswordLength
export const NAME_MAX = 100;

export type AuthField = "name" | "email" | "password";
export type FieldErrors = Partial<Record<AuthField, string>>;
export type AuthMode = "sign-in" | "sign-up";

// Deliberately loose: one "@", something either side, a dot in the domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(mode: AuthMode, field: AuthField, raw: string): string | undefined {
  const value = field === "password" ? raw : raw.trim();

  switch (field) {
    case "name":
      if (!value) return "Enter your name.";
      if (value.length > NAME_MAX) return `Use ${NAME_MAX} characters or fewer.`;
      return;
    case "email":
      if (!value) return "Enter your email address.";
      if (!EMAIL_RE.test(value)) return "Enter a valid email address, like name@example.com.";
      return;
    case "password":
      if (!value) return mode === "sign-in" ? "Enter your password." : "Choose a password.";
      // Sign-in only checks presence: older passwords may predate the current rules.
      if (mode === "sign-in") return;
      if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
      if (value.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
      return;
  }
}

export const FIELDS: Record<AuthMode, AuthField[]> = {
  "sign-in": ["email", "password"],
  "sign-up": ["name", "email", "password"],
};

export function validateForm(mode: AuthMode, values: Partial<Record<AuthField, string>>) {
  const errors: FieldErrors = {};
  for (const field of FIELDS[mode]) {
    const error = validateField(mode, field, values[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}
