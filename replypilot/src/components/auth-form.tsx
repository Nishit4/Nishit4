"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { login, signup, type AuthState } from "@/app/(auth)/actions";
import { Alert, Button, Card, Field, inputClass } from "./ui";

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to answer your reviews.",
    submit: "Log in",
    pending: "Logging in…",
    switchText: "New to ReplyPilot?",
    switchLink: { href: "/signup", label: "Create an account" },
  },
  signup: {
    title: "Create your account",
    subtitle: "Start with 5 free replies every month. No card needed.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: { href: "/login", label: "Log in" },
  },
} as const;

const URL_ERRORS: Record<string, string> = {
  confirm: "That confirmation link is invalid or has expired. Try logging in, or sign up again.",
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : signup,
    {},
  );
  const searchParams = useSearchParams();
  const copy = COPY[mode];
  const urlError = URL_ERRORS[searchParams.get("error") ?? ""];

  if (state.message) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
        <p className="mt-3 text-sm text-slate-600">{state.message}</p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-xl font-semibold text-slate-900">{copy.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{copy.subtitle}</p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        {mode === "login" && (
          <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
        )}

        {(state.error || urlError) && <Alert tone="error">{state.error ?? urlError}</Alert>}

        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={state.fieldErrors?.password}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className={inputClass}
          />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? copy.pending : copy.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {copy.switchText}{" "}
        <Link href={copy.switchLink.href} className="font-semibold text-indigo-600 hover:text-indigo-500">
          {copy.switchLink.label}
        </Link>
      </p>
    </Card>
  );
}
