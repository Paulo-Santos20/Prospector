import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, 'Cor hexadecimal inválida');

export const aiInsightSchema = z
  .object({
    mainPainPoint: z.string().trim().min(1).max(200).optional(),
    urgency: z.enum(['high', 'medium', 'low']).optional(),
    conversionOpportunity: z.enum(['A', 'B', 'C']).optional(),
    keyMetrics: z
      .object({
        rating: z.number().min(0).max(5).nullable().optional(),
        reviewCount: z.number().int().nonnegative().optional(),
        totalFollowers: z.number().int().nonnegative().optional(),
        platforms: z.array(z.string().max(60)).max(20).optional(),
        priceLevel: z.number().int().min(0).max(4).optional(),
        hasWebsite: z.boolean().optional(),
        hasEmail: z.boolean().optional(),
        hasSocial: z.boolean().optional(),
      })
      .partial()
      .optional(),
    specificIssues: z
      .array(
        z.object({
          type: z.string().max(60),
          impact: z.enum(['high', 'medium', 'low']),
          description: z.string().max(300),
        })
      )
      .max(10)
      .optional(),
    recommendedActions: z.array(z.string().max(200)).max(10).optional(),
    featuredItem: z.string().max(160).optional(),
  })
  .passthrough();

export const designStrategySchema = z.object({
  style: z.string().trim().min(1).max(120),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  typography: z.object({
    heading: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(80),
  }),
  designReasoning: z.string().trim().max(400).optional().default(''),
  referenceSite: z.string().trim().max(300).optional().default(''),
});

export const normalizeAiInsight = (raw) => {
  const parsed = aiInsightSchema.safeParse(raw);
  const design = designStrategySchema.safeParse(raw?.designStrategy);

  if (!parsed.success) {
    console.warn('[IA] Resposta fora do schema:', parsed.error.issues.map((i) => i.message).join('; '));
  }

  if (raw?.designStrategy && !design.success) {
    console.warn('[IA] designStrategy inválida:', design.error.issues.map((i) => i.message).join('; '));
  }

  const data = parsed.success ? parsed.data : {};

  return {
    mainPainPoint: data.mainPainPoint || 'Presença digital com oportunidades de melhoria',
    urgency: data.urgency || 'medium',
    conversionOpportunity: data.conversionOpportunity || 'B',
    keyMetrics: data.keyMetrics || {},
    specificIssues: data.specificIssues || [],
    recommendedActions: data.recommendedActions || [],
    designStrategy: design.success ? design.data : undefined,
    featuredItem: data.featuredItem || undefined,
  };
};
