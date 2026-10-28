"use client";

import { useActionState, useState } from "react";

import { Alert, Button, Card, Field, inputClass } from "@/components/ui";
import type { Business } from "@/lib/data/business";
import { saveBusiness, type BusinessFormState } from "./actions";

const BUSINESS_TYPES = [
  "Restaurant",
  "Café",
  "Bakery",
  "Bar",
  "Hair salon",
  "Beauty spa",
  "Dental clinic",
  "Medical practice",
  "Auto repair shop",
  "Retail store",
  "Gym",
  "Hotel",
  "Plumber",
  "Electrician",
  "Cleaning service",
];

const TONE_PRESETS = [
  "Warm and friendly, like talking to a regular",
  "Professional and reassuring",
  "Upbeat and playful",
  "Calm, caring and empathetic",
];

export function BusinessForm({ business }: { business: Business | null }) {
  const [state, formAction, pending] = useActionState<BusinessFormState, FormData>(
    saveBusiness,
    {},
  );
  const [tone, setTone] = useState(business?.tone ?? "");
  const errors = state.fieldErrors ?? {};
  // After a failed save, show what the user typed rather than the stored value.
  const value = (field: string, stored: string | null | undefined) =>
    state.values?.[field] ?? stored ?? "";

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-6">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.saved && <Alert tone="success">Saved. New replies will use this profile.</Alert>}

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Business name" htmlFor="name" error={errors.name}>
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              defaultValue={value("name", business?.name)}
              placeholder="Rosa's Bakery"
              className={inputClass}
            />
          </Field>
          <Field label="Type of business" htmlFor="businessType" error={errors.businessType}>
            <input
              id="businessType"
              name="businessType"
              required
              maxLength={80}
              list="business-types"
              defaultValue={value("businessType", business?.business_type)}
              placeholder="Bakery"
              className={inputClass}
            />
            <datalist id="business-types">
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field
          label="Tone of voice"
          htmlFor="tone"
          error={errors.tone}
          hint="Describe how you talk to customers, or pick a starting point."
        >
          <input
            id="tone"
            name="tone"
            required
            maxLength={300}
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            placeholder="Warm and friendly, a little playful"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {TONE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTone(preset)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                {preset}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Owner name"
            htmlFor="ownerName"
            optional
            error={errors.ownerName}
            hint="Used to sign replies, e.g. “Rosa, Owner”."
          >
            <input
              id="ownerName"
              name="ownerName"
              maxLength={80}
              defaultValue={value("ownerName", business?.owner_name)}
              placeholder="Rosa, Owner"
              className={inputClass}
            />
          </Field>
          <Field
            label="Contact for unhappy customers"
            htmlFor="contactDetails"
            optional
            error={errors.contactDetails}
            hint="Added to replies to negative reviews."
          >
            <input
              id="contactDetails"
              name="contactDetails"
              maxLength={200}
              defaultValue={value("contactDetails", business?.contact_details)}
              placeholder="hello@rosasbakery.com or (555) 123-4567"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Always do"
            htmlFor="doRules"
            optional
            error={errors.doRules}
            hint="One rule per line."
          >
            <textarea
              id="doRules"
              name="doRules"
              rows={4}
              maxLength={2000}
              defaultValue={value("doRules", business?.do_rules)}
              placeholder={"Mention our homemade sourdough\nInvite people back for Saturday brunch"}
              className={inputClass}
            />
          </Field>
          <Field
            label="Never do"
            htmlFor="dontRules"
            optional
            error={errors.dontRules}
            hint="One rule per line."
          >
            <textarea
              id="dontRules"
              name="dontRules"
              rows={4}
              maxLength={2000}
              defaultValue={value("dontRules", business?.dont_rules)}
              placeholder={"Don't offer discounts\nDon't mention staff by name"}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : business ? "Save changes" : "Save and continue"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
