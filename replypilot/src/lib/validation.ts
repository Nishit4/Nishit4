import { z } from "zod";

import { DEMO_REVIEW_MAX_CHARS, REVIEW_MAX_CHARS } from "@/lib/ai/config";

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => value || null);

const optionalRating = z
  .string()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .pipe(z.number().int().min(1).max(5).nullable());

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const businessSchema = z.object({
  name: requiredText("Business name", 120),
  businessType: requiredText("Business type", 80),
  tone: requiredText("Tone of voice", 300),
  ownerName: optionalText("Owner name", 80),
  contactDetails: optionalText("Contact details", 200),
  doRules: optionalText("Do rules", 2000),
  dontRules: optionalText("Don't rules", 2000),
});

export const reviewSchema = z.object({
  content: requiredText("Review text", REVIEW_MAX_CHARS),
  rating: optionalRating,
  reviewerName: optionalText("Reviewer name", 120),
});

export const demoSchema = z.object({
  content: requiredText("Review text", DEMO_REVIEW_MAX_CHARS),
  rating: optionalRating,
  businessName: optionalText("Business name", 120),
  businessType: optionalText("Business type", 80),
});

export type FieldErrors = Record<string, string>;

/** First error message per field, for showing under form inputs. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

/** FormData → plain object of strings (files are ignored). */
export function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) result[key] = value;
  });
  return result;
}
