import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * Analisa o conteúdo e gera um manual de branding e prospecção personalizado.
 */
export const analyzeLeadWithAI = async (htmlContent, businessName) => {
  if (!process.env.GROQ_API_KEY) {
    console.error("❌ [GROQ] API Key ausente.");
    return null;
  }

  try {
    const cleanContent = htmlContent
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 7000);

    if (!cleanContent || cleanContent.length < 100) return null;

    console.log(`🤖 [GROQ] Gerando Estratégia Visual Exclusiva para: "${businessName}"...`);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um Brand Designer e Especialista em UI/UX Senior.
          Sua tarefa é analisar o nome e nicho de uma empresa e criar uma estratégia de design ÚNICA.
          
          DIRETRIZES:
          1. CORES: Fuja do óbvio. Analise o nome para extrair cores (ex: "Ouro" = Dourados, "Mar" = Turquesas).
          2. ESTILOS: Escolha entre: Minimalista Japonês, Industrial Loft, Luxo Contemporâneo, Tech Futurista, Rústico Orgânico ou Tradicional Nobre.
          3. FONTES: Indique uma Google Font para Títulos e uma para Corpo que reflitam o estilo.
          4. REFERÊNCIA: Sugira uma URL real de um site (behance, awwwards ou pinterest) que combine com essa vibe.

          Retorne este JSON:
          { 
            "ownerName": "string", 
            "emails": ["string"], 
            "mainPainPoint": "string", 
            "featuredItem": "string",
            "designStrategy": {
              "style": "string",
              "primaryColor": "hex_code",
              "secondaryColor": "hex_code",
              "typography": {
                "heading": "Google Font Name",
                "body": "Google Font Name"
              },
              "designReasoning": "Justificativa detalhada da escolha visual para este cliente específico",
              "referenceSite": "URL de inspiração visual"
            }
          }`
        },
        {
          role: "user",
          content: `Empresa: ${businessName}\nConteúdo: ${cleanContent}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content);
    console.log(`📩 [GROQ] Insight Visual Gerado para ${businessName}`);

    return result;
  } catch (error) {
    console.error('⚠️ [GROQ] Erro:', error.message);
    return null;
  }
};