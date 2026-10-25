import { z } from 'zod';

const agencySchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    logoUrl: z.string().trim().max(500).optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().max(160).optional(),
    website: z.string().trim().max(300).optional(),
    tone: z.string().trim().max(300).optional(),
  })
  .strict();

export const updateMeSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    agency: agencySchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });
