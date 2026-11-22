import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <AuthPage
      mode="sign-up"
      title="Create an account"
      intro="One account for your details and, soon, your orders."
      searchParams={searchParams}
    />
  );
}
