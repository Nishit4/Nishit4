"use server";

import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, fieldErrors, formToObject, type FieldErrors } from "@/lib/validation";

export type AuthState = {
  error?: string;
  message?: string;
  fieldErrors?: FieldErrors;
  email?: string;
};

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = formToObject(formData);
  const parsed = credentialsSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), email: values.email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      email: parsed.data.email,
      error:
        error.code === "email_not_confirmed"
          ? "Please confirm your email first. Check your inbox for the link."
          : "Incorrect email or password.",
    };
  }

  redirect(safeRedirectPath(values.next));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = formToObject(formData);
  const parsed = credentialsSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), email: values.email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=/business` },
  });

  if (error) {
    return {
      email: parsed.data.email,
      error:
        error.code === "weak_password"
          ? "That password is too easy to guess. Try a longer one."
          : "We couldn't create your account. Please try again.",
    };
  }

  // Email confirmation disabled in Supabase: the user is signed in already.
  if (data.session) redirect("/business");

  return {
    message: `We sent a confirmation link to ${parsed.data.email}. Click it to finish signing up.`,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
