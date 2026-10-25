import { z } from 'zod';

export const searchSchema = z
  .object({
    niche: z.string().trim().min(2, 'Nicho muito curto').max(80),
    location: z.string().trim().min(2, 'Localização muito curta').max(120),
    provider: z
      .enum(['overpass', 'foursquare', 'google', 'geoapify', 'tomtom', 'both'])
      .default('geoapify'),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const leadIdSchema = z.object({
  id: z.string().min(1).max(300),
});

export const leadLeadIdSchema = z.object({
  leadId: z.string().min(1).max(300),
});
