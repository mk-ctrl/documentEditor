import { z } from 'zod';
import { HttpError } from './httpError.js';

export const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title cannot be empty')
  .max(200, 'Title must be 200 characters or fewer');

// A Tiptap/ProseMirror document. We check the outer shape; Tiptap's schema drops unknown nodes on load.
export const contentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.record(z.string(), z.unknown())).max(5000, 'Document is too long'),
});

export const createDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
  })
  .strict();

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
  })
  .strict()
  .refine((v) => v.title !== undefined || v.content !== undefined, 'Nothing to update');

export const shareSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    role: z.enum(['viewer', 'editor'], { message: 'Role must be viewer or editor' }),
  })
  .strict();

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name').max(80, 'Name must be 80 characters or fewer'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or fewer'),
  })
  .strict();

/** Parse `data` with `schema` or throw a 400 with the first human-readable issue. */
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message || 'Invalid request');
  }
  return result.data;
}
