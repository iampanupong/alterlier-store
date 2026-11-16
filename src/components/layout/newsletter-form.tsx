"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";

// Front-end only for now: no subscription backend is wired up yet.
export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p role="status" className="mt-6 text-caption">
        Thank you. You&rsquo;re on the list.
      </p>
    );
  }

  return (
    <form
      className="relative mt-6 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="Email address"
        className="field pr-10"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="btn-icon absolute top-1/2 right-0 -translate-y-1/2"
      >
        <ArrowRightIcon />
      </button>
    </form>
  );
}
