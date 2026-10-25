import { z } from 'zod';

export const CRM_STATUSES = [
  'SAVED',
  'CONTACTED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
];

export const crmCreateSchema = z
  .object({
    leadId: z.string().min(1).max(300),
  })
  .strict();

export const crmUpdateSchema = z
  .object({
    status: z.enum(CRM_STATUSES).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    dealValue: z.number().nonnegative().max(1_000_000_000).nullable().optional(),
    followUpAt: z.string().max(40).nullable().optional(),
    proposalData: z.unknown().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });
