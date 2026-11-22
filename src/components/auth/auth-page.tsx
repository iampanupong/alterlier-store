import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Breadcrumb } from "@/components/breadcrumb";

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
      <div className="px-gutter pt-6">
        <Breadcrumb current={title} />
      </div>

      <div className="px-gutter pt-10 pb-section lg:pt-16">
        <div className="max-w-md">
          <h1 className="text-display">{title}</h1>
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
    </main>
  );
}
