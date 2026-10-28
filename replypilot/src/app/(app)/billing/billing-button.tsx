"use client";

import { useActionState } from "react";

import { Alert, Button, type ButtonVariant } from "@/components/ui";
import { openBillingPortal, startCheckout, type BillingActionState } from "./actions";

const ACTIONS = {
  checkout: { action: startCheckout, label: "Upgrade to Pro", pending: "Opening checkout…" },
  portal: { action: openBillingPortal, label: "Manage subscription", pending: "Opening portal…" },
} as const;

export function BillingButton({
  kind,
  variant = "primary",
  label,
}: {
  kind: keyof typeof ACTIONS;
  variant?: ButtonVariant;
  label?: string;
}) {
  const config = ACTIONS[kind];
  const [state, formAction, pending] = useActionState<BillingActionState>(config.action, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Button type="submit" variant={variant} disabled={pending} className="w-full sm:w-auto">
        {pending ? config.pending : (label ?? config.label)}
      </Button>
    </form>
  );
}
