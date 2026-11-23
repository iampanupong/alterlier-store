"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/app/admin/products/actions";
import { Spinner } from "@/components/ui/spinner";
import { BADGES, LIMITS, PRODUCT_FIELDS, slugify, type ProductField } from "@/lib/admin-model";

export type ProductFormValues = Record<ProductField, string>;

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  categoryId: "",
  price: "",
  badge: "",
  description: "",
  details: "",
  imageSrc: "",
  imageAlt: "",
  gallery: "",
  stockQuantity: "0",
  lowStockThreshold: "3",
};

type ProductFormProps = {
  categories: { id: string; name: string }[];
  initial: ProductFormValues;
} & ({ mode: "create" } | { mode: "edit"; productId: string });

/**
 * Create and edit share this form. Every field is validated again on the server;
 * the form only keeps what was typed after a failed submit and focuses the problem.
 * Stock isn't edited here on existing products: it has its own guarded form.
 */
export function ProductForm(props: ProductFormProps) {
  const { categories, initial, mode } = props;
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    mode === "create" ? createProductAction : updateProductAction,
    { status: "idle" },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  // In create mode the slug follows the name until the admin edits it directly.
  const slugTouched = useRef(mode === "edit");

  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.at) return;
    const first = PRODUCT_FIELDS.find((field) => state.fieldErrors?.[field]);
    const control = first ? formRef.current?.elements.namedItem(first) : null;
    if (control instanceof HTMLElement) control.focus();
    else if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  const field = (name: ProductField) => ({
    name,
    id: name,
    defaultValue: values[name] ?? "",
    error: errors[name],
    readOnly: pending,
  });

  return (
    // Remount after each response so defaultValues show the echoed or refreshed values.
    <form key={state.at ?? 0} ref={formRef} action={formAction} noValidate aria-busy={pending} className="space-y-10">
      {mode === "edit" ? <input type="hidden" name="productId" value={props.productId} /> : null}

      {state.message ? (
        <div
          ref={alertRef}
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={-1}
          className={`border-l-2 bg-surface px-4 py-3 text-body focus:outline-none ${
            state.status === "error" ? "border-danger" : "border-ink"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <Fieldset legend="Product">
        <TextField
          {...field("name")}
          label="Name"
          maxLength={LIMITS.name}
          onInput={(event) => {
            if (slugTouched.current) return;
            const slug = formRef.current?.elements.namedItem("slug");
            if (slug instanceof HTMLInputElement) slug.value = slugify(event.currentTarget.value);
          }}
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <TextField
            {...field("slug")}
            label="URL slug"
            hint="Lowercase letters, numbers and hyphens. Changing it changes the product's URL."
            maxLength={LIMITS.slug}
            onInput={() => {
              slugTouched.current = true;
            }}
          />
          <TextField {...field("sku")} label="SKU" hint="For example NA-BG-24101." maxLength={LIMITS.sku} />
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <SelectField {...field("categoryId")} label="Category">
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <TextField {...field("price")} label="Price (USD)" inputMode="decimal" hint="For example 1250.00." />
          <SelectField {...field("badge")} label="Badge">
            <option value="">None</option>
            {BADGES.map((badge) => (
              <option key={badge} value={badge}>
                {badge}
              </option>
            ))}
          </SelectField>
        </div>
      </Fieldset>

      <Fieldset legend="Copy">
        <TextArea {...field("description")} label="Description" rows={5} maxLength={LIMITS.description} />
        <TextArea
          {...field("details")}
          label="Details"
          hint={`One per line, up to ${LIMITS.details}. Shown in the product page's details list.`}
          rows={5}
        />
      </Fieldset>

      <Fieldset legend="Images">
        <div className="grid gap-8 sm:grid-cols-2">
          <TextField
            {...field("imageSrc")}
            label="Main image URL"
            type="url"
            inputMode="url"
            hint="https only. Use bare images.unsplash.com/photo-… URLs."
          />
          <TextField {...field("imageAlt")} label="Main image alt text" maxLength={LIMITS.alt} />
        </div>
        <TextArea
          {...field("gallery")}
          label="Gallery"
          hint={`One image per line as “URL | alt text”, up to ${LIMITS.gallery}. Add “| 45% 40%” to show it as a zoomed detail crop.`}
          rows={4}
        />
      </Fieldset>

      <Fieldset legend="Availability">
        <div className="grid gap-8 sm:grid-cols-2">
          {mode === "create" ? (
            <TextField
              {...field("stockQuantity")}
              label="Opening stock"
              inputMode="numeric"
              hint="0 lists the product as sold out."
            />
          ) : null}
          <TextField
            {...field("lowStockThreshold")}
            label="Low-stock threshold"
            inputMode="numeric"
            hint="At or below this, the store shows “Only N left”."
          />
        </div>
      </Fieldset>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? (
          <>
            <Spinner />
            Saving…
          </>
        ) : mode === "create" ? (
          "Create product"
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-8 border-t border-line pt-6">
      <legend className="eyebrow float-left mb-6 w-full text-muted">{legend}</legend>
      <div className="clear-left space-y-8">{children}</div>
    </fieldset>
  );
}

type ControlProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  error?: string;
  defaultValue: string;
  readOnly?: boolean;
};

function describedBy(id: string, hint?: string, error?: string) {
  return [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

function Messages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-caption text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </>
  );
}

function TextField({
  id,
  name,
  label,
  hint,
  error,
  defaultValue,
  readOnly,
  ...rest
}: ControlProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof ControlProps>) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        defaultValue={defaultValue}
        readOnly={readOnly}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="field"
        {...rest}
      />
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}

function TextArea({
  id,
  name,
  label,
  hint,
  error,
  defaultValue,
  readOnly,
  ...rest
}: ControlProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof ControlProps>) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="field resize-y"
        {...rest}
      />
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  hint,
  error,
  defaultValue,
  readOnly,
  children,
}: ControlProps & { children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        // <select> has no readOnly; block changes while saving instead of disabling,
        // because disabled controls aren't submitted.
        aria-disabled={readOnly || undefined}
        onMouseDown={readOnly ? (event) => event.preventDefault() : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="field cursor-pointer bg-paper"
      >
        {children}
      </select>
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}
