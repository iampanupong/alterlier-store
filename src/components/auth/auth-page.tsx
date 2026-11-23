import Image from "next/image";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { accountEditorial } from "@/lib/sample-data";

type AuthPageProps = {
  mode: "sign-in" | "sign-up";
  title: string;
  intro: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Shared shell for /sign-in and /sign-up. The form is static; only `?next` streams in. */
export function AuthPage({ mode, title, intro, searchParams }: AuthPageProps) {
  return (
    <main id="main" className="pt-header">
      <div className="grid lg:min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2">
        <div className="flex flex-col px-gutter pt-6 pb-section lg:pb-16">
          <Breadcrumb current={title} />

          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-sm pt-12 lg:pt-16">
              <p className="eyebrow text-muted">{accountEditorial.eyebrow}</p>
              <h1 className="mt-4 text-display">{title}</h1>
              <p className="mt-3 text-body text-muted">{intro}</p>

              <div className="mt-10">
                <Suspense fallback={<AuthForm mode={mode} />}>
                  {searchParams.then(({ next }) => (
                    <AuthForm mode={mode} next={Array.isArray(next) ? next[0] : next} />
                  ))}
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <div className="media relative hidden lg:block">
          <Image
            src={accountEditorial.image.src}
            alt={accountEditorial.image.alt}
            fill
            priority
            sizes="50vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent" />
          <p className="absolute inset-x-0 bottom-0 max-w-md p-12 text-display text-white">
            {accountEditorial.title}
          </p>
        </div>
      </div>
    </main>
  );
}
